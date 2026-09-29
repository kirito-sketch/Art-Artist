import { CalendarDays, Check, ChevronLeft, ChevronRight, Clapperboard, Flag, Globe2, IndianRupee, Languages, MapPin, MessageCircle, Share, ShieldCheck, Sparkles, Users, WifiOff } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useStore } from '../../state/store';
import { findOpportunity, firstName, org, person } from '../../state/selectors';
import { Avatar, Button, EmptyState, IconButton, PressCard, TypeBadge, Verified } from '../../ui/primitives';
import { Still } from '../../ui/Still';
import { SaveButton } from '../home/OpportunityCard';

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="fact">
      <span className="fact-icon">{icon}</span>
      <span className="fact-label">{label}</span>
      <span className="fact-value">{value}</span>
    </div>
  );
}

export function OpportunityScreen({ id }: { id: string }) {
  const { pop, push, userCollabs, viewer, responses, interestsSent, openSheet, withdrawInterest, startConversation, scenario, interestsReceived, showToast } = useStore();
  const o = findOpportunity(id, userCollabs);
  const [scrolled, setScrolled] = useState(false);

  if (!o) {
    return (
      <div className="screen-scroll">
        <div className="detail-topbar detail-topbar--plain">
          <IconButton label="Back" className="icon-btn--glass" onClick={pop}>
            <ChevronLeft size={22} />
          </IconButton>
        </div>
        <EmptyState icon={<Clapperboard />} title="This role is no longer open" body="The production closed it or it was removed. Anything you sent is still in My responses." />
      </div>
    );
  }

  const official = o.kind !== 'collab';
  const house = o.orgId ? org(o.orgId) : null;
  const author = o.authorId ? person(o.authorId) : null;
  const mine = o.authorId === viewer.id;
  const response = responses[o.id];
  const interested = interestsSent[o.id] !== undefined;
  const received = interestsReceived.filter((i) => i.opportunityId === o.id);

  let cta: ReactNode;
  if (mine) {
    cta = (
      <Button block size="l" variant="primary" icon={<Users size={18} />} onClick={() => openSheet({ name: 'reviewInterest', opportunityId: o.id })}>
        Review interest{received.length ? ` (${received.length})` : ''}
      </Button>
    );
  } else if (scenario.offline) {
    cta = (
      <Button block size="l" variant="secondary" icon={<WifiOff size={16} />} disabled>
        Available when you're back online
      </Button>
    );
  } else if (official) {
    cta = response ? (
      <div className="cta-record">
        <span className="cta-record-icon">
          <Check size={16} strokeWidth={3} />
        </span>
        <div>
          <p className="cta-record-title">Response sent · {response.sentAt}</p>
          <p className="cta-record-body">{house?.name} will contact you in Inbox if they want to proceed.</p>
        </div>
      </div>
    ) : (
      <Button block size="l" onClick={() => openSheet({ name: 'respond', id: o.id })}>
        {o.kind === 'casting' ? 'Respond to casting call' : 'Respond to this role'}
      </Button>
    );
  } else if (o.allowDM) {
    cta = (
      <Button
        block
        size="l"
        icon={<MessageCircle size={18} />}
        onClick={() => {
          const cid = startConversation(author!.id, { kind: 'collab', label: 'Collaboration', detail: `${o.role} · ${o.project}`, refId: o.id });
          push({ name: 'conversation', id: cid });
        }}
      >
        Message {firstName(author!)}
      </Button>
    );
  } else {
    cta = interested ? (
      <div className="cta-record">
        <span className="cta-record-icon">
          <Check size={16} strokeWidth={3} />
        </span>
        <div>
          <p className="cta-record-title">Interest sent</p>
          <p className="cta-record-body">{firstName(author!)} will message you if it's a fit.</p>
        </div>
        <button className="link-btn" onClick={() => withdrawInterest(o.id)}>
          Withdraw
        </button>
      </div>
    ) : (
      <Button block size="l" icon={<Sparkles size={17} />} onClick={() => openSheet({ name: 'showInterest', id: o.id })}>
        Show interest
      </Button>
    );
  }

  return (
    <div className="detail">
      <div className="screen-scroll detail-scroll" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 300)}>
        <div className="detail-hero">
          <Still media={o.media} className="detail-hero-media" />
          <div className="detail-hero-scrim" />
        </div>

        <div className="detail-sheet">
          <div className="detail-badges">
            <TypeBadge kind={o.kind} />
            {o.closesInDays !== undefined && <span className={`closing ${o.closesInDays <= 3 ? 'closing--soon' : ''}`}>Closes in {o.closesInDays} days</span>}
            <span className="detail-posted">{o.postedAgo === 'now' ? 'Posted just now' : `Posted ${o.postedAgo} ago`}</span>
          </div>
          {o.kind === 'collab' && <p className="collab-kicker">{o.collabIntent === 'available' ? 'Available for' : 'Looking for'}</p>}
          <h1 className="detail-title">{o.role}</h1>
          <p className="detail-project">
            {o.project} · {o.projectType}
          </p>

          {house && (
            <PressCard className="poster-row" onPress={() => showToast({ text: `${house.name} company page` })}>
              <Avatar party={house} size={40} />
              <div className="poster-row-text">
                <p className="poster-row-name">
                  {house.name} <Verified size={14} />
                </p>
                <p className="poster-row-sub">Verified production house · {house.city}</p>
              </div>
              <ChevronRight size={16} className="muted" />
            </PressCard>
          )}
          {author && (
            <PressCard className="poster-row poster-row--peer" onPress={() => push({ name: 'profile', id: author.id })}>
              <Avatar party={author} size={40} />
              <div className="poster-row-text">
                <p className="poster-row-name">{mine ? 'You' : author.name}</p>
                <p className="poster-row-sub">
                  {author.role} · Peer collaboration, not a verified production
                </p>
              </div>
              <ChevronRight size={16} className="muted" />
            </PressCard>
          )}

          <div className="facts-grid">
            <Fact icon={<MapPin size={15} />} label="Location" value={o.city} />
            <Fact icon={<CalendarDays size={15} />} label="Dates" value={o.dates} />
            <Fact icon={<IndianRupee size={15} />} label="Compensation" value={o.compensation} />
            <Fact icon={o.language ? <Languages size={15} /> : <Globe2 size={15} />} label={o.language ? 'Language' : 'Stage'} value={o.language ?? o.stage} />
          </div>

          {o.match.length > 0 && (
            <div className="why">
              <p className="why-title">
                <Sparkles size={13} /> Why you're seeing this
              </p>
              <div className="why-chips">
                {o.match.map((m) => (
                  <span key={m} className="why-chip">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          <section className="detail-section">
            <h2>About the {o.kind === 'collab' ? 'project' : 'role'}</h2>
            <p>{o.about}</p>
          </section>

          <section className="detail-section">
            <h2>{o.collabIntent === 'available' ? 'Open to' : 'Looking for'}</h2>
            <ul className="ticks">
              {o.lookingFor.map((l) => (
                <li key={l}>
                  <Check size={14} strokeWidth={2.6} />
                  {l}
                </li>
              ))}
            </ul>
          </section>

          {o.audition && (
            <section className="detail-section">
              <h2>Audition for this role</h2>
              <div className="audition">
                <p className="audition-place">{o.audition.place}</p>
                <p className="audition-when">{o.audition.when}</p>
                <p className="audition-notes">{o.audition.notes}</p>
              </div>
            </section>
          )}

          {official && o.questions && (
            <section className="detail-section">
              <h2>What {house?.name.split(' ')[0]} will ask</h2>
              <p className="muted-body">Role-specific questions only. You answer them when you respond.</p>
              <ol className="questions">
                {o.questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ol>
            </section>
          )}

          {!official && !mine && (
            <section className="detail-section">
              <h2>How responses work</h2>
              <p className="muted-body">
                {o.allowDM
                  ? `${firstName(author!)} is open to direct messages about this collaboration.`
                  : `${firstName(author!)} is reviewing interest first. Send yours and they'll start the conversation if it's a fit.`}
              </p>
            </section>
          )}

          <div className="trust-note">
            <ShieldCheck size={18} />
            <p>
              Ana never charges to apply, audition or be cast. If anyone asks you for a fee, report it.
              <button className="link-btn" onClick={() => showToast({ text: 'Report sent to Trust & Safety · Case #A-20931', tone: 'success' })}>
                <Flag size={12} /> Report
              </button>
            </p>
          </div>
        </div>
      </div>

      <div className={`detail-topbar ${scrolled ? 'is-scrolled' : ''}`}>
        <IconButton label="Back" className="icon-btn--glass" onClick={pop}>
          <ChevronLeft size={22} />
        </IconButton>
        <span className="detail-topbar-title" style={{ opacity: scrolled ? 1 : 0 }}>
          {o.role}
        </span>
        <IconButton label="Share" className="icon-btn--glass" onClick={() => showToast({ text: 'Link copied' })}>
          <Share size={17} />
        </IconButton>
        <SaveButton id={o.id} onMedia />
      </div>

      <div className="cta-bar">{cta}</div>
    </div>
  );
}
