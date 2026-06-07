/**
 * TranscriptEditor — allows users to edit the Whisper-generated SRT captions
 * before the export stage runs.
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Edit3, Save, RotateCcw, FileText } from "lucide-react";

interface TranscriptEditorProps {
  jobId: number;
  jobStatus: string;
}

export default function TranscriptEditor({ jobId, jobStatus }: TranscriptEditorProps) {
  const { data, isLoading } = trpc.jobs.getTranscript.useQuery(
    { jobId },
    { enabled: !!jobId }
  );

  const updateMutation = trpc.jobs.updateTranscript.useMutation();
  const utils = trpc.useUtils();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.srt && !editing) {
      setDraft(data.srt);
    }
  }, [data?.srt]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-[#ABABAB] text-sm py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading transcript...
      </div>
    );
  }

  if (!data?.srt) {
    return (
      <div className="text-center py-8 text-[#ABABAB]">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No transcript available yet.</p>
        <p className="text-xs mt-1">Transcription will appear here after the caption generation stage completes.</p>
      </div>
    );
  }

  const canEdit = jobStatus !== "processing";

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMutation.mutateAsync({ jobId, srt: draft });
      await utils.jobs.getTranscript.invalidate({ jobId });
      setEditing(false);
      toast.success("Transcript saved! It will be used in the next export.");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save transcript");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setDraft(data.srt ?? "");
    setEditing(false);
  };

  // Parse SRT for a nicer preview
  const parsePreview = (srt: string) => {
    const blocks = srt.trim().split(/\n\n+/).slice(0, 5);
    return blocks.map(block => {
      const lines = block.trim().split("\n");
      if (lines.length < 3) return null;
      return { time: lines[1], text: lines.slice(2).join(" ") };
    }).filter(Boolean);
  };

  const preview = parsePreview(data.srt);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#ABABAB]" />
          <span className="text-sm font-medium text-white">Bengali Captions (SRT)</span>
          {updateMutation.isSuccess && (
            <span className="text-xs text-[#3AC87A] bg-[#3AC87A]/15 px-2 py-0.5 rounded-full">Edited</span>
          )}
        </div>
        {canEdit && !editing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditing(true)}
            className="gap-1.5 text-[#ABABAB] hover:text-white hover:bg-[#2c2c2c]"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit Captions
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <Textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="font-mono text-xs bg-[#1a1a1a] border-[#3a3a3a] text-white min-h-[300px] resize-y"
            placeholder="SRT content..."
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="gap-1.5 bg-[#E8643A] hover:bg-[#d55a32]"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDiscard}
              disabled={saving}
              className="gap-1.5 text-[#ABABAB] hover:text-white hover:bg-[#2c2c2c]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Discard
            </Button>
          </div>
          <p className="text-xs text-[#ABABAB]">
            ⚠ Changes apply on the next export. Re-run the export stage or retry the job after editing.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {preview.map((entry, i) => (
            <div key={i} className="bg-[#1a1a1a] rounded-lg p-3 border border-[#3a3a3a]">
              <p className="text-xs text-[#4A9EFF] font-mono mb-1">{entry!.time}</p>
              <p className="text-sm text-white">{entry!.text}</p>
            </div>
          ))}
          {data.srt.trim().split(/\n\n+/).length > 5 && (
            <p className="text-xs text-[#ABABAB] text-center pt-1">
              + {data.srt.trim().split(/\n\n+/).length - 5} more segments
            </p>
          )}
        </div>
      )}
    </div>
  );
}
