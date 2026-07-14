/* Boulder Buddy UI kit — screens. Uses window primitives from primitives.jsx. */

const { useState: useStateS } = React;

const SESSIONS = [
  { id: "lina", name: "Lina Kessler", short: "Lina K.", tone: "orange", grade: "6a – 6c", band: "intermediate",
    when: "Heute · 18:00 – 21:00", gym: "Boulderwelt München-Ost", online: true,
    note: "Suche jemand zum Projekt-Bouldern. Versuche mich an einem 6c+ in der gelben Ecke.",
    foot: { tone: "success", icon: "circle-check-big", text: "Passt zu deinem Level" }, years: "Klettert seit 3 Jahren · Power & Dynamisch" },
  { id: "tom", name: "Tom & Jana", short: "Tom & Jana", tone: "slate", grade: "5+ – 6a", band: "beginner",
    when: "Morgen · 19:30", gym: "Boulderwelt München-Ost",
    note: "Sind zu zweit, ein:e dritte:r ist noch frei. Locker, viel quatschen.",
    foot: { tone: "neutral", icon: "users", text: "1 / 2 Plätze frei" } },
  { id: "sami", name: "Sami Rahimi", short: "Sami R.", tone: "moss", grade: "7a+", band: "advanced",
    when: "Fr, 29. Mai · 17:00", gym: "Einstein Boulderhalle",
    note: "Power-Session. Suche jemand auf ähnlichem Niveau zum Spotten.",
    foot: { tone: "warning", icon: "arrow-up-right", text: "Stretch-Level" } },
  { id: "nora", name: "Nora Pohl", short: "Nora P.", tone: "clay", grade: "6b", band: "intermediate",
    when: "Sa, 30. Mai · 11:00", gym: "DAV Kletter- & Boulderzentrum",
    note: "Erstmal warm werden, dann Slabs. Tipps willkommen." },
];

/* Scroll region inside the phone */
function Body({ children, style }) {
  return <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", ...style }}>{children}</div>;
}
function Label({ children, style }) {
  return <div style={{
    fontFamily: "var(--font-ui)", fontSize: "var(--text-2xs)", fontWeight: 600, textTransform: "uppercase",
    letterSpacing: "var(--tracking-caps)", color: "var(--text-muted)", ...style,
  }}>{children}</div>;
}
const H = (s, w = 600) => ({ fontFamily: "var(--font-display)", fontWeight: w, letterSpacing: "var(--tracking-snug)", color: "var(--text-strong)", fontSize: s });

/* ---- AUTH -------------------------------------------------------------- */
function AuthScreen({ go }) {
  return (
    <>
      <StatusBar />
      <Body style={{ padding: "8px 26px 26px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <Icon name="mountain" size={24} />
          </div>
          <div style={{ ...H(19, 700), letterSpacing: "var(--tracking-tight)" }}>Boulder Buddy</div>
        </div>
        <div style={{ marginTop: 56 }}>
          <h1 style={{ ...H(30, 700), letterSpacing: "var(--tracking-tight)", lineHeight: "var(--leading-tight)", margin: 0 }}>
            Sag der App, wann du wohin gehst — sie zeigt dir, mit wem du klettern könntest.
          </h1>
          <p style={{ marginTop: 14, color: "var(--text-muted)", fontSize: "var(--text-base)", lineHeight: "var(--leading-normal)" }}>
            Gib deine E-Mail ein. Wir schicken dir einen Login-Link.
          </p>
        </div>
        <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: "0 14px", height: 48 }}>
            <Icon name="mail" size={17} color="var(--text-faint)" />
            <span style={{ color: "var(--text-strong)", fontSize: "var(--text-base)" }}>manu@boulder.cc</span>
          </div>
          <Button fullWidth size="lg" icon="send" onClick={() => go("dashboard")}>Login-Link senden</Button>
        </div>
        <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ height: 1, background: "var(--border-default)", flex: 1 }} />
          <span style={{ color: "var(--text-faint)", fontSize: "var(--text-xs)" }}>oder</span>
          <div style={{ height: 1, background: "var(--border-default)", flex: 1 }} />
        </div>
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
          <Button fullWidth size="lg" variant="outline" icon="globe" onClick={() => go("dashboard")}>Weiter mit Google</Button>
          <Button fullWidth size="lg" variant="outline" icon="apple" onClick={() => go("dashboard")}>Weiter mit Apple</Button>
        </div>
        <div style={{ marginTop: "auto", paddingTop: 26, textAlign: "center", color: "var(--text-faint)", fontSize: "var(--text-xs)" }}>
          Mit dem Login akzeptierst du unsere Datenschutzerklärung.
        </div>
      </Body>
    </>
  );
}

/* ---- DASHBOARD --------------------------------------------------------- */
function SessionCardRow({ s, onClick }) {
  return (
    <Card interactive onClick={onClick}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Avatar name={s.name} tone={s.tone} size={46} online={s.online} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ ...H(17), flex: "1 1 auto", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.short}</div>
            <span style={{ flex: "0 0 auto" }}><GradePill grade={s.grade} band={s.band} /></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "var(--text-sm)", marginTop: 3 }}>
            <Icon name="clock" size={14} style={{ flex: "0 0 auto" }} /><span style={{ whiteSpace: "nowrap" }}>{s.when}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "var(--text-sm)", marginTop: 2, minWidth: 0 }}>
            <Icon name="map-pin" size={14} style={{ flex: "0 0 auto" }} /><span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.gym}</span>
          </div>
          {s.note && <div style={{ marginTop: 8, color: "var(--text-body)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-normal)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.note}</div>}
          {s.foot && <div style={{ marginTop: 11 }}><Badge tone={s.foot.tone} icon={s.foot.icon}>{s.foot.text}</Badge></div>}
        </div>
      </div>
    </Card>
  );
}

function DashboardScreen({ go, openSession, tab, setTab }) {
  return (
    <>
      <StatusBar />
      <Body style={{ paddingBottom: 8 }}>
        <div style={{ padding: "6px 20px 12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <Label>Heute · Mi, 27. Mai</Label>
            <div style={{ ...H(30, 700), letterSpacing: "var(--tracking-tight)", marginTop: 2 }}>Wer klettert?</div>
          </div>
          <Avatar initials="M" tone="pink" size={42} onClick={() => setTab("profile")} style={{ cursor: "pointer" }} />
        </div>
        <div style={{ padding: "0 20px 12px", display: "flex", gap: 8, overflowX: "auto" }}>
          <Chip active icon="map-pin" trailingIcon="chevron-down">Boulderwelt München</Chip>
          <Chip icon="calendar">Heute &amp; morgen</Chip>
          <Chip icon="trending-up">Mein Level ± 1</Chip>
        </div>
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 16 }}>
          {SESSIONS.map((s) => <SessionCardRow key={s.id} s={s} onClick={() => openSession(s)} />)}
        </div>
      </Body>
      <Button onClick={() => go("create")} style={{
        position: "absolute", right: 20, bottom: 92, width: 56, height: 56, borderRadius: "var(--radius-pill)",
        padding: 0, boxShadow: "var(--shadow-brand)", zIndex: 20,
      }} icon={null}><Icon name="plus" size={26} /></Button>
      <BottomNav active={tab} onSelect={setTab} items={[
        { key: "home", label: "Home", icon: "house" },
        { key: "chats", label: "Chats", icon: "message-circle", badge: true },
        { key: "profile", label: "Profil", icon: "user" },
      ]} />
    </>
  );
}

/* ---- CREATE ------------------------------------------------------------ */
function FieldBox({ children, style }) {
  return <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: "12px 14px", ...style }}>{children}</div>;
}
function CreateScreen({ go }) {
  const [day, setDay] = useStateS("heute");
  const [levels, setLevels] = useStateS({ "6a": true, "6b": true, "6c": true });
  const lv = (k) => setLevels((p) => ({ ...p, [k]: !p[k] }));
  return (
    <>
      <StatusBar />
      <div style={{ padding: "4px 14px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", flex: "0 0 auto" }}>
        <IconButton name="x" label="Schließen" onClick={() => go("dashboard")} />
        <div style={{ ...H(16) }}>Neue Session</div>
        <div style={{ width: 40 }} />
      </div>
      <Body style={{ padding: "8px 20px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <Label style={{ marginBottom: 8 }}>Halle</Label>
          <FieldBox style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-strong)", fontWeight: 500 }}><Icon name="map-pin" size={16} color="var(--text-muted)" />Boulderwelt München-Ost</span>
            <Icon name="chevron-down" size={16} color="var(--text-faint)" />
          </FieldBox>
        </div>
        <div>
          <Label style={{ marginBottom: 8 }}>Wann?</Label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[["heute", "Heute"], ["morgen", "Morgen"], ["datum", "Datum"]].map(([k, t]) => (
              <button key={k} onClick={() => setDay(k)} style={{
                height: 46, borderRadius: "var(--radius-md)", fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: "var(--text-sm)", cursor: "pointer",
                border: `1px solid ${day === k ? "var(--brand)" : "var(--border-default)"}`,
                background: day === k ? "var(--brand)" : "var(--surface-card)", color: day === k ? "#fff" : "var(--text-body)",
              }}>{t}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            <FieldBox style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>Start</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-strong)" }}>18:00</span>
            </FieldBox>
            <FieldBox style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>Ende</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-strong)" }}>21:00</span>
            </FieldBox>
          </div>
        </div>
        <div>
          <Label style={{ marginBottom: 8 }}>Wunsch-Level</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["5+", "6a", "6b", "6c", "7a"].map((k) => <Chip key={k} active={!!levels[k]} onClick={() => lv(k)}>{k}</Chip>)}
            <Chip icon="infinity">egal</Chip>
          </div>
        </div>
        <div>
          <Label style={{ marginBottom: 8 }}>Notiz <span style={{ textTransform: "none", letterSpacing: 0, color: "var(--text-faint)" }}>(optional)</span></Label>
          <FieldBox style={{ color: "var(--text-faint)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-normal)", minHeight: 64 }}>
            z. B. „Suche jemand zum Projekt-Bouldern an einem 6c+"
          </FieldBox>
        </div>
      </Body>
      <div style={{ padding: "12px 20px 16px", borderTop: "1px solid var(--border-subtle)", background: "var(--surface-card)", flex: "0 0 auto" }}>
        <Button fullWidth size="lg" icon="send" onClick={() => go("dashboard")}>Session veröffentlichen</Button>
      </div>
    </>
  );
}

/* ---- DETAIL ------------------------------------------------------------ */
function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: "var(--radius-pill)", background: "var(--brand-soft)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
        <Icon name={icon} size={16} color="var(--brand-soft-ink)" />
      </div>
      <div>
        <div style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>{label}</div>
        <div style={{ ...H(15), fontWeight: 600 }}>{value}</div>
      </div>
    </div>
  );
}
function DetailScreen({ go, session }) {
  const s = session || SESSIONS[0];
  return (
    <>
      <StatusBar />
      <div style={{ padding: "4px 14px 6px", display: "flex", alignItems: "center", justifyContent: "space-between", flex: "0 0 auto" }}>
        <IconButton name="arrow-left" label="Zurück" onClick={() => go("dashboard")} />
        <IconButton name="more-horizontal" label="Mehr" />
      </div>
      <Body style={{ padding: "8px 20px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: 6 }}>
          <Avatar name={s.name} tone={s.tone} size={88} online={s.online} />
          <div style={{ ...H(22, 700), marginTop: 12 }}>{s.short}</div>
          <div style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", marginTop: 3 }}>{s.years || "Boulder-Buddy"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <GradePill grade={s.grade} band={s.band} />
            <Badge tone="success" icon="badge-check">Verifiziert</Badge>
          </div>
        </div>
        <Card style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <InfoRow icon="calendar" label="Wann" value={s.when} />
          <InfoRow icon="map-pin" label="Wo" value={s.gym} />
          <InfoRow icon="users" label="Plätze" value="1 Buddy gesucht" />
        </Card>
        <div style={{ marginTop: 16, background: "var(--surface-sunken)", borderRadius: "var(--radius-lg)", padding: 16 }}>
          <Label style={{ marginBottom: 6 }}>Notiz</Label>
          <div style={{ color: "var(--text-body)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)" }}>{s.note}</div>
        </div>
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, color: "var(--success-ink)", fontSize: "var(--text-sm)", fontWeight: 500 }}>
          <Icon name="circle-check-big" size={16} /><span>Passt zu deinem Level (6b) und deiner Stamm-Halle</span>
        </div>
      </Body>
      <div style={{ padding: "12px 20px 16px", borderTop: "1px solid var(--border-subtle)", background: "var(--surface-card)", flex: "0 0 auto" }}>
        <Button fullWidth size="lg" icon="hand" onClick={() => go("sent")}>Klettern mit?</Button>
      </div>
    </>
  );
}

/* ---- SENT -------------------------------------------------------------- */
function SentScreen({ go, session }) {
  const s = session || SESSIONS[0];
  return (
    <>
      <StatusBar />
      <div style={{ padding: "4px 14px 6px", display: "flex", alignItems: "center", justifyContent: "space-between", flex: "0 0 auto" }}>
        <IconButton name="arrow-left" label="Zurück" onClick={() => go("detail")} />
        <IconButton name="more-horizontal" label="Mehr" />
      </div>
      <Body style={{ padding: "8px 20px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: "var(--radius-pill)", background: "var(--success-surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="send" size={34} color="var(--success-ink)" />
          </div>
          <div style={{ ...H(22, 700), marginTop: 18 }}>Anfrage gesendet</div>
          <div style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", marginTop: 6, maxWidth: 270, lineHeight: "var(--leading-normal)" }}>
            {s.short.split(" ")[0]} kriegt eine Push-Nachricht. Wenn sie zusagt, kann's losgehen.
          </div>
        </div>
        <Card style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={s.name} tone={s.tone} size={46} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...H(15), fontWeight: 600 }}>{s.short}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)", marginTop: 2 }}>{s.when.split(" · ")[0]} · {s.gym}</div>
          </div>
          <Badge tone="warning" icon="clock">Wartet</Badge>
        </Card>
        <div style={{ marginTop: 18, display: "flex", gap: 12, background: "var(--surface-sunken)", borderRadius: "var(--radius-lg)", padding: 16 }}>
          <Icon name="lightbulb" size={18} color="var(--warning-ink)" style={{ flex: "0 0 auto", marginTop: 1 }} />
          <div style={{ color: "var(--text-body)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-normal)" }}>
            Tipp: Schreib eine kurze Begrüßung mit, sobald {s.short.split(" ")[0]} annimmt — Anfragen mit Nachricht werden 3× häufiger zugesagt.
          </div>
        </div>
      </Body>
      <div style={{ padding: "12px 20px 16px", borderTop: "1px solid var(--border-subtle)", background: "var(--surface-card)", flex: "0 0 auto" }}>
        <Button fullWidth size="lg" variant="secondary" icon="arrow-left" onClick={() => go("dashboard")}>Zurück zum Feed</Button>
      </div>
    </>
  );
}

/* ---- CHAT -------------------------------------------------------------- */
function ChatScreen({ go, session }) {
  const s = session || SESSIONS[0];
  return (
    <>
      <StatusBar />
      <div style={{ padding: "2px 10px 8px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border-subtle)", flex: "0 0 auto" }}>
        <IconButton name="arrow-left" label="Zurück" onClick={() => go("dashboard")} />
        <Avatar name={s.name} tone={s.tone} size={40} online />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...H(15), fontWeight: 600 }}>{s.short}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--success-ink)", fontSize: "var(--text-xs)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "var(--radius-pill)", background: "var(--success-ink)" }} />Online
          </div>
        </div>
        <IconButton name="more-vertical" label="Mehr" size={36} />
      </div>
      <div style={{ margin: "12px 16px 0", background: "var(--brand-soft)", border: "1px solid var(--orange-100)", borderRadius: "var(--radius-md)", padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
        <Icon name="mountain" size={15} color="var(--brand-soft-ink)" />
        <div style={{ flex: 1, fontSize: "var(--text-xs)", color: "var(--text-body)" }}><b style={{ color: "var(--text-strong)" }}>Heute 18:00</b> · {s.gym}</div>
        <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--brand-soft-ink)" }}>Details</span>
      </div>
      <Body style={{ padding: "16px 16px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", color: "var(--text-faint)" }}>HEUTE</div>
        <div style={{ textAlign: "center" }}>
          <span style={{ display: "inline-block", background: "var(--surface-sunken)", color: "var(--text-muted)", fontSize: "var(--text-2xs)", padding: "5px 12px", borderRadius: "var(--radius-pill)" }}>
            Ihr seid gematcht — viel Spaß beim Klettern!
          </span>
        </div>
        <MessageBubble>Hey Manu! Cool, dass du Bock hast.</MessageBubble>
        <MessageBubble time="9:42">Bin um 18 Uhr am Empfang. Magst du dich davor noch warm machen oder zusammen?</MessageBubble>
        <MessageBubble mine time="9:43">Zusammen warm machen klingt gut!</MessageBubble>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <div style={{ background: "var(--bubble-them-bg)", borderRadius: "16px 16px 16px 4px", padding: "11px 14px", display: "flex", gap: 4 }}>
            {[0, 1, 2].map((i) => <span key={i} style={{ width: 6, height: 6, borderRadius: "var(--radius-pill)", background: "var(--rock-400)", animation: `bbPulse 1s ${i * 0.15}s infinite` }} />)}
          </div>
        </div>
      </Body>
      <div style={{ padding: "10px 12px 16px", borderTop: "1px solid var(--border-subtle)", background: "var(--surface-card)", display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
        <IconButton name="plus" label="Anhang" variant="soft" size={38} />
        <div style={{ flex: 1, background: "var(--surface-sunken)", borderRadius: "var(--radius-pill)", padding: "10px 16px", color: "var(--text-faint)", fontSize: "var(--text-sm)" }}>Nachricht …</div>
        <IconButton name="send" label="Senden" variant="brand" size={38} />
      </div>
    </>
  );
}

Object.assign(window, { SESSIONS, AuthScreen, DashboardScreen, CreateScreen, DetailScreen, SentScreen, ChatScreen });
