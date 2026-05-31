import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import JobConfigPanel from "./JobConfigPanel";
import { Loader2 } from "lucide-react";

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputFileId: number;
  onJobCreated?: (jobId: number) => void;
}

export default function CreateJobDialog({
  open,
  onOpenChange,
  inputFileId,
  onJobCreated,
}: CreateJobDialogProps) {
  const [jobName, setJobName] = useState("");
  const [config, setConfig] = useState<any>(null);
  const createJobMutation = trpc.jobs.create.useMutation();
  const utils = trpc.useUtils();

  const handleCreateJob = async () => {
    if (!jobName.trim()) {
      toast.error("Please enter a job name");
      return;
    }

    try {
      const result = await createJobMutation.mutateAsync({
        inputFileId,
        jobName: jobName.trim(),
        config: config || undefined,
      });

      toast.success("Job created successfully");
      setJobName("");
      setConfig(null);
      onOpenChange(false);
      await utils.jobs.list.invalidate();
      onJobCreated?.(result.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create job";
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#242424] border-[#3a3a3a] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Pipeline Job</DialogTitle>
          <DialogDescription className="text-[#ABABAB]">
            Configure your video processing job with custom settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Job Name */}
          <div className="space-y-2">
            <Label htmlFor="job-name" className="text-[#ABABAB]">Job Name</Label>
            <Input
              id="job-name"
              placeholder="e.g., My Vlog - Episode 5"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              disabled={createJobMutation.isPending}
              className="bg-[#1a1a1a] border-[#3a3a3a] text-white placeholder:text-[#6a6a6a]"
            />
            <p className="text-xs text-[#ABABAB]">
              Give your job a descriptive name to track it easily
            </p>
          </div>

          {/* Configuration Panel */}
          <div>
            <Label className="mb-4 block text-[#ABABAB]">Pipeline Configuration</Label>
            <JobConfigPanel onConfigChange={(cfg) => setConfig(cfg)} />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createJobMutation.isPending}
            className="bg-transparent border-[#3a3a3a] text-white hover:bg-[#2c2c2c]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateJob}
            disabled={createJobMutation.isPending || !jobName.trim()}
            className="gap-2 bg-[#E8643A] hover:bg-[#d55a32]"
          >
            {createJobMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
