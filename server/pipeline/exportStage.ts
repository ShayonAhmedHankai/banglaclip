import { getJobStages, getVideoFileById, createVideoFile, updatePipelineStageStatus, updatePipelineJobStatus } from "../db";
import { storagePut, storageGetSignedUrl } from "../storage";
import type { PipelineJob } from "../../drizzle/schema";
import {
  tmpPath,
  cleanupFiles,
  runFFmpeg,
  readFileAsBuffer,
  downloadToTempFile,
} from "./ffmpeg";
import { writeFile } from "fs/promises";

const CRF_BY_QUALITY: Record<string, number> = {
  low: 28,
  medium: 23,
  high: 18,
};

export async function runExport(
  jobId: number,
  stageId: number,
  job: PipelineJob,
): Promise<void> {
  // 1. Resolve inputs from prior stages
  const stages = await getJobStages(jobId);

  // Prefer b-roll output if available and not skipped; else fall back to silence_removal
  const brollStage = stages.find(s => s.stageName === "broll_overlay");
  const brollMeta = brollStage?.metadata as { skipped?: boolean } | null;
  const brollOutputId = brollStage?.outputFileId && !brollMeta?.skipped ? brollStage.outputFileId : null;

  const silenceStage = stages.find(s => s.stageName === "silence_removal");
  if (!silenceStage?.outputFileId) {
    throw new Error("silence_removal stage output not found");
  }

  const sourceFileId = brollOutputId ?? silenceStage.outputFileId;

  const captionStage = stages.find(s => s.stageName === "caption_generation");
  const captionMeta = captionStage?.metadata as { srtKey?: string } | null;
  const srtKey = captionMeta?.srtKey;

  const videoFile = await getVideoFileById(sourceFileId);
  if (!videoFile) throw new Error(`Video file ${sourceFileId} not found`);

  const videoPath = tmpPath("mp4");
  const srtPath = tmpPath("srt");
  const outputPath = tmpPath("mp4");

  try {
    // 2. Download silence-removed video
    await updatePipelineStageStatus(stageId, "processing", { progressPercent: 5 });
    console.log(`[Export] Downloading video key=${videoFile.fileKey} (source: ${brollOutputId ? 'broll' : 'silence_removal'})`);
    const videoSignedUrl = await storageGetSignedUrl(videoFile.fileKey);
    await downloadToTempFile(videoSignedUrl, "mp4", videoPath);

    // 3. Download SRT if available
    let hasSrt = false;
    if (srtKey) {
      try {
        await updatePipelineStageStatus(stageId, "processing", { progressPercent: 20 });
        console.log(`[Export] Downloading SRT key=${srtKey}`);
        const srtSignedUrl = await storageGetSignedUrl(srtKey);
        await downloadToTempFile(srtSignedUrl, "srt", srtPath);
        hasSrt = true;
      } catch (err) {
        console.warn(`[Export] Could not download SRT, proceeding without subtitles: ${err}`);
      }
    }

    // 4. Build FFmpeg filter for 9:16 crop + optional subtitles
    await updatePipelineStageStatus(stageId, "processing", { progressPercent: 35 });

    const cropMode = job.exportCropMode ?? "center";
    const quality = job.exportQuality ?? "high";
    const crf = CRF_BY_QUALITY[quality] ?? 23;

    // Crop to 9:16: preserve full height, crop width to ih*(9/16)
    // x offset depends on cropMode
    let xExpr: string;
    switch (cropMode) {
      case "top":
        xExpr = "0";
        break;
      case "bottom":
        xExpr = "iw-ih*9/16";
        break;
      default: // center
        xExpr = "(iw-ih*9/16)/2";
    }

    // Build video filter chain
    let vfChain = `crop=ih*9/16:ih:${xExpr}:0,scale=1080:1920`;

    if (hasSrt) {
      // subtitles filter needs an escaped absolute path
      const escapedSrtPath = srtPath.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
      vfChain += `,subtitles='${escapedSrtPath}':force_style='FontName=${job.captionFontName ?? "Arial"},FontSize=${job.captionFontSize ?? 18},PrimaryColour=&H${hexColorToAssHex(job.captionFontColor ?? "#FFFFFF")}&,OutlineColour=&H${hexColorToAssHex(job.captionOutlineColor ?? "#000000")}&,Outline=2,Alignment=${alignmentToAss(job.captionAlignment ?? "bottom")}'`;
    }

    // 5. Run export FFmpeg pass
    await updatePipelineStageStatus(stageId, "processing", { progressPercent: 45 });
    console.log(`[Export] Running FFmpeg export — cropMode=${cropMode}, quality=${quality}, hasSrt=${hasSrt}`);

    await runFFmpeg([
      "-i", videoPath,
      "-vf", vfChain,
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", String(crf),
      "-c:a", "aac",
      "-b:a", "128k",
      outputPath,
    ]);

    // 6. Upload final video
    await updatePipelineStageStatus(stageId, "processing", { progressPercent: 85 });
    console.log(`[Export] Uploading final video for job ${jobId}`);
    const outBuf = await readFileAsBuffer(outputPath);
    const { key, url } = await storagePut(
      `pipeline/${jobId}/final_export.mp4`,
      outBuf,
      "video/mp4",
    );

    // 7. Create video file record for output
    const outputVideoFile = await createVideoFile({
      userId: job.userId,
      filename: `${job.jobName}_export.mp4`,
      fileKey: key,
      url,
      mimeType: "video/mp4",
      fileSizeBytes: outBuf.length,
    });

    // 8. Update stage and job with output file
    await updatePipelineStageStatus(stageId, "processing", {
      progressPercent: 95,
      outputFileId: outputVideoFile.id,
      metadata: { hasSrt, cropMode, quality, outputFileId: outputVideoFile.id },
    });

    await updatePipelineJobStatus(jobId, "processing", {
      outputFileId: outputVideoFile.id,
    });

    console.log(`[Export] Done — outputFileId=${outputVideoFile.id}, url=${url}`);
  } finally {
    await cleanupFiles(videoPath, srtPath, outputPath);
  }
}

/** Convert #RRGGBB to AABBGGRR (ASS/SSA colour format, alpha=00) */
function hexColorToAssHex(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "FFFFFF";
  const r = h.slice(0, 2);
  const g = h.slice(2, 4);
  const b = h.slice(4, 6);
  return `00${b}${g}${r}`.toUpperCase();
}

/** Map alignment string to ASS numpad alignment */
function alignmentToAss(alignment: "top" | "center" | "bottom"): number {
  switch (alignment) {
    case "top": return 8;
    case "center": return 5;
    default: return 2; // bottom
  }
}
