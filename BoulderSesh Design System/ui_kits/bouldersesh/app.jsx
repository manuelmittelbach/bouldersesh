/* BoulderSesh UI kit — app shell: screen rail + phone + state machine. */

const { useState: useStateA, useEffect: useEffectA } = React;

function ProfileScreen({ go, setTab }) {
  const styles = ["Power", "Dynamisch", "Technik"];
  return (
    <>
      <StatusBar />
      <Body style={{ padding: "8px 20px 20px" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-2xl)", letterSpacing: "var(--tracking-tight)", color: "var(--text-strong)" }}>Profil</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: 18 }}>
          <Avatar initials="M" tone="pink" size={88} />
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-xl)", color: "var(--text-strong)", marginTop: 12 }}>Manu</div>
          <div style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", marginTop: 3 }}>manu@boulder.cc</div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <GradePill grade="6b" band="intermediate" />
            <Badge tone="success" icon="badge-check">Verifiziert</Badge>
          </div>
        </div>
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-strong)", fontWeight: 500 }}><Icon name="map-pin" size={17} color="var(--text-muted)" />Stamm-Halle</span>
            <span style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>München-Ost</span>
          </Card>
          <Card>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-2xs)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "var(--tracking-caps)", color: "var(--text-muted)", marginBottom: 10 }}>Boulder-Stil</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{styles.map((s) => <Chip key={s} active>{s}</Chip>)}</div>
          </Card>
        </div>
        <div style={{ marginTop: 20 }}>
          <Button fullWidth variant="outline" onClick={() => go("auth")}>Ausloggen</Button>
        </div>
      </Body>
      <BottomNav active="profile" onSelect={setTab} items={[
        { key: "home", label: "Home", icon: "house" },
        { key: "chats", label: "Chats", icon: "message-circle", badge: true },
        { key: "profile", label: "Profil", icon: "user" },
      ]} />
    </>
  );
}

const RAIL = [
  ["auth", "Login"], ["dashboard", "Dashboard"], ["create", "Session anlegen"],
  ["detail", "Detail"], ["sent", "Anfrage"], ["chat", "Chat"], ["profile", "Profil"],
];

function App() {
  const [screen, setScreen] = useStateA("auth");
  const [session, setSession] = useStateA(SESSIONS[0]);

  useEffectA(() => { if (window.lucide) window.lucide.createIcons(); });

  const go = (s) => setScreen(s);
  const openSession = (s) => { setSession(s); setScreen("detail"); };
  const setTab = (key) => setScreen(key === "home" ? "dashboard" : key === "chats" ? "chat" : "profile");
  const tab = screen === "dashboard" ? "home" : screen === "chat" ? "chats" : screen === "profile" ? "profile" : "home";

  const screens = {
    auth: <AuthScreen go={go} />,
    dashboard: <DashboardScreen go={go} openSession={openSession} tab={tab} setTab={setTab} />,
    create: <CreateScreen go={go} />,
    detail: <DetailScreen go={go} session={session} />,
    sent: <SentScreen go={go} session={session} />,
    chat: <ChatScreen go={go} session={session} />,
    profile: <ProfileScreen go={go} setTab={setTab} />,
  };

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 760, padding: "26px 24px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <Icon name="mountain" size={22} />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-lg)", letterSpacing: "var(--tracking-tight)", color: "var(--text-strong)", lineHeight: 1.1 }}>BoulderSesh</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>UI kit · klickbar</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {RAIL.map(([k, t]) => (
            <button key={k} onClick={() => go(k)} style={{
              fontFamily: "var(--font-ui)", fontSize: "var(--text-xs)", fontWeight: 600, padding: "7px 12px",
              borderRadius: "var(--radius-pill)", cursor: "pointer", transition: "background 120ms",
              border: `1px solid ${screen === k ? "var(--rock-900)" : "var(--border-default)"}`,
              background: screen === k ? "var(--rock-900)" : "var(--surface-card)",
              color: screen === k ? "#fff" : "var(--text-body)",
            }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: "20px 0 48px", display: "flex", justifyContent: "center" }}>
        <PhoneFrame>{screens[screen]}</PhoneFrame>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
