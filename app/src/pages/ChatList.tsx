import { Link } from "react-router-dom";
import { MessageCircle, Mountain } from "lucide-react";

import { BottomNav } from "@/components/BottomNav";
import { Avatar } from "@/components/ui/Avatar";
import { useMyChats, type ChatListItem } from "@/queries/chat";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

/** Compact timestamp for a chat row: time today, weekday this week, else date. */
function formatChatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return `${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  }
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days < 7) return d.toLocaleDateString("de-DE", { weekday: "short" });
  return d.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}

function ChatRow({ chat }: { chat: ChatListItem }) {
  const name = chat.other?.display_name ?? "Anonym";
  const preview = chat.lastMessage?.body ?? "Sag Hallo 👋";
  const stamp = chat.lastMessage?.sent_at ?? chat.createdAt;

  return (
    <Link
      to={`/chats/${chat.id}`}
      className="flex items-center gap-3 px-5 py-3 hover:bg-rock-50 transition-colors ease-out"
    >
      <Avatar name={name} size={52} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="font-display font-semibold text-rock-900 truncate">
            {name}
          </div>
          <div
            className={cn(
              "text-xs shrink-0",
              chat.unread ? "text-brand-600 font-semibold" : "text-rock-400",
            )}
          >
            {formatChatTime(stamp)}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div
            className={cn(
              "text-sm truncate",
              chat.unread ? "text-rock-900 font-medium" : "text-rock-500",
            )}
          >
            {preview}
          </div>
          {chat.unread && (
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 shrink-0" />
          )}
        </div>
        {chat.session?.gym && (
          <div className="text-xs text-rock-400 truncate mt-0.5">
            {chat.session.gym.name} · {chat.session.level}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function ChatList() {
  const { user } = useAuth();
  const { data: chats, isLoading, error } = useMyChats();

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-6 pb-3">
        <div className="text-[30px] font-display font-bold tracking-[-0.02em] text-rock-900">
          Chats
        </div>
      </div>

      {!user ? (
        <div className="px-5 text-center text-rock-500 text-sm py-12 leading-normal">
          Meld dich an, um deine Chats zu sehen.
        </div>
      ) : isLoading ? (
        <div className="text-center text-rock-400 text-sm py-12">Lädt…</div>
      ) : error ? (
        <div className="text-center text-danger text-sm py-12">
          Fehler beim Laden: {(error as Error).message}
        </div>
      ) : chats && chats.length > 0 ? (
        <div className="divide-y divide-rock-100">
          {chats.map((chat) => (
            <ChatRow key={chat.id} chat={chat} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-5">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
            <MessageCircle className="w-7 h-7" />
          </div>
          <div className="font-display font-semibold text-rock-900">
            Noch keine Chats
          </div>
          <div className="text-sm text-rock-500 mt-1 mb-4 leading-normal">
            Sobald du eine Kletter-Anfrage annimmst oder deine angenommen wird,
            landet der Chat hier.
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 px-5 rounded-md transition-colors ease-out active:scale-[0.97]"
          >
            <Mountain className="w-4 h-4" /> Sessions ansehen
          </Link>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
