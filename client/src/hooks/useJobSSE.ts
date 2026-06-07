/**
 * useJobSSE — subscribe to real-time job progress via Server-Sent Events.
 * Falls back gracefully if SSE is unavailable.
 */

import { useEffect, useRef } from "react";
import { getIdToken } from "@/lib/auth";

export type SSEStageEvent = {
  stageName: string;
  status: string;
  progressPercent: number;
};

export type SSESnapshot = {
  job: { status: string; currentStage: string | null };
  stages: SSEStageEvent[];
};

interface UseJobSSEOptions {
  jobId: number;
  enabled: boolean;
  onSnapshot?: (snapshot: SSESnapshot) => void;
  onStage?: (stage: SSEStageEvent) => void;
  onDone?: (data: { status: string }) => void;
}

export function useJobSSE({ jobId, enabled, onSnapshot, onStage, onDone }: UseJobSSEOptions) {
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled || !jobId) return;

    let active = true;
    let es: EventSource | null = null;

    async function connect() {
      try {
        const token = await getIdToken();
        if (!token || !active) return;

        const url = `/api/jobs/${jobId}/progress`;

        // EventSource doesn't support custom headers natively — pass token as query param
        // The server accepts ?token= as fallback
        const fullUrl = `${url}?token=${encodeURIComponent(token)}`;

        es = new EventSource(fullUrl);
        esRef.current = es;

        es.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === "snapshot") onSnapshot?.(parsed.data);
            else if (parsed.type === "stage") onStage?.(parsed.data);
            else if (parsed.type === "done") {
              onDone?.(parsed.data);
              es?.close();
            }
          } catch {
            // ignore parse errors
          }
        };

        es.onerror = () => {
          es?.close();
          // Retry after 3s if still active
          if (active) setTimeout(connect, 3000);
        };
      } catch {
        // ignore token errors
      }
    }

    connect();

    return () => {
      active = false;
      es?.close();
      esRef.current = null;
    };
  }, [jobId, enabled]);
}
