import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Youtube, ExternalLink, AlertTriangle, CheckCircle2, Upload, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

const YOUTUBE_CONFIGURED =
  typeof import.meta.env.VITE_YOUTUBE_CLIENT_ID === "string" &&
  import.meta.env.VITE_YOUTUBE_CLIENT_ID.length > 0;

export default function YouTube() {
  const { data: jobs, isLoading } = trpc.jobs.list.useQuery();
  const uploadMutation = trpc.youtube.uploadVideo.useMutation();
  const [uploadingJobId, setUploadingJobId] = useState<number | null>(null);

  const completedJobs = jobs?.filter(j => j.status === "done") ?? [];

  const handleUpload = async (jobId: number, jobName: string) => {
    setUploadingJobId(jobId);
    try {
      const result = await uploadMutation.mutateAsync({
        jobId,
        title: jobName,
        description: `Processed by BanglaClip — A .NF Product`,
        privacyStatus: "unlisted",
      });
      toast.success("Video queued for YouTube upload");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploadingJobId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">YouTube Integration</h1>
            <p className="text-[#ABABAB] mt-1">
              Upload completed videos directly to your YouTube channel
            </p>
          </div>
        </div>

        {!YOUTUBE_CONFIGURED && (
          <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-[#F59E0B] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#F59E0B] mb-2">YouTube OAuth Not Configured</h3>
                <p className="text-sm text-[#F59E0B]/80 mb-3">
                  YouTube uploading requires OAuth credentials. Add the following to your Replit secrets:
                </p>
                <div className="bg-[#1a1a1a] rounded-md p-3 font-mono text-xs text-[#ABABAB] space-y-1">
                  <p>YOUTUBE_CLIENT_ID = your_client_id_here</p>
                  <p>YOUTUBE_CLIENT_SECRET = your_client_secret_here</p>
                </div>
                <p className="text-xs text-[#F59E0B]/60 mt-3">
                  Get these from Google Cloud Console → APIs &amp; Services → Credentials → OAuth 2.0 Client IDs
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">
            <p className="text-sm text-[#ABABAB] mb-1">Completed Jobs</p>
            <div className="text-2xl font-bold text-white">{completedJobs.length}</div>
            <p className="text-xs text-[#ABABAB] mt-1">Ready to upload</p>
          </div>
          <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">
            <p className="text-sm text-[#ABABAB] mb-1">Already Uploaded</p>
            <div className="text-2xl font-bold text-[#3AC87A]">
              {completedJobs.filter(j => j.youtubeVideoId).length}
            </div>
            <p className="text-xs text-[#ABABAB] mt-1">On YouTube</p>
          </div>
          <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">
            <p className="text-sm text-[#ABABAB] mb-1">YouTube Status</p>
            <div className={`text-sm font-semibold mt-1 ${YOUTUBE_CONFIGURED ? "text-[#3AC87A]" : "text-[#F59E0B]"}`}>
              {YOUTUBE_CONFIGURED ? "✓ Connected" : "⚠ Not Configured"}
            </div>
          </div>
        </div>

        <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg">
          <div className="p-4 border-b border-[#3a3a3a]">
            <h2 className="text-lg font-semibold text-white">Completed Jobs — Ready to Upload</h2>
            <p className="text-sm text-[#ABABAB] mt-1">
              {completedJobs.length === 0
                ? "No completed jobs yet. Process a video to get started."
                : `${completedJobs.length} job${completedJobs.length !== 1 ? "s" : ""} ready`}
            </p>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 rounded-full border-4 border-[#3a3a3a] border-t-[#E8643A] animate-spin" />
              </div>
            ) : completedJobs.length > 0 ? (
              <div className="space-y-3">
                {completedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-lg border border-[#3a3a3a] hover:border-[#4a4a4a] transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{job.jobName}</p>
                      <p className="text-xs text-[#ABABAB] mt-1">
                        Completed {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                      {job.youtubeVideoId && (
                        <div className="flex items-center gap-2 mt-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#3AC87A]" />
                          <span className="text-xs text-[#3AC87A]">Uploaded</span>
                          {job.youtubeVideoUrl && (
                            <a
                              href={job.youtubeVideoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#4A9EFF] hover:underline flex items-center gap-1"
                            >
                              Watch <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="ghost" size="sm" className="text-[#ABABAB] hover:text-white hover:bg-[#2c2c2c]">
                          View
                        </Button>
                      </Link>
                      {!job.youtubeVideoId && (
                        <Button
                          size="sm"
                          onClick={() => handleUpload(job.id, job.jobName)}
                          disabled={!YOUTUBE_CONFIGURED || uploadingJobId === job.id}
                          className="gap-1.5 bg-[#E8643A] hover:bg-[#d55a32] text-white"
                        >
                          {uploadingJobId === job.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Youtube className="h-3.5 w-3.5" />
                          )}
                          Upload
                        </Button>
                      )}
                      {job.youtubeVideoId && (
                        <Badge className="bg-[#3AC87A]/15 text-[#3AC87A] border-[#3AC87A]/30 text-xs">
                          Uploaded
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Youtube className="h-12 w-12 text-[#ABABAB] mx-auto mb-4 opacity-40" />
                <p className="text-[#ABABAB] mb-4">No completed jobs yet</p>
                <Link href="/dashboard">
                  <Button className="bg-[#E8643A] hover:bg-[#d55a32]">
                    Process a Video
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Youtube className="h-5 w-5 text-[#E8643A]" />
            YouTube Upload Flow
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Process Video", desc: "Complete a job through the full pipeline" },
              { step: "2", title: "Configure OAuth", desc: "Add YouTube credentials to Replit secrets" },
              { step: "3", title: "Upload", desc: "Click Upload on any completed job" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="h-10 w-10 rounded-full bg-[#E8643A]/20 border border-[#E8643A]/40 flex items-center justify-center mx-auto mb-3">
                  <span className="text-sm font-bold text-[#E8643A]">{s.step}</span>
                </div>
                <p className="text-sm font-semibold text-white mb-1">{s.title}</p>
                <p className="text-xs text-[#ABABAB]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
