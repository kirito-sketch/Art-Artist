import { Bell, ChevronDown, ChevronLeft, Globe2, Lock, Plus } from 'lucide-react';
import { useState } from 'react';
import * as seed from '../../data/seed';
import type { Media } from '../../data/types';
import { isLive, work, worksForOrg, type Work } from '../../data/works';
import { useStore } from '../../state/store';
import { org, person } from '../../state/selectors';
import { Avatar, Button, IconButton, Photo, PressCard, Pressable, SectionHeader, Verified } from '../../ui/primitives';

/*
 * EXPLORATION, not confirmed architecture. See docs/PRODUCTION_HOUSE_EXPLORATION.md.
 * The public record (Work) is shared with the rest of Ana. What lives here is only what the house
 * sees privately: needs not yet opened, invitations not yet accepted, credits not yet public.
 */

type NeedState = 'private' | 'open' | 'filled';
interface Need {
  id: string;
  position: string;
  dept: string;
  state: NeedState;
  opportunityId?: string;
}
interface Invite {
  personId: string;
  position: string;
  dept: string;
}
interface Workspace {
  needs: Need[];
  invites: Invite[];
  disputes: { personId: string; asked: string }[];
}

const PRIVATE: Record<string, Workspace> = {
  neela: {
    needs: [
      { id: 'n1', position: 'Director of Photography', dept: 'Camera', state: 'open', opportunityId: 'o-neela-dop' },
      { id: 'n2', position: 'Journalist (supporting)', dept: 'Cast', state: 'open', opportunityId: 'o-neela-journalist' },
      { id: 'n3', position: 'Colourist', dept: 'Post', state: 'private' },
      { id: 'n4', position: 'Gaffer', dept: 'Lighting', state: 'private' },
    ],
    invites: [{ personId: 'sana', position: '1st AC', dept: 'Camera' }],
    disputes: [],
  },
  neeliraat: { needs: [], invites: [], disputes: [{ personId: 'sameer', asked: 'Chief Lighting Technician, not Gaffer' }] },
};
/** A project only the house can see: no public page until they choose to share it. */
const UNTITLED = { id: 'untitled', title: 'Untitled thriller', format: 'Web series · Hindi', stage: 'Development' };

const ws = (id: string): Workspace => PRIVATE[id] ?? { needs: [], invites: [], disputes: [] };

/** Who has responded to the house's open roles, via the same interest model individuals use. */
function useSignals(house: string) {
  const { interestsReceived: all } = useStore();
  const interestsReceived = all.filter((i) => !i.withdrawn);
  const works = worksForOrg(house);
  const live = works.filter(isLive);
  const interestFor = (w: Work) => interestsReceived.filter((i) => seed.opportunities.find((o) => o.id === i.opportunityId)?.project === w.title);
  return { works, live, interestFor, interestsReceived };
}

function HouseTop() {
  const { acting, openSheet, showToast, notifications } = useStore();
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
      <IconButton label="New project" onClick={() => showToast({ text: 'Creating a project is not designed yet' })}>
        <Plus size={22} />
      </IconButton>
    </header>
  );
}

/* ------------------------------------------------------------- Home, A: Slate */

/** A. Slate. Our work first, as artwork. Signals live on the project they belong to. */
export function ProductionHome() {
  const { houseHome } = useStore();
  if (houseHome === 'pulse') return <PulseHome />;
  if (houseHome === 'queue') return <QueueHome />;
  return <SlateHome />;
}

function SlateHome() {
  const { acting, push } = useStore();
  const { works, live, interestFor } = useSignals(acting);
  const lead = live[0];
  return (
    <div className="screen" data-scroll="home">
      <HouseTop />
      {lead ? (
        <PressCard className="slate-hero" onPress={() => push({ name: 'project', id: lead.id })} scale={0.985}>
          <Photo media={lead.stills[0] ?? lead.media} className="slate-hero-photo" showPlay={false} />
          <div className="slate-hero-text">
            <p className="now-card-kicker">{lead.stage}</p>
            <p className="slate-hero-title">{lead.title}</p>
            <Signals w={lead} interested={interestFor(lead).length} />
          </div>
        </PressCard>
      ) : (
        <EmptyHouse />
      )}
      <Around />
      <Slate works={works} />
      <PeopleForNeeds />
    </div>
  );
}

function Signals({ w, interested }: { w: Work; interested: number }) {
  const s = ws(w.id);
  const open = s.needs.filter((n) => n.state === 'open').length;
  const items = [interested && `${interested} interested`, open && `${open} roles open`, s.invites.length && `${s.invites.length} added, no credit yet`].filter(Boolean);
  return (
    <p className="slate-signals">
      {items.map((t) => (
        <span key={String(t)}>{t}</span>
      ))}
    </p>
  );
}

function EmptyHouse() {
  const { acting, showToast } = useStore();
  return (
    <div className="house-empty">
      <p className="title-2">Nothing in production</p>
      <p className="meta">Start a project when you're ready. {org(acting).name}'s past work already shows on your page.</p>
      <Button onClick={() => showToast({ text: 'New project: a title is enough to start' })}>Start a project</Button>
    </div>
  );
}

/** What is happening around our work: people, credits, interest. Only real events, newest first. */
function Around({ expanded }: { expanded?: boolean }) {
  const { acting, push, openSheet } = useStore();
  const { live, interestFor } = useSignals(acting);
  type Item = { key: string; faces: string[]; text: string; sub: string; poster?: Media; flag?: boolean; go: () => void };
  const items: Item[] = [];
  live.forEach((w) => {
    const ints = interestFor(w);
    if (ints.length)
      items.push({
        key: `i-${w.id}`,
        faces: ints.map((i) => i.personId),
        text: `${person(ints[0].personId).name}${ints.length > 1 ? ` and ${ints.length - 1} others` : ''} are interested`,
        sub: `${w.title} · open roles`,
        go: () => openSheet({ name: 'reviewInterest' }),
      });
  });
  Object.entries(PRIVATE).forEach(([wid, s]) => {
    const w = work(wid)!;
    if (!w.orgIds.includes(acting)) return;
    s.disputes.forEach((d) =>
      items.push({ key: `d-${wid}`, faces: [d.personId], text: `${person(d.personId).name} asked to correct a credit`, sub: `${w.title} · "${d.asked}"`, flag: true, go: () => push({ name: 'project', id: wid }) }),
    );
  });
  if (acting === 'konark') {
    items.push({ key: 'acc', faces: ['lakshmi'], text: 'Lakshmi Pillai accepted the credit as Amma', sub: 'Neela Akasham · now on the public page', go: () => push({ name: 'work', id: 'neela' }), poster: work('neela')!.media });
    items.push({ key: 'saw', faces: ['vikram', 'meera', 'devika'], text: 'Monsoon Letters credits are public', sub: 'Co-produced with Tidewater Films · 5 people', go: () => push({ name: 'work', id: 'monsoon' }), poster: work('monsoon')!.media });
  }
  if (!items.length) return null;
  const shown = expanded ? items : items.slice(0, 3);
  return (
    <section className="section">
      <SectionHeader title="Around your work" />
      <div className={`list list--flush ${expanded ? 'around--big' : ''}`}>
        {shown.map((it) => (
          <PressCard key={it.key} className={`around ${it.flag ? 'around--flag' : ''}`} onPress={it.go} scale={0.985}>
            <span className="faces">
              {it.faces.slice(0, 3).map((f) => (
                <Avatar key={f} party={person(f)} size={expanded ? 40 : 32} />
              ))}
            </span>
            <span className="around-text">
              <span className="item-title">{it.text}</span>
              <span className="meta">{it.sub}</span>
            </span>
            {it.poster && expanded && <Photo media={it.poster} className="around-poster" showPlay={false} />}
          </PressCard>
        ))}
      </div>
    </section>
  );
}

function Slate({ works, compact }: { works: Work[]; compact?: boolean }) {
  const { acting, push } = useStore();
  return (
    <section className="section">
      <SectionHeader title="Our slate" />
      <div className="rail">
        {works.map((w) => (
          <Pressable key={w.id} className="rail-item" scale={0.97} onClick={() => push({ name: isLive(w) || PRIVATE[w.id] ? 'project' : 'work', id: w.id })}>
            <Photo media={w.media} className={`rail-poster ${compact ? 'rail-poster--s' : ''}`} showPlay={false} />
            <p className="item-title">{w.title}</p>
            <p className="meta">{isLive(w) ? w.stage : w.orgIds[0] !== acting ? `Co-production · ${w.year}` : w.year}</p>
          </Pressable>
        ))}
        {acting === 'konark' && (
          <Pressable className="rail-item" scale={0.97} onClick={() => push({ name: 'project', id: UNTITLED.id })}>
            <span className={`rail-poster ph-noposter ${compact ? 'rail-poster--s' : ''}`}>
              <Lock size={20} />
            </span>
            <p className="item-title">{UNTITLED.title}</p>
            <p className="meta">Only your house sees this</p>
          </Pressable>
        )}
      </div>
    </section>
  );
}

/** Relevant people for needs the house hasn't opened yet: the network doing the work a job board would. */
function PeopleForNeeds() {
  const { acting, push } = useStore();
  if (acting !== 'konark') return null;
  const picks = [
    { p: person('rhea'), why: 'Colourist · still private on Neela Akasham' },
    { p: person('sameer'), why: 'Gaffer · lit Neeli Raat for you' },
  ];
  return (
    <section className="section">
      <SectionHeader title="For your needs" />
      <div className="list list--flush">
        {picks.map(({ p, why }) => (
          <PressCard key={p.id} className="prow" onPress={() => push({ name: 'profile', id: p.id })} scale={0.985}>
            <Avatar party={p} size={44} available={!!p.availableFrom} />
            <div className="prow-text">
              <p className="item-title">{p.name}</p>
              <p className="meta">{why}</p>
            </div>
          </PressCard>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Home, B: Pulse */

/** B. Pulse. What is happening around our work first. The slate is a shelf underneath. */
function PulseHome() {
  const { acting } = useStore();
  const { works, live } = useSignals(acting);
  return (
    <div className="screen" data-scroll="home">
      <HouseTop />
      {live.length ? null : <EmptyHouse />}
      <Around expanded />
      <PeopleForNeeds />
      <Slate works={works} compact />
    </div>
  );
}

/* ------------------------------------------------------------- Home, C: Queue */

/** C. Queue. Decisions first, then a plain list. Kept as the reference for the work-queue model. */
function QueueHome() {
  const { acting, push } = useStore();
  const { works, interestsReceived } = useSignals(acting);
  const invites = works.reduce((n, w) => n + ws(w.id).invites.length, 0);
  const disputes = works.reduce((n, w) => n + ws(w.id).disputes.length, 0);
  const attention = [
    interestsReceived.length && { label: 'Interest to review', n: `${interestsReceived.length}`, go: () => push({ name: 'project', id: 'neela' }) },
    disputes && { label: 'Credit correction asked', n: `${disputes}`, go: () => push({ name: 'project', id: 'neeliraat' }) },
    invites && { label: 'Added, no credit yet', n: `${invites}`, go: () => push({ name: 'project', id: 'neela' }) },
  ].filter(Boolean) as { label: string; n: string; go: () => void }[];
  return (
    <div className="screen" data-scroll="home">
      <HouseTop />
      {attention.length > 0 && (
        <section className="section">
          <SectionHeader title="Needs a decision" />
          <div className="list list--flush">
            {attention.map((a) => (
              <PressCard key={a.label} className="prow" onPress={a.go} scale={0.985}>
                <div className="prow-text">
                  <p className="item-title">{a.label}</p>
                </div>
                <span className="ph-count">{a.n}</span>
              </PressCard>
            ))}
          </div>
        </section>
      )}
      <section className="section">
        <SectionHeader title="Projects" />
        <div className="list list--flush">
          {works.map((w) => (
            <PressCard key={w.id} className="rrow" onPress={() => push({ name: 'project', id: w.id })} scale={0.985}>
              <Photo media={w.media} className="rrow-thumb" showPlay={false} />
              <div className="rrow-text">
                <p className="item-title">{w.title}</p>
                <p className="meta">{w.stage}</p>
              </div>
            </PressCard>
          ))}
        </div>
      </section>
      {!works.length && <EmptyHouse />}
    </div>
  );
}

/* --------------------------------------------------------- Private workspace */

const NEED_LABEL: Record<NeedState, string> = { private: 'Only your house', open: 'Open on Ana', filled: 'Filled' };

/** The house's private view of one project. The public page stays the source of what others see. */
export function ProjectScreen({ id }: { id: string }) {
  const { pop, push, showToast, openSheet, acting, interestsReceived, memberships, setActing } = useStore();
  const w = work(id);
  const s = ws(id);
  const [needs, setNeeds] = useState(s.needs);
  const title = w?.title ?? UNTITLED.title;
  const meta = w ? `${w.format} · ${w.stage}` : `${UNTITLED.format} · ${UNTITLED.stage}`;
  const people = [
    ...(w?.credits ?? []).map((c) => ({ personId: c.personId, position: c.role, dept: c.dept, state: 'confirmed' as const })),
    ...s.invites.map((i) => ({ ...i, state: 'invited' as const })),
  ];
  const depts = [...new Set(people.map((e) => e.dept))];
  // Opened from a notification while acting as yourself: show whose workspace this is, and require a switch to act.
  const houseId = w ? w.orgIds.find((x) => memberships.includes(x)) ?? w.orgIds[0] : 'konark';
  const canAct = acting === houseId;

  return (
    <div className="screen">
      <header className="topbar topbar--nav">
        <IconButton label="Back" onClick={pop}>
          <ChevronLeft size={26} />
        </IconButton>
        {w && (
          <button className="link" onClick={() => push({ name: 'work', id })}>
            View public page
          </button>
        )}
      </header>
      <div className="title-block">
        <p className="kicker">{meta}</p>
        <h1 className="large-title">{title}</h1>
        <p className="meta">
          {w ? `${w.orgIds.length > 1 ? 'Co-production' : 'Production'}: ${w.orgIds.map((o) => org(o).name).join(', ')}` : `Only ${org(acting).name} can see this project`}
        </p>
      </div>

      {!canAct && (
        <div className="acting-banner">
          <Avatar party={org(houseId)} size={28} />
          <span>
            <b>{org(houseId).name}</b>
            <span className="meta">You're viewing as yourself. Switch to act for the house.</span>
          </span>
          <Button size="s" onClick={() => setActing(houseId, false, true)}>
            Switch
          </Button>
        </div>
      )}

      {(!w || isLive(w)) && (
        <section className="section">
          <SectionHeader title="Roles to fill" />
          <p className="meta ph-note">Keep a role to your house, or open it on Ana so the right people can find it and show interest.</p>
          <div className="list list--flush">
            {needs.map((n) => {
              const ints = n.opportunityId ? interestsReceived.filter((i) => i.opportunityId === n.opportunityId && !i.withdrawn).length : 0;
              return (
                <div key={n.id} className="prow">
                  <div className="prow-text">
                    <p className="item-title">{n.position}</p>
                    <p className="meta">
                      {n.state === 'open' ? <Globe2 size={12} /> : <Lock size={12} />} {NEED_LABEL[n.state]}
                      {ints ? ` · ${ints} interested` : ''}
                    </p>
                  </div>
                  {n.state === 'private' ? (
                    <Button
                      size="s"
                      variant="outline"
                      disabled={!canAct}
                      onClick={() => {
                        setNeeds((xs) => xs.map((x) => (x.id === n.id ? { ...x, state: 'open' } : x)));
                        showToast({ text: `${n.position} is now open on Ana` });
                      }}
                    >
                      Open on Ana
                    </Button>
                  ) : (
                    <Button size="s" variant="secondary" disabled={!ints || !canAct} onClick={() => openSheet({ name: 'reviewInterest', opportunityId: n.opportunityId })}>
                      {ints ? 'Review' : 'No one yet'}
                    </Button>
                  )}
                </div>
              );
            })}
            {!needs.length && <p className="meta">No roles yet. Add one when you know what you need.</p>}
          </div>
        </section>
      )}

      {people.length > 0 && (
        <section className="section">
          <SectionHeader title="On this project" />
          <p className="meta ph-note">Added people are private to your house and them. Issue a credit when it's earned; it's public only once they accept.</p>
          {depts.map((d) => (
            <div key={d} className="ph-dept">
              <p className="meta">{d}</p>
              <div className="list list--flush">
                {people
                  .filter((e) => e.dept === d)
                  .map((e) => {
                    const p = person(e.personId);
                    const disputed = s.disputes.find((x) => x.personId === e.personId);
                    return (
                      <PressCard key={e.personId + e.position} className="prow" onPress={() => push({ name: 'profile', id: p.id })} scale={0.99}>
                        <Avatar party={p} size={40} />
                        <div className="prow-text">
                          <p className="item-title">{p.name}</p>
                          <p className="meta">{disputed ? `Asked for: ${disputed.asked}` : e.position}</p>
                        </div>
                        <span className={`ph-state ph-state--${disputed ? 'invited' : e.state}`}>{disputed ? 'Correction' : e.state === 'invited' ? 'Added' : 'Credited'}</span>
                      </PressCard>
                    );
                  })}
              </div>
            </div>
          ))}
          {s.disputes.length > 0 && (
            <Button block disabled={!canAct} onClick={() => showToast({ text: 'Credit updated. Sameer Ali will see the change.', tone: 'success' })}>
              Accept correction
            </Button>
          )}
        </section>
      )}

      {!w && (
        <section className="section">
          <p className="meta">Only a title so far. Share it on Ana when you want people to see it.</p>
        </section>
      )}
      <p className="end">
        <Verified size={12} /> Exploration: house workspace
      </p>
    </div>
  );
}
