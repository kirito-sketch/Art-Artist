import { Bell, ChevronDown, Lock, Plus } from 'lucide-react';
import * as seed from '../../data/seed';
import { useStore } from '../../state/store';
import { org, party } from '../../state/selectors';
import { publicName, world, type HouseProject } from '../../state/world';
import { Avatar, Button, IconButton, Photo, PressCard, Pressable, SectionHeader } from '../../ui/primitives';

/*
 * House Home. Slate is the primary direction: the house's work is the visual centre and operational
 * signals sit on the project they belong to. Pulse and Queue are archived references for stakeholder
 * comparison only; new work is designed for Slate. Everything reads from the one project model.
 */

function useHouse() {
  const { acting, interestsReceived, roleStatus, notifications } = useStore();
  const mine = world.projects.filter((p) => p.houseId === acting);
  const co = world.projects.filter((p) => p.coHouseIds?.includes(acting) && p.shared);
  const live = mine.filter((p) => p.stage !== 'Released');
  const rolesOf = (p: HouseProject) => world.roles.filter((r) => r.projectId === p.id && !roleStatus[r.id]);
  const interestOf = (p: HouseProject) => interestsReceived.filter((i) => !i.withdrawn && rolesOf(p).some((r) => r.id === i.opportunityId));
  const houseNotes = notifications.filter((n) => n.forId === acting);
  return { acting, mine, co, live, rolesOf, interestOf, houseNotes };
}

function HouseTop() {
  const { acting, openSheet, notifications } = useStore();
  const house = org(acting);
  const unread = notifications.some((n) => n.unread && n.forId === acting);
  return (
    <header className="topbar">
      <button className="ph-house" onClick={() => openSheet({ name: 'identity' })} aria-label={`Acting as ${house.name}. Switch`}>
        <Avatar party={house} size={32} />
        <span>
          <span className="item-title">
            {house.name} <ChevronDown size={14} />
          </span>
          <span className="meta ph-acting">Acting for the house</span>
        </span>
      </button>
      <span className="flex" />
      <IconButton label="Notifications" onClick={() => openSheet({ name: 'notifications' })}>
        <Bell size={21} />
        {unread && <span className="tab-dot ph-bell-dot" />}
      </IconButton>
      <IconButton label="New project" onClick={() => openSheet({ name: 'newProject' })}>
        <Plus size={22} />
      </IconButton>
    </header>
  );
}

export function ProductionHome() {
  const { houseHome } = useStore();
  if (houseHome === 'pulse') return <PulseHome />;
  if (houseHome === 'queue') return <QueueHome />;
  return <SlateHome />;
}

/* ------------------------------------------------------------ Slate (primary) */

function Pending() {
  const { acting } = useStore();
  if (org(acting).verified) return null;
  return <p className="inline-note ws-pad">Verification pending. Ana checks houses within 2 working days. Until then you can edit your page and prepare private projects; public roles and credits unlock after.</p>;
}

function SlateHome() {
  const { push } = useStore();
  const h = useHouse();
  const lead = [...h.live].sort((a, b) => Number(!!b.artwork) - Number(!!a.artwork) || Number(b.shared) - Number(a.shared))[0];
  return (
    <div className="screen" data-scroll="home">
      <HouseTop />
      <Pending />
      {lead ? (
        <PressCard className="slate-hero" onPress={() => push({ name: 'hproject', id: lead.id })} scale={0.985}>
          {lead.artwork ? <Photo media={lead.artwork} className="slate-hero-photo" showPlay={false} /> : <div className="slate-hero-photo whero-empty" />}
          <div className="slate-hero-text">
            <p className="now-card-kicker">
              {lead.stage}
              {!lead.shared && ' · Not announced'}
            </p>
            <p className="slate-hero-title">{lead.workingTitle}</p>
            <Signals p={lead} />
          </div>
        </PressCard>
      ) : (
        <EmptyHouse />
      )}
      <Around />
      <Slate />
      <PeopleForRoles />
    </div>
  );
}

/** Live signals, written as what is happening on this project, not as counters. */
function Signals({ p }: { p: HouseProject }) {
  const h = useHouse();
  const interested = h.interestOf(p).length;
  const open = h.rolesOf(p).filter((r) => r.visibility === 'open').length;
  const corrections = world.credits.filter((c) => c.projectId === p.id && c.status === 'correction').length;
  const items = [interested && `${interested} interested`, open && `${open} ${open === 1 ? 'role' : 'roles'} open`, corrections && `${corrections} correction asked`].filter(Boolean);
  if (!items.length) return null;
  return (
    <p className="slate-signals">
      {items.map((t) => (
        <span key={String(t)}>{t}</span>
      ))}
    </p>
  );
}

function EmptyHouse() {
  const { acting, openSheet } = useStore();
  return (
    <div className="house-empty">
      <p className="title-2">Nothing in production</p>
      <p className="meta">Start a project when you're ready. It stays private until you share it. {org(acting).name}'s past work already shows on your page.</p>
      <Button onClick={() => openSheet({ name: 'newProject' })}>Start a project</Button>
    </div>
  );
}

/** What is happening around our work: the house's own notifications, with faces. */
function Around({ expanded }: { expanded?: boolean }) {
  const { push, markNotificationRead } = useStore();
  const h = useHouse();
  const items = h.houseNotes.slice(0, expanded ? 8 : 3);
  if (!items.length) return null;
  return (
    <section className="section">
      <SectionHeader title="Around your work" />
      <div className={`list list--flush ${expanded ? 'around--big' : ''}`}>
        {items.map((n) => (
          <PressCard
            key={n.id}
            className={`around ${n.kind === 'credit' && /correct|isn't right/.test(n.text) ? 'around--flag' : ''}`}
            onPress={() => {
              markNotificationRead(n.id);
              if (n.route) push(n.route as never);
            }}
            scale={0.985}
          >
            <span className="faces">
              <Avatar party={party(n.actorId)!} size={expanded ? 40 : 32} />
            </span>
            <span className="around-text">
              <span className="item-title">{n.text}</span>
              <span className="meta">{n.time}</span>
            </span>
          </PressCard>
        ))}
      </div>
    </section>
  );
}

function Slate({ compact }: { compact?: boolean }) {
  const { push } = useStore();
  const h = useHouse();
  const poster = (p: HouseProject) =>
    p.artwork ? (
      <Photo media={p.artwork} className={`rail-poster ${compact ? 'rail-poster--s' : ''}`} showPlay={false} />
    ) : (
      <span className={`rail-poster ph-noposter ${compact ? 'rail-poster--s' : ''}`}>{p.shared ? p.workingTitle[0] : <Lock size={20} />}</span>
    );
  if (!h.mine.length && !h.co.length) return null;
  return (
    <section className="section">
      <SectionHeader title="Our slate" />
      <div className="rail">
        {h.mine.map((p) => (
          <Pressable key={p.id} className="rail-item" scale={0.97} onClick={() => push({ name: 'hproject', id: p.id })}>
            {poster(p)}
            <p className="item-title">{p.workingTitle}</p>
            <p className="meta">{!p.shared ? 'Only your house sees this' : p.stage === 'Released' ? p.year : p.stage}</p>
          </Pressable>
        ))}
        {h.co.map((p) => (
          <Pressable key={p.id} className="rail-item" scale={0.97} onClick={() => push({ name: 'work', id: p.id })}>
            {poster(p)}
            <p className="item-title">{publicName(p)}</p>
            <p className="meta">Co-production with {org(p.houseId!).name}</p>
          </Pressable>
        ))}
      </div>
    </section>
  );
}

/** People on Ana who fit roles the house hasn't opened yet: the network doing the work a job board would. */
function PeopleForRoles() {
  const { push } = useStore();
  const h = useHouse();
  const picks = h.mine
    .flatMap((p) => h.rolesOf(p).filter((r) => r.visibility === 'private').map((r) => ({ r, p })))
    .map(({ r, p }) => ({ r, p, who: seed.people.find((x) => x.visibility === 'public' && x.role.toLowerCase().includes(r.role.toLowerCase().split(' ')[0])) }))
    .filter((x) => x.who)
    .slice(0, 3);
  if (!picks.length) return null;
  return (
    <section className="section">
      <SectionHeader title="For roles you haven't opened" />
      <div className="list list--flush">
        {picks.map(({ r, p, who }) => (
          <PressCard key={r.id} className="prow" onPress={() => push({ name: 'profile', id: who!.id })} scale={0.985}>
            <Avatar party={who!} size={44} available={!!who!.availableFrom} />
            <div className="prow-text">
              <p className="item-title">{who!.name}</p>
              <p className="meta">
                {r.role} · still private on {p.workingTitle}
              </p>
            </div>
          </PressCard>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ Archived references */

/** Archived: activity first, slate underneath. Reference only. */
function PulseHome() {
  const h = useHouse();
  return (
    <div className="screen" data-scroll="home">
      <HouseTop />
      {!h.live.length && <EmptyHouse />}
      <Around expanded />
      <PeopleForRoles />
      <Slate compact />
    </div>
  );
}

/** Archived: decisions first, then a plain list. Reference for what an admin dashboard would look like. */
function QueueHome() {
  const { push } = useStore();
  const h = useHouse();
  const unread = h.houseNotes.filter((n) => n.unread);
  return (
    <div className="screen" data-scroll="home">
      <HouseTop />
      {unread.length > 0 && (
        <section className="section">
          <SectionHeader title="Needs a decision" />
          <div className="list list--flush">
            {unread.map((n) => (
              <PressCard key={n.id} className="prow" onPress={() => n.route && push(n.route as never)} scale={0.985}>
                <div className="prow-text">
                  <p className="item-title">{n.text}</p>
                </div>
              </PressCard>
            ))}
          </div>
        </section>
      )}
      <section className="section">
        <SectionHeader title="Projects" />
        <div className="list list--flush">
          {h.mine.map((p) => (
            <PressCard key={p.id} className="rrow" onPress={() => push({ name: 'hproject', id: p.id })} scale={0.985}>
              {p.artwork ? <Photo media={p.artwork} className="rrow-thumb" showPlay={false} /> : <span className="rrow-thumb ph-noposter">{p.workingTitle[0]}</span>}
              <div className="rrow-text">
                <p className="item-title">{p.workingTitle}</p>
                <p className="meta">
                  {p.stage}
                  {!p.shared && ' · private'}
                </p>
              </div>
            </PressCard>
          ))}
        </div>
      </section>
      {!h.mine.length && <EmptyHouse />}
    </div>
  );
}

