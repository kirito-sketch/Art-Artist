import { ChevronLeft, Lock, Plus, Globe2 } from 'lucide-react';
import { useState } from 'react';
import * as seed from '../../data/seed';
import type { Media } from '../../data/types';
import { useStore } from '../../state/store';
import { org, person } from '../../state/selectors';
import { Avatar, Button, IconButton, Photo, PressCard, SectionHeader, Verified } from '../../ui/primitives';

/*
 * EXPLORATION, not confirmed architecture. See docs/PRODUCTION_HOUSE_EXPLORATION.md.
 * Hypotheses under test:
 *  H1  A house lands on its projects, not on a dashboard. Urgent items sit above the list only when they exist.
 *  H2  "Requirement" and "opportunity" are one thing: a project need. It starts private and becomes an
 *      opportunity when the house opens it on Ana.
 *  H3  "People on a project" is the credits list in progress, not crew management.
 */

type NeedState = 'private' | 'open' | 'filled';
interface Need {
  id: string;
  position: string;
  dept: string;
  state: NeedState;
  interested?: number;
  opportunityId?: string;
}
interface Engagement {
  personId?: string;
  name?: string;
  position: string;
  dept: string;
  state: 'invited' | 'confirmed';
  addedBy?: string;
}
interface Project {
  id: string;
  title: string;
  format: string;
  stage: 'Development' | 'Pre-production' | 'Shooting' | 'Released';
  media?: Media;
  needs: Need[];
  people: Engagement[];
  credits?: { published: number; disputed: number };
}

const m = (src: string): Media => ({ id: src, kind: 'image', src: `images/${src}.jpg` });

const PROJECTS: Project[] = [
  {
    id: 'neela',
    title: 'Neela Akasham',
    format: 'Feature film · Telugu',
    stage: 'Pre-production',
    media: m('covers/neela'),
    needs: [
      { id: 'n1', position: 'Director of Photography', dept: 'Camera', state: 'open', interested: 9, opportunityId: 'o-neela-dop' },
      { id: 'n2', position: 'Supporting · Journalist', dept: 'Cast', state: 'open', interested: 14, opportunityId: 'o-neela-journalist' },
      { id: 'n3', position: 'Colourist', dept: 'Post', state: 'private' },
      { id: 'n4', position: 'Gaffer', dept: 'Lighting', state: 'private' },
    ],
    people: [
      { name: 'Ravi Teja Varma', position: 'Director', dept: 'Direction', state: 'confirmed' },
      { name: 'Aditi Ghosh', position: 'Crew coordinator', dept: 'Production', state: 'confirmed' },
      { personId: 'ishaan', position: 'Production designer', dept: 'Art', state: 'confirmed' },
      { personId: 'sana', position: '1st AC', dept: 'Camera', state: 'invited', addedBy: 'pending DoP' },
      { personId: 'lakshmi', position: 'Lead · Amma', dept: 'Cast', state: 'confirmed' },
    ],
  },
  {
    id: 'neeli',
    title: 'Neeli Raat',
    format: 'Feature film · Telugu',
    stage: 'Released',
    media: m('covers/salt-2'),
    needs: [],
    people: [],
    credits: { published: 38, disputed: 1 },
  },
  { id: 'untitled', title: 'Untitled thriller', format: 'Web series · Hindi', stage: 'Development', needs: [], people: [] },
];

const HOUSE = 'konark';

export function ProductionHome() {
  const { push, showToast } = useStore();
  const house = org(HOUSE);
  const [projects] = useState(PROJECTS);
  const interested = projects.flatMap((p) => p.needs).reduce((n, x) => n + (x.interested ?? 0), 0);
  const invites = projects.flatMap((p) => p.people).filter((e) => e.state === 'invited').length;
  const disputed = projects.reduce((n, p) => n + (p.credits?.disputed ?? 0), 0);
  const attention = [
    interested && { label: 'Interest to review', detail: 'Neela Akasham · 2 open needs', n: `${interested} people`, go: () => push({ name: 'project', id: 'neela' }) },
    disputed && { label: 'Credit disputed', detail: 'Neeli Raat', n: `${disputed}`, go: () => push({ name: 'project', id: 'neeli' }) },
    invites && { label: 'Invites not yet accepted', detail: 'Neela Akasham', n: `${invites}`, go: () => push({ name: 'project', id: 'neela' }) },
  ].filter(Boolean) as { label: string; detail: string; n: string; go: () => void }[];

  return (
    <div className="screen" data-scroll="home">
      <header className="topbar">
        <span className="ph-house">
          <Avatar party={house} size={32} />
          <span>
            <span className="item-title">{house.name} <Verified size={13} /></span>
            <span className="meta ph-acting">Acting for the house</span>
          </span>
        </span>
        <IconButton label="New project" onClick={() => showToast({ text: 'New project: title, format, language. Everything else later.' })}>
          <Plus size={22} />
        </IconButton>
      </header>

      {attention.length > 0 && (
        <section className="section">
          <SectionHeader title="Needs a decision" />
          <div className="list list--flush">
            {attention.map((a) => (
              <PressCard key={a.label} className="prow" onPress={a.go} scale={0.985}>
                <div className="prow-text">
                  <p className="item-title">{a.label}</p>
                  <p className="meta">{a.detail}</p>
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
          {projects.map((p) => {
            const open = p.needs.filter((n) => n.state === 'open').length;
            const priv = p.needs.filter((n) => n.state === 'private').length;
            const line =
              p.stage === 'Released' ? `${p.credits?.published ?? 0} credits published` : p.needs.length ? `${open} open on Ana · ${priv} private` : 'No needs yet';
            return (
              <PressCard key={p.id} className="rrow" onPress={() => push({ name: 'project', id: p.id })} scale={0.985}>
                {p.media ? <Photo media={p.media} className="rrow-thumb" showPlay={false} /> : <span className="rrow-thumb ph-noposter">{p.title[0]}</span>}
                <div className="rrow-text">
                  <p className="item-title">{p.title}</p>
                  <p className="meta meta--dark">{p.stage}</p>
                  <p className="meta">{line}</p>
                </div>
              </PressCard>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const NEED_LABEL: Record<NeedState, string> = { private: 'Private', open: 'Open on Ana', filled: 'Filled' };

export function ProjectScreen({ id }: { id: string }) {
  const { pop, push, showToast } = useStore();
  const base = PROJECTS.find((p) => p.id === id)!;
  const [needs, setNeeds] = useState(base.needs);
  const depts = [...new Set(base.people.map((e) => e.dept))];

  return (
    <div className="screen">
      <header className="topbar topbar--nav">
        <IconButton label="Back" onClick={pop}>
          <ChevronLeft size={26} />
        </IconButton>
      </header>
      <div className="title-block">
        <p className="kicker">{base.format} · {base.stage}</p>
        <h1 className="large-title">{base.title}</h1>
        <p className="meta">Lead: {org(HOUSE).name}</p>
      </div>

      {base.stage !== 'Released' && (
        <section className="section">
          <SectionHeader title="Needs" />
          <p className="meta ph-note">A need is private to the house until you open it on Ana. Then people can find it and respond.</p>
          <div className="list list--flush">
            {needs.map((n) => (
              <div key={n.id} className="prow">
                <div className="prow-text">
                  <p className="item-title">{n.position}</p>
                  <p className="meta">
                    {n.state === 'open' ? <Globe2 size={12} /> : <Lock size={12} />} {NEED_LABEL[n.state]}
                    {n.interested ? ` · ${n.interested} interested` : ''}
                  </p>
                </div>
                {n.state === 'private' ? (
                  <Button
                    size="s"
                    variant="outline"
                    onClick={() => {
                      setNeeds((xs) => xs.map((x) => (x.id === n.id ? { ...x, state: 'open', interested: 0 } : x)));
                      showToast({ text: `${n.position} is now open on Ana` });
                    }}
                  >
                    Open on Ana
                  </Button>
                ) : (
                  <Button size="s" variant="secondary" onClick={() => (n.opportunityId ? push({ name: 'opportunity', id: n.opportunityId }) : showToast({ text: 'No one yet' }))}>
                    Review
                  </Button>
                )}
              </div>
            ))}
            {!needs.length && <p className="meta">Nothing needed yet.</p>}
          </div>
        </section>
      )}

      {base.people.length > 0 && (
        <section className="section">
          <SectionHeader title="People on this project" />
          <p className="meta ph-note">This list becomes the credits when the project wraps. People confirm before anything is public.</p>
          {depts.map((d) => (
            <div key={d} className="ph-dept">
              <p className="meta">{d}</p>
              <div className="list list--flush">
                {base.people
                  .filter((e) => e.dept === d)
                  .map((e, i) => {
                    const p = e.personId ? person(e.personId) : null;
                    return (
                      <PressCard key={i} className="prow" onPress={() => p && push({ name: 'profile', id: p.id })} scale={0.99}>
                        {p ? <Avatar party={p} size={40} /> : <span className="ph-initial">{e.name![0]}</span>}
                        <div className="prow-text">
                          <p className="item-title">{p?.name ?? e.name}</p>
                          <p className="meta">{e.position}</p>
                        </div>
                        <span className={`ph-state ph-state--${e.state}`}>{e.state === 'invited' ? 'Invited' : 'Confirmed'}</span>
                      </PressCard>
                    );
                  })}
              </div>
            </div>
          ))}
          <Button variant="outline" block onClick={() => showToast({ text: 'Add someone you already work with' })}>
            Add someone
          </Button>
        </section>
      )}

      {base.credits && (
        <section className="section">
          <SectionHeader title="Credits" />
          <div className="list list--flush">
            <div className="prow">
              <div className="prow-text">
                <p className="item-title">{base.credits.published} published</p>
                <p className="meta">Accepted by each person</p>
              </div>
            </div>
            <PressCard className="prow" onPress={() => showToast({ text: 'Sameer Ali says the role should read Chief Lighting Technician' })} scale={0.99}>
              <div className="prow-text">
                <p className="item-title">{base.credits.disputed} disputed</p>
                <p className="meta">Review the correction the person asked for</p>
              </div>
              <span className="ph-state ph-state--invited">Review</span>
            </PressCard>
          </div>
        </section>
      )}

      {base.stage === 'Development' && (
        <section className="section">
          <p className="meta">Only a title so far. Add a poster, people or needs whenever you're ready.</p>
        </section>
      )}
      <p className="end">{seed.orgs.length ? 'Exploration: production house' : ''}</p>
    </div>
  );
}
