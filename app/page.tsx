"use client";

import { useState } from "react";
import * as adventurer from "@dicebear/adventurer";
import { createAvatar } from "@dicebear/core";
import Image from "next/image";
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

function SuspectPortrait({ id, talking = false }: { id: SuspectId; talking?: boolean }) {
  const colors = {
    dani: { background: "#f0d7b2", hair: "#34251f", skin: "#c9845f" },
    noa: { background: "#d9e8d5", hair: "#352723", skin: "#d99b76" },
    yossi: { background: "#d7e3ed", hair: "#77736e", skin: "#c98f70" },
    maya: { background: "#efd9dd", hair: "#4b2b29", skin: "#e1a27f" },
  }[id];
  const createPortrait = (mouth: "variant28" | "variant29") => createAvatar(adventurer, {
    seed: id,
    size: 112,
    radius: 22,
    backgroundColor: [colors.background.slice(1)],
    hairColor: [colors.hair.slice(1)],
    skinColor: [colors.skin.slice(1)],
    mouth: [mouth],
  });

  return (
    <span className={`${styles.portrait} ${talking ? styles.talking : ""}`} aria-hidden="true">
      <Image
        className={styles.portraitFace}
        src={createPortrait("variant29").toDataUri()}
        width={112}
        height={112}
        alt=""
        unoptimized
      />
      <Image
        className={`${styles.portraitFace} ${styles.portraitSpeaking}`}
        src={createPortrait("variant28").toDataUri()}
        width={112}
        height={112}
        alt=""
        unoptimized
      />
    </span>
  );
}

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
  busyLabel = "Thinking...",
  onSend,
}: {
  title: string;
  messages: Msg[];
  busy: boolean;
  busyLabel?: string;
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
        {busy && <p className={styles.muted} aria-live="polite" aria-atomic="true">{busyLabel}</p>}
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
                className={`${styles.card} ${openSuspect === s.id ? styles.selected : ""}`}
                onClick={() => setOpenSuspect(s.id)}
                aria-pressed={openSuspect === s.id}
              >
                <SuspectPortrait id={s.id} talking={busySuspect === s.id} />
                <span className={styles.cardText}>
                  <strong>{s.name}</strong>
                  <span className={styles.muted}>{s.blurb}</span>
                </span>
              </button>
            ))}
          </div>

          {active && (
            <Chat
              title={`Interrogating ${active.name}`}
              messages={chats[active.id]}
              busy={busySuspect === active.id}
              busyLabel={`${active.name} is replying...`}
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
