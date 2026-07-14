import type { GradeBand } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Boulder Buddy — GradePill
 * Climbing-grade chip. Mono numerals on a muted, cool band surface so grades
 * read as data, not candy.
 */

const bandClass: Record<GradeBand, string> = {
  beginner: "bg-grade-beginner text-grade-beginner-ink",
  intermediate: "bg-grade-intermediate text-grade-intermediate-ink",
  advanced: "bg-grade-advanced text-grade-advanced-ink",
  pro: "bg-grade-pro text-grade-pro-ink",
  neutral: "bg-rock-50 text-rock-700",
};

export function GradePill({
  grade,
  band = "neutral",
  className,
}: {
  grade: string;
  band?: GradeBand;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xs font-mono font-bold text-xs leading-none px-2.5 py-1 whitespace-nowrap",
        bandClass[band],
        className,
      )}
    >
      {grade}
    </span>
  );
}
