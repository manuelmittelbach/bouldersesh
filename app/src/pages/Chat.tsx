import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";

import { useMessages, useSendMessage } from "@/queries/chat";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/PageLoader";

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages(id);
  const send = useSendMessage(id);
  const [body, setBody] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  if (isLoading || !id) return <PageLoader />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    await send.mutateAsync(body);
    setBody("");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-3 pt-6 pb-2 flex items-center gap-2 border-b border-rock-100">
        <Link
          to="/chats"
          className="w-10 h-10 rounded-full hover:bg-rock-100 flex items-center justify-center text-rock-700"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="font-display font-semibold text-rock-900 text-sm">Chat</div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-24">
        {messages?.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={"flex " + (mine ? "justify-end" : "")}>
              <div
                className={
                  "max-w-[75%] px-3.5 py-2 text-sm leading-normal " +
                  (mine
                    ? "bg-brand-500 text-white rounded-[16px_16px_4px_16px]"
                    : "bg-rock-100 text-rock-900 rounded-[16px_16px_16px_4px]")
                }
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={onSubmit}
        className="fixed bottom-0 inset-x-0 mx-auto max-w-md bg-rock-0 border-t border-rock-100 px-3 pt-2 pb-6 flex items-center gap-2"
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Nachricht …"
          className="flex-1 bg-rock-50 rounded-full px-4 py-2.5 text-sm text-rock-900 placeholder-rock-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <button
          type="submit"
          disabled={!body.trim() || send.isPending}
          className="w-9 h-9 rounded-full bg-brand-500 disabled:opacity-50 flex items-center justify-center text-white shrink-0 transition-transform ease-out active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
