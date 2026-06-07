/**
 * ThumbnailPreview — auto-generates and displays a thumbnail from the output video.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Image, RefreshCw } from "lucide-react";

interface ThumbnailPreviewProps {
  jobId: number;
}

export default function ThumbnailPreview({ jobId }: ThumbnailPreviewProps) {
  const [offsetSeconds, setOffsetSeconds] = useState(2);
  const { data, isLoading, refetch, isFetching } = trpc.jobs.getThumbnail.useQuery(
    { jobId, offsetSeconds },
    { enabled: !!jobId }
  );

  const handleRegenerate = () => {
    // Pick a different frame offset
    setOffsetSeconds(prev => prev + 3);
    setTimeout(() => refetch(), 50);
  };

  if (isLoading || isFetching) {
    return (
      <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Thumbnail</h2>
        <div className="flex items-center gap-2 text-[#ABABAB] text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating thumbnail...
        </div>
      </div>
    );
  }

  if (!data?.url) {
    return (
      <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Thumbnail</h2>
        <div className="text-center py-6 text-[#ABABAB]">
          <Image className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Could not generate thumbnail</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Thumbnail</h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRegenerate}
          className="gap-1.5 text-[#ABABAB] hover:text-white hover:bg-[#2c2c2c]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Different Frame
        </Button>
      </div>
      <div className="flex justify-center">
        <div className="relative overflow-hidden rounded-lg border border-[#3a3a3a] max-w-[200px]">
          <img
            src={data.url}
            alt="Video thumbnail"
            className="w-full object-cover"
            style={{ aspectRatio: "9/16" }}
          />
        </div>
      </div>
      <p className="text-xs text-[#ABABAB] text-center mt-3">
        Frame at {offsetSeconds}s — click "Different Frame" to try another
      </p>
    </div>
  );
}
