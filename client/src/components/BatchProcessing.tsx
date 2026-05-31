import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Play, Pause, Trash2 } from "lucide-react";

interface BatchJob {
  id: number;
  name: string;
  fileCount: number;
  scheduledTime?: string;
  status: "scheduled" | "running" | "completed" | "failed";
  progress: number;
  createdAt: string;
}

export default function BatchProcessing() {
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleName, setScheduleName] = useState("");
  const [scheduleTime, setScheduleTime] = useState("22:00");
  const [scheduleFrequency, setScheduleFrequency] = useState("daily");

  const handleCreateBatch = () => {
    if (!scheduleName.trim()) return;

    const newBatch: BatchJob = {
      id: Date.now(),
      name: scheduleName,
      fileCount: 0,
      scheduledTime: scheduleTime,
      status: "scheduled",
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    setBatchJobs([...batchJobs, newBatch]);
    setScheduleName("");
    setShowScheduler(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-[#3AC87A]/15 text-[#3AC87A] border-[#3AC87A]/30";
      case "failed":
        return "bg-[#FF4444]/15 text-[#FF4444] border-[#FF4444]/30";
      case "running":
        return "bg-[#4A9EFF]/15 text-[#4A9EFF] border-[#4A9EFF]/30";
      case "scheduled":
        return "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30";
      default:
        return "bg-[#2c2c2c] text-[#ABABAB] border-[#3a3a3a]";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Batch Processing</h2>
          <p className="text-[#ABABAB] mt-1">
            Schedule multiple videos for automated processing
          </p>
        </div>
        <Button onClick={() => setShowScheduler(!showScheduler)} className="gap-2 bg-[#E8643A] hover:bg-[#d55a32]">
          <Clock className="h-4 w-4" />
          New Batch
        </Button>
      </div>

      {/* Scheduler Form */}
      {showScheduler && (
        <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg">
          <div className="p-4 border-b border-[#3a3a3a]">
            <h3 className="text-base font-semibold text-white">Create Batch Job</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-[#ABABAB]">Batch Name</Label>
              <Input
                placeholder="e.g., Weekly uploads"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
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
                <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
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
                <p className="text-sm font-medium text-white">Send notifications on completion</p>
                <p className="text-xs text-[#ABABAB]">Get notified when batch processing finishes</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowScheduler(false)} className="bg-transparent border-[#3a3a3a] text-white hover:bg-[#2c2c2c]">
                Cancel
              </Button>
              <Button onClick={handleCreateBatch} disabled={!scheduleName.trim()} className="bg-[#E8643A] hover:bg-[#d55a32]">
                Create Batch
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Jobs List */}
      <div className="space-y-3">
        {batchJobs.length === 0 ? (
          <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg">
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-[#ABABAB] mx-auto mb-4 opacity-50" />
              <p className="text-[#ABABAB] mb-4">No batch jobs scheduled yet</p>
              <Button onClick={() => setShowScheduler(true)} className="bg-[#E8643A] hover:bg-[#d55a32]">
                Create Your First Batch
              </Button>
            </div>
          </div>
        ) : (
          batchJobs.map(batch => (
            <div key={batch.id} className="bg-[#242424] border border-[#3a3a3a] rounded-lg hover:border-[#4a4a4a] transition-all">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">{batch.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded border ${getStatusBadge(batch.status)} font-medium`}>
                        {batch.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#ABABAB]">
                      <span>{batch.fileCount} files</span>
                      {batch.scheduledTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {batch.scheduledTime}
                        </span>
                      )}
                      <span>{new Date(batch.createdAt).toLocaleDateString()}</span>
                    </div>
                    {batch.status === "running" && (
                      <div className="mt-3 w-full h-2 bg-[#3a3a3a] rounded-full overflow-hidden">
                        <div className="h-full bg-[#4A9EFF] transition-all duration-300" style={{ width: `${batch.progress}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {batch.status === "scheduled" && (
                      <>
                        <Button size="sm" variant="ghost" className="gap-1 text-[#ABABAB] hover:text-white hover:bg-[#2c2c2c]">
                          <Play className="h-4 w-4" />
                          Run Now
                        </Button>
                        <Button size="sm" variant="ghost" className="text-[#FF4444] hover:text-[#FF4444] hover:bg-[#FF4444]/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {batch.status === "running" && (
                      <Button size="sm" variant="ghost" className="gap-1 text-[#ABABAB] hover:text-white hover:bg-[#2c2c2c]">
                        <Pause className="h-4 w-4" />
                        Pause
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Card */}
      <div className="bg-[#4A9EFF]/10 border border-[#4A9EFF]/30 rounded-lg p-4">
        <h3 className="text-base font-semibold text-[#4A9EFF] mb-2">How Batch Processing Works</h3>
        <div className="text-sm text-[#4A9EFF]/80 space-y-1">
          <p>• Add videos to a batch job and set a schedule time</p>
          <p>• The system automatically processes videos sequentially (one at a time)</p>
          <p>• Each video goes through all pipeline stages: silence removal → captions → B-roll → export</p>
          <p>• Receive notifications when each video completes or if any errors occur</p>
        </div>
      </div>
    </div>
  );
}
