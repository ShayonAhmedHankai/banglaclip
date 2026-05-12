import { spawn } from "child_process";
import { readFile, unlink, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

export function tmpPath(ext: string): string {
  return join(tmpdir(), `banglaclip-${randomUUID()}.${ext}`);
}

export async function cleanupFiles(...paths: string[]): Promise<void> {
  await Promise.allSettled(paths.map(p => unlink(p)));
}

export function runFFmpeg(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", ["-y", ...args]);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
    proc.on("close", code => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`FFmpeg exited ${code}\n${stderr.slice(-2000)}`));
    });
    proc.on("error", reject);
  });
}

export function runFFprobe(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffprobe", args);
    let out = "";
    proc.stdout.on("data", (d: Buffer) => { out += d.toString(); });
    proc.stderr.on("data", () => {});
    proc.on("close", code => {
      if (code === 0) resolve(out.trim());
      else reject(new Error(`ffprobe exited ${code}`));
    });
    proc.on("error", reject);
  });
}

export async function getVideoDuration(inputPath: string): Promise<number> {
  const out = await runFFprobe([
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    inputPath,
  ]);
  return parseFloat(out);
}

export interface SilenceInterval {
  start: number;
  end: number;
}

export function parseSilenceIntervals(stderr: string, duration: number): SilenceInterval[] {
  const starts: number[] = [];
  const ends: number[] = [];

  for (const line of stderr.split("\n")) {
    const sStart = line.match(/silence_start:\s*([\d.]+)/);
    if (sStart) starts.push(parseFloat(sStart[1]));
    const sEnd = line.match(/silence_end:\s*([\d.]+)/);
    if (sEnd) ends.push(parseFloat(sEnd[1]));
  }

  // If a silence starts but never ends (video ends during silence)
  if (starts.length > ends.length) ends.push(duration);

  return starts.map((start, i) => ({ start, end: ends[i] ?? duration }));
}

export interface KeepSegment {
  start: number;
  end: number;
}

export function computeKeepSegments(
  silences: SilenceInterval[],
  duration: number,
  paddingSec: number,
): KeepSegment[] {
  const MIN_SEGMENT = 0.05;
  const keeps: KeepSegment[] = [];
  let cursor = 0;

  for (const silence of silences) {
    const keepEnd = Math.max(0, silence.start - paddingSec);
    if (keepEnd - cursor >= MIN_SEGMENT) {
      keeps.push({ start: cursor, end: keepEnd });
    }
    cursor = Math.min(duration, silence.end + paddingSec);
  }

  if (duration - cursor >= MIN_SEGMENT) {
    keeps.push({ start: cursor, end: duration });
  }

  return keeps;
}

export async function downloadToTempFile(url: string, ext: string): Promise<string> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Download failed: ${resp.status} ${resp.statusText}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  const path = tmpPath(ext);
  await writeFile(path, buf);
  return path;
}

export async function readFileAsBuffer(path: string): Promise<Buffer> {
  return readFile(path);
}
