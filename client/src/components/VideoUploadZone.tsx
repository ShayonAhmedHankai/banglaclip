import { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFirebaseToken } from "@/lib/trpc";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface UploadProgress {
  fileName: string;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
}

interface VideoUploadZoneProps {
  onFileUploaded?: (fileId: number) => void;
}

interface UploadResult {
  id: number;
  filename: string;
  url: string;
  fileKey: string;
  fileSizeBytes: number;
  createdAt: string | Date | null;
}

function uploadFileWithProgress(
  file: File,
  token: string,
  onProgress: (pct: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as UploadResult);
        } catch {
          reject(new Error("Invalid response from server"));
        }
      } else {
        let message = "Upload failed";
        try {
          const body = JSON.parse(xhr.responseText);
          message = body.error ?? message;
        } catch {
          // ignore parse error
        }
        reject(new Error(message));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

    xhr.open("POST", "/api/upload");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(formData);
  });
}

export default function VideoUploadZone({ onFileUploaded }: VideoUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const utils = trpc.useUtils();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await processFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await processFiles(Array.from(e.target.files ?? []));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processFiles = async (files: File[]) => {
    for (const file of files) {
      if (!file.type.startsWith("video/")) {
        toast.error(`${file.name} is not a video file`);
        continue;
      }

      setIsUploading(true);
      setUploads(prev => [
        ...prev,
        { fileName: file.name, progress: 0, status: "uploading" },
      ]);

      try {
        const token = await getFirebaseToken();
        if (!token) {
          throw new Error("Not authenticated — please sign in again");
        }

        const result = await uploadFileWithProgress(
          file,
          token,
          (pct) => {
            setUploads(prev =>
              prev.map(u => u.fileName === file.name ? { ...u, progress: pct } : u)
            );
          }
        );

        setUploads(prev =>
          prev.map(u => u.fileName === file.name ? { ...u, progress: 100, status: "success" } : u)
        );

        await utils.files.list.invalidate();
        toast.success(`${file.name} uploaded successfully`);

        if (onFileUploaded && result?.id) {
          onFileUploaded(result.id);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        setUploads(prev =>
          prev.map(u => u.fileName === file.name ? { ...u, status: "error", error: errorMessage } : u)
        );
        toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg transition-all ${
          isDragging
            ? "border-[#E8643A] bg-[#E8643A]/5"
            : "border-[#3a3a3a] hover:border-[#E8643A]/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-12 text-center">
          <Upload className="mx-auto h-12 w-12 text-[#ABABAB] mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Upload Video</h3>
          <p className="text-sm text-[#ABABAB] mb-6">
            Drag and drop your MP4 video here, or click to browse
          </p>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-transparent border-[#3a3a3a] text-white hover:bg-[#2c2c2c]"
          >
            {isUploading ? "Uploading…" : "Select Video"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map(upload => (
            <div
              key={upload.fileName}
              className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg border border-[#3a3a3a]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {upload.status === "uploading" && (
                    <div className="h-4 w-4 rounded-full border-2 border-[#E8643A] border-t-transparent animate-spin flex-shrink-0" />
                  )}
                  {upload.status === "success" && (
                    <CheckCircle2 className="h-4 w-4 text-[#3AC87A] flex-shrink-0" />
                  )}
                  {upload.status === "error" && (
                    <AlertCircle className="h-4 w-4 text-[#FF4444] flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium text-white truncate">{upload.fileName}</span>
                  {upload.status === "uploading" && (
                    <span className="text-xs text-[#ABABAB] ml-auto flex-shrink-0">{upload.progress}%</span>
                  )}
                </div>

                {upload.status === "uploading" && (
                  <div className="w-full h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#E8643A] transition-all duration-200 rounded-full"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}

                {upload.status === "error" && upload.error && (
                  <p className="text-xs text-[#FF4444] mt-0.5">{upload.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
