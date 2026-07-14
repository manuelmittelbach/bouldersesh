import { Link } from "react-router-dom";
import { Clock, MapPin } from "lucide-react";

import type { SessionWithMeta } from "@/queries/sessions";
import { Avatar } from "@/components/ui/Avatar";
import { GradePill } from "@/components/ui/GradePill";
import { formatSessionTime, gradeBand } from "@/lib/utils";

/** The signature feed unit: who's climbing, when, where, at what grade. */
export function SessionCard({ session }: { session: SessionWithMeta }) {
  const name = session.creator?.display_name ?? "Anonym";

  return (
    <Link
      to={`/sessions/${session.id}`}
      className="block bg-rock-0 rounded-lg p-4 border border-rock-100 shadow-sm transition-transform ease-out active:scale-[0.985]"
    >
      <div className="flex items-start gap-3">
        <Avatar name={name} size={46} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="font-display font-semibold text-[17px] tracking-[-0.01em] text-rock-900 truncate">
              {name}
            </div>
            <GradePill
              grade={session.level}
              band={gradeBand(session.creator?.skill_level)}
              className="shrink-0"
            />
          </div>
          <div className="flex items-center gap-1.5 text-sm text-rock-500 mt-1">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">
              {formatSessionTime(session.starts_at)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-rock-500 mt-0.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {session.gym?.name ?? "Unbekannte Halle"}
            </span>
          </div>
          {session.note && (
            <div className="mt-2 text-sm text-rock-700 leading-normal line-clamp-2">
              {session.note}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
