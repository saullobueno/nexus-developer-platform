import { XIcon } from "lucide-react";
import { cn } from "../lib/utils";

export interface ToastProps {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  onDismiss?: () => void;
}

export function Toast({ title, description, variant = "default", onDismiss }: ToastProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex w-80 items-start justify-between gap-2 rounded-lg border bg-background p-3 shadow-lg",
        variant === "destructive" && "border-destructive/50",
      )}
    >
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-xs opacity-70 transition-opacity hover:opacity-100"
        >
          <XIcon className="size-4" />
          <span className="sr-only">Fechar</span>
        </button>
      )}
    </div>
  );
}
