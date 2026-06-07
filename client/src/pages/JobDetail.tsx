import { useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Play,
  Youtube,
  RotateCcw,
  Loader2,
  Zap,
  Film,
  Globe,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { useJobSSE } from "@/hooks/useJobSSE";
import TranscriptEditor from "@/components/TranscriptEditor";
import ThumbnailPreview from "@/components/ThumbnailPreview";

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id || "0");
  const [retrying, setRetrying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const utils = trpc.useUtils();

  const { data: job, isLoading: jobLoading, refetch: refetchJob } = trpc.jobs.getById.useQuery(
    { id: jobId },
    {
      enabled: !!jobId,
      // SSE handles live updates; poll every 10s only as fallback
      refetchInterval: (query) => {
        const data = query.state.data;
        if (!data) return false;
        const active = data.status === "processing" || data.status === "queued";
        return active ? 10000 : false;
      },
    }
  );

  const { data: stages, isLoading: stagesLoading, refetch: refetchStages } = trpc.jobs.getStages.useQuery(
    { jobId },
    {
      enabled: !!jobId,
      refetchInterval: (query) => {
        if (!job) return false;
        const active = job.status === "processing" || job.status === "queued";
        return active ? 10000 : false;
      },
    }
  );

  // SSE for real-time updates
  useJobSSE({
    jobId,
    enabled: !!jobId && (job?.status === "processing" || job?.status === "queued" || !job),
    onStage: () => { void refetchStages(); void refetchJob(); },
    onDone: () => { void refetchJob(); void refetchStages(); },
  });

  const retryMutation = trpc.pipeline.retryJob.useMutation();
  const downloadUrlQuery = trpc.files.getDownloadUrl.useQuery(
    { id: job?.outputFileId ?? 0 },
    { enabled: false }
  );

  const handleDownload = async () => {
    if (!job?.outputFileId) {
      toast.error("No output file available yet");
      return;
    }
    setDownloading(true);
    try {
      const result = await utils.files.getDownloadUrl.fetch({ id: job.outputFileId });
      const a = document.createElement("a");
      a.href = result.url;
      a.download = result.filename;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      toast.error(err?.message ?? "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await retryMutation.mutateAsync({ jobId });
      await utils.jobs.getById.invalidate({ id: jobId });
      await utils.jobs.getStages.invalidate({ jobId });
      toast.success("Job re-queued for processing");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to retry job");
    } finally {
      setRetrying(false);
    }
  };

  if (jobLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 rounded-full border-4 border-[#3a3a3a] border-t-[#E8643A] animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="text-center py-24">
          <AlertCircle className="h-12 w-12 text-[#FF4444] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-white">Job Not Found</h2>
          <p className="text-[#ABABAB] mb-4">The job you're looking for doesn't exist.</p>
          <Link href="/dashboard">
            <Button className="bg-[#E8643A] hover:bg-[#d55a32]">Back to Dashboard</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "done":
      case "completed":
        return "bg-[#3AC87A]/15 text-[#3AC87A] border-[#3AC87A]/30";
      case "failed":
        return "bg-[#FF4444]/15 text-[#FF4444] border-[#FF4444]/30";
      case "processing":
        return "bg-[#4A9EFF]/15 text-[#4A9EFF] border-[#4A9EFF]/30";
      case "queued":
        return "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30";
      default:
        return "bg-[#2c2c2c] text-[#ABABAB] border-[#3a3a3a]";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-[#3AC87A]" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-[#FF4444]" />;
      case "processing":
        return <div className="h-5 w-5 rounded-full border-2 border-[#4A9EFF] border-t-transparent animate-spin" />;
      case "queued":
        return <Clock className="h-5 w-5 text-[#F59E0B]" />;
      default:
        return <Clock className="h-5 w-5 text-[#ABABAB]" />;
    }
  };

  const stageOrder = [
    { key: "silence_removal", label: "Silence Removal", icon: Zap },
    { key: "caption_generation", label: "Captions", icon: Film },
    { key: "broll_overlay", label: "B-Roll", icon: Globe },
    { key: "export", label: "Export", icon: Sparkles },
    { key: "youtube_upload", label: "YouTube", icon: Youtube },
  ];

  const sortedStages = [...(stages ?? [])].sort((a, b) => {
    const aIndex = stageOrder.findIndex(s => s.key === a.stageName);
    const bIndex = stageOrder.findIndex(s => s.key === b.stageName);
    return aIndex - bIndex;
  });

  const completedCount = sortedStages.filter(s => s.status === "completed").length;
  const totalCount = sortedStages.length;
  const overallProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const isProcessingOrQueued = job.status === "processing" || job.status === "queued";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-[#ABABAB] hover:text-white hover:bg-[#2c2c2c]">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">{job.jobName}</h1>
            <p className="text-[#ABABAB] mt-0.5 text-sm">
              Created {new Date(job.createdAt).toLocaleDateString()}
              {isProcessingOrQueued && (
                <span className="ml-2 text-[#4A9EFF] text-xs animate-pulse">● Live</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {job.status === "failed" && (
              <Button
                onClick={handleRetry}
                disabled={retrying}
                variant="outline"
                className="gap-2 bg-transparent border-[#3a3a3a] text-white hover:bg-[#2c2c2c]"
              >
                {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Retry
              </Button>
            )}
            <Badge className={`${getStatusBadge(job.status)} text-sm font-medium px-3 py-1`}>
              {job.status === "done" ? "Completed" : job.status}
            </Badge>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">
            <p className="text-sm text-[#ABABAB] mb-1">Current Stage</p>
            <div className="text-base font-semibold text-white">
              {job.currentStage?.replace(/_/g, " ") || (job.status === "done" ? "Completed" : "-")}
            </div>
          </div>
          <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">
            <p className="text-sm text-[#ABABAB] mb-2">Overall Progress</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-[#3a3a3a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#E8643A] transition-all duration-500"
                  style={{ width: `${job.status === "done" ? 100 : overallProgress}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-white w-8 text-right">
                {job.status === "done" ? 100 : overallProgress}%
              </span>
            </div>
          </div>
          <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">
            <p className="text-sm text-[#ABABAB] mb-1">Duration</p>
            <div className="text-base font-semibold text-white">
              {job.completedAt && job.startedAt
                ? `${Math.round((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000)}s`
                : job.startedAt
                ? "Running..."
                : "-"}
            </div>
          </div>
        </div>

        {/* Pipeline Horizontal Stepper */}
        <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Pipeline Stages</h2>
          <div className="flex items-start justify-center gap-0 overflow-x-auto pb-2">
            {stageOrder.map((stage, index) => {
              const stageData = sortedStages.find(s => s.stageName === stage.key);
              const isCompleted = stageData?.status === "completed" || (job.status === "done" && !stageData);
              const isProcessingStage = stageData?.status === "processing";
              const isFailed = stageData?.status === "failed";
              const isPending = !stageData || stageData?.status === "pending";

              return (
                <div key={stage.key} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[90px] sm:min-w-[110px]">
                    <div className={`h-11 w-11 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isCompleted
                        ? "bg-[#3AC87A]/20 border-[#3AC87A] text-[#3AC87A]"
                        : isProcessingStage
                        ? "bg-[#4A9EFF]/20 border-[#4A9EFF] text-[#4A9EFF]"
                        : isFailed
                        ? "bg-[#FF4444]/20 border-[#FF4444] text-[#FF4444]"
                        : "bg-[#2c2c2c] border-[#3a3a3a] text-[#ABABAB]"
                    }`}>
                      {isProcessingStage ? (
                        <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      ) : (
                        <stage.icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className="text-xs text-[#ABABAB] mt-2 text-center leading-tight px-1">{stage.label}</span>
                    {isProcessingStage && stageData?.progressPercent != null && stageData.progressPercent > 0 && (
                      <div className="w-14 h-1 bg-[#3a3a3a] rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-[#4A9EFF] transition-all duration-300" style={{ width: `${stageData.progressPercent}%` }} />
                      </div>
                    )}
                  </div>
                  {index < stageOrder.length - 1 && (
                    <div className={`h-0.5 w-6 sm:w-8 mx-1 transition-all duration-300 shrink-0 ${
                      isCompleted ? "bg-[#3AC87A]" : "bg-[#3a3a3a]"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stage Details */}
        <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Stage Details</h2>
          <div className="space-y-3">
            {stagesLoading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 rounded-full border-4 border-[#3a3a3a] border-t-[#E8643A] animate-spin" />
              </div>
            ) : sortedStages.length > 0 ? (
              sortedStages.map((stage) => (
                <div key={stage.id} className="flex items-start gap-4 p-4 bg-[#1a1a1a] rounded-lg border border-[#3a3a3a]">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
                    stage.status === "completed" ? "bg-[#3AC87A]/20" :
                    stage.status === "processing" ? "bg-[#4A9EFF]/20" :
                    stage.status === "failed" ? "bg-[#FF4444]/20" :
                    "bg-[#2c2c2c]"
                  }`}>
                    {getStatusIcon(stage.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white capitalize text-sm">
                        {stage.stageName.replace(/_/g, " ")}
                      </h3>
                      <Badge className={`${getStatusBadge(stage.status)} text-xs font-medium`}>
                        {stage.status}
                      </Badge>
                    </div>
                    {stage.status === "processing" && (
                      <div className="w-full h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full bg-[#4A9EFF] transition-all duration-300"
                          style={{ width: `${stage.progressPercent ?? 0}%` }}
                        />
                      </div>
                    )}
                    {stage.errorMessage && (
                      <p className="text-xs text-[#FF4444] mt-1">{stage.errorMessage}</p>
                    )}
                    {stage.completedAt && (
                      <p className="text-xs text-[#ABABAB] mt-1">
                        Completed {new Date(stage.completedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-[#ABABAB] py-8 text-sm">
                {job.status === "queued" ? "Waiting for worker to pick up job..." : "No stages recorded"}
              </p>
            )}
          </div>
        </div>

        {/* Thumbnail Preview */}
        {job.status === "done" && job.outputFileId && (
          <ThumbnailPreview jobId={jobId} />
        )}

        {/* Transcript Editor */}
        <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Captions / Transcript</h2>
          <TranscriptEditor jobId={jobId} jobStatus={job.status} />
        </div>

        {/* Configuration */}
        <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Configuration</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Silence Threshold", value: `${job.config.silenceThresholdDb} dB` },
              { label: "Caption Font", value: `${job.config.captionFontName} (${job.config.captionFontSize}px)` },
              { label: "Caption Color", value: job.config.captionFontColor },
              { label: "Caption Position", value: job.config.captionAlignment },
              { label: "B-Roll Max/Minute", value: String(job.config.brollMaxPerMinute) },
              { label: "Export Quality", value: job.config.exportQuality },
              { label: "Aspect Ratio", value: job.config.exportAspectRatio },
              { label: "YouTube Upload", value: job.config.youtubeUploadEnabled ? "Enabled" : "Disabled" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#1a1a1a] rounded-lg p-3 border border-[#3a3a3a]">
                <p className="text-xs text-[#ABABAB]">{label}</p>
                <p className="text-sm font-semibold text-white mt-0.5 capitalize">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Error Details */}
        {job.status === "failed" && job.errorMessage && (
          <div className="bg-[#FF4444]/10 border border-[#FF4444]/30 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[#FF4444] shrink-0 mt-0.5" />
              <div className="flex-1">
                <h2 className="text-base font-semibold text-[#FF4444] mb-2">Error Details</h2>
                <p className="text-sm text-[#FF4444]/80">{job.errorMessage}</p>
                {job.errorStage && (
                  <p className="text-xs text-[#FF4444]/60 mt-2">
                    Failed at stage: <span className="capitalize">{job.errorStage.replace(/_/g, " ")}</span>
                  </p>
                )}
                <Button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="mt-4 gap-2 bg-[#E8643A] hover:bg-[#d55a32]"
                >
                  {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  Retry Job
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* YouTube Info */}
        {job.youtubeVideoId && (
          <div className="bg-[#3AC87A]/10 border border-[#3AC87A]/30 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Youtube className="h-5 w-5 text-[#3AC87A] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-semibold text-[#3AC87A] mb-2">YouTube Upload</h2>
                <p className="text-sm text-[#3AC87A]/80 mb-1">
                  Video ID: <span className="font-mono">{job.youtubeVideoId}</span>
                </p>
                {job.youtubeVideoUrl && (
                  <a
                    href={job.youtubeVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3AC87A] hover:text-[#4A9EFF] text-sm font-medium transition-colors"
                  >
                    Watch on YouTube →
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {job.status === "done" && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center pb-6">
            {job.youtubeVideoUrl ? (
              <a href={job.youtubeVideoUrl} target="_blank" rel="noopener noreferrer">
                <Button className="gap-2 bg-[#E8643A] hover:bg-[#d55a32] w-full sm:w-auto">
                  <Youtube className="h-5 w-5" />
                  View on YouTube
                </Button>
              </a>
            ) : null}
            <Button
              onClick={handleDownload}
              disabled={downloading || !job.outputFileId}
              className="gap-2 bg-[#2c2c2c] hover:bg-[#3a3a3a] border border-[#3a3a3a] text-white w-full sm:w-auto"
            >
              {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
              {downloading ? "Preparing..." : "Download Video"}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
