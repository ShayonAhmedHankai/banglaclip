import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        <TabsList className="grid w-full grid-cols-4 bg-[#1a1a1a] border border-[#3a3a3a]">
          <TabsTrigger value="silence" className="text-[#ABABAB] data-[state=active]:bg-[#242424] data-[state=active]:text-white">Silence</TabsTrigger>
          <TabsTrigger value="captions" className="text-[#ABABAB] data-[state=active]:bg-[#242424] data-[state=active]:text-white">Captions</TabsTrigger>
          <TabsTrigger value="broll" className="text-[#ABABAB] data-[state=active]:bg-[#242424] data-[state=active]:text-white">B-Roll</TabsTrigger>
          <TabsTrigger value="export" className="text-[#ABABAB] data-[state=active]:bg-[#242424] data-[state=active]:text-white">Export</TabsTrigger>
        </TabsList>

        {/* Silence Removal Settings */}
        <TabsContent value="silence" className="space-y-4">
          <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-1">Silence Removal Settings</h3>
            <p className="text-sm text-[#ABABAB] mb-6">
              Configure how the system detects and removes silent segments from your video
            </p>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[#ABABAB]">Silence Threshold (dB)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[config.silenceThresholdDb]}
                    onValueChange={([v]) => handleConfigChange("silenceThresholdDb", v)}
                    min={-60}
                    max={0}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12 text-right text-white">{config.silenceThresholdDb} dB</span>
                </div>
                <p className="text-xs text-[#ABABAB]">
                  Lower values = more aggressive silence detection. Default: -35 dB
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-[#ABABAB]">Minimum Silence Duration (seconds)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[config.silenceMinDurationSec]}
                    onValueChange={([v]) => handleConfigChange("silenceMinDurationSec", v)}
                    min={0.1}
                    max={2}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12 text-right text-white">{config.silenceMinDurationSec.toFixed(1)}s</span>
                </div>
                <p className="text-xs text-[#ABABAB]">
                  Minimum silent segment to remove. Default: 0.4s
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-[#ABABAB]">Silence Padding (seconds)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[config.silencePaddingSec]}
                    onValueChange={([v]) => handleConfigChange("silencePaddingSec", v)}
                    min={0}
                    max={0.5}
                    step={0.05}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12 text-right text-white">{config.silencePaddingSec.toFixed(2)}s</span>
                </div>
                <p className="text-xs text-[#ABABAB]">
                  Keep small audio buffer around cuts. Default: 0.1s
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Caption Settings */}
        <TabsContent value="captions" className="space-y-4">
          <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-1">Bengali Caption Settings</h3>
            <p className="text-sm text-[#ABABAB] mb-6">
              Configure subtitle appearance and positioning
            </p>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[#ABABAB]">Font Name</Label>
                <Select value={config.captionFontName} onValueChange={(v) => handleConfigChange("captionFontName", v)}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#242424] border-[#3a3a3a]">
                    <SelectItem value="Arial" className="text-white focus:bg-[#2c2c2c] focus:text-white">Arial</SelectItem>
                    <SelectItem value="Helvetica" className="text-white focus:bg-[#2c2c2c] focus:text-white">Helvetica</SelectItem>
                    <SelectItem value="Times New Roman" className="text-white focus:bg-[#2c2c2c] focus:text-white">Times New Roman</SelectItem>
                    <SelectItem value="Courier" className="text-white focus:bg-[#2c2c2c] focus:text-white">Courier</SelectItem>
                    <SelectItem value="Verdana" className="text-white focus:bg-[#2c2c2c] focus:text-white">Verdana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[#ABABAB]">Font Size (pixels)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[config.captionFontSize]}
                    onValueChange={([v]) => handleConfigChange("captionFontSize", v)}
                    min={12}
                    max={48}
                    step={2}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12 text-right text-white">{config.captionFontSize}px</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#ABABAB]">Text Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.captionFontColor}
                    onChange={(e) => handleConfigChange("captionFontColor", e.target.value)}
                    className="h-10 w-16 rounded border border-[#3a3a3a] bg-[#1a1a1a]"
                  />
                  <Input
                    value={config.captionFontColor}
                    onChange={(e) => handleConfigChange("captionFontColor", e.target.value)}
                    className="font-mono text-sm bg-[#1a1a1a] border-[#3a3a3a] text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#ABABAB]">Outline Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.captionOutlineColor}
                    onChange={(e) => handleConfigChange("captionOutlineColor", e.target.value)}
                    className="h-10 w-16 rounded border border-[#3a3a3a] bg-[#1a1a1a]"
                  />
                  <Input
                    value={config.captionOutlineColor}
                    onChange={(e) => handleConfigChange("captionOutlineColor", e.target.value)}
                    className="font-mono text-sm bg-[#1a1a1a] border-[#3a3a3a] text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#ABABAB]">Alignment</Label>
                <Select value={config.captionAlignment} onValueChange={(v: any) => handleConfigChange("captionAlignment", v)}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#242424] border-[#3a3a3a]">
                    <SelectItem value="top" className="text-white focus:bg-[#2c2c2c] focus:text-white">Top</SelectItem>
                    <SelectItem value="center" className="text-white focus:bg-[#2c2c2c] focus:text-white">Center</SelectItem>
                    <SelectItem value="bottom" className="text-white focus:bg-[#2c2c2c] focus:text-white">Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* B-Roll Settings */}
        <TabsContent value="broll" className="space-y-4">
          <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-1">B-Roll Overlay Settings</h3>
            <p className="text-sm text-[#ABABAB] mb-6">
              Configure automatic stock footage insertion
            </p>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[#ABABAB]">Max Clips Per Minute</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[config.brollMaxPerMinute]}
                    onValueChange={([v]) => handleConfigChange("brollMaxPerMinute", v)}
                    min={1}
                    max={10}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12 text-right text-white">{config.brollMaxPerMinute}</span>
                </div>
                <p className="text-xs text-[#ABABAB]">
                  Maximum number of B-roll clips to insert per minute of video
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-[#ABABAB]">Minimum Relevance Score</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[config.brollMinScore]}
                    onValueChange={([v]) => handleConfigChange("brollMinScore", v)}
                    min={0.3}
                    max={0.95}
                    step={0.05}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12 text-right text-white">{config.brollMinScore.toFixed(2)}</span>
                </div>
                <p className="text-xs text-[#ABABAB]">
                  Higher = more selective. Only use highly relevant clips. Default: 0.6
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Export Settings */}
        <TabsContent value="export" className="space-y-4">
          <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-1">Export Settings</h3>
            <p className="text-sm text-[#ABABAB] mb-6">
              Configure final video output format and quality
            </p>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[#ABABAB]">Aspect Ratio</Label>
                <Select value={config.exportAspectRatio} onValueChange={(v) => handleConfigChange("exportAspectRatio", v)}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#242424] border-[#3a3a3a]">
                    <SelectItem value="9:16" className="text-white focus:bg-[#2c2c2c] focus:text-white">9:16 (Vertical - Instagram Reels)</SelectItem>
                    <SelectItem value="16:9" className="text-white focus:bg-[#2c2c2c] focus:text-white">16:9 (Horizontal - YouTube)</SelectItem>
                    <SelectItem value="1:1" className="text-white focus:bg-[#2c2c2c] focus:text-white">1:1 (Square - TikTok)</SelectItem>
                    <SelectItem value="4:5" className="text-white focus:bg-[#2c2c2c] focus:text-white">4:5 (Instagram Feed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[#ABABAB]">Crop Mode</Label>
                <Select value={config.exportCropMode} onValueChange={(v: any) => handleConfigChange("exportCropMode", v)}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#242424] border-[#3a3a3a]">
                    <SelectItem value="center" className="text-white focus:bg-[#2c2c2c] focus:text-white">Center (Crop from center)</SelectItem>
                    <SelectItem value="top" className="text-white focus:bg-[#2c2c2c] focus:text-white">Top (Focus on top)</SelectItem>
                    <SelectItem value="bottom" className="text-white focus:bg-[#2c2c2c] focus:text-white">Bottom (Focus on bottom)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[#ABABAB]">Export Quality</Label>
                <Select value={config.exportQuality} onValueChange={(v: any) => handleConfigChange("exportQuality", v)}>
                  <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#242424] border-[#3a3a3a]">
                    <SelectItem value="low" className="text-white focus:bg-[#2c2c2c] focus:text-white">Low (720p - Smaller file)</SelectItem>
                    <SelectItem value="medium" className="text-white focus:bg-[#2c2c2c] focus:text-white">Medium (1080p - Balanced)</SelectItem>
                    <SelectItem value="high" className="text-white focus:bg-[#2c2c2c] focus:text-white">High (1080p - Best quality)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg border border-[#3a3a3a]">
                <div>
                  <Label className="text-base text-white">Auto-upload to YouTube</Label>
                  <p className="text-sm text-[#ABABAB] mt-1">
                    Automatically upload finished video to your YouTube channel
                  </p>
                </div>
                <Switch
                  checked={config.youtubeUploadEnabled}
                  onCheckedChange={(v) => handleConfigChange("youtubeUploadEnabled", v)}
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <div className="bg-[#1a1a1a] rounded-lg border border-[#3a3a3a] p-4">
        <h3 className="text-base font-semibold text-white mb-3">Configuration Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-[#ABABAB]">Silence Threshold</p>
            <p className="font-semibold text-white">{config.silenceThresholdDb} dB</p>
          </div>
          <div>
            <p className="text-[#ABABAB]">Caption Font</p>
            <p className="font-semibold text-white">{config.captionFontName}</p>
          </div>
          <div>
            <p className="text-[#ABABAB]">B-Roll Max</p>
            <p className="font-semibold text-white">{config.brollMaxPerMinute}/min</p>
          </div>
          <div>
            <p className="text-[#ABABAB]">Export Quality</p>
            <p className="font-semibold text-white capitalize">{config.exportQuality}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
