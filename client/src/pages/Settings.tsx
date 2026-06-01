import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Settings2, Save, RotateCcw } from "lucide-react";

const SETTINGS_KEY = "banglaclip-default-settings";

interface DefaultSettings {
  silenceThresholdDb: number;
  silenceMinDurationSec: number;
  captionStyle: "white" | "yellow" | "green";
  captionAlignment: "top" | "center" | "bottom";
  brollDensity: "none" | "low" | "medium" | "high";
  exportQuality: "low" | "medium" | "high";
  youtubeUploadEnabled: boolean;
}

const DEFAULT: DefaultSettings = {
  silenceThresholdDb: -35,
  silenceMinDurationSec: 0.5,
  captionStyle: "white",
  captionAlignment: "bottom",
  brollDensity: "low",
  exportQuality: "high",
  youtubeUploadEnabled: false,
};

function loadSettings(): DefaultSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

const captionStyleColors: Record<string, string> = {
  white: "#FFFFFF",
  yellow: "#FFD700",
  green: "#3AC87A",
};

const brollDensityLabels: Record<string, string> = {
  none: "None — No B-roll",
  low: "Low — 1–2 per minute",
  medium: "Medium — 3–4 per minute",
  high: "High — 5+ per minute",
};

const brollToMaxPerMinute: Record<string, number> = {
  none: 0,
  low: 2,
  medium: 4,
  high: 6,
};

export default function Settings() {
  const [settings, setSettings] = useState<DefaultSettings>(loadSettings);
  const [saved, setSaved] = useState(false);

  const update = <K extends keyof DefaultSettings>(key: K, value: DefaultSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      setSaved(true);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT);
    localStorage.removeItem(SETTINGS_KEY);
    setSaved(false);
    toast.success("Settings reset to defaults");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
            <p className="text-[#ABABAB] mt-1">
              Default pipeline settings applied to every new job
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2 bg-transparent border-[#3a3a3a] text-[#ABABAB] hover:text-white hover:bg-[#2c2c2c]"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              className="gap-2 bg-[#E8643A] hover:bg-[#d55a32]"
            >
              <Save className="h-4 w-4" />
              {saved ? "Saved" : "Save"}
            </Button>
          </div>
        </div>

        <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-6 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Settings2 className="h-5 w-5 text-[#E8643A]" />
            <h2 className="text-lg font-semibold text-white">Silence Removal</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[#ABABAB]">Silence Threshold</Label>
                <span className="text-sm font-mono text-white bg-[#1a1a1a] border border-[#3a3a3a] rounded px-2 py-0.5">
                  {settings.silenceThresholdDb} dB
                </span>
              </div>
              <Slider
                min={-60}
                max={-20}
                step={1}
                value={[settings.silenceThresholdDb]}
                onValueChange={([v]) => update("silenceThresholdDb", v)}
                className="w-full"
              />
              <p className="text-xs text-[#ABABAB]">
                Audio below this level is considered silence. Lower = more aggressive removal.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[#ABABAB]">Minimum Silence Duration</Label>
                <span className="text-sm font-mono text-white bg-[#1a1a1a] border border-[#3a3a3a] rounded px-2 py-0.5">
                  {settings.silenceMinDurationSec.toFixed(1)}s
                </span>
              </div>
              <Slider
                min={0.1}
                max={2.0}
                step={0.1}
                value={[settings.silenceMinDurationSec]}
                onValueChange={([v]) => update("silenceMinDurationSec", Math.round(v * 10) / 10)}
                className="w-full"
              />
              <p className="text-xs text-[#ABABAB]">
                Silences shorter than this are kept. Recommended: 0.5s
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Caption Style</h2>

          <div className="space-y-2">
            <Label className="text-[#ABABAB]">Text Color</Label>
            <div className="flex gap-3">
              {(["white", "yellow", "green"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => update("captionStyle", style)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    settings.captionStyle === style
                      ? "border-[#E8643A] bg-[#E8643A]/10 text-white"
                      : "border-[#3a3a3a] text-[#ABABAB] hover:border-[#4a4a4a] hover:text-white"
                  }`}
                >
                  <span
                    className="h-3 w-3 rounded-full inline-block border border-white/20"
                    style={{ background: captionStyleColors[style] }}
                  />
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#ABABAB]">Caption Position</Label>
            <Select
              value={settings.captionAlignment}
              onValueChange={(v) => update("captionAlignment", v as "top" | "center" | "bottom")}
            >
              <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#242424] border-[#3a3a3a]">
                <SelectItem value="top" className="text-white focus:bg-[#2c2c2c] focus:text-white">Top</SelectItem>
                <SelectItem value="center" className="text-white focus:bg-[#2c2c2c] focus:text-white">Center</SelectItem>
                <SelectItem value="bottom" className="text-white focus:bg-[#2c2c2c] focus:text-white">Bottom (Recommended)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">B-Roll Overlay</h2>

          <div className="space-y-2">
            <Label className="text-[#ABABAB]">B-Roll Density</Label>
            <Select
              value={settings.brollDensity}
              onValueChange={(v) => update("brollDensity", v as "none" | "low" | "medium" | "high")}
            >
              <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#242424] border-[#3a3a3a]">
                {(["none", "low", "medium", "high"] as const).map((d) => (
                  <SelectItem key={d} value={d} className="text-white focus:bg-[#2c2c2c] focus:text-white">
                    {brollDensityLabels[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#ABABAB]">
              B-roll requires external stock footage API integration.
            </p>
          </div>
        </div>

        <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Export</h2>

          <div className="space-y-2">
            <Label className="text-[#ABABAB]">Export Quality</Label>
            <div className="flex gap-3">
              {(["low", "medium", "high"] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => update("exportQuality", q)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                    settings.exportQuality === q
                      ? "border-[#E8643A] bg-[#E8643A]/10 text-white"
                      : "border-[#3a3a3a] text-[#ABABAB] hover:border-[#4a4a4a] hover:text-white"
                  }`}
                >
                  {q === "low" ? "720p" : q === "medium" ? "1080p" : "4K"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">YouTube</h2>
          <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#3a3a3a]">
            <div>
              <p className="text-sm font-medium text-white">Auto-upload to YouTube after completion</p>
              <p className="text-xs text-[#ABABAB] mt-0.5">
                Requires YouTube OAuth credentials in Replit secrets
              </p>
            </div>
            <Switch
              checked={settings.youtubeUploadEnabled}
              onCheckedChange={(v) => update("youtubeUploadEnabled", v)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-6">
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2 bg-transparent border-[#3a3a3a] text-[#ABABAB] hover:text-white hover:bg-[#2c2c2c]"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} className="gap-2 bg-[#E8643A] hover:bg-[#d55a32]">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
