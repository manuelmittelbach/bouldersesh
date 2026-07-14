import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mountain } from "lucide-react";

import { supabase } from "@/lib/supabase";

type Mode = "signin" | "signup";
type Status = "idle" | "working" | "magic-sent" | "confirm-sent" | "error";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setStatus("working");
    setErrorMessage(null);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
        return;
      }
      // With email confirmation OFF, a session is returned immediately and the
      // user is logged in. With it ON, session is null until they confirm.
      if (data.session) {
        navigate(from, { replace: true });
        return;
      }
      setStatus("confirm-sent");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    navigate(from, { replace: true });
  }

  async function handleMagicLink() {
    if (!email) {
      setStatus("error");
      setErrorMessage("Bitte zuerst deine E-Mail eingeben.");
      return;
    }
    setStatus("working");
    setErrorMessage(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("magic-sent");
  }

  const sent = status === "magic-sent" || status === "confirm-sent";

  return (
    <div className="min-h-screen flex flex-col px-6 pt-16 pb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-brand-500 flex items-center justify-center text-white">
          <Mountain className="w-6 h-6" />
        </div>
        <div className="text-xl font-display font-bold tracking-[-0.02em] text-rock-900">
          Boulder Buddy
        </div>
      </div>

      <div className="mt-14">
        <h1 className="text-[30px] font-display font-bold tracking-[-0.02em] text-rock-900 leading-[1.05]">
          Sag der App, wann du wohin gehst — sie zeigt dir, mit wem du klettern könntest.
        </h1>
        <p className="text-rock-500 mt-3.5 text-base leading-normal">
          {mode === "signup"
            ? "Leg dir einen Account an — E-Mail und ein Passwort genügen."
            : "Meld dich mit E-Mail und Passwort an."}
        </p>
      </div>

      {sent ? (
        <div className="mt-8 bg-success-surface border border-success/15 rounded-lg p-5">
          <div className="font-display font-semibold text-success">
            Check deine Mails
          </div>
          <div className="text-sm text-rock-700 mt-1 leading-normal">
            {status === "confirm-sent" ? (
              <>
                Wir haben einen Bestätigungs-Link an{" "}
                <span className="font-medium">{email}</span> geschickt. Klick
                darauf, um deinen Account zu aktivieren.
              </>
            ) : (
              <>
                Wir haben einen Login-Link an{" "}
                <span className="font-medium">{email}</span> geschickt. Klick
                darauf, und du bist drin.
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Mode toggle */}
          <div className="mt-8 grid grid-cols-2 gap-1 bg-rock-100 rounded-md p-1">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setStatus("idle");
                  setErrorMessage(null);
                }}
                className={
                  "py-2 rounded text-sm font-semibold transition-colors ease-out " +
                  (mode === m
                    ? "bg-rock-0 text-rock-900 shadow-sm"
                    : "text-rock-500")
                }
              >
                {m === "signin" ? "Anmelden" : "Registrieren"}
              </button>
            ))}
          </div>

          <form onSubmit={handlePassword} className="mt-4 space-y-3">
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="du@example.com"
              className="w-full bg-rock-0 border border-rock-200 rounded-md px-4 py-3 text-base text-rock-900 placeholder-rock-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500"
            />
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort (mind. 6 Zeichen)"
              className="w-full bg-rock-0 border border-rock-200 rounded-md px-4 py-3 text-base text-rock-900 placeholder-rock-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={status === "working"}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-45 text-white font-semibold py-3.5 rounded-md transition-colors ease-out active:scale-[0.97]"
            >
              {status === "working"
                ? "Moment…"
                : mode === "signup"
                  ? "Account anlegen"
                  : "Anmelden"}
            </button>
            {errorMessage && (
              <div className="text-sm text-danger">{errorMessage}</div>
            )}
          </form>

          <button
            type="button"
            onClick={handleMagicLink}
            disabled={status === "working"}
            className="mt-4 text-sm text-rock-500 hover:text-rock-700 underline underline-offset-2 transition-colors ease-out self-start"
          >
            Lieber per Login-Link ohne Passwort
          </button>
        </>
      )}

      <p className="text-xs text-rock-400 mt-auto text-center">
        Mit dem Login akzeptierst du unsere Datenschutzerklärung.
      </p>
    </div>
  );
}
