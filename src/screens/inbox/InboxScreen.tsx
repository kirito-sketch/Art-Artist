import { useFeatures } from '../../ui/features';
import { motion } from 'framer-motion';
import { scriptLang } from '../../ui/compose';
import { ArrowUp, BellOff, ChevronLeft, ChevronRight, MoreHorizontal, Search, SquarePen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Conversation, Party } from '../../data/types';
import { useStore } from '../../state/store';
import { findOpportunity, org, party, person } from '../../state/selectors';
import * as seed from '../../data/seed';
import { searchablePeople } from '../../domain/discovery';
import { usePref } from '../../state/settingsPrefs';
import { Sheet } from '../../ui/Sheet';
import { stagger } from '../../ui/motion';
import { Avatar, Button, Chip, EmptyState, IconButton, PressCard, Photo, Pressable, Row, Verified } from '../../ui/primitives';

type Filter = 'all' | 'productions' | 'collabs';

/** Project image with the other party's avatar tucked into the corner, so the row reads "who, about what". */
function ThreadThumb({ c }: { c: Conversation }) {
  const p = party(c.withId)!;
  return (
    <span className="thumb">
      {c.media ? <Photo surface="search-thumbnail" media={c.media} className="thumb-image" showPlay={false} /> : <span className="thumb-image thumb-image--empty" />}
      <span className="thumb-avatar">
        <Avatar party={p} size={28} />
      </span>
    </span>
  );
}

export function InboxScreen() {
  const districtFeature = useFeatures().home === 'district';
  const { conversations, interestsReceived: allInterest, push, openSheet, userCollabs, sendMessage, showToast, acting, memberships } = useStore();
  const district = districtFeature && acting !== 'self';
  const [filter, setFilter] = useState<Filter>('all');
  // Personal and house conversations never mix: the Inbox opens on the identity in use, like Notifications.
  // "All" shows everything, each house thread labelled with the house it belongs to.
  const [who, setWho] = useState<string>(acting);
  useEffect(() => setWho(acting), [acting]);
  const [composing, setComposing] = useState(false);
  const ownerOf = (c: Conversation) => c.asId ?? 'self';
  const identities = memberships.length ? ['self', ...memberships, 'all'] : [];
  const unreadFor = (id: string) => conversations.filter((c) => c.unread && (id === 'all' || ownerOf(c) === id)).length;
  const whoLabel = (id: string) => (id === 'all' ? 'All' : id === 'self' ? 'You' : org(id).name);
  // Two or more houses: their first word fits the row ("Konark", "Tidewater"); the full name stays the accessible name.
  const shortLabel = (id: string) => (memberships.length > 1 && id !== 'all' && id !== 'self' ? org(id).name.split(' ')[0] : whoLabel(id));
  const [done, setDone] = useState<string[]>([]);
  // Only Interest nobody has reviewed yet. Reviewed records stay in the review sheet.
  const interestsReceived = allInterest.filter((i) => !i.withdrawn && !i.review);

  const mine = identities.length && who !== 'all' ? conversations.filter((c) => ownerOf(c) === who) : conversations;
  const list = mine.filter((c) => (filter === 'productions' ? c.orgOwned : filter === 'collabs' ? c.context.kind === 'collab' : true));
  const interestFor = interestsReceived[0] ? findOpportunity(interestsReceived[0].opportunityId, userCollabs) : null;

  return (
    <div className={`screen${district ? ' dhouse-page' : ''}`} data-scroll="inbox">
      <div className="title-block title-block--top inbox-title">
        <h1 className="large-title">Inbox</h1>
        <IconButton label={acting === 'self' ? 'New message' : `New message as ${org(acting).name}`} onClick={() => setComposing(true)}>
          <SquarePen size={22} />
        </IconButton>
      </div>
      {identities.length > 0 && (
        <div className="inbox-who" role="group" aria-label="Whose conversations">
          {identities.map((id) => (
            <button key={id} type="button" className={`inbox-who-btn${who === id ? ' is-on' : ''}`} aria-pressed={who === id} aria-label={whoLabel(id)} onClick={() => setWho(id)}>
              {shortLabel(id)}
              {unreadFor(id) > 0 && id !== who && <span className="dot dot--inline" aria-label={`${unreadFor(id)} unread`} />}
            </button>
          ))}
        </div>
      )}
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
        {filter !== 'productions' && (who === acting || who === 'all' || !identities.length) && interestsReceived.length > 0 && interestFor && (
          <PressCard className="thread" onPress={() => openSheet({ name: 'reviewInterest' })} scale={0.99}>
            <span className="thumb">
              <Photo surface="search-thumbnail" media={interestFor.media} className="thumb-image" showPlay={false} />
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
                    {who === 'all' && ownerOf(c) !== 'self' && <span className="thread-for">For {org(ownerOf(c)).name} · </span>}
                    {c.context.label} · {c.context.detail.split(' · ').pop()}
                    <MutedMark id={c.id} />
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
      {!list.length && <EmptyState title="No conversations" body={who !== 'self' && who !== 'all' && identities.length ? `Messages to ${org(who).name} appear here.` : 'Message someone from their profile, or start one here.'} />}
      <NewMessage open={composing} onClose={() => setComposing(false)} />
    </div>
  );
}

function MutedMark({ id }: { id: string }) {
  const [muted] = usePref<boolean>(`mute-${id}`, false);
  return muted ? (
    <span className="thread-muted">
      {' '}
      · <BellOff size={12} aria-hidden /> Muted
    </span>
  ) : null;
}

/** Start a conversation from the Inbox: anyone on Art and Artist you can reach, people first, then houses. */
function NewMessage({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { viewer, acting, startConversation, push, cannotReach, memberships, blocked } = useStore();
  const [q, setQ] = useState('');
  const own = new Set([viewer.id, acting, ...memberships]);
  // The same people search shows (never minors or blocked people), plus houses.
  const all: Party[] = [...searchablePeople(viewer.id, blocked), ...seed.orgs].filter((p) => !own.has(p.id) && !cannotReach(p.id));
  const term = q.trim().toLowerCase();
  const found = all
    .filter((p) => !term || p.name.toLowerCase().includes(term) || (p.kind === 'person' && (p.role ?? '').toLowerCase().includes(term)))
    .sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'person' ? -1 : 1))
    .slice(0, 30);
  const start = (id: string) => {
    const cid = startConversation(id, { kind: 'project', label: 'Direct', detail: 'Direct message', refId: 'direct' });
    if (!cid) return;
    onClose();
    setQ('');
    push({ name: 'conversation', id: cid });
  };
  return (
    <Sheet open={open} onClose={onClose} title={acting === 'self' ? 'New message' : `New message as ${org(acting).name}`} size="tall">
      <label className="new-msg-search">
        <Search size={18} aria-hidden />
        <input id="new-msg-q" className="field" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people and houses" aria-label="Search people and houses" />
      </label>
      <div className="group new-msg-list">
        {found.map((p) => (
          <Row key={p.id} icon={<Avatar party={p} size={36} />} label={<span className="settings-label"><span>{p.name}</span><span className="meta">{p.kind === 'org' ? 'Production house' : p.role}</span></span>} onPress={() => start(p.id)} />
        ))}
        {!found.length && <p className="meta new-msg-empty">No one matches "{q}".</p>}
      </div>
    </Sheet>
  );
}

export function ConversationScreen({ id }: { id: string }) {
  const districtFeature = useFeatures().home === 'district';
  const { conversations, pop, push, sendMessage, markConversationRead, scenario, userCollabs, memberships, viewer, retryMessage, cannotReach, blocked, unblock, acting, setActing, openSheet } = useStore();
  const [menu, setMenu] = useState(false);
  const [muted, setMuted] = usePref<boolean>(`mute-${id}`, false);
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
        <IconButton label="Conversation options" onClick={() => setMenu(true)}>
          <MoreHorizontal size={22} />
        </IconButton>
      </header>

      <Sheet open={menu} onClose={() => setMenu(false)} label="Conversation options">
        <div className="group">
          <Row label={p.kind === 'org' ? 'View house page' : 'View profile'} onPress={() => (setMenu(false), push(p.kind === 'person' ? { name: 'profile', id: p.id } : { name: 'org', id: p.id }))} />
          <Row label={muted ? 'Unmute notifications' : 'Mute notifications'} chevron={false} onPress={() => (setMuted(!muted), setMenu(false))} />
          <Row label={`Report ${p.name}`} onPress={() => (setMenu(false), openSheet({ name: 'report', subject: p.name, partyId: p.id }))} />
          {blocked.includes(c.withId) ? (
            <Row label={`Unblock ${p.name}`} chevron={false} onPress={() => (setMenu(false), unblock(c.withId))} />
          ) : (
            <Row label={<span className="danger-text">Block {p.name}</span>} chevron={false} onPress={() => (setMenu(false), openSheet({ name: 'block', id: c.withId }))} />
          )}
        </div>
        <p className="meta settings-note">{p.kind === 'org' ? 'Reporting and blocking are personal: they come from you, not from a house you act for.' : 'Reporting and blocking are personal, even while you act for a house.'}</p>
      </Sheet>

      <div className="convo-scroll" ref={scrollRef}>
        <Pressable className="convo-context" onClick={() => ref && push({ name: 'opportunity', id: ref.id })} scale={0.99}>
          {c.media && <Photo surface="search-thumbnail" media={c.media} className="convo-context-thumb" showPlay={false} />}
          <span className="convo-context-text">
            <span className="item-title">{c.context.detail.split(' · ')[0]}</span>
            <span className="meta">
              {c.context.label} · {c.context.detail.split(' · ').slice(1).join(' · ') || p.name}
            </span>
          </span>
          {ref && <ChevronRight size={18} className="row-chevron" />}
        </Pressable>

        <div className="bubbles">
          {c.messages.map((m, i) => {
            const mine = m.from === 'me';
            const prev = c.messages[i - 1];
            // Their messages carry a chat head on the first message of each run (a new run starts when the
            // sender changes); later messages in the run keep its space so the bubbles stay aligned. Ours never do.
            const head = !mine && (!prev || prev.from !== 'them' || prev.senderName !== m.senderName);
            return (
              <motion.div
                key={m.id}
                className={`bubble-row ${mine ? 'is-me' : 'is-them'}`}
                initial={i === c.messages.length - 1 ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              >
                {!mine && <span className="bubble-head" aria-hidden="true">{head && <Avatar party={p} size={28} />}</span>}
                <div className="bubble-body">
                  {m.senderName && !mine && head && <p className="meta bubble-sender">{m.senderName.split(' · ')[0]}</p>}
                  {m.card ? (
                    <PressCard className="share-card" onPress={() => m.card!.route && push(m.card!.route as never)} scale={0.98} aria-label={`${m.card.sub ? m.card.sub + ': ' : ''}${m.card.title}`}>
                      {m.card.image && <Photo media={m.card.image} surface="search-thumbnail" showPlay={false} className="share-card-img" />}
                      <span className="share-card-text"><b>{m.card.title}</b>{m.card.sub && <i>{m.card.sub}</i>}</span>
                    </PressCard>
                  ) : <div className={`bubble ${m.status === 'failed' ? 'bubble--failed' : ''}`} lang={scriptLang(m.text)}>{m.text}</div>}
                  {m.status === 'sending' && <p className="meta bubble-status">Sending…</p>}
                  {m.status === 'failed' && (
                    <button className="bubble-status bubble-retry" onClick={() => retryMessage(c.id, m.id)}>
                      Not delivered · Tap to retry
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
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
      ) : (c.asId ?? 'self') !== acting ? (
        // Opening a conversation never changes who you're acting as. To reply, switch to the identity it belongs to.
        <div className="convo-closed convo-switch">
          <p className="meta">{c.asId && c.asId !== 'self' ? `This conversation belongs to ${org(c.asId).name}.` : 'This is your personal conversation.'} Switch to reply.</p>
          <Button size="s" variant="outline" onClick={() => setActing(c.asId ?? 'self', true, true)}>
            {c.asId && c.asId !== 'self' ? `Switch to ${org(c.asId).name}` : 'Switch to you'}
          </Button>
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
