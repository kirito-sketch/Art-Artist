import { Bell, ChevronDown, Lock, Plus } from 'lucide-react';
import * as seed from '../../data/seed';
import { useStore } from '../../state/store';
import { org, party } from '../../state/selectors';
import { publicName, world, type HouseProject } from '../../state/world';
import { Avatar, Button, IconButton, Photo, PressCard, Pressable, SectionHeader } from '../../ui/primitives';
import { Faces, FrameLabel, PortraitCard, PosterTile, TitleCard } from '../../ui/compose';
import { publicCreditsFor } from '../../domain/discovery';
import { person } from '../../state/selectors';

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
    <div className="screen canvas v-slate" data-scroll="home">
      <HouseTop />
      <Pending />
      {lead ? <LeadProject p={lead} onOpen={() => push({ name: 'hproject', id: lead.id })} /> : <EmptyHouse />}
      <div className="ws-pad">
        <AroundWork />
        <OpenRoles />
        <SlateRail />
        <PeopleToConsider />
      </div>
    </div>
  );
}

/**
 * The lead project as a cinematic slate: its artwork is the page's centre, and what is happening
 * on it (interest, open roles, corrections) is set on the image as one working strip with faces.
 */
function LeadProject({ p, onOpen }: { p: HouseProject; onOpen: () => void }) {
  const h = useHouse();
  const interest = h.interestOf(p);
  const open = h.rolesOf(p).filter((r) => r.visibility === 'open').length;
  const corrections = world.credits.filter((c) => c.projectId === p.id && (c.status === 'correction')).length + world.amendments.filter((m) => m.projectId === p.id && m.status === 'open').length;
  const faces = [...new Set(interest.map((i) => i.personId))].map(person);
  return (
    <PressCard className="slate-lead" onPress={onOpen} scale={0.985} aria-label={p.workingTitle}>
      {p.artwork ? <Photo media={p.artwork} className="slate-lead-photo" showPlay={false} /> : <TitleCard title={p.workingTitle} locked={!p.shared} />}
      <span className="slate-lead-labels">
        <FrameLabel>{p.stage}</FrameLabel>
        {!p.shared && <FrameLabel icon={<Lock size={11} strokeWidth={2.6} />}>Not announced</FrameLabel>}
      </span>
      <div className="slate-lead-text">
        <p className="slate-lead-title">{p.workingTitle}</p>
        {(faces.length > 0 || open > 0 || corrections > 0) && (
          <div className="slate-strip">
            {faces.length > 0 && (
              <span className="slate-strip-item">
                <Faces people={faces} size={24} />
                {faces.length} interested
              </span>
            )}
            {faces.length > 0 && open > 0 && <span className="slate-strip-sep" />}
            {open > 0 && <span className="slate-strip-item">{open} {open === 1 ? 'role' : 'roles'} open</span>}
            {corrections > 0 && <span className="slate-strip-sep" />}
            {corrections > 0 && <span className="slate-strip-item slate-strip-flag">{corrections} to review</span>}
          </div>
        )}
      </div>
    </PressCard>
  );
}

/** Editorial rows: what is happening around the work. Attention is a small mark, not red text. */
function AroundWork() {
  const { push, markNotificationRead } = useStore();
  const h = useHouse();
  const items = h.houseNotes.slice(0, 3);
  if (!items.length) return null;
  return (
    <section className="v-section">
      <SectionHeader title="Around your work" />
      <div className="list list--flush">
        {items.map((n) => (
          <PressCard
            key={n.id}
            className="around"
            onPress={() => {
              markNotificationRead(n.id);
              if (n.route) push(n.route as never);
            }}
            scale={0.985}
          >
            <Avatar party={party(n.actorId)!} size={36} />
            <span className="around-text">
              <span className="item-title">{n.text}</span>
              <span className="meta">{n.time}</span>
            </span>
            {n.kind === 'credit' && /correct|amend|isn't right/.test(n.text) && <span className="around-flag-dot" aria-label="Needs a decision" />}
          </PressCard>
        ))}
      </div>
    </section>
  );
}

/** Compact role cards: each open role with its project image and the faces of who is interested. */
function OpenRoles() {
  const { push, interestsReceived } = useStore();
  const h = useHouse();
  const roles = h.mine.flatMap((p) => h.rolesOf(p).filter((r) => r.visibility === 'open').map((r) => ({ r, p })));
  if (!roles.length) return null;
  return (
    <section className="v-section">
      <SectionHeader title="Open roles" />
      <div className="role-strip">
        {roles.map(({ r, p }) => {
          const who = [...new Set(interestsReceived.filter((i) => i.opportunityId === r.id && !i.withdrawn).map((i) => i.personId))].map(person);
          return (
            <PressCard key={r.id} className="role-compact" onPress={() => push({ name: 'opportunity', id: r.id })} scale={0.98} aria-label={r.role}>
              <span className="role-compact-media">{p.artwork ? <Photo media={p.artwork} showPlay={false} /> : <TitleCard title={p.workingTitle} />}</span>
              <span className="role-compact-text">
                <p className="item-title">{r.role}</p>
                <p className="meta">{p.workingTitle}</p>
                <span className="role-compact-foot">
                  {who.length ? (
                    <>
                      <Faces people={who} size={22} max={3} /> {who.length} interested
                    </>
                  ) : (
                    'No interest yet'
                  )}
                </span>
              </span>
            </PressCard>
          );
        })}
      </div>
    </section>
  );
}

/** Poster rail: the whole slate. Unannounced work is its own title card, never an empty box. */
function SlateRail() {
  const { push } = useStore();
  const h = useHouse();
  if (!h.mine.length && !h.co.length) return null;
  return (
    <section className="v-section">
      <SectionHeader title="Our slate" />
      <div className="poster-rail">
        {h.mine.map((p) => (
          <PosterTile
            key={p.id}
            media={p.artwork}
            title={p.workingTitle}
            meta={p.stage === 'Released' ? p.year : p.stage}
            label={p.artwork ? <FrameLabel>{p.stage === 'Released' ? p.year : p.stage}</FrameLabel> : undefined}
            locked={!p.shared}
            onPress={() => push({ name: 'hproject', id: p.id })}
          />
        ))}
        {h.co.map((p) => (
          <PosterTile key={p.id} media={p.artwork} title={publicName(p)} meta={`With ${org(p.houseId!).name}`} label={<FrameLabel>Co-production</FrameLabel>} onPress={() => push({ name: 'work', id: p.id })} />
        ))}
      </div>
    </section>
  );
}

/** Portrait Cards, the same family as the Individual Home: people who fit roles you haven't opened. */
function PeopleToConsider() {
  const { push } = useStore();
  const h = useHouse();
  const picks = h.mine
    .flatMap((p) => h.rolesOf(p).filter((r) => r.visibility === 'private').map((r) => ({ r, p })))
    .map(({ r, p }) => ({ r, p, who: seed.people.find((x) => x.visibility === 'public' && x.role.toLowerCase().includes(r.role.toLowerCase().split(' ')[0])) }))
    .filter((x) => x.who)
    .slice(0, 3);
  if (!picks.length) return null;
  return (
    <section className="v-section">
      <SectionHeader title="For roles you haven't opened" />
      <div className="portrait-rail">
        {picks.map(({ r, p, who }) => {
          const c = publicCreditsFor(who!.id)[0];
          const w = c ? world.projects.find((x) => x.id === c.projectId) : undefined;
          return <PortraitCard key={r.id} person={who!} still={w?.artwork ?? seed.portfolio[who!.id]?.[0]} context={`${r.role} · private on ${p.workingTitle}`} onPress={() => push({ name: 'profile', id: who!.id })} />;
        })}
      </div>
    </section>
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

