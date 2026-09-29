import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Bell, Check, FileText, Film, Handshake, MessageCircle, PenLine, Sparkles, UserCheck, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import * as seed from '../../data/seed';
import { useStore, type Sheet as SheetRoute } from '../../state/store';
import { findOpportunity, firstName, org, party, person } from '../../state/selectors';
import { stagger } from '../../ui/motion';
import { Avatar, Button, EmptyState, Pressable, Toggle } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';

export function SheetHost() {
  const { sheet, closeSheet } = useStore();
  const is = <N extends SheetRoute['name']>(n: N) => sheet?.name === n;
  return (
    <>
      <Sheet open={is('create')} onClose={closeSheet} title="Create" subtitle="Share with the industry" label="Create">
        <CreateMenu />
      </Sheet>
      <Sheet open={is('notifications')} onClose={closeSheet} title="Notifications" subtitle="Only things addressed to you" size="tall">
        <Notifications />
      </Sheet>
      <Sheet open={is('availability')} onClose={closeSheet} title="Your availability" subtitle="Shown on your profile and used to match you">
        <AvailabilityForm />
      </Sheet>
      <Sheet open={is('respond')} onClose={closeSheet} title="Respond" size="tall">
        {sheet?.name === 'respond' && <RespondForm id={sheet.id} />}
      </Sheet>
      <Sheet open={is('showInterest')} onClose={closeSheet} title="Show interest">
        {sheet?.name === 'showInterest' && <InterestForm id={sheet.id} />}
      </Sheet>
      <Sheet open={is('reviewInterest')} onClose={closeSheet} title="Interested in your collaboration" subtitle="You decide who to message" size="tall">
        <ReviewInterest opportunityId={sheet?.name === 'reviewInterest' ? sheet.opportunityId : undefined} />
      </Sheet>
      <Sheet open={is('reportCredit')} onClose={closeSheet} title="Report a credit">
        {sheet?.name === 'reportCredit' && <ReportCredit title={sheet.title} />}
      </Sheet>
    </>
  );
}

/* ------------------------------------------------------------------ Create */

function CreateMenu() {
  const { push } = useStore();
  return (
    <div className="create-menu">
      <motion.div {...stagger(0)}>
        <Pressable className="create-option" onClick={() => push({ name: 'composePost' })}>
          <span className="create-option-icon create-option-icon--post">
            <PenLine size={20} />
          </span>
          <span className="create-option-text">
            <span className="create-option-title">Post</span>
            <span className="create-option-body">Text, photos or video. Add work to your portfolio as you post.</span>
          </span>
          <ArrowRight size={18} className="muted" />
        </Pressable>
      </motion.div>
      <motion.div {...stagger(1)} className="create-collab-group">
        <p className="create-group-label">
          <Handshake size={14} /> Collaboration
        </p>
        <div className="create-collab-row">
          <Pressable className="create-tile" onClick={() => push({ name: 'composeCollab', intent: 'looking' })}>
            <span className="create-tile-title">Looking for someone</span>
            <span className="create-tile-body">Find crew, cast or collaborators for your project</span>
          </Pressable>
          <Pressable className="create-tile create-tile--available" onClick={() => push({ name: 'composeCollab', intent: 'available' })}>
            <span className="create-tile-title">Available for work</span>
            <span className="create-tile-body">Tell your network you're free, and when</span>
          </Pressable>
        </div>
      </motion.div>
      <motion.p className="create-footnote" {...stagger(2)}>
        Casting calls and crew jobs are published by verified production houses.
      </motion.p>
    </div>
  );
}

/* ----------------------------------------------------------- Notifications */

function Notifications() {
  const { notifications, markNotificationsRead, push, openSheet } = useStore();
  if (!notifications.length) return <EmptyState icon={<Bell />} title="Nothing yet" body="Replies to your responses, interest in your collaborations and new credits will show here." />;
  const iconFor = { credit: <BadgeCheck size={13} />, message: <MessageCircle size={13} />, interest: <Sparkles size={13} />, follow: <UserPlus size={13} />, response: <FileText size={13} /> };
  return (
    <div className="notif-list">
      {notifications.some((n) => n.unread) && (
        <button className="link-btn notif-markall" onClick={markNotificationsRead}>
          Mark all as read
        </button>
      )}
      {notifications.map((n, i) => {
        const p = party(n.actorId)!;
        return (
          <motion.div key={n.id} {...stagger(i)}>
            <Pressable
              className={`notif ${n.unread ? 'is-unread' : ''}`}
              onClick={() => {
                if (n.route) push(n.route);
                else if (n.kind === 'interest') openSheet({ name: 'reviewInterest' });
              }}
              scale={0.98}
            >
              <span className="notif-avatar">
                <Avatar party={p} size={40} />
                <span className={`notif-kind notif-kind--${n.kind}`}>{iconFor[n.kind]}</span>
              </span>
              <span className="notif-text">
                {n.text}
                <span className="notif-time">{n.time}</span>
              </span>
              {n.unread && <span className="unread-dot" />}
            </Pressable>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------ Availability */

const FROM_OPTIONS = ['Now', '3 Oct', '15 Oct', '1 Nov'];

function AvailabilityForm() {
  const { availability, setAvailability, closeSheet, scenario, setScenario } = useStore();
  const [open, setOpen] = useState(availability.open || scenario.newUser);
  const [from, setFrom] = useState(availability.from);
  const [scope, setScope] = useState(availability.scope);
  return (
    <div className="form">
      <div className="form-row form-row--toggle">
        <div>
          <p className="form-label">Open to work</p>
          <p className="form-help">Productions and your network can see this.</p>
        </div>
        <Toggle on={open} onChange={setOpen} label="Open to work" />
      </div>
      <motion.div className="form-collapsible" animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }} initial={false}>
        <p className="form-label">Available from</p>
        <div className="chip-picker">
          {FROM_OPTIONS.map((f) => (
            <button key={f} className={`pick ${from === f ? 'is-on' : ''}`} onClick={() => setFrom(f)}>
              {f}
            </button>
          ))}
        </div>
        <label className="form-label" htmlFor="scope">
          Where
        </label>
        <input id="scope" className="input" value={scope} onChange={(e) => setScope(e.target.value)} placeholder="City, and whether you travel" />
      </motion.div>
      <Button
        block
        size="l"
        onClick={() => {
          setAvailability({ open, from, scope });
          if (scenario.newUser) setScenario({ newUser: false });
          closeSheet();
        }}
      >
        Save
      </Button>
    </div>
  );
}

/* ----------------------------------------------------------------- Respond */

function RespondForm({ id }: { id: string }) {
  const { respond, userCollabs, viewer, responses } = useStore();
  const o = findOpportunity(id, userCollabs)!;
  const house = org(o.orgId!);
  const reel = seed.portfolio[viewer.id][0];
  const [answers, setAnswers] = useState<string[]>(() => (o.questions ?? []).map(() => ''));
  const [attach, setAttach] = useState({ reel: true, credits: true });
  const [sending, setSending] = useState(false);
  const complete = answers.every((a) => a.trim().length > 1);
  const already = !!responses[id];

  return (
    <div className="form">
      <div className="respond-head">
        <Avatar party={house} size={36} />
        <div>
          <p className="respond-role">{o.role}</p>
          <p className="form-help">
            {o.project} · {house.name}
          </p>
        </div>
      </div>

      <p className="form-label">What you're sending</p>
      <div className="attach-list">
        <div className="attach is-locked">
          <UserCheck size={16} />
          <span>Your profile</span>
          <Check size={16} className="attach-check" />
        </div>
        <button className={`attach ${attach.reel ? 'is-on' : ''}`} onClick={() => setAttach((a) => ({ ...a, reel: !a.reel }))}>
          <Film size={16} />
          <span>{reel.caption}</span>
          <span className="attach-box">{attach.reel && <Check size={13} strokeWidth={3} />}</span>
        </button>
        <button className={`attach ${attach.credits ? 'is-on' : ''}`} onClick={() => setAttach((a) => ({ ...a, credits: !a.credits }))}>
          <BadgeCheck size={16} />
          <span>{seed.credits[viewer.id].length} verified credits</span>
          <span className="attach-box">{attach.credits && <Check size={13} strokeWidth={3} />}</span>
        </button>
      </div>

      {o.questions?.map((q, i) => (
        <div key={q}>
          <label className="form-label" htmlFor={`q${i}`}>
            {q}
          </label>
          <textarea
            id={`q${i}`}
            className="input input--area"
            rows={2}
            value={answers[i]}
            onChange={(e) => setAnswers((a) => a.map((x, j) => (j === i ? e.target.value : x)))}
            placeholder="Your answer"
          />
        </div>
      ))}

      <p className="form-fineprint">
        The {house.name} team reviews responses privately. Ana won't show you a hired or rejected status; if they want to proceed, they'll message you in Inbox.
      </p>
      <div className="sheet-sticky">
      <Button
        block
        size="l"
        loading={sending}
        disabled={!complete || already}
        onClick={() => {
          setSending(true);
          window.setTimeout(() => respond(id, ['Profile', ...(attach.reel ? [reel.caption!] : []), ...(attach.credits ? ['Credits'] : []), `${answers.length} answers`]), 900);
        }}
      >
        {already ? 'Already sent' : complete ? 'Send response' : `Answer ${answers.filter((a) => a.trim().length <= 1).length} more to send`}
      </Button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Interest */

function InterestForm({ id }: { id: string }) {
  const { sendInterest, userCollabs } = useStore();
  const o = findOpportunity(id, userCollabs)!;
  const author = person(o.authorId!);
  const [note, setNote] = useState('');
  const max = 160;
  return (
    <div className="form">
      <p className="form-lead">
        {firstName(author)} will see your profile and this note. They're not taking direct messages for this collaboration, so they'll start the conversation if it's a fit.
      </p>
      <label className="form-label" htmlFor="note">
        Add a note <span className="muted">(optional)</span>
      </label>
      <textarea id="note" className="input input--area" rows={3} maxLength={max} value={note} onChange={(e) => setNote(e.target.value)} placeholder={`Why you'd be great for ${o.project}`} />
      <p className="counter">
        {note.length}/{max}
      </p>
      <Button block size="l" icon={<Sparkles size={17} />} onClick={() => sendInterest(id, note)}>
        Send interest
      </Button>
    </div>
  );
}

function ReviewInterest({ opportunityId }: { opportunityId?: string }) {
  const { interestsReceived, dismissInterest, startConversation, push, userCollabs } = useStore();
  const list = opportunityId ? interestsReceived.filter((i) => i.opportunityId === opportunityId) : interestsReceived;
  if (!list.length) return <EmptyState icon={<Sparkles />} title="No new interest" body="When people show interest in a collaboration with messages off, they'll appear here for you to review." />;
  return (
    <div className="interest-list">
      {list.map((it, i) => {
        const p = person(it.personId);
        const o = findOpportunity(it.opportunityId, userCollabs)!;
        return (
          <motion.div key={it.id} className="interest" {...stagger(i)} layout>
            <Pressable className="interest-person" onClick={() => push({ name: 'profile', id: p.id })} scale={0.98}>
              <Avatar party={p} size={44} />
              <span>
                <span className="interest-name">{p.name}</span>
                <span className="interest-role">
                  {p.role} · {p.city} · {p.years} yrs
                </span>
              </span>
            </Pressable>
            {it.note && <p className="interest-note">“{it.note}”</p>}
            <p className="interest-for">
              For {o.role} · {o.project} · {it.time} ago
            </p>
            <div className="interest-actions">
              <Button
                size="s"
                icon={<MessageCircle size={14} />}
                onClick={() => {
                  const cid = startConversation(p.id, { kind: 'collab', label: 'Collaboration', detail: `${o.role} · ${o.project}`, refId: o.id });
                  dismissInterest(it.id);
                  push({ name: 'conversation', id: cid });
                }}
              >
                Message
              </Button>
              <Button size="s" variant="ghost" icon={<X size={14} />} onClick={() => dismissInterest(it.id)}>
                Not now
              </Button>
            </div>
          </motion.div>
        );
      })}
      <p className="form-fineprint">People aren't told when you choose "Not now".</p>
    </div>
  );
}

function ReportCredit({ title }: { title: string }) {
  const { closeSheet, showToast } = useStore();
  const [reason, setReason] = useState('');
  const reasons = ['Wrong role or department', 'Wrong episodes or dates', "I didn't work on this", 'Name spelled wrong'];
  return (
    <div className="form">
      <p className="form-lead">Credits on Ana are issued by the production house. We'll ask them to review <b>{title}</b>. The credit stays visible while it's reviewed.</p>
      <div className="chip-picker chip-picker--stack">
        {reasons.map((r) => (
          <button key={r} className={`pick pick--wide ${reason === r ? 'is-on' : ''}`} onClick={() => setReason(r)}>
            {r}
          </button>
        ))}
      </div>
      <Button
        block
        size="l"
        disabled={!reason}
        onClick={() => {
          closeSheet();
          showToast({ text: 'Sent to the production for review · Case #C-4471', tone: 'success' });
        }}
      >
        Send for review
      </Button>
    </div>
  );
}
