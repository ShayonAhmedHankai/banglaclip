import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Play, Download, AlertCircle, CheckCircle2, Clock, Video, Sparkles } from "lucide-react";
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

export default function Dashboard() {
  const { user } = useAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const { data: jobs, isLoading } = trpc.jobs.list.useQuery(undefined, {
    refetchInterval: query => {
      const data = query.state.data;
      if (!Array.isArray(data)) return false;
      const hasActive = data.some(
        (j: { status: string }) => j.status === "processing" || j.status === "queued",
      );
      return hasActive ? 3000 : false;
    },
  });
  const { data: files } = trpc.files.list.useQuery();

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

  const stats = {
    total: jobs?.length || 0,
    completed: jobs?.filter(j => j.status === "done").length || 0,
    processing: jobs?.filter(j => j.status === "processing").length || 0,
    failed: jobs?.filter(j => j.status === "failed").length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Video Pipeline
            </h1>
            <p className="text-[#ABABAB] mt-1">
              Manage and process your video files through the automated pipeline
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-[#ABABAB]">Welcome, {user?.name || "User"}</p>
            </div>
            <Button onClick={() => setShowUpload(true)} className="gap-2 bg-[#E8643A] hover:bg-[#d55a32]">
              <Plus className="h-4 w-4" />
              New Job
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Jobs", value: stats.total, icon: Video, color: "text-white" },
            { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-[#3AC87A]" },
            { label: "Processing", value: stats.processing, icon: Sparkles, color: "text-[#4A9EFF]" },
            { label: "Failed", value: stats.failed, icon: AlertCircle, color: "text-[#FF4444]" },
          ].map((stat, i) => (
            <div key={i} className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">
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
          <div className="p-4 border-b border-[#3a3a3a]">
            <h2 className="text-lg font-semibold text-white">Recent Jobs</h2>
            <p className="text-sm text-[#ABABAB] mt-1">
              {jobs?.length === 0
                ? "No jobs yet. Create one to get started."
                : `Showing ${jobs?.length} job${jobs?.length !== 1 ? "s" : ""}`}
            </p>
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
                      <th className="text-left py-3 px-4 font-medium text-[#ABABAB]">Stage</th>
                      <th className="text-left py-3 px-4 font-medium text-[#ABABAB]">Created</th>
                      <th className="text-right py-3 px-4 font-medium text-[#ABABAB]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(job => (
                      <tr key={job.id} className="border-b border-[#3a3a3a] hover:bg-[#2c2c2c] transition-colors">
                        <td className="py-3 px-4 font-medium text-white">{job.jobName}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(job.status)}
                            <Badge className={`${getStatusBadge(job.status)} text-xs font-medium`}>
                              {job.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#ABABAB]">
                          {job.currentStage?.replace(/_/g, " ") || "-"}
                        </td>
                        <td className="py-3 px-4 text-[#ABABAB] text-xs">
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
              <div className="text-center py-12">
                <p className="text-[#ABABAB] mb-4">No jobs created yet</p>
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
