import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Hand,
  CheckCircle2,
  Users,
  MessageCircle,
  Check,
  X,
} from "lucide-react";

import { useSession } from "@/queries/sessions";
import {
  useCreateMatchRequest,
  useRequestsForSession,
  useRespondToMatchRequest,
  type MatchRequestWithRequester,
} from "@/queries/matches";
import { useChatForSession } from "@/queries/chat";
import { useAuth } from "@/hooks/useAuth";
import { formatSessionTime, gradeBand } from "@/lib/utils";
import { PageLoader } from "@/components/PageLoader";
import { Avatar } from "@/components/ui/Avatar";
import { GradePill } from "@/components/ui/GradePill";

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-xs text-rock-500">{label}</div>
        <div className="font-display font-semibold text-rock-900 text-sm">
          {value}
        </div>
      </div>
    </div>
  );
}

const SKILL_LABEL: Record<string, string> = {
  beginner: "Anfänger:in",
  intermediate: "Fortgeschritten",
  advanced: "Erfahren",
  pro: "Pro",
};

/** One incoming request row with accept/decline (or its resolved state). */
function RequestRow({
  request,
  sessionId,
}: {
  request: MatchRequestWithRequester;
  sessionId: string;
}) {
  const navigate = useNavigate();
  const respond = useRespondToMatchRequest();
  const chat = useChatForSession(sessionId, request.status === "accepted");

  const name = request.requester?.display_name ?? "Anonym";
  const skill = request.requester?.skill_level;
  const pending = respond.isPending && respond.variables?.requestId === request.id;

  async function accept() {
    const res = await respond.mutateAsync({
      requestId: request.id,
      action: "accept",
    });
    if (res.chatId) navigate(`/chats/${res.chatId}`);
  }

  return (
    <div className="flex items-center gap-3 bg-rock-0 border border-rock-100 rounded-lg p-3 shadow-sm">
      <Avatar name={name} size={44} />
      <div className="flex-1 min-w-0">
        <div className="font-display font-semibold text-rock-900 truncate">
          {name}
        </div>
        {skill && (
          <div className="text-xs text-rock-500">
            {SKILL_LABEL[skill] ?? skill}
          </div>
        )}
      </div>

      {request.status === "pending" && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() =>
              respond.mutate({ requestId: request.id, action: "decline" })
            }
            disabled={pending}
            aria-label="Ablehnen"
            className="w-10 h-10 rounded-full border border-rock-200 text-rock-500 hover:bg-rock-100 disabled:opacity-45 flex items-center justify-center transition-colors ease-out"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={accept}
            disabled={pending}
            aria-label="Annehmen"
            className="w-10 h-10 rounded-full bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-45 flex items-center justify-center transition-colors ease-out active:scale-95"
          >
            <Check className="w-5 h-5" />
          </button>
        </div>
      )}

      {request.status === "accepted" &&
        (chat.data ? (
          <Link
            to={`/chats/${chat.data}`}
            className="shrink-0 inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-sm font-semibold py-2 px-3 rounded-full hover:bg-brand-100 transition-colors ease-out"
          >
            <MessageCircle className="w-4 h-4" /> Chat
          </Link>
        ) : (
          <span className="shrink-0 inline-flex items-center gap-1.5 text-success text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Angenommen
          </span>
        ))}

      {request.status === "declined" && (
        <span className="shrink-0 text-sm text-rock-400">Abgelehnt</span>
      )}
    </div>
  );
}

function IncomingRequests({ sessionId }: { sessionId: string }) {
  const { data: requests, isLoading } = useRequestsForSession(sessionId);

  return (
    <div className="mt-8">
      <div className="eyebrow mb-2 flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" /> Anfragen
      </div>

      {isLoading ? (
        <div className="text-sm text-rock-400 py-4">Lädt…</div>
      ) : requests && requests.length > 0 ? (
        <div className="space-y-2.5">
          {requests.map((req) => (
            <RequestRow key={req.id} request={req} sessionId={sessionId} />
          ))}
        </div>
      ) : (
        <div className="text-sm text-rock-500 bg-rock-50 rounded-lg p-4 leading-normal">
          Noch keine Anfragen. Sobald jemand mitklettern will, taucht die Anfrage
          hier auf.
        </div>
      )}
    </div>
  );
}

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading } = useSession(id);
  const { user } = useAuth();
  const request = useCreateMatchRequest();

  if (isLoading) return <PageLoader />;
  if (!session) {
    return (
      <div className="p-8 text-center text-rock-500">
        Diese Session gibt es nicht (mehr).
      </div>
    );
  }

  const isMine = user?.id === session.creator_id;
  const sent = request.isSuccess;
  const name = session.creator?.display_name ?? "Anonym";

  return (
    <div className="min-h-screen pb-32">
      <div className="px-5 pt-6 pb-3 flex items-center justify-between">
        <Link
          to="/"
          className="w-10 h-10 -ml-2 rounded-full hover:bg-rock-100 flex items-center justify-center text-rock-700"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
      </div>

      <div className="px-5">
        {/* Creator */}
        <div className="flex flex-col items-center text-center mt-2">
          <Avatar name={name} size={88} />
          <div className="mt-3 text-[22px] font-display font-bold tracking-[-0.01em] text-rock-900">
            {name}
          </div>
          <div className="mt-3">
            <GradePill
              grade={session.level}
              band={gradeBand(session.creator?.skill_level)}
            />
          </div>
        </div>

        {/* Info block */}
        <div className="mt-6 bg-rock-0 border border-rock-100 rounded-lg p-4 space-y-3.5 shadow-sm">
          <InfoRow
            icon={<Calendar className="w-4 h-4" />}
            label="Wann"
            value={formatSessionTime(session.starts_at)}
          />
          <InfoRow
            icon={<MapPin className="w-4 h-4" />}
            label="Wo"
            value={session.gym?.name ?? "—"}
          />
          <InfoRow
            icon={<Users className="w-4 h-4" />}
            label="Plätze"
            value="1 Buddy gesucht"
          />
        </div>

        {session.note && (
          <div className="mt-4 bg-rock-50 rounded-lg p-4">
            <div className="eyebrow mb-1.5">Notiz</div>
            <div className="text-sm text-rock-700 leading-relaxed">
              {session.note}
            </div>
          </div>
        )}

        {/* Owner: incoming requests to accept/decline. */}
        {isMine && <IncomingRequests sessionId={session.id} />}
      </div>

      {/* Action bar — only for other people's sessions. */}
      {!isMine && (
        <div className="fixed bottom-0 inset-x-0 mx-auto max-w-md bg-rock-0 border-t border-rock-100 px-5 pt-3 pb-6">
          {sent ? (
            <div className="w-full bg-success-surface text-success font-semibold py-3.5 rounded-md flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Anfrage gesendet
            </div>
          ) : (
            <button
              onClick={() => request.mutate(session.id)}
              disabled={request.isPending}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-45 text-white font-semibold py-3.5 rounded-md flex items-center justify-center gap-2 transition-colors ease-out active:scale-[0.97]"
            >
              <Hand className="w-4 h-4" /> Klettern mit?
            </button>
          )}
        </div>
      )}
    </div>
  );
}
