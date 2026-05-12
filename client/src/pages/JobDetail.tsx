import { useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Download, AlertCircle, CheckCircle2, Clock, Play } from "lucide-react";
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
          <div className="h-8 w-8 rounded-full border-4 border-border border-t-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
          <p className="text-muted-foreground mb-4">The job you're looking for doesn't exist.</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "processing":
        return <div className="h-5 w-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const stageOrder = ["silence_removal", "caption_generation", "broll_overlay", "export", "youtube_upload"];
  const sortedStages = stages?.sort((a, b) => {
    const aIndex = stageOrder.indexOf(a.stageName);
    const bIndex = stageOrder.indexOf(b.stageName);
    return aIndex - bIndex;
  }) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{job.jobName}</h1>
            <p className="text-muted-foreground mt-1">
              Created {new Date(job.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Badge className={getStatusColor(job.status)}>
            {job.status}
          </Badge>
        </div>

        {/* Job Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Stage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {job.currentStage?.replace(/_/g, " ") || "-"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getStatusIcon(job.status)}
                <span className="text-lg font-semibold capitalize">{job.status}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {job.completedAt && job.startedAt
                  ? `${Math.round((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000)}s`
                  : "-"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Stages */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Stages</CardTitle>
            <CardDescription>
              Progress through each processing stage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stagesLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 rounded-full border-4 border-border border-t-primary animate-spin" />
                </div>
              ) : sortedStages.length > 0 ? (
                sortedStages.map((stage, index) => (
                  <div key={stage.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        {getStatusIcon(stage.status)}
                      </div>
                      {index < sortedStages.length - 1 && (
                        <div className="h-12 w-0.5 bg-border my-2" />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold capitalize">
                          {stage.stageName.replace(/_/g, " ")}
                        </h3>
                        <Badge className={getStatusColor(stage.status)}>
                          {stage.status}
                        </Badge>
                      </div>
                      {stage.status === "processing" && (
                        <div className="w-full h-2 bg-border rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${stage.progressPercent}%` }}
                          />
                        </div>
                      )}
                      {stage.errorMessage && (
                        <p className="text-sm text-red-600 mt-2">{stage.errorMessage}</p>
                      )}
                      {stage.completedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Completed {new Date(stage.completedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No stages found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Silence Threshold</p>
                <p className="font-semibold">{job.config.silenceThresholdDb} dB</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Caption Font</p>
                <p className="font-semibold">{job.config.captionFontName} ({job.config.captionFontSize}px)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">B-Roll Max Per Minute</p>
                <p className="font-semibold">{job.config.brollMaxPerMinute}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Export Quality</p>
                <p className="font-semibold capitalize">{job.config.exportQuality}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Details */}
        {job.errorMessage && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Error Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700">{job.errorMessage}</p>
              {job.errorStage && (
                <p className="text-xs text-red-600 mt-2">
                  Failed at stage: {job.errorStage.replace(/_/g, " ")}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* YouTube Upload Info */}
        {job.youtubeVideoId && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">YouTube Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-muted-foreground">Video ID:</span>{" "}
                  <span className="font-mono text-sm">{job.youtubeVideoId}</span>
                </p>
                {job.youtubeVideoUrl && (
                  <a
                    href={job.youtubeVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 hover:text-green-800 text-sm font-medium"
                  >
                    View on YouTube →
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
