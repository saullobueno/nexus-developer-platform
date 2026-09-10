"use client";

import { Toast } from "@nexus/ui";
import { useEffect } from "react";
import { useRealtimeEvents } from "../../hooks/use-realtime-events";
import { formatRealtimeMessage } from "../../lib/realtime-message";

const AUTO_DISMISS_MS = 6000;

export function RealtimeToaster() {
  const { toasts, dismiss } = useRealtimeEvents();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <TimedToast key={toast.id} id={toast.id} event={toast} onDismiss={dismiss} />
      ))}
    </div>
  );
}

function TimedToast({
  id,
  event,
  onDismiss,
}: {
  id: string;
  event: { type: string; data: Record<string, unknown> };
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timeout = setTimeout(() => onDismiss(id), AUTO_DISMISS_MS);
    return () => clearTimeout(timeout);
  }, [id, onDismiss]);

  const message = formatRealtimeMessage(event);

  return (
    <div className="pointer-events-auto">
      <Toast
        title={message.title}
        description={message.description}
        variant={message.variant}
        onDismiss={() => onDismiss(id)}
      />
    </div>
  );
}
