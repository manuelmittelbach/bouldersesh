import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combine class names — shadcn-style helper. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a UTC timestamp into a short German local label, e.g. "Heute · 18:00". */
export function formatSessionTime(starts_at: string): string {
  const d = new Date(starts_at);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  const time = `${hh}:${mm}`;

  if (isToday) return `Heute · ${time}`;
  if (isTomorrow) return `Morgen · ${time}`;
  return d.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }) + ` · ${time}`;
}

/** Build a first-name initial avatar fallback. */
export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Calm, cool avatar tones (no candy gradients). See DS Avatar. */
export type AvatarTone = "rock" | "orange" | "slate" | "moss" | "clay";
const AVATAR_TONES: AvatarTone[] = ["rock", "slate", "moss", "clay", "orange"];

/** Pick a deterministic avatar tone from a seed (name/id) so it stays stable. */
export function avatarTone(seed: string | null | undefined): AvatarTone {
  if (!seed) return "rock";
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

/** Map a skill level to a grade-pill colour band. */
export type GradeBand = "beginner" | "intermediate" | "advanced" | "pro" | "neutral";
export function gradeBand(level: string | null | undefined): GradeBand {
  switch (level) {
    case "beginner":
    case "intermediate":
    case "advanced":
    case "pro":
      return level;
    default:
      return "neutral";
  }
}
