import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      
      // Reset form
      setJobName("");
      setConfig(null);
      onOpenChange(false);

      // Invalidate jobs list to refresh
      await utils.jobs.list.invalidate();

      // Callback
      onJobCreated?.(result.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create job";
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Pipeline Job</DialogTitle>
          <DialogDescription>
            Configure your video processing job with custom settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Job Name */}
          <div className="space-y-2">
            <Label htmlFor="job-name">Job Name</Label>
            <Input
              id="job-name"
              placeholder="e.g., My Vlog - Episode 5"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              disabled={createJobMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Give your job a descriptive name to track it easily
            </p>
          </div>

          {/* Configuration Panel */}
          <div>
            <Label className="mb-4 block">Pipeline Configuration</Label>
            <JobConfigPanel onConfigChange={(cfg) => setConfig(cfg)} />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createJobMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateJob}
            disabled={createJobMutation.isPending || !jobName.trim()}
            className="gap-2"
          >
            {createJobMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
