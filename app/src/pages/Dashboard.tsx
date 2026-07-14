import { Link } from "react-router-dom";
import { Plus, MapPin, Calendar, TrendingUp, ChevronDown, LogIn, Mountain } from "lucide-react";

import { BottomNav } from "@/components/BottomNav";
import { SessionCard } from "@/components/SessionCard";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { useOpenSessions } from "@/queries/sessions";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { data: sessions, isLoading, error } = useOpenSessions();

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-3 flex items-start justify-between">
        <div>
          <div className="eyebrow">
            {new Date().toLocaleDateString("de-DE", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </div>
          <div className="mt-1 text-[30px] font-display font-bold tracking-[-0.02em] text-rock-900 leading-none">
            Wer klettert?
          </div>
        </div>
        {user ? (
          <Link to="/profile" aria-label="Profil">
            <Avatar name={profile?.display_name ?? user.email} size={42} />
          </Link>
        ) : (
          <Link
            to="/auth"
            className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-2 px-3.5 rounded-full transition-colors ease-out active:scale-[0.97]"
          >
            <LogIn className="w-4 h-4" />
            Anmelden
          </Link>
        )}
      </div>

      {/* Filter chips — wired up later */}
      <div className="px-5 pb-3 flex gap-2 overflow-x-auto">
        <button className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-rock-900 text-white text-sm font-semibold tracking-[-0.01em] whitespace-nowrap">
          <MapPin className="w-3.5 h-3.5" />
          Alle Hallen
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-rock-0 border border-rock-200 text-rock-700 text-sm font-semibold tracking-[-0.01em] whitespace-nowrap">
          <Calendar className="w-3.5 h-3.5" />
          Heute &amp; morgen
        </button>
        <button className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-rock-0 border border-rock-200 text-rock-700 text-sm font-semibold tracking-[-0.01em] whitespace-nowrap">
          <TrendingUp className="w-3.5 h-3.5" />
          Mein Level ± 1
        </button>
      </div>

      {/* List */}
      <div className="px-5 space-y-3">
        {isLoading && (
          <div className="text-center text-rock-400 text-sm py-12">Lädt…</div>
        )}

        {error && (
          <div className="text-center text-danger text-sm py-12">
            Fehler beim Laden: {(error as Error).message}
          </div>
        )}

        {!isLoading && sessions?.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
              <Mountain className="w-7 h-7" />
            </div>
            <div className="font-display font-semibold text-rock-900">
              Noch keine Sessions
            </div>
            <div className="text-sm text-rock-500 mt-1 mb-4">
              Sei die erste Person, die heute klettern geht.
            </div>
            <Link
              to="/sessions/new"
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 px-5 rounded-md transition-colors ease-out active:scale-[0.97]"
            >
              <Plus className="w-4 h-4" /> Session anlegen
            </Link>
          </div>
        )}

        {sessions?.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>

      {/* FAB — the one brand glow per view */}
      <Link
        to="/sessions/new"
        aria-label="Session anlegen"
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-brand active:scale-95 transition ease-out"
      >
        <Plus className="w-7 h-7" />
      </Link>

      <BottomNav />
    </div>
  );
}
