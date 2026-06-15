import { getVideoFileById, createVideoFile, updatePipelineStageStatus } from "../db";
import { storagePut } from "../storage";
import { storageGetSignedUrl } from "../storage";
import type { PipelineJob } from "../../drizzle/schema";
import { writeFile } from "fs/promises";
import {
  tmpPath,
  cleanupFiles,
  runFFmpeg,
  getVideoDuration,
  parseSilenceIntervals,
  computeKeepSegments,
  readFileAsBuffer,
  downloadToTempFile,
  type KeepSegment,
} from "./ffmpeg";

async function buildConcatFilter(
  segments: KeepSegment[],
): Promise<{ filterComplex: string; mapArgs: string[] }> {
  const parts: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const { start, end } = segments[i];
    parts.push(
      `[0:v]trim=start=${start}:end=${end},setpts=PTS-STARTPTS[v${i}];` +
      `[0:a]atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS[a${i}]`,
    );
  }

  const concatInputs = segments.map((_, i) => `[v${i}][a${i}]`).join("");
  parts.push(`${concatInputs}concat=n=${segments.length}:v=1:a=1[outv][outa]`);

  return {
    filterComplex: parts.join(";"),
    mapArgs: ["-map", "[outv]", "-map", "[outa]"],
  };
}

export async function runSilenceRemoval(
  jobId: number,
  stageId: number,
  job: PipelineJob,
): Promise<void> {
  const inputFile = await getVideoFileById(job.inputFileId);
  if (!inputFile) throw new Error(`Input video file ${job.inputFileId} not found`);

  const thresholdDb = parseFloat(String(job.silenceThresholdDb ?? -35));
  const minDurationSec = parseFloat(String(job.silenceMinDurationSec ?? 0.4));
  const paddingSec = parseFloat(String(job.silencePaddingSec ?? 0.1));

  const inputPath = tmpPath("mp4");
  const outputPath = tmpPath("mp4");

  try {
    // 1. Download input video from S3
    await updatePipelineStageStatus(stageId, "processing", { progressPercent: 5 });
    console.log(`[SilenceRemoval] Downloading input file key=${inputFile.fileKey}`);
    const signedUrl = await storageGetSignedUrl(inputFile.fileKey);
    await downloadToTempFile(signedUrl, "mp4", inputPath);

    // 2. Get duration
    await updatePipelineStageStatus(stageId, "processing", { progressPercent: 15 });
    const duration = await getVideoDuration(inputPath);
    console.log(`[SilenceRemoval] Video duration: ${duration}s`);

    // 3. Run silencedetect
    await updatePipelineStageStatus(stageId, "processing", { progressPercent: 25 });
    console.log(`[SilenceRemoval] Detecting silence: threshold=${thresholdDb}dB, min=${minDurationSec}s`);
    const { stderr } = await runFFmpeg([
      "-i", inputPath,
      "-af", `silencedetect=noise=${thresholdDb}dB:d=${minDurationSec}`,
      "-f", "null", "-",
    ]);

    // 4. Compute keep segments
    const silences = parseSilenceIntervals(stderr, duration);
    const keeps = computeKeepSegments(silences, duration, paddingSec);
    console.log(`[SilenceRemoval] Found ${silences.length} silence intervals, ${keeps.length} keep segments`);

    await updatePipelineStageStatus(stageId, "processing", { progressPercent: 40 });

    // 5. Cut and stitch
    if (keeps.length === 0) {
      throw new Error("No non-silent segments found in video");
    }

    if (keeps.length === 1 && keeps[0].start <= 0.01 && keeps[0].end >= duration - 0.01) {
      // No silence found — copy directly
      await runFFmpeg([
        "-i", inputPath,
        "-c", "copy",
        outputPath,
      ]);
    } else {
      const { filterComplex, mapArgs } = await buildConcatFilter(keeps);
      await runFFmpeg([
        "-i", inputPath,
        "-filter_complex", filterComplex,
        ...mapArgs,
        "-c:v", "libx264",
        "-preset", "fast",
        "-c:a", "aac",
        outputPath,
      ]);
    }

    await updatePipelineStageStatus(stageId, "processing", { progressPercent: 80 });

    // 6. Upload result to S3
    console.log(`[SilenceRemoval] Uploading result for job ${jobId}`);
    const buf = await readFileAsBuffer(outputPath);
    const { key, url } = await storagePut(
      `pipeline/${jobId}/silence_removed.mp4`,
      buf,
      "video/mp4",
    );

    // 7. Create video file record
    const outputFile = await createVideoFile({
      userId: job.userId,
      filename: `${job.jobName}_silence_removed.mp4`,
      fileKey: key,
      url,
      mimeType: "video/mp4",
      fileSizeBytes: buf.length,
    });

    // 8. Store outputFileId on stage
    await updatePipelineStageStatus(stageId, "processing", {
      progressPercent: 95,
      outputFileId: outputFile.id,
      metadata: { silenceCount: silences.length, keepSegmentCount: keeps.length, duration },
    });

    console.log(`[SilenceRemoval] Done — outputFileId=${outputFile.id}`);
  } finally {
    await cleanupFiles(inputPath, outputPath);
  }
}
