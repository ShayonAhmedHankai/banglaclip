import { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function VideoUploadZone({ onFileUploaded }: VideoUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const uploadMutation = trpc.files.upload.useMutation();
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
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    for (const file of files) {
      if (!file.type.startsWith("video/")) {
        toast.error(`${file.name} is not a video file`);
        continue;
      }

      setUploads(prev => [...prev, {
        fileName: file.name,
        progress: 0,
        status: "uploading",
      }]);

      try {
        const buffer = await file.arrayBuffer();
        const result = await uploadMutation.mutateAsync({
          filename: file.name,
          fileBuffer: new Uint8Array(buffer) as any,
          fileSizeBytes: file.size,
        });

        setUploads(prev => prev.map(u =>
          u.fileName === file.name
            ? { ...u, progress: 100, status: "success" }
            : u
        ));

        await utils.files.list.invalidate();
        toast.success(`${file.name} uploaded successfully`);

        if (onFileUploaded && result?.id) {
          onFileUploaded(result.id);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        setUploads(prev => prev.map(u =>
          u.fileName === file.name
            ? { ...u, status: "error", error: errorMessage }
            : u
        ));
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
            disabled={uploadMutation.isPending}
            className="bg-transparent border-[#3a3a3a] text-white hover:bg-[#2c2c2c]"
          >
            Select Video
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploadMutation.isPending}
          />
        </div>
      </div>

      {/* Upload Progress List */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map(upload => (
            <div key={upload.fileName} className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg border border-[#3a3a3a]">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {upload.status === "uploading" && (
                    <div className="h-4 w-4 rounded-full border-2 border-[#E8643A] border-t-transparent animate-spin" />
                  )}
                  {upload.status === "success" && (
                    <CheckCircle2 className="h-4 w-4 text-[#3AC87A]" />
                  )}
                  {upload.status === "error" && (
                    <AlertCircle className="h-4 w-4 text-[#FF4444]" />
                  )}
                  <span className="text-sm font-medium text-white truncate">{upload.fileName}</span>
                </div>
                {upload.status === "uploading" && (
                  <div className="w-full h-1 bg-[#3a3a3a] rounded-full overflow-hidden">
                    <div className="h-full bg-[#E8643A] transition-all duration-300" style={{ width: `${upload.progress}%` }} />
                  </div>
                )}
                {upload.error && (
                  <p className="text-xs text-[#FF4444]">{upload.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
