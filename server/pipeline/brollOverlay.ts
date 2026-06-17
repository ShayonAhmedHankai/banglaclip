/**
 * B-Roll Overlay Stage
 *
 * Strategy:
 * 1. Read the transcript (SRT) from caption_generation stage metadata
 * 2. Extract keywords from each segment using the LLM
 * 3. Search Pexels for relevant stock video clips (requires PEXELS_API_KEY env var)
 * 4. Download clips and overlay them over the main video at appropriate timestamps
 *
 * Required env:
 *   PEXELS_API_KEY — get a free key at https://www.pexels.com/api/
 *
 * Falls back gracefully: if Pexels is not configured, writes a warning and copies
 * the input video unchanged so the pipeline continues.
 */

import { getJobStages, getVideoFileById, createVideoFile, updatePipelineStageStatus } from "../db";
import { storagePut, storageGetSignedUrl } from "../storage";
import { ENV } from "../_core/env";
import type { PipelineJob } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import {
  tmpPath,
  cleanupFiles,
  runFFmpeg,
  readFileAsBuffer,
  downloadToTempFile,
} from "./ffmpeg";
import { writeFile } from "fs/promises";

// ─── Pexels ───────────────────────────────────────────────────────────────────

interface PexelsVideo {
  id: number;
  duration: number;
  video_files: {
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }[];
}

async function searchPexelsVideo(query: string): Promise<PexelsVideo | null> {
  const apiKey = ENV.pexelsApiKey;
  if (!apiKey) return null;

  try {
    const url = new URL("https://api.pexels.com/videos/search");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", "5");
    url.searchParams.set("orientation", "portrait"); // 9:16 content

    const resp = await fetch(url.toString(), {
      headers: { Authorization: apiKey },
    });
    if (!resp.ok) return null;

    const data = await resp.json() as { videos: PexelsVideo[] };
    return data.videos?.[0] ?? null;
  } catch {
    return null;
  }
}

function pickBestVideoFile(video: PexelsVideo): string | null {
  // Prefer HD portrait (720p+), fallback to any
  const sorted = [...video.video_files]
    .filter(f => f.file_type === "video/mp4")
    .sort((a, b) => {
      const aScore = (a.quality === "hd" ? 100 : 0) + a.height;
      const bScore = (b.quality === "hd" ? 100 : 0) + b.height;
      return bScore - aScore;
    });
  return sorted[0]?.link ?? null;
}

// ─── SRT parser ───────────────────────────────────────────────────────────────

interface SRTSegment {
  index: number;
  start: number; // seconds
  end: number;
  text: string;
}

function parseSRT(srt: string): SRTSegment[] {
  const blocks = srt.trim().split(/\n\n+/);
  const segments: SRTSegment[] = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 3) continue;

    const index = parseInt(lines[0], 10);
    const timeParts = lines[1].match(
      /(\d+):(\d+):(\d+),(\d+)\s*-->\s*(\d+):(\d+):(\d+),(\d+)/
    );
    if (!timeParts) continue;

    const toSec = (h: string, m: string, s: string, ms: string) =>
      parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;

    segments.push({
      index,
      start: toSec(timeParts[1], timeParts[2], timeParts[3], timeParts[4]),
      end: toSec(timeParts[5], timeParts[6], timeParts[7], timeParts[8]),
      text: lines.slice(2).join(" ").trim(),
    });
  }
  return segments;
}

// ─── LLM keyword extraction ───────────────────────────────────────────────────

async function extractKeywords(texts: string[]): Promise<string[]> {
  try {
    const combined = texts.slice(0, 10).join(" ");
    const resp = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Extract 3-5 English keywords from Bengali text for searching stock video. Return only a JSON array of short English strings.",
        },
        {
          role: "user",
          content: `Bengali text: "${combined}"\n\nReturn a JSON array like: ["nature", "city", "people"]`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "keywords",
          strict: true,
          schema: {
            type: "object",
            properties: { keywords: { type: "array", items: { type: "string" } } },
            required: ["keywords"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = resp.choices[0]?.message?.content;
    if (!content) return ["nature", "people"];
    const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
    return (parsed.keywords as string[]).slice(0, 5);
  } catch {
    return ["nature", "people", "city"];
  }
}

// ─── Main stage ───────────────────────────────────────────────────────────────

interface BRollClip {
  localPath: string;
  startTime: number; // seconds in the main video where to insert
  duration: number;  // how long the b-roll plays
}

export async function runBrollOverlay(
  jobId: number,
  stageId: number,
  job: PipelineJob,
): Promise<void> {
  // 1. Get input from previous stages
  const stages = await getJobStages(jobId);
  const silenceStage = stages.find(s => s.stageName === "silence_removal");
  if (!silenceStage?.outputFileId) {
    throw new Error("silence_removal stage output not found");
  }

  const captionStage = stages.find(s => s.stageName === "caption_generation");
  const captionMeta = captionStage?.metadata as { srtKey?: string; segmentCount?: number } | null;

  const videoFile = await getVideoFileById(silenceStage.outputFileId);
  if (!videoFile) throw new Error(`Video file ${silenceStage.outputFileId} not found`);

  const pexelsConfigured = !!ENV.pexelsApiKey;

  // If Pexels not configured, just copy the video through
  if (!pexelsConfigured) {
    console.log("[BRoll] PEXELS_API_KEY not set — passing video through unchanged");
    await updatePipelineStageStatus(stageId, "processing", {
      progressPercent: 50,
      metadata: { skipped: true, reason: "PEXELS_API_KEY not configured" },
    });

    // Store the same video file as output so the export stage can find it
    await updatePipelineStageStatus(stageId, "processing", {
      progressPercent: 95,
      outputFileId: silenceStage.outputFileId,
      metadata: { skipped: true, reason: "PEXELS_API_KEY not configured" },
    });
    return;
  }

  const videoPath = tmpPath("mp4");
  const tempFiles: string[] = [videoPath];

  try {
    // 2. Download main video
    await updatePipelineStageStatus(stageId, "processing", { progressPercent: 5 });
    const signedUrl = await storageGetSignedUrl(videoFile.fileKey);
    await downloadToTempFile(signedUrl, "mp4", videoPath);

    // 3. Parse SRT if available
    let segments: SRTSegment[] = [];
    if (captionMeta?.srtKey) {
      try {
        const srtUrl = await storageGetSignedUrl(captionMeta.srtKey);
        const srtText = await (await fetch(srtUrl)).text();
        segments = parseSRT(srtText);
      } catch {
        // non-fatal
      }
    }

    await updatePipelineStageStatus(stageId, "processing", { progressPercent: 15 });

    // 4. Extract keywords from transcript
    const keywords = segments.length > 0
      ? await extractKeywords(segments.map(s => s.text))
      : ["nature", "lifestyle", "urban"];

    console.log(`[BRoll] Keywords: ${keywords.join(", ")}`);
    await updatePipelineStageStatus(stageId, "processing", { progressPercent: 25 });

    // 5. Fetch b-roll clips from Pexels
    const maxBRoll = Math.min(job.brollMaxPerMinute ?? 3, 5);
    const clips: BRollClip[] = [];

    for (let i = 0; i < Math.min(keywords.length, maxBRoll); i++) {
      const keyword = keywords[i];
      const video = await searchPexelsVideo(keyword);
      if (!video) continue;

      const fileUrl = pickBestVideoFile(video);
      if (!fileUrl) continue;

      // Download clip
      const clipPath = tmpPath("mp4");
      tempFiles.push(clipPath);
      try {
        await downloadToTempFile(fileUrl, "mp4", clipPath);

        // Space b-roll evenly through the video
        const segment = segments[Math.floor((segments.length / maxBRoll) * i)];
        const startTime = segment ? segment.start : i * 10;

        clips.push({ localPath: clipPath, startTime, duration: Math.min(3, video.duration) });
        console.log(`[BRoll] Downloaded clip for "${keyword}" — ${clipPath}`);
      } catch {
        // skip this clip
      }

      await updatePipelineStageStatus(stageId, "processing", {
        progressPercent: 25 + Math.round(((i + 1) / maxBRoll) * 40),
      });
    }

    await updatePipelineStageStatus(stageId, "processing", { progressPercent: 70 });

    if (clips.length === 0) {
      // No clips fetched — pass through
      console.log("[BRoll] No clips fetched, passing video through");
      await updatePipelineStageStatus(stageId, "processing", {
        progressPercent: 95,
        outputFileId: silenceStage.outputFileId,
        metadata: { skipped: true, reason: "No Pexels clips found" },
      });
      return;
    }

    // 6. Overlay b-roll clips using FFmpeg overlay filter
    //    For each clip: trim it, then overlay on the main video at the given timestamp
    const outputPath = tmpPath("mp4");
    tempFiles.push(outputPath);

    // Build a complex filter that overlays each clip at the right time
    // Using scale2ref + overlay with enable expression
    const inputArgs: string[] = ["-i", videoPath];
    for (const clip of clips) {
      inputArgs.push("-i", clip.localPath);
    }

    const filterParts: string[] = [];
    let lastVideo = "[0:v]";

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const inputIdx = i + 1;
      const outLabel = i < clips.length - 1 ? `[v${i}]` : "[vout]";

      // Scale b-roll to match main video size and overlay with time-based enable
      filterParts.push(
        `[${inputIdx}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setpts=PTS-STARTPTS[broll${i}]`
      );
      filterParts.push(
        `${lastVideo}[broll${i}]overlay=0:0:enable='between(t,${clip.startTime},${clip.startTime + clip.duration})'${outLabel}`
      );
      lastVideo = outLabel;
    }

    await runFFmpeg([
      ...inputArgs,
      "-filter_complex", filterParts.join(";"),
      "-map", "[vout]",
      "-map", "0:a",
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "23",
      "-c:a", "copy",
      outputPath,
    ]);

    await updatePipelineStageStatus(stageId, "processing", { progressPercent: 85 });

    // 7. Upload result
    const outBuf = await readFileAsBuffer(outputPath);
    const { key, url } = await storagePut(
      `pipeline/${jobId}/broll_overlay.mp4`,
      outBuf,
      "video/mp4",
    );

    const outputVideoFile = await createVideoFile({
      userId: job.userId,
      filename: `${job.jobName}_broll.mp4`,
      fileKey: key,
      url,
      mimeType: "video/mp4",
      fileSizeBytes: outBuf.length,
    });

    await updatePipelineStageStatus(stageId, "processing", {
      progressPercent: 95,
      outputFileId: outputVideoFile.id,
      metadata: { clipCount: clips.length, keywords },
    });

    console.log(`[BRoll] Done — ${clips.length} clips overlaid, outputFileId=${outputVideoFile.id}`);
  } finally {
    await cleanupFiles(...tempFiles);
  }
}
