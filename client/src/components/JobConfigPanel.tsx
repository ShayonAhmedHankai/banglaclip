import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown } from "lucide-react";

interface JobConfig {
  silenceThresholdDb: number;
  silenceMinDurationSec: number;
  silencePaddingSec: number;
  captionFontName: string;
  captionFontSize: number;
  captionFontColor: string;
  captionOutlineColor: string;
  captionAlignment: "top" | "center" | "bottom";
  brollMaxPerMinute: number;
  brollMinScore: number;
  exportAspectRatio: string;
  exportCropMode: "center" | "top" | "bottom";
  exportQuality: "low" | "medium" | "high";
  youtubeUploadEnabled: boolean;
}

interface JobConfigPanelProps {
  onConfigChange?: (config: JobConfig) => void;
  defaultConfig?: Partial<JobConfig>;
}

const DEFAULT_CONFIG: JobConfig = {
  silenceThresholdDb: -35,
  silenceMinDurationSec: 0.4,
  silencePaddingSec: 0.1,
  captionFontName: "Arial",
  captionFontSize: 18,
  captionFontColor: "#FFFFFF",
  captionOutlineColor: "#000000",
  captionAlignment: "bottom",
  brollMaxPerMinute: 3,
  brollMinScore: 0.6,
  exportAspectRatio: "9:16",
  exportCropMode: "center",
  exportQuality: "high",
  youtubeUploadEnabled: false,
};

export default function JobConfigPanel({ onConfigChange, defaultConfig }: JobConfigPanelProps) {
  const [config, setConfig] = useState<JobConfig>({ ...DEFAULT_CONFIG, ...defaultConfig });

  const handleConfigChange = (key: keyof JobConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="silence" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="silence">Silence</TabsTrigger>
          <TabsTrigger value="captions">Captions</TabsTrigger>
          <TabsTrigger value="broll">B-Roll</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        {/* Silence Removal Settings */}
        <TabsContent value="silence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Silence Removal Settings</CardTitle>
              <CardDescription>
                Configure how the system detects and removes silent segments from your video
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Silence Threshold */}
              <div className="space-y-2">
                <Label>Silence Threshold (dB)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[config.silenceThresholdDb]}
                    onValueChange={([v]) => handleConfigChange("silenceThresholdDb", v)}
                    min={-60}
                    max={0}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12 text-right">{config.silenceThresholdDb} dB</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Lower values = more aggressive silence detection. Default: -35 dB
                </p>
              </div>

              {/* Minimum Duration */}
              <div className="space-y-2">
                <Label>Minimum Silence Duration (seconds)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[config.silenceMinDurationSec]}
                    onValueChange={([v]) => handleConfigChange("silenceMinDurationSec", v)}
                    min={0.1}
                    max={2}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12 text-right">{config.silenceMinDurationSec.toFixed(1)}s</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum silent segment to remove. Default: 0.4s
                </p>
              </div>

              {/* Padding */}
              <div className="space-y-2">
                <Label>Silence Padding (seconds)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[config.silencePaddingSec]}
                    onValueChange={([v]) => handleConfigChange("silencePaddingSec", v)}
                    min={0}
                    max={0.5}
                    step={0.05}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12 text-right">{config.silencePaddingSec.toFixed(2)}s</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Keep small audio buffer around cuts. Default: 0.1s
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Caption Settings */}
        <TabsContent value="captions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bengali Caption Settings</CardTitle>
              <CardDescription>
                Configure subtitle appearance and positioning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Font Selection */}
              <div className="space-y-2">
                <Label>Font Name</Label>
                <Select value={config.captionFontName} onValueChange={(v) => handleConfigChange("captionFontName", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Courier">Courier</SelectItem>
                    <SelectItem value="Verdana">Verdana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <Label>Font Size (pixels)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[config.captionFontSize]}
                    onValueChange={([v]) => handleConfigChange("captionFontSize", v)}
                    min={12}
                    max={48}
                    step={2}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12 text-right">{config.captionFontSize}px</span>
                </div>
              </div>

              {/* Text Color */}
              <div className="space-y-2">
                <Label>Text Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.captionFontColor}
                    onChange={(e) => handleConfigChange("captionFontColor", e.target.value)}
                    className="h-10 w-16 rounded border"
                  />
                  <Input
                    value={config.captionFontColor}
                    onChange={(e) => handleConfigChange("captionFontColor", e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              {/* Outline Color */}
              <div className="space-y-2">
                <Label>Outline Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.captionOutlineColor}
                    onChange={(e) => handleConfigChange("captionOutlineColor", e.target.value)}
                    className="h-10 w-16 rounded border"
                  />
                  <Input
                    value={config.captionOutlineColor}
                    onChange={(e) => handleConfigChange("captionOutlineColor", e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              {/* Alignment */}
              <div className="space-y-2">
                <Label>Alignment</Label>
                <Select value={config.captionAlignment} onValueChange={(v: any) => handleConfigChange("captionAlignment", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* B-Roll Settings */}
        <TabsContent value="broll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>B-Roll Overlay Settings</CardTitle>
              <CardDescription>
                Configure automatic stock footage insertion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Max Clips Per Minute */}
              <div className="space-y-2">
                <Label>Max Clips Per Minute</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[config.brollMaxPerMinute]}
                    onValueChange={([v]) => handleConfigChange("brollMaxPerMinute", v)}
                    min={1}
                    max={10}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12 text-right">{config.brollMaxPerMinute}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum number of B-roll clips to insert per minute of video
                </p>
              </div>

              {/* Minimum Score */}
              <div className="space-y-2">
                <Label>Minimum Relevance Score</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[config.brollMinScore]}
                    onValueChange={([v]) => handleConfigChange("brollMinScore", v)}
                    min={0.3}
                    max={0.95}
                    step={0.05}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12 text-right">{config.brollMinScore.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Higher = more selective. Only use highly relevant clips. Default: 0.6
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Settings */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Settings</CardTitle>
              <CardDescription>
                Configure final video output format and quality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Aspect Ratio */}
              <div className="space-y-2">
                <Label>Aspect Ratio</Label>
                <Select value={config.exportAspectRatio} onValueChange={(v) => handleConfigChange("exportAspectRatio", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9:16">9:16 (Vertical - Instagram Reels)</SelectItem>
                    <SelectItem value="16:9">16:9 (Horizontal - YouTube)</SelectItem>
                    <SelectItem value="1:1">1:1 (Square - TikTok)</SelectItem>
                    <SelectItem value="4:5">4:5 (Instagram Feed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Crop Mode */}
              <div className="space-y-2">
                <Label>Crop Mode</Label>
                <Select value={config.exportCropMode} onValueChange={(v: any) => handleConfigChange("exportCropMode", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">Center (Crop from center)</SelectItem>
                    <SelectItem value="top">Top (Focus on top)</SelectItem>
                    <SelectItem value="bottom">Bottom (Focus on bottom)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quality */}
              <div className="space-y-2">
                <Label>Export Quality</Label>
                <Select value={config.exportQuality} onValueChange={(v: any) => handleConfigChange("exportQuality", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Smaller file, faster)</SelectItem>
                    <SelectItem value="medium">Medium (Balanced)</SelectItem>
                    <SelectItem value="high">High (Best quality, larger file)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* YouTube Upload */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div>
                  <Label className="text-base">Auto-upload to YouTube</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically upload finished video to your YouTube channel
                  </p>
                </div>
                <Switch
                  checked={config.youtubeUploadEnabled}
                  onCheckedChange={(v) => handleConfigChange("youtubeUploadEnabled", v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Silence Threshold</p>
              <p className="font-semibold">{config.silenceThresholdDb} dB</p>
            </div>
            <div>
              <p className="text-muted-foreground">Caption Font</p>
              <p className="font-semibold">{config.captionFontName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">B-Roll Max</p>
              <p className="font-semibold">{config.brollMaxPerMinute}/min</p>
            </div>
            <div>
              <p className="text-muted-foreground">Export Quality</p>
              <p className="font-semibold capitalize">{config.exportQuality}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
