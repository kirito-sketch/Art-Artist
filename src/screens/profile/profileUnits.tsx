import { useFeatures } from '../../ui/features';
import { ShowreelMedia } from './Showreel';
import { craftDef } from '../../data/crafts';
import { ExternalLink, Play } from 'lucide-react';
import { useState } from 'react';
import * as seed from '../../data/seed';
import { categoryOf, craftProfile, EXPERIENCE, setsFor, skillDef, VISIBILITY_LABEL, type FieldDef } from '../../data/profileSchema';
import type { Person } from '../../data/types';
import { useStore } from '../../state/store';
import { org } from '../../state/selectors';
import { canSee, openSteps, profileOf, visibilityOf, type DetailValue, type Step, type Viewer } from '../../state/profile';
import { Photo, SectionHeader } from '../../ui/primitives';

/* What the profile shows from the role-aware profile (docs/REVIEW_EVENTS_PROFILE.md §6 to §11). */

/** Who is looking, for visibility: the person, someone acting for a verified house, or anyone else. */
export function useViewerKind(personId: string): Viewer {
  const { viewer, acting } = useStore();
  if (personId === viewer.id) return 'self';
  return acting !== 'self' && org(acting).verified ? 'production' : 'member';
}

const show = (f: FieldDef, v: DetailValue): string => (f.type === 'range' && Array.isArray(v) ? `${v[0]}–${v[1]}` : f.type === 'number' ? `${v} ${f.unit ?? ''}`.trim() : Array.isArray(v) ? v.join(', ') : String(v));

/** The reel: a link out (Ana doesn't host video in v1), with its cover. */
export function ReelCard({ person, active = true }: { person: Person; active?: boolean }) {
  const district = useFeatures().home === 'district';
  const x = profileOf(person.id);
  if (!x.reel) return null;
  if (district) return <section className="section section--flush"><SectionHeader title="Showreel" /><ShowreelMedia reel={x.reel} active={active} /></section>;
  const host = x.reel.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
  return (
    <section className="section section--flush">
      <SectionHeader title={craftProfile(person.craft).work.reel ?? 'Showreel'} />
      <a className="reel" href={x.reel.url} target="_blank" rel="noopener noreferrer" aria-label={`${x.reel.title}, opens ${host}`}>
        {x.reel.cover ? <Photo media={x.reel.cover} showPlay={false} /> : <span className="reel-blank" />}
        <span className="reel-play" aria-hidden>
          <Play size={20} fill="currentColor" strokeWidth={0} />
        </span>
        <span className="reel-caption">
          <span className="item-title">{x.reel.title}</span>
          <span className="reel-sub">
            {[x.reel.duration, host].filter(Boolean).join(' · ')} <ExternalLink size={12} aria-hidden />
          </span>
        </span>
      </a>
    </section>
  );
}

/** Craft details and skills, each detail shown only to whoever its visibility allows. */
export function ProfileDetails({ person }: { person: Person }) {
  const who = useViewerKind(person.id);
  const x = profileOf(person.id);
  const sets = setsFor([person.craft, ...(person.crafts ?? [])]);
  const rows = sets.flatMap((s) => s.fields.filter((f) => x.details[f.id] !== undefined && canSee(visibilityOf(x, f.id), who)).map((f) => ({ f, v: x.details[f.id] })));
  const exp = EXPERIENCE.find((e) => e.id === x.experience)?.label;
  const skills = x.skills.map((k) => ({ k, d: skillDef(k.id) })).filter((s) => s.d);
  const crafts = [person.craft, ...(person.crafts ?? [])];
  return (
    <>
      {(skills.length > 0 || x.suggestedSkills.length > 0) && (
        <section className="section section--flush">
          <SectionHeader title="Skills" />
          <ul className="pf-skills" aria-label="Skills">
            {skills.map(({ k, d }) => (
              <li key={k.id} className="pf-skill">
                {d!.label}
                {(k.level || k.cert) && <small>{[k.level, k.cert && categoryOf(d!.category)?.cert ? k.cert : ''].filter(Boolean).join(' · ')}</small>}
              </li>
            ))}
            {x.suggestedSkills.map((s) => (
              <li key={s} className="pf-skill">
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}
      {(crafts.length > 0 || rows.length > 0 || exp || x.workTypes.length > 0) && (
        <section className="section section--flush">
          <SectionHeader title="Professional details" />
          <dl className="pf-details">
            <dt>Primary craft</dt><dd>{person.role || craftDef(person.craft)?.label}</dd>
            {!!person.crafts?.length && <><dt>Other crafts</dt><dd>{person.crafts.map(c => craftDef(c)?.label ?? c).join(', ')}</dd></>}
            {!!person.languages?.length && <><dt>Languages</dt><dd>{person.languages.join(', ')}</dd></>}
            {person.specialisation && <><dt>Specialisation</dt><dd>{person.specialisation}</dd></>}
            {!!person.years && <><dt>Years active</dt><dd>{person.years}</dd></>}
            {exp && (
              <>
                <dt>Experience</dt>
                <dd>{exp}</dd>
              </>
            )}
            {rows.map(({ f, v }) => (
              <div key={f.id} style={{ display: 'contents' }}>
                <dt>{f.label}</dt>
                <dd>
                  {show(f, v)}
                  {who === 'self' && visibilityOf(x, f.id) !== 'public' && <span className="meta"> · {VISIBILITY_LABEL[visibilityOf(x, f.id)]}</span>}
                </dd>
              </div>
            ))}
            {x.workTypes.length > 0 && (
              <>
                <dt>Work</dt>
                <dd>{x.workTypes.join(', ')}</dd>
              </>
            )}
          </dl>
        </section>
      )}
    </>
  );
}

export function WorkLinks({ person }: { person: Person }) {
  const district = useFeatures().home === 'district';
  const x = profileOf(person.id);
  const links = [...(district ? [] : x.workLinks), ...x.links];
  if (!links.length) return null;
  return (
    <section className="section section--flush">
      <SectionHeader title="Links" />
      <div className="pf-links">
        {links.map((l) => (
          <a key={l.id} className="pf-reel-link" href={l.url} target="_blank" rel="noopener noreferrer">
            {l.label || l.url.replace(/^https?:\/\//, '')} <ExternalLink size={13} aria-hidden />
          </a>
        ))}
      </div>
    </section>
  );
}

/** "Ways to be found": private to you, the same open items as Home's prompt, each opening its Edit Profile page. */
export function WaysToBeFound({ person }: { person: Person }) {
  const { push, openSheet, availability, intent, viewer, profileVersion } = useStore();
  void profileVersion;
  const KEY = `aa-ways-hidden:${viewer.id}`;
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  });
  const x = profileOf(person.id);
  const steps = openSteps({ person, extra: x, images: (seed.portfolio[person.id] ?? []).length, availabilityOpen: availability.open, wantsWork: intent === 'work' || intent === 'collaborate' });
  if (hidden || !steps.length) return null;
  const set = setsFor([person.craft, ...(person.crafts ?? [])])[0];
  const LABEL: Record<Step, [string, () => void]> = {
    phone: ['Verify your mobile number', () => push({ name: 'editProfile', section: 'contact' })],
    photo: ['Add a profile photo', () => push({ name: 'editProfile', section: 'identity' })],
    work: [craftProfile(person.craft).work.prompt.title, () => push({ name: 'editProfile', section: 'portfolio' })],
    languages: ['Add your languages', () => push({ name: 'editProfile', section: 'languages' })],
    availability: ['Set your availability', () => openSheet({ name: 'availability' })],
    details: [`Add your ${set?.label.toLowerCase() ?? 'details'}`, () => push({ name: 'editProfile', section: `details:${set?.id}` })],
    skills: ['Add your skills', () => push({ name: 'editProfile', section: 'skills' })],
  };
  return (
    <section className="ways" aria-label="Ways to be found. Only you can see this">
      <div className="ways-head">
        <b>Ways to be found</b>
        <button
          className="link link--small"
          onClick={() => {
            setHidden(true);
            try {
              localStorage.setItem(KEY, '1');
            } catch {
              /* storage blocked: hidden for this session */
            }
          }}
        >
          Hide
        </button>
      </div>
      <p className="meta">Only you see this.</p>
      <ul>
        {steps.map((s) => (
          <li key={s}>
            <button className="ways-item" onClick={LABEL[s][1]}>
              <span className="ways-dot" aria-hidden />
              <span>{LABEL[s][0]}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
