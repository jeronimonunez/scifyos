import { useEffect, useMemo, useRef, useState } from "react";
import { useNavAudio } from "../lib/useNavAudio";
import { BRANDING, PROMPT } from "../lib/branding";

// ─────────────────────────────────────────────────────────
// Data model
//
// A Thread is one conversation: subject + ordered messages.
// `direction` says who sent it ("incoming" = NPC / system,
// "outgoing" = player). `tags` is a placeholder for a future
// game layer to hook quest / story state off of.
//
// `replyOptions` is the multi-choice reply menu shown at the end
// of the thread. Picking one appends it as an outgoing message
// and fires MAIL_REPLY_EVENT so a future game can react.
// ─────────────────────────────────────────────────────────

type Direction = "incoming" | "outgoing";

type Message = {
  id: string;
  direction: Direction;
  from: string;
  date: string;
  body: string;
};

export type ReplyOption = {
  id: string;
  /** Short label shown on the button. */
  label: string;
  /** Full message body appended to the thread when picked. */
  body: string;
  /** Optional game-state hook — emitted on MAIL_REPLY_EVENT detail. */
  action?: string;
};

type Thread = {
  id: string;
  subject: string;
  /** Who participates in the conversation, for the list row. */
  participants: string[];
  messages: Message[];
  unread: boolean;
  tags?: string[];
  /** When present + non-empty, the reply UI is shown at thread end. */
  replyOptions?: ReplyOption[];
};

/** Custom event fired when the player picks a reply option.
 *  detail: { threadId, optionId, action? } */
export const MAIL_REPLY_EVENT = "scifyos:mail:reply";

export type MailReplyDetail = {
  threadId: string;
  optionId: string;
  action?: string;
};

const PLAYER_FROM = PROMPT;

const THREADS: Thread[] = [
  {
    id: "mail-001",
    subject: "welcome aboard",
    participants: ["cmdr. vesper"],
    unread: false,
    tags: ["intro"],
    messages: [
      {
        id: "mail-001-1",
        direction: "incoming",
        from: "cmdr. vesper <vesper@bridge>",
        date: "2026-05-12 09:01",
        body: `${BRANDING.user},

you're confirmed for the nightingale's next jump window. quarters are
on deck 2, your kit's already aboard. read the cargo manifest before
launch — there's been a discrepancy and i want eyes on it.

— vesper`,
      },
    ],
  },
  {
    id: "mail-002",
    subject: "cargo manifest discrepancy",
    participants: ["m. morrigan"],
    unread: true,
    tags: ["mystery", "cargo"],
    replyOptions: [
      {
        id: "go-quiet",
        label: "i'll check H-19 myself · keep this off the bridge",
        body: `keep this between us. i'll check H-19 personally tonight.
don't escalate. don't pull the manifest again — whoever did this
is watching the audit log.`,
        action: "cargo.investigate-quiet",
      },
      {
        id: "escalate",
        label: "escalate to cmdr. vesper",
        body: `this is above my pay grade. forwarding to vesper. lock
the hold and don't touch anything else until security walks
through.`,
        action: "cargo.escalate",
      },
      {
        id: "stand-down",
        label: "stand down · reseal it and move on",
        body: `stand down. reseal H-04 properly and log the discrepancy
as a clerical error. we don't have time for this before the
jump window.`,
        action: "cargo.coverup",
      },
    ],
    messages: [
      {
        id: "mail-002-1",
        direction: "incoming",
        from: "m. morrigan <morrigan@hold>",
        date: "2026-05-13 02:47",
        body: `we're short 1.2 tonnes against the shipping bill. the seal on
crate H-04 was broken and resealed — i can tell because the
serial sticker doesn't match the stamp underneath.

not flagging it through the bridge until i've talked to you.`,
      },
      {
        id: "mail-002-2",
        direction: "outgoing",
        from: PLAYER_FROM,
        date: "2026-05-13 03:12",
        body: `which crate, what was supposed to be inside, who signed for it
at the loading dock?`,
      },
      {
        id: "mail-002-3",
        direction: "incoming",
        from: "m. morrigan <morrigan@hold>",
        date: "2026-05-13 03:31",
        body: `H-04. manifest says "medical / surgical consumables, sealed."
weight delta suggests something denser came out and something
lighter went in. dock signature is "j. tarn" — no such name
on the crew roster i pulled.

i'm sending the hash of the new seal to your terminal.`,
      },
    ],
  },
  {
    id: "mail-003",
    subject: "are you eating",
    participants: ["mom"],
    unread: true,
    tags: ["personal"],
    replyOptions: [
      {
        id: "short",
        label: "▸ alive",
        body: `alive. tell the dog.`,
        action: "mom.short",
      },
      {
        id: "long",
        label: "▸ longer letter",
        body: `i'm fine, mom. long week. nothing i can talk about over
this channel. tell biscuit i miss him too. i'll call sunday
your time. and you owe me a hundred — the leak was upstairs
all along.`,
        action: "mom.long",
      },
      {
        id: "ignore",
        label: "▸ archive without replying",
        body: `[archived — no reply sent]`,
        action: "mom.ignore",
      },
    ],
    messages: [
      {
        id: "mail-003-1",
        direction: "incoming",
        from: "mom <mom@home.net>",
        date: "2026-05-14 18:22",
        body: `you haven't called in three weeks. i don't need a long letter,
just say "alive" so the dog stops moping.

love,
mom

p.s. the upstairs neighbour finally fixed the leak. you owe me
fifty credits from the bet.`,
      },
    ],
  },
  {
    id: "mail-004",
    subject: "[security] anomalous login detected",
    participants: ["scifyos-security"],
    unread: true,
    tags: ["security", "urgent"],
    messages: [
      {
        id: "mail-004-1",
        direction: "incoming",
        from: "scifyos-security <noreply@scifyos>",
        date: "2026-05-15 03:09",
        body: `// automated alert

successful authentication on ${BRANDING.hostname} as ${BRANDING.user}
from 185.220.101.4 (TOR exit relay, NL).

your session token was issued from a host that is offline. if this
was not you, run:

    sudo lockdown --revoke-all --force

this message will not be repeated.`,
      },
    ],
  },
  {
    id: "mail-005",
    subject: "(no subject)",
    participants: ["anon"],
    unread: true,
    tags: ["mystery", "encrypted"],
    replyOptions: [
      {
        id: "trace",
        label: "▸ who are you? how do you know that name?",
        body: `who are you. how do you know about j. tarn.`,
        action: "anon.trace",
      },
      {
        id: "play-along",
        label: "▸ play along · check H-19 quietly",
        body: `going dark. if this is a trap it's on you.`,
        action: "anon.play-along",
      },
      {
        id: "delete",
        label: "▸ delete and forget",
        body: `[message purged from local store]`,
        action: "anon.delete",
      },
    ],
    messages: [
      {
        id: "mail-005-1",
        direction: "incoming",
        from: "<no signature>",
        date: "2026-05-15 04:00",
        body: `you are looking in the wrong crate.

H-04 is bait. check H-19 — under the false floor. don't tell
morrigan. don't tell vesper. burn this after reading.

i was on the dock when "j. tarn" signed for it. that's not what
they were called when i knew them.`,
      },
    ],
  },
  {
    id: "mail-006",
    subject: "re: shore leave request",
    participants: ["hr-bot"],
    unread: false,
    tags: ["bureaucracy"],
    messages: [
      {
        id: "mail-006-1",
        direction: "outgoing",
        from: PLAYER_FROM,
        date: "2026-05-10 14:00",
        body: `requesting 72hrs shore leave on the next rotation. dates
flexible.`,
      },
      {
        id: "mail-006-2",
        direction: "incoming",
        from: "hr-bot <hr@scifyos>",
        date: "2026-05-10 14:00",
        body: `// ticket HR-2741 received

your request has been processed.
status: DENIED
reason: "operational tempo (priority 2)"

you may appeal this decision via form 47-B. form 47-B is currently
unavailable. please try again later.`,
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────

/** Pull 1-2 letter initials from a "from" header.
 *  "cmdr. vesper <vesper@bridge>" → "CV"
 *  "mom <mom@home.net>"           → "M"
 *  "<no signature>"               → "?" */
function initials(name: string): string {
  const noBracket = name.replace(/<[^>]+>/g, "").trim();
  if (!noBracket) return "?";
  const parts = noBracket.split(/[\s.@_-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Map a sender's "from" string to an avatar image. Substring-matched
 *  against the lowercased from header, so "Cmdr. Vesper <vesper@bridge>"
 *  matches the "vesper" key. Add entries here to give NPCs portraits. */
const SENDER_AVATARS: Record<string, string> = {
  vesper: "/avatars/vesper.png",
  morrigan: "/avatars/morrigan.png",
};

function avatarSrcFor(from: string): string | null {
  const lower = from.toLowerCase();
  for (const key of Object.keys(SENDER_AVATARS)) {
    if (lower.includes(key)) return SENDER_AVATARS[key];
  }
  return null;
}

function Avatar({ name, outgoing }: { name: string; outgoing: boolean }) {
  // Player keeps the inverted initials avatar — the "you" tag.
  if (!outgoing) {
    const src = avatarSrcFor(name);
    if (src) {
      return (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className="shrink-0 w-8 h-8 object-cover border border-primary/60 bg-bg"
          style={{ imageRendering: "pixelated" }}
        />
      );
    }
  }
  return (
    <div
      aria-hidden="true"
      className={`shrink-0 w-8 h-8 flex items-center justify-center border text-[11px] font-bold tracking-tight uppercase ${
        outgoing
          ? "bg-primary border-primary text-primary-fg"
          : "bg-bg border-primary/60 text-primary"
      }`}
    >
      {initials(name)}
    </div>
  );
}

/** Take a "YYYY-MM-DD HH:MM" string and add N minutes. */
function plusMinutes(dateStr: string, minutes: number): string {
  const d = new Date(dateStr.replace(" ", "T") + ":00");
  if (isNaN(d.getTime())) return dateStr;
  d.setMinutes(d.getMinutes() + minutes);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type View = { kind: "list" } | { kind: "detail"; threadId: string };

export default function MailApp() {
  const [view, setView] = useState<View>({ kind: "list" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    return new Set(THREADS.filter((t) => !t.unread).map((t) => t.id));
  });
  /** Player-picked replies appended after the static thread messages. */
  const [appended, setAppended] = useState<Record<string, Message[]>>({});
  /** Threads where the user has already picked a reply (hide reply UI). */
  const [replied, setReplied] = useState<Set<string>>(new Set());
  /** Message ids that should play the reply-enter animation. Populated
   *  in `pickReply` and cleared a moment later so re-opening the thread
   *  doesn't replay the animation. */
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (freshIds.size === 0) return;
    const t = window.setTimeout(() => setFreshIds(new Set()), 700);
    return () => window.clearTimeout(t);
  }, [freshIds]);

  const audio = useNavAudio();
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const threads = THREADS;
  const activeThread = useMemo(
    () =>
      view.kind === "detail"
        ? threads.find((t) => t.id === view.threadId)
        : null,
    [view, threads],
  );

  useEffect(() => {
    if (view.kind === "list") {
      containerRef.current?.focus();
    }
  }, [view.kind]);

  useEffect(() => {
    if (view.kind !== "list") return;
    const el = listRef.current?.querySelector<HTMLLIElement>(
      `[data-thread-index="${selectedIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, view.kind]);

  const moveSelection = (delta: number) => {
    setSelectedIndex((i) => {
      const next = Math.min(threads.length - 1, Math.max(0, i + delta));
      if (next !== i) audio.nav();
      return next;
    });
  };

  const openSelected = () => {
    const thread = threads[selectedIndex];
    if (!thread) return;
    audio.select();
    setReadIds((prev) => {
      if (prev.has(thread.id)) return prev;
      const next = new Set(prev);
      next.add(thread.id);
      return next;
    });
    setView({ kind: "detail", threadId: thread.id });
  };

  const back = () => {
    audio.back();
    setView({ kind: "list" });
  };

  const pickReply = (thread: Thread, option: ReplyOption) => {
    audio.select();
    const allMsgs = [...thread.messages, ...(appended[thread.id] ?? [])];
    const lastMsg = allMsgs[allMsgs.length - 1];
    const replyMsg: Message = {
      id: `${thread.id}-r-${option.id}`,
      direction: "outgoing",
      from: PLAYER_FROM,
      date: plusMinutes(lastMsg.date, 5),
      body: option.body,
    };
    setAppended((prev) => ({
      ...prev,
      [thread.id]: [...(prev[thread.id] ?? []), replyMsg],
    }));
    setReplied((prev) => {
      const next = new Set(prev);
      next.add(thread.id);
      return next;
    });
    setFreshIds((prev) => {
      const next = new Set(prev);
      next.add(replyMsg.id);
      return next;
    });
    window.dispatchEvent(
      new CustomEvent<MailReplyDetail>(MAIL_REPLY_EVENT, {
        detail: {
          threadId: thread.id,
          optionId: option.id,
          action: option.action,
        },
      }),
    );
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (view.kind === "list") {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveSelection(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveSelection(-1);
      } else if (e.key === "Home") {
        e.preventDefault();
        if (selectedIndex !== 0) {
          audio.nav();
          setSelectedIndex(0);
        }
      } else if (e.key === "End") {
        e.preventDefault();
        const last = threads.length - 1;
        if (selectedIndex !== last) {
          audio.nav();
          setSelectedIndex(last);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        openSelected();
      }
    } else {
      if (e.key === "Escape" || e.key === "Backspace") {
        e.preventDefault();
        back();
      }
    }
  };

  const unreadCount = threads.filter((t) => !readIds.has(t.id)).length;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="h-full w-full flex flex-col bg-bg text-xs outline-none"
    >
      {view.kind === "list" ? (
        <>
          <div className="px-3 py-2 border-b border-primary/30 bg-bg-elevated text-[10px] uppercase tracking-widest text-fg-subtle flex items-center justify-between">
            <span>
              <span className="text-primary">//</span> mail · inbox
            </span>
            <span>
              {unreadCount > 0 && (
                <span className="text-primary mr-3">
                  {unreadCount} unread
                </span>
              )}
              ↑↓ navigate · enter open
            </span>
          </div>
          <ul
            ref={listRef}
            role="listbox"
            aria-label="Mail threads"
            className="flex-1 overflow-y-auto"
          >
            {threads.map((thread, i) => {
              const selected = i === selectedIndex;
              const unread = !readIds.has(thread.id);
              const lastMessage = thread.messages[thread.messages.length - 1];
              return (
                <li
                  key={thread.id}
                  data-thread-index={i}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => {
                    if (i !== selectedIndex) {
                      audio.nav();
                      setSelectedIndex(i);
                    }
                  }}
                  onClick={() => {
                    setSelectedIndex(i);
                    audio.select();
                    setReadIds((prev) => {
                      if (prev.has(thread.id)) return prev;
                      const next = new Set(prev);
                      next.add(thread.id);
                      return next;
                    });
                    setView({ kind: "detail", threadId: thread.id });
                  }}
                  className={`px-3 py-2 border-b border-primary/10 flex items-center gap-3 cursor-pointer transition-colors ${
                    selected
                      ? "bg-primary text-bg"
                      : unread
                      ? "text-fg hover:text-primary"
                      : "text-fg-muted hover:text-primary"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={
                      selected
                        ? "text-bg"
                        : unread
                        ? "text-primary"
                        : "text-fg-subtle"
                    }
                  >
                    {unread ? "●" : "○"}
                  </span>
                  <span
                    className={`font-mono tabular-nums tracking-tight ${
                      selected ? "text-bg" : "text-fg-subtle"
                    }`}
                  >
                    {lastMessage.date}
                  </span>
                  <span
                    className={`uppercase tracking-wider w-32 truncate ${
                      selected
                        ? "text-bg"
                        : unread
                        ? "text-primary"
                        : "text-fg-muted"
                    }`}
                  >
                    {thread.participants[0]}
                  </span>
                  <span className="flex-1 truncate">
                    {thread.subject}
                    {thread.messages.length > 1 && (
                      <span
                        className={`ml-2 text-[10px] ${
                          selected ? "text-bg" : "text-fg-subtle"
                        }`}
                      >
                        ({thread.messages.length})
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      ) : activeThread ? (
        <div
          key={activeThread.id}
          className="mail-detail-enter flex flex-col flex-1 min-h-0"
        >
          <div className="px-3 py-2 border-b border-primary/30 bg-bg-elevated text-[10px] uppercase tracking-widest flex items-center gap-3">
            <button
              type="button"
              onClick={back}
              className="px-2 py-0.5 border border-primary/50 text-primary hover:bg-primary/15 hover:border-primary transition flex items-center gap-1"
              aria-label="Back to mail list"
            >
              <span aria-hidden="true">◂</span> back
            </button>
            <span className="text-fg-subtle">esc / backspace</span>
            <span className="ml-auto text-primary">// {activeThread.id}</span>
          </div>
          <div className="px-4 py-3 border-b border-primary/20 bg-bg-elevated">
            <h2 className="text-base uppercase tracking-widest text-primary">
              {activeThread.subject}
            </h2>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-fg-subtle">
              {activeThread.participants.join(" · ")} ·{" "}
              {activeThread.messages.length} message
              {activeThread.messages.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {(() => {
              const allMessages = [
                ...activeThread.messages,
                ...(appended[activeThread.id] ?? []),
              ];
              const replyOptions = activeThread.replyOptions ?? [];
              const showReply =
                replyOptions.length > 0 && !replied.has(activeThread.id);
              return (
                <>
                  {allMessages.map((m, idx) => (
                    <article
                      key={m.id}
                      className={`px-4 py-3 border-b border-primary/10 last:border-b-0 flex gap-3 ${
                        m.direction === "outgoing" ? "bg-primary/5" : ""
                      } ${freshIds.has(m.id) ? "mail-reply-enter" : ""}`}
                    >
                      <Avatar name={m.from} outgoing={m.direction === "outgoing"} />
                      <div className="flex-1 min-w-0">
                        <header className="flex items-baseline justify-between text-[10px] uppercase tracking-widest mb-2">
                          <span
                            className={
                              m.direction === "outgoing"
                                ? "text-fg-muted"
                                : "text-primary"
                            }
                          >
                            {m.from}
                          </span>
                          <span className="text-fg-subtle font-mono tabular-nums">
                            {m.date}
                          </span>
                        </header>
                        <pre className="whitespace-pre-wrap break-words text-fg leading-relaxed font-mono text-xs">
                          {m.body}
                        </pre>
                        {idx === allMessages.length - 1 && !showReply && (
                          <p className="mt-3 text-[10px] uppercase tracking-widest text-fg-subtle">
                            // end of thread
                          </p>
                        )}
                      </div>
                    </article>
                  ))}

                  {showReply && (
                    <section className="px-4 py-3 border-t border-primary/30 bg-bg-elevated">
                      <p className="text-[10px] uppercase tracking-widest text-fg-subtle mb-2">
                        // reply
                      </p>
                      <ul className="flex flex-col gap-1.5">
                        {replyOptions.map((opt) => (
                          <li key={opt.id}>
                            <button
                              type="button"
                              onClick={() => pickReply(activeThread, opt)}
                              className="w-full text-left px-3 py-2 border border-primary/40 text-fg-muted hover:text-primary hover:border-primary hover:bg-primary/10 transition uppercase tracking-wider text-xs"
                            >
                              {opt.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
