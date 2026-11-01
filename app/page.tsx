"use client";

import { useState } from "react";
import styles from "./page.module.css";

type Role = "user" | "assistant";
type Msg = { role: Role; content: string };
type SuspectId = "dani" | "noa" | "yossi" | "maya";

const SUSPECTS: { id: SuspectId; name: string; blurb: string }[] = [
  { id: "dani", name: "Dani Levi", blurb: "Hummus HaMelech, across the alley" },
  { id: "noa", name: "Noa Shalev", blurb: "Rina's niece, works at the stall" },
  { id: "yossi", name: "Yossi Ben-David", blurb: "Night guard" },
  { id: "maya", name: "Maya Katz", blurb: "Food influencer" },
];

async function ask(url: string, body: object): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data.reply as string;
}

function Chat({
  title,
  messages,
  busy,
  onSend,
}: {
  title: string;
  messages: Msg[];
  busy: boolean;
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");

  function submit() {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    onSend(text);
  }

  return (
    <section className={styles.panel}>
      <h2>{title}</h2>
      <div className={styles.log}>
        {messages.length === 0 && <p className={styles.muted}>No messages yet.</p>}
        {messages.map((m, i) => (
          <p key={i} className={m.role === "user" ? styles.you : styles.them}>
            <strong>{m.role === "user" ? "You" : "Reply"}:</strong> {m.content}
          </p>
        ))}
        {busy && <p className={styles.muted}>Thinking...</p>}
      </div>
      <div className={styles.inputRow}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Ask a question"
        />
        <button onClick={submit} disabled={busy}>
          Send
        </button>
      </div>
    </section>
  );
}

export default function Home() {
  const [assistantMsgs, setAssistantMsgs] = useState<Msg[]>([]);
  const [assistantBusy, setAssistantBusy] = useState(false);

  // Each suspect keeps their own conversation history.
  const [chats, setChats] = useState<Record<SuspectId, Msg[]>>({
    dani: [],
    noa: [],
    yossi: [],
    maya: [],
  });
  const [busySuspect, setBusySuspect] = useState<SuspectId | null>(null);
  const [openSuspect, setOpenSuspect] = useState<SuspectId | null>(null);

  const [accuseId, setAccuseId] = useState<SuspectId>("dani");
  const [verdict, setVerdict] = useState<string | null>(null);

  async function sendAssistant(text: string) {
    const next: Msg[] = [...assistantMsgs, { role: "user", content: text }];
    setAssistantMsgs(next);
    setAssistantBusy(true);
    try {
      const reply = await ask("/api/assistant", { messages: next });
      setAssistantMsgs([...next, { role: "assistant", content: reply }]);
    } catch (err) {
      setAssistantMsgs([...next, { role: "assistant", content: String(err) }]);
    } finally {
      setAssistantBusy(false);
    }
  }

  async function sendSuspect(id: SuspectId, text: string) {
    const next: Msg[] = [...chats[id], { role: "user", content: text }];
    setChats((c) => ({ ...c, [id]: next }));
    setBusySuspect(id);
    try {
      const reply = await ask(`/api/suspect/${id}`, { messages: next });
      setChats((c) => ({ ...c, [id]: [...next, { role: "assistant", content: reply }] }));
    } catch (err) {
      setChats((c) => ({ ...c, [id]: [...next, { role: "assistant", content: String(err) }] }));
    } finally {
      setBusySuspect(null);
    }
  }

  async function accuse() {
    try {
      const res = await fetch("/api/accuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspect: accuseId }),
      });
      const data = await res.json();
      setVerdict(data.message ?? data.error);
    } catch (err) {
      setVerdict(String(err));
    }
  }

  const active = openSuspect ? SUSPECTS.find((s) => s.id === openSuspect) : null;

  return (
    <main className={styles.main}>
      <h1>The Shuk Recipe Heist</h1>
      <p className={styles.muted}>
        Rina&apos;s blue notebook is missing. Search the case files, question the suspects, then accuse.
      </p>

      <div className={styles.grid}>
        <Chat
          title="Case Assistant"
          messages={assistantMsgs}
          busy={assistantBusy}
          onSend={sendAssistant}
        />

        <section className={styles.panel}>
          <h2>Suspects</h2>
          <div className={styles.cards}>
            {SUSPECTS.map((s) => (
              <button
                key={s.id}
                className={styles.card}
                onClick={() => setOpenSuspect(s.id)}
              >
                <strong>{s.name}</strong>
                <span className={styles.muted}>{s.blurb}</span>
              </button>
            ))}
          </div>

          {active && (
            <Chat
              title={`Interrogating ${active.name}`}
              messages={chats[active.id]}
              busy={busySuspect === active.id}
              onSend={(text) => sendSuspect(active.id, text)}
            />
          )}

          <div className={styles.accuse}>
            <h2>Accuse</h2>
            <select
              value={accuseId}
              onChange={(e) => setAccuseId(e.target.value as SuspectId)}
            >
              {SUSPECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button onClick={accuse}>Accuse</button>
            {verdict && <p>{verdict}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
