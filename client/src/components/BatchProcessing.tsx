import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "running":
        return "bg-blue-100 text-blue-800";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Batch Processing</h2>
          <p className="text-muted-foreground mt-1">
            Schedule multiple videos for automated processing
          </p>
        </div>
        <Button onClick={() => setShowScheduler(!showScheduler)} className="gap-2">
          <Clock className="h-4 w-4" />
          New Batch
        </Button>
      </div>

      {/* Scheduler Form */}
      {showScheduler && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Create Batch Job</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Batch Name</Label>
              <Input
                placeholder="e.g., Weekly uploads"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Schedule Time</Label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="once">Once</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Send notifications on completion</p>
                <p className="text-xs text-muted-foreground">Get notified when batch processing finishes</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowScheduler(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBatch} disabled={!scheduleName.trim()}>
                Create Batch
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batch Jobs List */}
      <div className="space-y-3">
        {batchJobs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">No batch jobs scheduled yet</p>
              <Button onClick={() => setShowScheduler(true)}>Create Your First Batch</Button>
            </CardContent>
          </Card>
        ) : (
          batchJobs.map(batch => (
            <Card key={batch.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{batch.name}</h3>
                      <Badge className={getStatusColor(batch.status)}>
                        {batch.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                      <div className="mt-3 w-full h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${batch.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {batch.status === "scheduled" && (
                      <>
                        <Button size="sm" variant="ghost" className="gap-1">
                          <Play className="h-4 w-4" />
                          Run Now
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-1 text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {batch.status === "running" && (
                      <Button size="sm" variant="ghost" className="gap-1">
                        <Pause className="h-4 w-4" />
                        Pause
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base text-blue-900">How Batch Processing Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            • Add videos to a batch job and set a schedule time
          </p>
          <p>
            • The system automatically processes videos sequentially (one at a time)
          </p>
          <p>
            • Each video goes through all pipeline stages: silence removal → captions → B-roll → export
          </p>
          <p>
            • Receive notifications when each video completes or if any errors occur
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
