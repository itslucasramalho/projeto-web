"use client";

import { useEffect } from "react";

type Props = {
  propositionId: string;
  eventType?: "view" | "favorite" | "share";
};

export function PropositionEngagementTracker({
  propositionId,
  eventType = "view",
}: Props) {
  useEffect(() => {
    const controller = new AbortController();

    async function track() {
      try {
        await fetch(`/api/propositions/${propositionId}/engagement`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventType }),
          signal: controller.signal,
        });
      } catch {
        // best-effort only
      }
    }

    track();

    return () => controller.abort();
  }, [eventType, propositionId]);

  return null;
}

