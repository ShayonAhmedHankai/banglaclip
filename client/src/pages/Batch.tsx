import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Clock, Layers, Play, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function Batch() {
  const [showScheduler, setShowScheduler] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [scheduleTime, setScheduleTime] = useState("22:00");
  const [frequency, setFrequency] = useState("daily");
  const [notifications, setNotifications] = useState(true);

  const { data: batches, isLoading, refetch } = trpc.batch.list.useQuery();
  const createBatchMutation = trpc.batch.create.useMutation();
  const updateStatusMutation = trpc.batch.updateStatus.useMutation();

  const handleCreateBatch = async () => {
    if (!batchName.trim()) {
      toast.error("Please enter a batch name");
      return;
    }
    try {
      const [hour, minute] = scheduleTime.split(":").map(Number);
      const scheduled = new Date();
      scheduled.setHours(hour, minute, 0, 0);
      if (scheduled <= new Date()) {
        scheduled.setDate(scheduled.getDate() + 1);
      }

      await createBatchMutation.mutateAsync({
        batchName: batchName.trim(),
        scheduledFor: scheduled,
        totalJobCount: 0,
      });

      toast.success(`Batch "${batchName}" created`);
      setBatchName("");
      setShowScheduler(false);
      refetch();
    } catch {
      toast.error("Failed to create batch");
    }
  };

  const handleRunNow = async (batchId: number) => {
    try {
      await updateStatusMutation.mutateAsync({ batchId, status: "processing" });
      toast.success("Batch started");
      refetch();
    } catch {
      toast.error("Failed to start batch");
    }
  };

  const handleDelete = async (batchId: number) => {
    try {
      await updateStatusMutation.mutateAsync({ batchId, status: "failed" });
      toast.success("Batch cancelled");
      refetch();
    } catch {
      toast.error("Failed to cancel batch");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-[#3AC87A]/15 text-[#3AC87A] border-[#3AC87A]/30";
      case "failed":
        return "bg-[#FF4444]/15 text-[#FF4444] border-[#FF4444]/30";
      case "processing":
        return "bg-[#4A9EFF]/15 text-[#4A9EFF] border-[#4A9EFF]/30";
      case "scheduled":
        return "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30";
      default:
        return "bg-[#2c2c2c] text-[#ABABAB] border-[#3a3a3a]";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-[#3AC87A]" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-[#FF4444]" />;
      case "processing":
        return <div className="h-4 w-4 rounded-full border-2 border-[#4A9EFF] border-t-transparent animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-[#F59E0B]" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Batch Processing</h1>
            <p className="text-[#ABABAB] mt-1">
              Schedule multiple videos for automated overnight processing
            </p>
          </div>
          <Button
            onClick={() => setShowScheduler(!showScheduler)}
            className="gap-2 bg-[#E8643A] hover:bg-[#d55a32]"
          >
            <Layers className="h-4 w-4" />
            New Batch
          </Button>
        </div>

        {showScheduler && (
          <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg">
            <div className="p-4 border-b border-[#3a3a3a]">
              <h3 className="text-base font-semibold text-white">Create Batch Job</h3>
              <p className="text-sm text-[#ABABAB] mt-1">
                Schedule a batch of jobs to process automatically
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-[#ABABAB]">Batch Name</Label>
                <Input
                  placeholder="e.g., Weekly uploads"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  className="bg-[#1a1a1a] border-[#3a3a3a] text-white placeholder:text-[#6a6a6a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#ABABAB]">Schedule Time</Label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#ABABAB]">Frequency</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#242424] border-[#3a3a3a]">
                      <SelectItem value="daily" className="text-white focus:bg-[#2c2c2c] focus:text-white">Daily</SelectItem>
                      <SelectItem value="weekly" className="text-white focus:bg-[#2c2c2c] focus:text-white">Weekly</SelectItem>
                      <SelectItem value="monthly" className="text-white focus:bg-[#2c2c2c] focus:text-white">Monthly</SelectItem>
                      <SelectItem value="once" className="text-white focus:bg-[#2c2c2c] focus:text-white">Once</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#3a3a3a]">
                <div>
                  <p className="text-sm font-medium text-white">Notify on completion</p>
                  <p className="text-xs text-[#ABABAB]">Get notified when batch processing finishes</p>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowScheduler(false)}
                  className="bg-transparent border-[#3a3a3a] text-white hover:bg-[#2c2c2c]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateBatch}
                  disabled={!batchName.trim() || createBatchMutation.isPending}
                  className="gap-2 bg-[#E8643A] hover:bg-[#d55a32]"
                >
                  {createBatchMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Batch
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg">
          <div className="p-4 border-b border-[#3a3a3a]">
            <h2 className="text-lg font-semibold text-white">Scheduled Batches</h2>
            <p className="text-sm text-[#ABABAB] mt-1">
              {batches?.length === 0 || !batches
                ? "No batches scheduled"
                : `${batches.length} batch${batches.length !== 1 ? "es" : ""} total`}
            </p>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 rounded-full border-4 border-[#3a3a3a] border-t-[#E8643A] animate-spin" />
              </div>
            ) : batches && batches.length > 0 ? (
              <div className="space-y-3">
                {batches.map((batch) => (
                  <div
                    key={batch.id}
                    className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-lg border border-[#3a3a3a] hover:border-[#4a4a4a] transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(batch.status)}
                        <h3 className="font-semibold text-white truncate">{batch.batchName}</h3>
                        <Badge className={`${getStatusBadge(batch.status)} text-xs font-medium shrink-0`}>
                          {batch.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#ABABAB]">
                        <span>{batch.processedJobCount ?? 0}/{batch.totalJobCount ?? 0} jobs processed</span>
                        {batch.scheduledFor && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(batch.scheduledFor).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {batch.status === "processing" && (batch.totalJobCount ?? 0) > 0 && (
                        <div className="mt-2 w-full h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#4A9EFF] transition-all duration-300"
                            style={{ width: `${((batch.processedJobCount ?? 0) / (batch.totalJobCount ?? 1)) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {batch.status === "scheduled" && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRunNow(batch.id)}
                          className="gap-1 text-[#ABABAB] hover:text-white hover:bg-[#2c2c2c]"
                        >
                          <Play className="h-3 w-3" />
                          Run Now
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(batch.id)}
                          className="text-[#FF4444] hover:text-[#FF4444] hover:bg-[#FF4444]/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-[#ABABAB] mx-auto mb-4 opacity-40" />
                <p className="text-[#ABABAB] mb-4">No batch jobs scheduled yet</p>
                <Button onClick={() => setShowScheduler(true)} className="bg-[#E8643A] hover:bg-[#d55a32]">
                  Create Your First Batch
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#4A9EFF]/10 border border-[#4A9EFF]/30 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-[#4A9EFF] mb-2">How Batch Processing Works</h3>
          <div className="text-sm text-[#4A9EFF]/80 space-y-1">
            <p>• Create a batch and add individual jobs to it from the Dashboard</p>
            <p>• Jobs process sequentially — one at a time — through the full pipeline</p>
            <p>• Each video goes through: Silence Removal → Captions → B-Roll → Export</p>
            <p>• You receive a notification when each video completes or fails</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
