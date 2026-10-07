import { useFeatures } from '../../ui/features';
import { AnimatePresence, motion } from 'framer-motion';
import { dur, shared, spring } from '../../ui/motion';
import { Check, ChevronLeft, Clock, MapPin, Share, Sparkles, Users } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useStore } from '../../state/store';
import { world } from '../../state/world';
import { findOpportunity, firstName, kindLabel, org, person } from '../../state/selectors';
import { Avatar, Button, EmptyState, IconButton, Photo, Pressable } from '../../ui/primitives';
import { CallSheet, displayTitle, keepSeparators, FrameLabel } from '../../ui/compose';
import { Byline, SaveButton } from '../home/OpportunityCard';

const TODAY = new Date(2026, 8, 29);
export const closesOn = (days: number) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

function Fact({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="fact">
      <span className="fact-icon">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

export function OpportunityScreen({ id, fromCard }: { id: string; fromCard?: boolean }) {
  const districtFeature = useFeatures().home === 'district';
  const { pop, push, userCollabs, viewer, interestsSent, openSheet, withdrawInterest, startConversation, scenario, interestsReceived, setHero, acting, setActing, roleEdits, roleStatus, reopenRole, conversations, openAgain, showToast, blocked } = useStore();
  const base = findOpportunity(id, userCollabs);
  const o = base && { ...base, ...roleEdits[id] };
  const district = districtFeature && !!o?.orgId;
  const status = roleStatus[id];
  const changed = roleEdits[id]?.changed ?? [];
  const [scrollY, setScrollY] = useState(0);
  /** View state only: after withdrawing, the bar says so instead of silently resetting. */
  const [withdrew, setWithdrew] = useState(false);

  // Light status bar while the photo is under it.
  useEffect(() => {
    setHero('opportunity', scrollY < 330);
    return () => setHero('opportunity', false);
  }, [scrollY, setHero]);

  if (!o) {
    return (
      <div className="screen">
        <header className="topbar topbar--nav">
          <IconButton label="Back" onClick={pop}>
            <ChevronLeft size={26} />
          </IconButton>
        </header>
        <EmptyState title="This role has closed" body="Anything you sent is still in your activity." />
      </div>
    );
  }

  const author = o.authorId ? person(o.authorId) : null;
  const mine = o.authorId === viewer.id || (!!o.orgId && o.orgId === acting);
  const interested = interestsSent[o.id] !== undefined;
  const received = interestsReceived.filter((i) => i.opportunityId === o.id && !i.withdrawn).length;
  const poster = author ? firstName(author) : org(o.orgId!).name;

  /* Footer: what it pays and when it closes on the left, the one action on the right. Each fact is said once on
     this page (docs/TEXT_LOAD.md): while the bar shows pay, the facts above leave it out, and the closing date
     lives only here, as "Closes in N days" when it is close. */
  const closingSoon = o.closesInDays !== undefined && o.closesInDays <= 5;
  const openLeft: ReactNode = (
    <>
      <p className="item-title">{o.paid ? o.compensation : 'Unpaid'}</p>
      <p className={`meta ${closingSoon ? 'meta--urgent' : ''}`}>
        {o.closesInDays === undefined ? o.dates : closingSoon ? `Closes in ${o.closesInDays} ${o.closesInDays === 1 ? 'day' : 'days'}` : `Closes ${closesOn(o.closesInDays)}`}
      </p>
    </>
  );
  let left: ReactNode = openLeft;
  let action: ReactNode;
  const talking = conversations.find((c) => c.context.refId === o.id);
  if (status) {
    left = (
      <>
        <p className="item-title">{status.state === 'filled' ? 'Role filled' : 'Role closed'}</p>
        <p className="meta">{status.reason}</p>
      </>
    );
    // Closed can be reopened. Filled is a record of who was chosen, so hiring again is a new role.
    if (mine && status.state === 'closed')
      action = (
        <Button variant="secondary" onClick={() => reopenRole(o.id)}>
          Reopen
        </Button>
      );
    if (mine && status.state === 'filled')
      action = (
        <Button
          variant="secondary"
          onClick={() => {
            const nid = openAgain(o.id);
            push({ name: 'opportunity', id: nid });
            showToast({ text: 'New role opened. The filled one stays on record.' });
          }}
        >
          Open a new role
        </Button>
      );
  } else if (mine) {
    action = <Button onClick={() => openSheet({ name: 'reviewInterest', opportunityId: o.id })}>{received ? `Review ${received}` : 'Review interest'}</Button>;
  } else if (!mine && blocked.includes(o.orgId ?? o.authorId ?? '')) {
    // Reached from an old link or a notification: the role is readable, but nothing is offered.
    left = (
      <>
        <p className="item-title">You blocked {poster}</p>
        <p className="meta">Unblock from their page to respond</p>
      </>
    );
    action = null;
  } else if (acting !== 'self') {
    // Responding is always personal. A house never applies for a role, so make the switch explicit.
    left = (
      <>
        <p className="item-title">Responses are personal</p>
        <p className="meta">You're acting as the house</p>
      </>
    );
    action = (
      <Button variant="secondary" onClick={() => setActing('self', true, true)}>
        Switch to you
      </Button>
    );
  } else if (interested && talking) {
    // Once the poster has started a conversation, interest has done its job. Changing your mind happens in the chat.
    left = (
      <>
        <p className="item-title">In conversation</p>
        <p className="meta">Changed your mind? Say so in the chat</p>
      </>
    );
    action = <Button onClick={() => push({ name: 'conversation', id: talking.id })}>Open chat</Button>;
  } else if (interested) {
    left = (
      <>
        <p className="item-title booking-done">
          Interest sent
          <motion.span className="booking-check" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring.settle, delay: 0.12 }}>
            <Check size={14} strokeWidth={3} />
          </motion.span>
        </p>
        <p className="meta">{poster} will message you if it's a fit</p>
      </>
    );
    action = (
      <Button
        variant="secondary"
        onClick={() => {
          withdrawInterest(o.id);
          setWithdrew(true);
        }}
      >
        Withdraw
      </Button>
    );
  } else if (scenario.offline) {
    action = <Button disabled>Offline</Button>;
  } else if (o.allowDM) {
    action = (
      <Button
        onClick={() => {
          const cid = startConversation(author!.id, { kind: 'collab', label: 'Collaboration', detail: `${o.role} · ${o.project}`, refId: o.id });
          cid && push({ name: 'conversation', id: cid });
        }}
      >
        Message
      </Button>
    );
  } else {
    if (withdrew)
      left = (
        <>
          <p className="item-title">No longer interested</p>
          <p className="meta">Withdrawn. You can show interest again.</p>
        </>
      );
    action = (
      <Button
        onClick={() => {
          setWithdrew(false);
          openSheet({ name: 'showInterest', id: o.id });
        }}
      >
        Show interest
      </Button>
    );
  }
  const payInBar = left === openLeft;
  // The kicker often names the language already ("Feature film · Telugu"); then the facts don't repeat it.
  const languageSaid = !!o.language && o.projectType.toLowerCase().includes(o.language.toLowerCase());
  // Under Show interest the questions are asked in the sheet itself, so the page doesn't list them first.
  const questionsInSheet = !o.allowDM && !mine;
  const barKey = status ? 'status' : interested ? 'sent' : withdrew ? 'withdrawn' : 'open';

  return (
    <div className="detail v-role">
      <div className={`screen screen--hero canvas${district ? ' dhouse-page' : ''}`} onScroll={(e) => setScrollY(e.currentTarget.scrollTop)}>
        <div className="ohero">
          <div className="ohero-parallax" style={{ transform: `translateY(${Math.max(0, scrollY) * 0.4}px)` }}>
            {/* Opened from a card: the card's artwork becomes this hero. Otherwise it simply appears. */}
            <motion.div layoutId={fromCard ? shared.role(o.id) : undefined} className="ohero-photo" transition={spring.push}>
              <Photo surface="project-hero" media={o.media} className="ohero-photo" />
            </motion.div>
          </div>
          <span className="ohero-labels">
            <FrameLabel>{kindLabel[o.kind]}</FrameLabel>
          </span>
        </div>

        <motion.div className="detail-body osheet" initial={fromCard ? { y: 48, opacity: 0 } : false} animate={{ y: 0, opacity: 1 }} transition={{ ...spring.push, delay: 0.06 }}>
          <p className="kicker">{o.projectType}</p>
          <h1 className="large-title display-title" {...displayTitle(o.role)}>
            {keepSeparators(o.role)}
          </h1>
          <Pressable className="detail-by" onClick={() => (author ? push({ name: 'profile', id: author.id }) : push({ name: 'org', id: o.orgId! }))} scale={0.98}>
            {o.orgId && <Avatar party={org(o.orgId)} size={26} />}
            <Byline o={o} />
            <span className="meta">· {o.project}</span>
          </Pressable>

          {mine && !status && (
            <div className="owner-bar">
              <button className="link" onClick={() => openSheet({ name: 'editRole', id: o.id })}>
                Edit role
              </button>
              <button className="link link--muted" onClick={() => openSheet({ name: 'closeRole', id: o.id })}>
                Close role
              </button>
            </div>
          )}
          {!mine && changed.length > 0 && interested && <p className="inline-note">Updated since you showed interest: {changed.join(', ')}</p>}
          {status && !mine && (() => {
            // The person chosen for a filled role finds their way to the project they're now on.
            const onIt = world.associations.find((a) => a.fromRoleId === o.id && a.personId === viewer.id && a.status !== 'removed');
            return onIt ? (
              <p className="inline-note">
                {poster} added you to the project for this role.{' '}
                <button className="link" onClick={() => push({ name: 'association', id: onIt.id })}>
                  See project
                </button>
              </p>
            ) : (
              <p className="inline-note">This role is no longer open. Anything you sent stays in your activity.</p>
            );
          })()}

          {o.highlight && (
            <p className="role-highlight">
              <Sparkles size={18} /> {o.highlight}
            </p>
          )}
          <CallSheet
            items={[
              { label: 'Location', value: o.city },
              { label: 'Dates', value: o.dates },
              ...(o.language && !languageSaid ? [{ label: 'Language', value: o.language }] : []),
              ...(payInBar ? [] : [{ label: 'Pay', value: o.paid ? o.compensation : 'Unpaid' }]),
            ]}
          />
          {!o.allowDM && !mine && (
            <p className="role-decides">
              <Users size={18} /> {poster} sees your profile and decides whether to message you
            </p>
          )}

          <section className="detail-section">
            <h2 className="section-title">About</h2>
            <p className="body">{o.about}</p>
            <ul className="bullets">
              {o.lookingFor.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </section>

          {o.audition && (
            <section className="detail-section">
              <h2 className="section-title">Audition</h2>
              <ul className="facts facts--tight">
                <Fact icon={<MapPin size={20} />}>{o.audition.place}</Fact>
                <Fact icon={<Clock size={20} />}>{o.audition.when}</Fact>
              </ul>
              <p className="meta">{o.audition.notes}</p>
            </section>
          )}

          {o.questions && !questionsInSheet && (
            <section className="detail-section">
              <h2 className="section-title">Questions</h2>
              <ol className="numbered">
                {o.questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ol>
            </section>
          )}

          <p className="meta detail-trust">
            Art and Artist never charges to apply or audition.{' '}
            <button className="link link--small" onClick={() => openSheet({ name: 'report', subject: `${o.role} · ${o.project}` })}>
              Report
            </button>
          </p>
        </motion.div>
      </div>

      <div className={`float-bar ${scrollY > 400 ? 'is-solid' : ''}`}>
        <IconButton label="Back" className="icon-btn--float" onClick={pop}>
          <ChevronLeft size={24} />
        </IconButton>
        <span className="flex" />
        <IconButton label={`Share ${o.role} role`} className="icon-btn--float" onClick={() => openSheet({ name: 'share', label: `${o.role} · ${o.project}` })}>
          <Share size={18} />
        </IconButton>
        <span className="save-float">
          <SaveButton id={o.id} floating name={`${o.role} role`} />
        </span>
      </div>

      <footer className="booking">
        {/* The bar is the control: its state changes in place (open → sent → withdrawn), no toast needed. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={barKey} className="booking-left" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: dur.micro }}>
            {left}
          </motion.div>
        </AnimatePresence>
        {action}
      </footer>
    </div>
  );
}
