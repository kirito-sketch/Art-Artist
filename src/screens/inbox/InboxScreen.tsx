import { motion } from 'framer-motion';
import { ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Conversation } from '../../data/types';
import { useStore } from '../../state/store';
import { findOpportunity, party, person } from '../../state/selectors';
import { stagger } from '../../ui/motion';
import { Avatar, Button, Chip, EmptyState, IconButton, PressCard, Photo, Pressable, Verified } from '../../ui/primitives';

type Filter = 'all' | 'productions' | 'collabs';

/** Project image with the other party's avatar tucked into the corner, so the row reads "who, about what". */
function ThreadThumb({ c }: { c: Conversation }) {
  const p = party(c.withId)!;
  return (
    <span className="thumb">
      {c.media ? <Photo media={c.media} className="thumb-image" showPlay={false} /> : <span className="thumb-image thumb-image--empty" />}
      <span className="thumb-avatar">
        <Avatar party={p} size={28} />
      </span>
    </span>
  );
}

export function InboxScreen() {
  const { conversations, interestsReceived, push, openSheet, userCollabs, sendMessage, showToast } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [done, setDone] = useState<string[]>([]);

  const list = conversations.filter((c) => (filter === 'productions' ? c.orgOwned : filter === 'collabs' ? c.context.kind === 'collab' : true));
  const interestFor = interestsReceived[0] ? findOpportunity(interestsReceived[0].opportunityId, userCollabs) : null;

  return (
    <div className="screen" data-scroll="inbox">
      <div className="title-block title-block--top">
        <h1 className="large-title">Inbox</h1>
      </div>
      <div className="chips chips--pad">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </Chip>
        <Chip active={filter === 'productions'} onClick={() => setFilter('productions')}>
          Productions
        </Chip>
        <Chip active={filter === 'collabs'} onClick={() => setFilter('collabs')}>
          Collaborations
        </Chip>
      </div>

      <div className="list">
        {filter !== 'productions' && interestsReceived.length > 0 && interestFor && (
          <PressCard className="thread" onPress={() => openSheet({ name: 'reviewInterest' })} scale={0.99}>
            <span className="thumb">
              <Photo media={interestFor.media} className="thumb-image" showPlay={false} />
              <span className="thumb-avatar">
                <Avatar party={person(interestsReceived[0].personId)} size={28} />
              </span>
            </span>
            <div className="thread-text">
              <p className="thread-top">
                <span className="item-title">{interestsReceived.length} people interested</span>
              </p>
              <p className="meta">
                {interestFor.role} · {interestFor.project}
              </p>
              <Button size="s" variant="outline" className="thread-action" onClick={(e) => (e.stopPropagation(), openSheet({ name: 'reviewInterest' }))}>
                Review
              </Button>
            </div>
          </PressCard>
        )}

        {list.map((c, i) => {
          const p = party(c.withId)!;
          const last = c.messages[c.messages.length - 1];
          const showAction = c.action && !done.includes(c.id);
          return (
            <motion.div key={c.id} {...stagger(i, 0.03)}>
              <PressCard className={`thread ${c.unread ? 'is-unread' : ''}`} onPress={() => push({ name: 'conversation', id: c.id })} scale={0.99}>
                <ThreadThumb c={c} />
                <div className="thread-text">
                  <p className="thread-top">
                    <span className="item-title">
                      {p.name}
                      {p.kind === 'org' && p.verified && <Verified size={14} />}
                    </span>
                    <span className="meta">{c.updated}</span>
                  </p>
                  <p className="thread-last">
                    {last?.from === 'me' ? 'You: ' : ''}
                    {last?.text ?? 'New conversation'}
                  </p>
                  <p className="meta thread-context">
                    {c.unread > 0 && <span className="dot dot--inline" />}
                    {c.context.label} · {c.context.detail.split(' · ').pop()}
                  </p>
                  {showAction && (
                    <Button
                      size="s"
                      variant="outline"
                      className="thread-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        sendMessage(c.id, c.action!.reply);
                        setDone((d) => [...d, c.id]);
                        showToast({ text: 'Sent' });
                      }}
                    >
                      {c.action!.label}
                    </Button>
                  )}
                </div>
              </PressCard>
            </motion.div>
          );
        })}
      </div>
      {!list.length && <EmptyState title="No conversations" />}
    </div>
  );
}

export function ConversationScreen({ id }: { id: string }) {
  const { conversations, pop, push, sendMessage, markConversationRead, scenario, userCollabs } = useStore();
  const c = conversations.find((x) => x.id === id);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => markConversationRead(id), [id, markConversationRead]);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), [c?.messages.length]);

  if (!c) return <EmptyState title="Conversation unavailable" />;
  const p = party(c.withId)!;
  const ref = c.context.refId ? findOpportunity(c.context.refId, userCollabs) : null;
  const send = () => {
    if (!text.trim()) return;
    sendMessage(c.id, text.trim());
    setText('');
  };

  return (
    <div className="convo">
      <header className="convo-bar">
        <IconButton label="Back" onClick={pop}>
          <ChevronLeft size={26} />
        </IconButton>
        <button className="convo-who" onClick={() => p.kind === 'person' && push({ name: 'profile', id: p.id })}>
          <span className="item-title">
            {p.name} {p.kind === 'org' && p.verified && <Verified size={14} />}
          </span>
          <span className="meta">{p.kind === 'org' ? 'Production team' : p.role}</span>
        </button>
        <Avatar party={p} size={36} />
      </header>

      <div className="convo-scroll">
        <Pressable className="convo-context" onClick={() => ref && push({ name: 'opportunity', id: ref.id })} scale={0.99}>
          {c.media && <Photo media={c.media} className="convo-context-thumb" showPlay={false} />}
          <span className="convo-context-text">
            <span className="item-title">{c.context.detail.split(' · ')[0]}</span>
            <span className="meta">
              {c.context.label} · {c.context.detail.split(' · ').slice(1).join(' · ') || p.name}
            </span>
          </span>
          {ref && <ChevronRight size={18} className="row-chevron" />}
        </Pressable>

        <div className="bubbles">
          {c.messages.map((m, i) => (
            <motion.div
              key={m.id}
              className={`bubble-row ${m.from === 'me' ? 'is-me' : ''}`}
              initial={i === c.messages.length - 1 ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            >
              {m.senderName && m.from === 'them' && <p className="meta bubble-sender">{m.senderName.split(' · ')[0]}</p>}
              <div className="bubble">{m.text}</div>
            </motion.div>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      <div className="convo-input">
        <input id="convo-field" className="convo-field" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={scenario.offline ? 'Sends when you reconnect' : 'Message'} aria-label="Message" />
        <motion.button className="convo-send" disabled={!text.trim()} onClick={send} whileTap={{ scale: 0.85 }} aria-label="Send" animate={{ opacity: text.trim() ? 1 : 0.3 }}>
          <ArrowUp size={20} strokeWidth={2.6} />
        </motion.button>
      </div>
    </div>
  );
}
