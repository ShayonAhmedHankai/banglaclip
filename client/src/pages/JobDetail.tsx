import { useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Download, AlertCircle, CheckCircle2, Clock, Play, Youtube } from "lucide-react";
import { Link } from "wouter";

export default function JobDetail() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id || "0");

  const { data: job, isLoading: jobLoading } = trpc.jobs.getById.useQuery(
    { id: jobId },
    { enabled: !!jobId }
  );

  const { data: stages, isLoading: stagesLoading } = trpc.jobs.getStages.useQuery(
    { jobId },
    { enabled: !!jobId }
  );

  if (jobLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 rounded-full border-4 border-[#3a3a3a] border-t-[#E8643A] animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
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
      case "completed":
        return "bg-[#3AC87A]/15 text-[#3AC87A] border-[#3AC87A]/30";
      case "failed":
        return "bg-[#FF4444]/15 text-[#FF4444] border-[#FF4444]/30";
      case "processing":
        return "bg-[#4A9EFF]/15 text-[#4A9EFF] border-[#4A9EFF]/30";
      case "pending":
        return "bg-[#2c2c2c] text-[#ABABAB] border-[#3a3a3a]";
      default:
        return "bg-[#2c2c2c] text-[#ABABAB] border-[#3a3a3a]";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-[#3AC87A]" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-[#FF4444]" />;
      case "processing":
        return <div className="h-5 w-5 rounded-full border-2 border-[#4A9EFF] border-t-transparent animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-[#ABABAB]" />;
    }
  };

  const stageOrder = [
    { key: "silence_removal", label: "Silence Removal", icon: Play },
    { key: "caption_generation", label: "Captions", icon: Clock },
    { key: "broll_overlay", label: "B-Roll", icon: Download },
    { key: "export", label: "Export", icon: Download },
    { key: "youtube_upload", label: "YouTube", icon: Youtube },
  ];

  const sortedStages = stages?.sort((a, b) => {
    const aIndex = stageOrder.findIndex(s => s.key === a.stageName);
    const bIndex = stageOrder.findIndex(s => s.key === b.stageName);
    return aIndex - bIndex;
  }) || [];

  const completedCount = sortedStages.filter(s => s.status === "completed").length;
  const totalCount = sortedStages.length;
  const overallProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

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
            <h1 className="text-3xl font-bold tracking-tight text-white">{job.jobName}</h1>
            <p className="text-[#ABABAB] mt-1">
              Created {new Date(job.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Badge className={`${getStatusBadge(job.status)} text-sm font-medium`}>
            {job.status}
          </Badge>
        </div>

        {/* Job Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">
            <p className="text-sm text-[#ABABAB] mb-1">Current Stage</p>
            <div className="text-lg font-semibold text-white">
              {job.currentStage?.replace(/_/g, " ") || "-"}
            </div>
          </div>
          <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">
            <p className="text-sm text-[#ABABAB] mb-1">Overall Progress</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-[#3a3a3a] rounded-full overflow-hidden">
                <div className="h-full bg-[#E8643A] transition-all duration-300" style={{ width: `${overallProgress}%` }} />
              </div>
              <span className="text-sm font-semibold text-white">{Math.round(overallProgress)}%</span>
            </div>
          </div>
          <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">
            <p className="text-sm text-[#ABABAB] mb-1">Duration</p>
            <div className="text-lg font-semibold text-white">
              {job.completedAt && job.startedAt
                ? `${Math.round((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000)}s`
                : "-"}
            </div>
          </div>
        </div>

        {/* Pipeline Horizontal Stepper */}
        <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Pipeline Stages</h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {stageOrder.map((stage, index) => {
              const stageData = sortedStages.find(s => s.stageName === stage.key);
              const isCompleted = stageData?.status === "completed";
              const isProcessing = stageData?.status === "processing";
              const isFailed = stageData?.status === "failed";

              return (
                <div key={stage.key} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[100px]">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isCompleted
                        ? "bg-[#3AC87A]/20 border-[#3AC87A] text-[#3AC87A]"
                        : isProcessing
                        ? "bg-[#4A9EFF]/20 border-[#4A9EFF] text-[#4A9EFF]"
                        : isFailed
                        ? "bg-[#FF4444]/20 border-[#FF4444] text-[#FF4444]"
                        : "bg-[#2c2c2c] border-[#3a3a3a] text-[#ABABAB]"
                    }`}>
                      <stage.icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs text-[#ABABAB] mt-2 text-center leading-tight">{stage.label}</span>
                    {isProcessing && stageData?.progressPercent && stageData.progressPercent > 0 && (
                      <div className="w-16 h-1 bg-[#3a3a3a] rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-[#4A9EFF] transition-all duration-300" style={{ width: `${stageData.progressPercent}%` }} />
                      </div>
                    )}
                  </div>
                  {index < stageOrder.length - 1 && (
                    <div className={`h-0.5 w-8 mx-1 transition-all duration-300 ${
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
          <div className="space-y-4">
            {stagesLoading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 rounded-full border-4 border-[#3a3a3a] border-t-[#E8643A] animate-spin" />
              </div>
            ) : sortedStages.length > 0 ? (
              sortedStages.map((stage) => (
                <div key={stage.id} className="flex items-start gap-4 p-3 bg-[#1a1a1a] rounded-lg border border-[#3a3a3a]">
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
                      <h3 className="font-semibold text-white capitalize">
                        {stage.stageName.replace(/_/g, " ")}
                      </h3>
                      <Badge className={`${getStatusBadge(stage.status)} text-xs font-medium`}>
                        {stage.status}
                      </Badge>
                    </div>
                    {stage.status === "processing" && (
                      <div className="w-full h-2 bg-[#3a3a3a] rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-[#4A9EFF] transition-all duration-300" style={{ width: `${stage.progressPercent}%` }} />
                      </div>
                    )}
                    {stage.errorMessage && (
                      <p className="text-sm text-[#FF4444] mt-2">{stage.errorMessage}</p>
                    )}
                    {stage.completedAt && (
                      <p className="text-xs text-[#ABABAB] mt-2">
                        Completed {new Date(stage.completedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-[#ABABAB] py-8">No stages found</p>
            )}
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#3a3a3a]">
              <p className="text-sm text-[#ABABAB]">Silence Threshold</p>
              <p className="font-semibold text-white">{job.config.silenceThresholdDb} dB</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#3a3a3a]">
              <p className="text-sm text-[#ABABAB]">Caption Font</p>
              <p className="font-semibold text-white">{job.config.captionFontName} ({job.config.captionFontSize}px)</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#3a3a3a]">
              <p className="text-sm text-[#ABABAB]">B-Roll Max Per Minute</p>
              <p className="font-semibold text-white">{job.config.brollMaxPerMinute}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#3a3a3a]">
              <p className="text-sm text-[#ABABAB]">Export Quality</p>
              <p className="font-semibold text-white capitalize">{job.config.exportQuality}</p>
            </div>
          </div>
        </div>

        {/* Error Details */}
        {job.errorMessage && (
          <div className="bg-[#FF4444]/10 border border-[#FF4444]/30 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[#FF4444] mb-2">Error Details</h2>
            <p className="text-sm text-[#FF4444]/80">{job.errorMessage}</p>
            {job.errorStage && (
              <p className="text-xs text-[#FF4444]/60 mt-2">
                Failed at stage: {job.errorStage.replace(/_/g, " ")}
              </p>
            )}
          </div>
        )}

        {/* YouTube Upload Info */}
        {job.youtubeVideoId && (
          <div className="bg-[#3AC87A]/10 border border-[#3AC87A]/30 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[#3AC87A] mb-2">YouTube Upload</h2>
            <div className="space-y-2">
              <p className="text-sm text-[#3AC87A]/80">
                <span className="text-[#ABABAB]">Video ID:</span>{" "}
                <span className="font-mono text-sm">{job.youtubeVideoId}</span>
              </p>
              {job.youtubeVideoUrl && (
                <a
                  href={job.youtubeVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3AC87A] hover:text-[#4A9EFF] text-sm font-medium transition-colors"
                >
                  View on YouTube →
                </a>
              )}
            </div>
          </div>
        )}

        {/* Download Button */}
        {job.status === "done" && (
          <div className="flex justify-center">
            <Button className="gap-2 bg-[#E8643A] hover:bg-[#d55a32] text-lg px-6 py-3">
              <Download className="h-5 w-5" />
              Download Video
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
