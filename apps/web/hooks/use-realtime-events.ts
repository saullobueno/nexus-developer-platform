"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { RealtimeEvent } from "../lib/realtime-message";

export interface RealtimeToastItem extends RealtimeEvent {
  id: string;
}

const QUERY_KEY_BY_PREFIX: Array<{ prefix: string; queryKey: string[] }> = [
  { prefix: "deployment.", queryKey: ["deployments"] },
  { prefix: "incident.", queryKey: ["incidents"] },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function useRealtimeEvents() {
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState<RealtimeToastItem[]>([]);

  useEffect(() => {
    if (typeof EventSource === "undefined") return;

    const source = new EventSource(`${API_URL}/realtime/events`, { withCredentials: true });

    source.onmessage = (message) => {
      let event: RealtimeEvent;
      try {
        event = JSON.parse(message.data) as RealtimeEvent;
      } catch {
        return;
      }

      setToasts((current) => [...current.slice(-4), { ...event, id: `${Date.now()}-${Math.random()}` }]);

      const match = QUERY_KEY_BY_PREFIX.find((entry) => event.type.startsWith(entry.prefix));
      if (match) {
        void queryClient.invalidateQueries({ queryKey: match.queryKey });
      }
    };

    return () => source.close();
  }, [queryClient]);

  function dismiss(id: string) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  return { toasts, dismiss };
}
