import { getJobStages, getVideoFileById, updatePipelineStageStatus } from "../db";
import { storagePut, storageGetSignedUrl } from "../storage";
import { ENV } from "../_core/env";
import type { PipelineJob } from "../../drizzle/schema";
import type { WhisperSegment, WhisperResponse } from "../_core/voiceTranscription";
import {
  tmpPath,
  cleanupFiles,
  runFFmpeg,
  downloadToTempFile,
  readFileAsBuffer,
} from "./ffmpeg";

function secondsToSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return [
    String(h).padStart(2, "0"),
    String(m).padStart(2, "0"),
    String(s).padStart(2, "0"),
  ].join(":") + "," + String(ms).padStart(3, "0");
}

function segmentsToSrt(segments: WhisperSegment[]): string {
  return segments
    .map((seg, i) =>
      `${i + 1}\n${secondsToSrtTime(seg.start)} --> ${secondsToSrtTime(seg.end)}\n${seg.text.trim()}\n`,
    )
    .join("\n");
}

async function transcribeBengali(audioUrl: string): Promise<WhisperResponse> {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    throw new Error("Forge API not configured — set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY");
  }

  const resp = await fetch(audioUrl);
  if (!resp.ok) throw new Error(`Failed to download audio: ${resp.status}`);
  const audioBuf = Buffer.from(await resp.arrayBuffer());

  const formData = new FormData();
  formData.append("file", new Blob([audioBuf], { type: "audio/mpeg" }), "audio.mp3");
  formData.append("model", "whisper-1");
  formData.append("language", "bn");
  formData.append("response_format", "verbose_json");
  formData.append("prompt", "Transcribe this Bengali audio accurately");

  const baseUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
  const apiResp = await fetch(`${baseUrl}/v1/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.forgeApiKey}`,
      "Accept-Encoding": "identity",
    },
    body: formData,
  });

  if (!apiResp.ok) {
    const msg = await apiResp.text().catch(() => apiResp.statusText);
    throw new Error(`Whisper API failed (${apiResp.status}): ${msg}`);
  }

  return apiResp.json() as Promise<WhisperResponse>;
}

export async function runCaptionGeneration(
  jobId: number,
  stageId: number,
  job: PipelineJob,
): Promise<void> {
  // 1. Find silence_removal stage output
  const stages = await getJobStages(jobId);
  const silenceStage = stages.find(s => s.stageName === "silence_removal");
  if (!silenceStage?.outputFileId) {
    throw new Error("silence_removal stage output not found — run silence removal first");
  }

  const videoFile = await getVideoFileById(silenceStage.outputFileId);
  if (!videoFile) throw new Error(`Video file ${silenceStage.outputFileId} not found`);

  const videoPath = tmpPath("mp4");
  const audioPath = tmpPath("mp3");

  try {
    // 2. Download silence-removed video
    await updatePipelineStageStatus(stageId, "processing", { progressPercent: 5 });
    console.log(`[Captions] Downloading video key=${videoFile.fileKey}`);
    const signedUrl = await storageGetSignedUrl(videoFile.fileKey);
    const videoBuf = Buffer.from(await (await fetch(signedUrl)).arrayBuffer());
    const { writeFile } = await import("fs/promises");
    await writeFile(videoPath, videoBuf);

    // 3. Extract audio with FFmpeg
    await updatePipelineStageStatus(stageId, "processing", { progressPercent: 20 });
    console.log(`[Captions] Extracting audio`);
    await runFFmpeg([
      "-i", videoPath,
      "-vn",
      "-ar", "16000",
      "-ac", "1",
      "-f", "mp3",
      audioPath,
    ]);

    // 4. Upload audio to S3 so Whisper API can download it
    await updatePipelineStageStatus(stageId, "processing", { progressPercent: 40 });
    console.log(`[Captions] Uploading audio for transcription`);
    const audioBuf = await readFileAsBuffer(audioPath);
    const { key: audioKey } = await storagePut(
      `pipeline/${jobId}/audio.mp3`,
      audioBuf,
      "audio/mpeg",
    );
    const audioSignedUrl = await storageGetSignedUrl(audioKey);

    // 5. Transcribe with Whisper (Bengali)
    await updatePipelineStageStatus(stageId, "processing", { progressPercent: 55 });
    console.log(`[Captions] Transcribing Bengali audio`);
    const whisperResult = await transcribeBengali(audioSignedUrl);

    if (!whisperResult.segments || whisperResult.segments.length === 0) {
      throw new Error("Whisper returned no segments — audio may be silent or unrecognizable");
    }

    // 6. Convert to SRT and upload
    await updatePipelineStageStatus(stageId, "processing", { progressPercent: 80 });
    const srtContent = segmentsToSrt(whisperResult.segments);
    console.log(`[Captions] Generated SRT with ${whisperResult.segments.length} segments`);

    const { key: srtKey } = await storagePut(
      `pipeline/${jobId}/captions.srt`,
      Buffer.from(srtContent, "utf-8"),
      "text/plain",
    );

    // 7. Store srtKey in stage metadata
    await updatePipelineStageStatus(stageId, "processing", {
      progressPercent: 95,
      metadata: {
        srtKey,
        language: whisperResult.language,
        segmentCount: whisperResult.segments.length,
        duration: whisperResult.duration,
      },
    });

    console.log(`[Captions] Done — srtKey=${srtKey}`);
  } finally {
    await cleanupFiles(videoPath, audioPath);
  }
}
