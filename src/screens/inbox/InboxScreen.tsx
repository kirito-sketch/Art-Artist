import { motion } from 'framer-motion';
import { BadgeCheck, Building2, ChevronLeft, ChevronRight, Clapperboard, FolderOpen, Handshake, Info, Megaphone, MessagesSquare, SendHorizonal, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ContextKind, Conversation } from '../../data/types';
import { useStore } from '../../state/store';
import { findOpportunity, firstName, party, person } from '../../state/selectors';
import { stagger } from '../../ui/motion';
import { Avatar, AvatarStack, EmptyState, IconButton, PressCard, Segmented, Verified } from '../../ui/primitives';

export const CONTEXT_ICON: Record<ContextKind, JSX.Element> = {
  crew: <Clapperboard size={12} />,
  casting: <Megaphone size={12} />,
  collab: <Handshake size={12} />,
  project: <FolderOpen size={12} />,
  credit: <BadgeCheck size={12} />,
};

export function ContextTag({ c }: { c: Conversation['context'] }) {
  return (
    <span className={`ctx ctx--${c.kind}`}>
      {CONTEXT_ICON[c.kind]}
      <span className="ctx-label">{c.label}</span>
      <span className="ctx-detail">{c.detail}</span>
    </span>
  );
}

type Filter = 'all' | 'productions' | 'collabs';

export function InboxScreen() {
  const { conversations, interestsReceived, push, openSheet, userCollabs } = useStore();
  const [filter, setFilter] = useState<Filter>('all');

  const list = conversations.filter((c) => {
    if (filter === 'productions') return c.orgOwned;
    if (filter === 'collabs') return c.context.kind === 'collab';
    return true;
  });
  const interestPeople = interestsReceived.map((i) => person(i.personId));
  const interestFor = interestsReceived[0] ? findOpportunity(interestsReceived[0].opportunityId, userCollabs) : null;

  return (
    <div className="screen-scroll" data-scroll="inbox">
      <div className="discover-head">
        <h1 className="screen-title">Inbox</h1>
        <p className="screen-sub">Every conversation shows what it's about</p>
      </div>

      {interestsReceived.length > 0 && (
        <motion.div className="inbox-interest-wrap" {...stagger(0)}>
          <PressCard className="inbox-interest" onPress={() => openSheet({ name: 'reviewInterest' })}>
            <span className="inbox-interest-icon">
              <Sparkles size={16} />
            </span>
            <div className="inbox-interest-text">
              <p className="inbox-interest-title">
                {interestsReceived.length} {interestsReceived.length === 1 ? 'person is' : 'people are'} interested
              </p>
              <p className="inbox-interest-sub">
                {interestFor ? `${interestFor.role} · ${interestFor.project}` : 'Your collaborations'} · you start the conversation
              </p>
            </div>
            <AvatarStack parties={interestPeople} size={26} />
            <ChevronRight size={16} className="muted" />
          </PressCard>
        </motion.div>
      )}

      <div className="inbox-filter">
        <Segmented
          id="inbox"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: conversations.filter((c) => c.unread).length },
            { value: 'productions', label: 'Productions' },
            { value: 'collabs', label: 'Collaborations' },
          ]}
        />
      </div>

      <div className="thread-list">
        {list.length === 0 && (
          <EmptyState
            icon={<MessagesSquare />}
            title={filter === 'productions' ? 'No messages from productions yet' : 'No conversations yet'}
            body={filter === 'productions' ? 'When a production contacts you about a role you responded to, it appears here.' : 'Conversations start from roles, collaborations and projects.'}
          />
        )}
        {list.map((c, i) => {
          const p = party(c.withId)!;
          const last = c.messages[c.messages.length - 1];
          return (
            <motion.div key={c.id} {...stagger(i, 0.03)} layout>
              <PressCard className={`thread ${c.unread ? 'is-unread' : ''}`} onPress={() => push({ name: 'conversation', id: c.id })} scale={0.985}>
                <Avatar party={p} size={48} />
                <div className="thread-text">
                  <p className="thread-top">
                    <span className="thread-name">
                      {p.name}
                      {p.kind === 'org' && p.verified && <Verified size={13} />}
                    </span>
                    <span className="thread-time">{c.updated}</span>
                  </p>
                  <ContextTag c={c.context} />
                  <p className="thread-last">
                    {last ? (
                      <>
                        {last.from === 'me' ? 'You: ' : ''}
                        {last.text}
                      </>
                    ) : (
                      <span className="muted">New conversation</span>
                    )}
                  </p>
                </div>
                {c.unread > 0 && <span className="unread-dot" />}
              </PressCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function ConversationScreen({ id }: { id: string }) {
  const { conversations, pop, push, sendMessage, markConversationRead, scenario, userCollabs } = useStore();
  const c = conversations.find((x) => x.id === id);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markConversationRead(id);
  }, [id, markConversationRead]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [c?.messages.length]);

  if (!c) return <EmptyState title="Conversation unavailable" body="It may have been removed." />;
  const p = party(c.withId)!;
  const ref = c.context.refId ? findOpportunity(c.context.refId, userCollabs) : null;
  const personBlocked = p.kind === 'person' && p.visibility === 'removed';

  const send = () => {
    if (!text.trim()) return;
    sendMessage(c.id, text.trim());
    setText('');
  };

  return (
    <div className="convo">
      <header className="convo-bar">
        <IconButton label="Back" className="icon-btn--ghost" onClick={pop}>
          <ChevronLeft size={24} />
        </IconButton>
        <button className="convo-who" onClick={() => p.kind === 'person' && push({ name: 'profile', id: p.id })}>
          <Avatar party={p} size={34} />
          <span>
            <span className="convo-name">
              {p.name} {p.kind === 'org' && p.verified && <Verified size={12} />}
            </span>
            <span className="convo-sub">{p.kind === 'org' ? `Verified production house · ${p.city}` : `${p.role} · ${p.city}`}</span>
          </span>
        </button>
      </header>

      <div className="convo-scroll">
        {/* Pinned context: why this conversation exists. */}
        <PressCard className={`convo-context convo-context--${c.context.kind}`} onPress={() => ref && push({ name: 'opportunity', id: ref.id })} scale={0.985}>
          <span className="convo-context-icon">{CONTEXT_ICON[c.context.kind]}</span>
          <div>
            <p className="convo-context-label">{c.context.label}</p>
            <p className="convo-context-detail">{c.context.detail}</p>
          </div>
          {ref && <ChevronRight size={16} className="muted" />}
        </PressCard>
        {c.orgOwned && (
          <p className="convo-note">
            <Building2 size={13} /> You're talking with the {p.name} team. Several people from the production may reply here.
          </p>
        )}

        <div className="bubbles">
          {c.messages.length === 0 && (
            <p className="convo-note convo-note--center">
              <Info size={13} /> Say hello. {p.kind === 'person' ? firstName(p) : 'They'} will see which {c.context.label.toLowerCase()} this is about.
            </p>
          )}
          {c.messages.map((m, i) => (
            <motion.div
              key={m.id}
              className={`bubble-row ${m.from === 'me' ? 'is-me' : ''}`}
              initial={i >= c.messages.length - 1 ? { opacity: 0, y: 10, scale: 0.98 } : false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            >
              {m.senderName && m.from === 'them' && <p className="bubble-sender">{m.senderName}</p>}
              <div className="bubble">{m.text}</div>
              <p className="bubble-time">{m.time}</p>
            </motion.div>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      <div className="convo-input">
        {personBlocked ? (
          <p className="convo-note">This profile is no longer available. You can't reply.</p>
        ) : (
          <>
            <input
              className="convo-field"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={scenario.offline ? 'Messages send when you reconnect' : 'Message'}
              aria-label="Message"
            />
            <motion.button className="convo-send" disabled={!text.trim()} onClick={send} whileTap={{ scale: 0.85 }} aria-label="Send" animate={{ scale: text.trim() ? 1 : 0.9, opacity: text.trim() ? 1 : 0.4 }}>
              <SendHorizonal size={18} />
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}
