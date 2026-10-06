import { useFeatures } from '../../ui/features';
import { motion } from 'framer-motion';
import { scriptLang } from '../../ui/compose';
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
  const districtFeature = useFeatures().home === 'district';
  const { conversations, interestsReceived: allInterest, push, openSheet, userCollabs, sendMessage, showToast, acting } = useStore();
  const district = districtFeature && acting !== 'self';
  const [filter, setFilter] = useState<Filter>('all');
  const [done, setDone] = useState<string[]>([]);
  // Only Interest nobody has reviewed yet. Reviewed records stay in the review sheet.
  const interestsReceived = allInterest.filter((i) => !i.withdrawn && !i.review);

  const list = conversations.filter((c) => (filter === 'productions' ? c.orgOwned : filter === 'collabs' ? c.context.kind === 'collab' : true));
  const interestFor = interestsReceived[0] ? findOpportunity(interestsReceived[0].opportunityId, userCollabs) : null;

  return (
    <div className={`screen${district ? ' dhouse-page' : ''}`} data-scroll="inbox">
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
                <span className="item-title">{interestsReceived.length} {interestsReceived.length === 1 ? 'person' : 'people'} interested</span>
              </p>
              <p className="meta">
                {interestFor.role} · {interestFor.project}
              </p>
              <Button size="s" variant="outline" className="thread-action" aria-label={`Review interest in ${interestFor.role}`} onClick={(e) => (e.stopPropagation(), openSheet({ name: 'reviewInterest' }))}>
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
                    {c.unread > 0 && (
                      <>
                        <span className="dot dot--inline" aria-hidden />
                        <span className="sr-only">Unread</span>
                      </>
                    )}
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
  const districtFeature = useFeatures().home === 'district';
  const { conversations, pop, push, sendMessage, markConversationRead, scenario, userCollabs, memberships, viewer, retryMessage, cannotReach, blocked, unblock, acting } = useStore();
  const c = conversations.find((x) => x.id === id);
  const district = districtFeature && acting !== 'self';
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => markConversationRead(id), [id, markConversationRead]);
  // Scroll only this conversation's own list. scrollIntoView also scrolled every ancestor (the phone,
  // the /test frame, the page), which can leave a blank view after sending on mobile browsers.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [c?.messages.length]);

  if (!c) return <EmptyState title="Conversation unavailable" />;
  const p = party(c.withId)!;
  const ref = c.context.refId ? findOpportunity(c.context.refId, userCollabs) : null;
  const send = () => {
    if (!text.trim()) return;
    sendMessage(c.id, text.trim());
    setText('');
  };

  return (
    <div className={`convo${district ? ' dhouse-conversation' : ''}`}>
      <h1 className="sr-only">Conversation with {p.name}</h1>
      <header className="convo-bar">
        <IconButton label="Back" onClick={pop}>
          <ChevronLeft size={26} />
        </IconButton>
        <button className="convo-who" aria-label={`Open profile for ${p.name}`} onClick={() => push(p.kind === 'person' ? { name: 'profile', id: p.id } : { name: 'org', id: p.id })}>
          <span className="item-title">
            {p.name} {p.kind === 'org' && p.verified && <Verified size={14} />}
          </span>
          <span className="meta">{p.kind === 'org' ? 'Production team' : p.role}</span>
        </button>
        <Avatar party={p} size={36} />
      </header>

      <div className="convo-scroll" ref={scrollRef}>
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
              <div className={`bubble ${m.status === 'failed' ? 'bubble--failed' : ''}`} lang={scriptLang(m.text)}>{m.text}</div>
              {m.status === 'sending' && <p className="meta bubble-status">Sending…</p>}
              {m.status === 'failed' && (
                <button className="bubble-status bubble-retry" onClick={() => retryMessage(c.id, m.id)}>
                  Not delivered · Tap to retry
                </button>
              )}
            </motion.div>
          ))}
          {c.messages.length === 0 && c.context.refId === 'direct' && (
            <p className="convo-hint meta">
              Messages go straight to {p.kind === 'org' ? p.name : p.name.split(' ')[0]}. About a role or collaboration? Show interest on it instead, and the person who posted it will decide whether to message you.
            </p>
          )}
        </div>
      </div>

      {/* A block closes the conversation for both sides and keeps its history. Only the person who blocked is told why. */}
      {cannotReach(c.withId) ? (
        <div className="convo-closed">
          {blocked.includes(c.withId) ? (
            <>
              <p className="meta">You blocked {p.name}. Messages stay here; neither of you can send more.</p>
              <button className="link link--small" onClick={() => unblock(c.withId)}>
                Unblock
              </button>
            </>
          ) : (
            <p className="meta">You can't reply to this conversation.</p>
          )}
        </div>
      ) : (
      <>
      {memberships.length > 0 && c && (
        <p className="convo-as">
          <Avatar party={c.asId && c.asId !== 'self' ? party(c.asId)! : party(viewer.id)!} size={18} /> Replying as {c.asId && c.asId !== 'self' ? party(c.asId)!.name : 'yourself'}
        </p>
      )}
      <div className="convo-input">
        <input id="convo-field" className="convo-field" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={scenario.offline ? 'Sends when you reconnect' : 'Message'} aria-label={`Message ${p.name}`} />
        <motion.button className="convo-send" disabled={!text.trim()} onClick={send} whileTap={{ scale: 0.85 }} aria-label="Send message" animate={{ opacity: text.trim() ? 1 : 0.3 }}>
          <ArrowUp size={20} strokeWidth={2.6} />
        </motion.button>
      </div>
      </>
      )}
    </div>
  );
}
