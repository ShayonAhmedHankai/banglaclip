import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Play, AlertCircle, CheckCircle2, Clock, Video, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import VideoUploadZone from "@/components/VideoUploadZone";
import CreateJobDialog from "@/components/CreateJobDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNotifications } from "@/contexts/NotificationContext";

export default function Dashboard() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);

  const prevJobStatuses = useRef<Record<number, string>>({});

  const { data: jobs, isLoading } = trpc.jobs.list.useQuery(undefined, {
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!Array.isArray(data)) return false;
      const hasActive = data.some(
        (j: { status: string }) => j.status === "processing" || j.status === "queued",
      );
      return hasActive ? 3000 : false;
    },
  });

  // Detect job completions / failures and fire notifications
  useEffect(() => {
    if (!jobs) return;
    jobs.forEach((job) => {
      const prev = prevJobStatuses.current[job.id];
      if (prev && prev !== job.status) {
        if (job.status === "done") {
          addNotification({
            type: "success",
            title: "Job Completed",
            message: `"${job.jobName}" finished processing successfully.`,
          });
        } else if (job.status === "failed") {
          addNotification({
            type: "error",
            title: "Job Failed",
            message: `"${job.jobName}" encountered an error. Click Retry to try again.`,
          });
        }
      }
      prevJobStatuses.current[job.id] = job.status;
    });
  }, [jobs, addNotification]);

  const handleFileUploaded = (fileId: number) => {
    setSelectedFileId(fileId);
    setShowUpload(false);
    setShowCreateJob(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-[#3AC87A]" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-[#FF4444]" />;
      case "processing":
        return <div className="h-4 w-4 rounded-full border-2 border-[#4A9EFF] border-t-transparent animate-spin" />;
      case "queued":
        return <Clock className="h-4 w-4 text-[#F59E0B]" />;
      default:
        return <Clock className="h-4 w-4 text-[#ABABAB]" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "done":
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

  const getStatusLabel = (status: string) => {
    if (status === "done") return "Completed";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const stats = {
    total: jobs?.length || 0,
    completed: jobs?.filter(j => j.status === "done").length || 0,
    processing: jobs?.filter(j => j.status === "processing" || j.status === "queued").length || 0,
    failed: jobs?.filter(j => j.status === "failed").length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Welcome, {user?.name?.split(" ")[0] || "there"}
            </h1>
            <p className="text-[#ABABAB] mt-1">
              Manage your video processing pipeline
            </p>
          </div>
          <Button onClick={() => setShowUpload(true)} className="gap-2 bg-[#E8643A] hover:bg-[#d55a32]">
            <Plus className="h-4 w-4" />
            New Job
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Jobs", value: stats.total, icon: Video, color: "text-white" },
            { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-[#3AC87A]" },
            { label: "Processing", value: stats.processing, icon: Sparkles, color: "text-[#4A9EFF]" },
            { label: "Failed", value: stats.failed, icon: AlertCircle, color: "text-[#FF4444]" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4 hover:border-[#4a4a4a] transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#ABABAB]">{stat.label}</span>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Jobs Table */}
        <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg">
          <div className="p-4 border-b border-[#3a3a3a] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Jobs</h2>
              <p className="text-sm text-[#ABABAB] mt-0.5">
                {!jobs || jobs.length === 0
                  ? "No jobs yet. Create one to get started."
                  : `${jobs.length} job${jobs.length !== 1 ? "s" : ""} total`}
              </p>
            </div>
            {jobs && jobs.some(j => j.status === "processing" || j.status === "queued") && (
              <div className="flex items-center gap-2 text-xs text-[#4A9EFF]">
                <div className="h-2 w-2 rounded-full bg-[#4A9EFF] animate-pulse" />
                Live updates
              </div>
            )}
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 rounded-full border-4 border-[#3a3a3a] border-t-[#E8643A] animate-spin" />
              </div>
            ) : jobs && jobs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#3a3a3a]">
                      <th className="text-left py-3 px-4 font-medium text-[#ABABAB]">Job Name</th>
                      <th className="text-left py-3 px-4 font-medium text-[#ABABAB]">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-[#ABABAB] hidden sm:table-cell">Stage</th>
                      <th className="text-left py-3 px-4 font-medium text-[#ABABAB] hidden md:table-cell">Created</th>
                      <th className="text-right py-3 px-4 font-medium text-[#ABABAB]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(job => (
                      <tr key={job.id} className="border-b border-[#3a3a3a] last:border-0 hover:bg-[#2c2c2c] transition-colors">
                        <td className="py-3 px-4 font-medium text-white max-w-[160px] truncate">
                          {job.jobName}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(job.status)}
                            <Badge className={`${getStatusBadge(job.status)} text-xs font-medium`}>
                              {getStatusLabel(job.status)}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#ABABAB] hidden sm:table-cell text-xs">
                          {job.currentStage?.replace(/_/g, " ") || (job.status === "done" ? "Done" : "-")}
                        </td>
                        <td className="py-3 px-4 text-[#ABABAB] text-xs hidden md:table-cell">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/jobs/${job.id}`}>
                            <Button variant="ghost" size="sm" className="gap-1 text-[#ABABAB] hover:text-white hover:bg-[#2c2c2c]">
                              <Play className="h-3 w-3" />
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <Video className="h-12 w-12 text-[#ABABAB] mx-auto mb-4 opacity-40" />
                <p className="text-white font-semibold mb-2">No jobs yet</p>
                <p className="text-[#ABABAB] text-sm mb-6">Upload a video and configure your pipeline to get started</p>
                <Button onClick={() => setShowUpload(true)} className="bg-[#E8643A] hover:bg-[#d55a32]">
                  Create Your First Job
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-2xl bg-[#242424] border-[#3a3a3a] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Upload Video File</DialogTitle>
            <DialogDescription className="text-[#ABABAB]">
              Select an MP4 video file to upload. You'll configure the pipeline settings next.
            </DialogDescription>
          </DialogHeader>
          <VideoUploadZone onFileUploaded={handleFileUploaded} />
        </DialogContent>
      </Dialog>

      {/* Create Job Dialog */}
      {selectedFileId && (
        <CreateJobDialog
          open={showCreateJob}
          onOpenChange={setShowCreateJob}
          inputFileId={selectedFileId}
          onJobCreated={() => {
            setShowCreateJob(false);
            setSelectedFileId(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
