import { CalendarDays, ChevronLeft, Clock, Languages, MapPin, Share, Sparkles, Users } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useImageTint } from '../../ui/useImageTint';
import { useStore } from '../../state/store';
import { findOpportunity, firstName, kindLabel, person } from '../../state/selectors';
import { Button, EmptyState, IconButton, Photo, Pressable } from '../../ui/primitives';
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

export function OpportunityScreen({ id }: { id: string }) {
  const { pop, push, userCollabs, viewer, responses, interestsSent, openSheet, withdrawInterest, startConversation, scenario, interestsReceived, showToast, setHero } = useStore();
  const o = findOpportunity(id, userCollabs);
  const [scrollY, setScrollY] = useState(0);
  const tint = useImageTint(o?.media);

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
  const mine = o.authorId === viewer.id;
  const response = responses[o.id];
  const interested = interestsSent[o.id] !== undefined;
  const received = interestsReceived.filter((i) => i.opportunityId === o.id).length;

  /* Footer: what it pays and when it closes on the left, the one action on the right. */
  let left: ReactNode = (
    <>
      <p className="item-title">{o.paid ? o.compensation : 'Unpaid'}</p>
      <p className="meta">{o.closesInDays !== undefined ? `Closes ${closesOn(o.closesInDays)}` : o.dates}</p>
    </>
  );
  let action: ReactNode;
  if (mine) {
    action = <Button onClick={() => openSheet({ name: 'reviewInterest', opportunityId: o.id })}>{received ? `Review ${received}` : 'Review interest'}</Button>;
  } else if (response) {
    left = (
      <>
        <p className="item-title">Response sent</p>
        <p className="meta">{response.sentAt}</p>
      </>
    );
  } else if (interested) {
    left = (
      <>
        <p className="item-title">Interest sent</p>
        <p className="meta">{firstName(author!)} will message you if it's a fit</p>
      </>
    );
    action = (
      <Button variant="secondary" onClick={() => withdrawInterest(o.id)}>
        Withdraw
      </Button>
    );
  } else if (scenario.offline) {
    action = <Button disabled>Offline</Button>;
  } else if (o.kind !== 'collab') {
    action = <Button onClick={() => openSheet({ name: 'respond', id: o.id })}>Respond</Button>;
  } else if (o.allowDM) {
    action = (
      <Button
        onClick={() => {
          const cid = startConversation(author!.id, { kind: 'collab', label: 'Collaboration', detail: `${o.role} · ${o.project}`, refId: o.id });
          push({ name: 'conversation', id: cid });
        }}
      >
        Message
      </Button>
    );
  } else {
    action = <Button onClick={() => openSheet({ name: 'showInterest', id: o.id })}>Show interest</Button>;
  }

  return (
    <div className="detail">
      <div className="screen screen--hero" onScroll={(e) => setScrollY(e.currentTarget.scrollTop)}>
        <div className="ohero">
          <div className="ohero-parallax" style={{ transform: `translateY(${Math.max(0, scrollY) * 0.4}px)` }}>
            <Photo media={o.media} className="ohero-photo" />
          </div>
        </div>

        <div className="detail-body osheet" style={tint ? { background: `linear-gradient(to bottom, rgba(${tint}, 0.14), rgba(255, 255, 255, 0) 360px), var(--surface)` } : undefined}>
          <p className="kicker">
            {kindLabel[o.kind]} · {o.projectType.split(' · ')[0]}
          </p>
          <h1 className="large-title">{o.role}</h1>
          <Pressable className="detail-by" onClick={() => (author ? push({ name: 'profile', id: author.id }) : showToast({ text: 'Production page' }))} scale={0.98}>
            <Byline o={o} />
            <span className="meta">· {o.project}</span>
          </Pressable>

          <ul className="facts">
            <Fact icon={<MapPin size={20} />}>{o.city}</Fact>
            <Fact icon={<CalendarDays size={20} />}>{o.dates}</Fact>
            {o.language && <Fact icon={<Languages size={20} />}>{o.language}</Fact>}
            {o.highlight && <Fact icon={<Sparkles size={20} />}>{o.highlight}</Fact>}
            {o.kind === 'collab' && !o.allowDM && !mine && <Fact icon={<Users size={20} />}>{firstName(author!)} reviews interest before messaging</Fact>}
          </ul>

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

          {o.questions && !response && (
            <section className="detail-section">
              <h2 className="section-title">You'll be asked</h2>
              <ol className="numbered">
                {o.questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ol>
            </section>
          )}

          <p className="meta detail-trust">
            Ana never charges to apply or audition.{' '}
            <button className="link link--small" onClick={() => showToast({ text: 'Reported. Case A-20931' })}>
              Report
            </button>
          </p>
        </div>
      </div>

      <div className="float-bar">
        <IconButton label="Back" className="icon-btn--float" onClick={pop}>
          <ChevronLeft size={24} />
        </IconButton>
        <span className="flex" />
        <IconButton label="Share" className="icon-btn--float" onClick={() => showToast({ text: 'Link copied' })}>
          <Share size={18} />
        </IconButton>
        <span className="save-float">
          <SaveButton id={o.id} floating />
        </span>
      </div>

      <footer className="booking">
        <div className="booking-left">{left}</div>
        {action}
      </footer>
    </div>
  );
}
