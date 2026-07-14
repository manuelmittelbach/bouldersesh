import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Boulder Buddy — Badge
 * Small status marker with optional leading icon. Tones map to functional colours.
 */

type Tone = "neutral" | "success" | "warning" | "danger" | "brand";

const toneClass: Record<Tone, string> = {
  neutral: "bg-rock-50 text-rock-500",
  success: "bg-success-surface text-success",
  warning: "bg-warning-surface text-warning",
  danger: "bg-danger-surface text-danger",
  brand: "bg-brand-50 text-brand-700",
};

export function Badge({
  children,
  tone = "neutral",
  icon,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-[-0.01em] whitespace-nowrap",
        toneClass[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
