import type { AvatarTone } from "@/lib/utils";
import { avatarTone, cn, initials } from "@/lib/utils";

/**
 * Boulder Buddy — Avatar
 * Initials avatar with a calm, cool, flat tone set (no candy gradients).
 * Optional online dot. Tone is derived from the name unless given explicitly.
 */

const toneClass: Record<AvatarTone, string> = {
  rock: "bg-rock-700",
  orange: "bg-brand-500",
  slate: "bg-[#3a4252]",
  moss: "bg-[#2f5d4a]",
  clay: "bg-[#7a4a36]",
};

export function Avatar({
  name,
  tone,
  size = 44,
  online = false,
  src,
  className,
}: {
  name?: string | null;
  tone?: AvatarTone;
  size?: number;
  online?: boolean;
  src?: string | null;
  className?: string;
}) {
  const t = tone ?? avatarTone(name);
  const dot = Math.max(8, Math.round(size * 0.24));

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <div
        className={cn(
          "w-full h-full rounded-full flex items-center justify-center text-white font-display font-semibold tracking-[-0.01em] select-none overflow-hidden bg-cover bg-center",
          !src && toneClass[t],
        )}
        style={{
          fontSize: Math.round(size * 0.4),
          backgroundImage: src ? `url(${src})` : undefined,
        }}
      >
        {src ? null : initials(name)}
      </div>
      {online && (
        <span
          className="absolute right-0 bottom-0 rounded-full bg-success border-2 border-rock-0"
          style={{ width: dot, height: dot }}
        />
      )}
    </div>
  );
}
