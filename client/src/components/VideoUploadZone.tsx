import { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

      const uploadId = `${file.name}-${Date.now()}`;
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

        // Invalidate files list to refresh
        await utils.files.list.invalidate();

        toast.success(`${file.name} uploaded successfully`);
        
        // Call the callback with the file ID
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

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full space-y-4">
      <Card
        className={`relative border-2 border-dashed transition-all ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-12 text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upload Video</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Drag and drop your MP4 video here, or click to browse
          </p>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
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
      </Card>

      {/* Upload Progress List */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map(upload => (
            <div key={upload.fileName} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {upload.status === "uploading" && (
                    <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  )}
                  {upload.status === "success" && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  {upload.status === "error" && (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium truncate">{upload.fileName}</span>
                </div>
                {upload.status === "uploading" && (
                  <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
                {upload.error && (
                  <p className="text-xs text-red-600">{upload.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
