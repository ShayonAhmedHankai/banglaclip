import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Play, Download, AlertCircle, CheckCircle2, Clock } from "lucide-react";
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
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "processing":
        return <div className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "queued":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Video Pipeline</h1>
            <p className="text-muted-foreground mt-1">
              Manage and process your video files through the automated pipeline
            </p>
          </div>
          <Button onClick={() => setShowUpload(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Job
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobs?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {jobs?.filter(j => j.status === "done").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {jobs?.filter(j => j.status === "processing").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {jobs?.filter(j => j.status === "failed").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>
              {jobs?.length === 0
                ? "No jobs yet. Create one to get started."
                : `Showing ${jobs?.length} job${jobs?.length !== 1 ? "s" : ""}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 rounded-full border-4 border-border border-t-primary animate-spin" />
              </div>
            ) : jobs && jobs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Job Name</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Stage</th>
                      <th className="text-left py-3 px-4 font-medium">Created</th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(job => (
                      <tr key={job.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-medium">{job.jobName}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(job.status)}
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {job.currentStage?.replace(/_/g, " ") || "-"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/jobs/${job.id}`}>
                            <Button variant="ghost" size="sm" className="gap-1">
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
                <p className="text-muted-foreground mb-4">No jobs created yet</p>
                <Button onClick={() => setShowUpload(true)}>Create Your First Job</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Video File</DialogTitle>
            <DialogDescription>
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
