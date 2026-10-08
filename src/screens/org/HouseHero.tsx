import { ChevronDown } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { Media, Org } from '../../data/types';
import { Avatar, Photo, Verified } from '../../ui/primitives';
import { scriptLang } from '../../ui/compose';

/*
 * The production house hero (docs/ux-refinement/PLAN.md, Stage 2): the same full-screen, image-led treatment as an
 * individual's profile, made more cinematic because a house's identity is its films. Its own stills play as a slow
 * reel: each frame holds with a gentle push-in, then dissolves into the next, the way a title sequence cuts between
 * shots. Nothing moves with Reduced Motion (the first still holds), and the reel only runs while the page is in view.
 *
 * Over the image, bottom-up like a film's title card: the house mark, an eyebrow (production house and city), the
 * name, its line, the record (projects, credited people, open roles), then the actions. A slate above names what
 * the house is making now.
 */
const HOLD = 6500;

export function HouseHero({ o, stills, slate, record, actions, bar, own, onSwitch, onExplore, active }: {
  o: Org;
  stills: Media[];
  slate?: { label: string; title: string };
  record: string[];
  actions: ReactNode;
  bar: ReactNode;
  own: boolean;
  onSwitch: () => void;
  onExplore: () => void;
  active: boolean;
}) {
  const reduce = useReducedMotion();
  const [shot, setShot] = useState(0);
  const moving = !reduce && stills.length > 1 && active;
  useEffect(() => {
    if (!moving) return;
    const t = window.setInterval(() => {
      if (!document.hidden) setShot((s) => (s + 1) % stills.length);
    }, HOLD);
    return () => window.clearInterval(t);
  }, [moving, stills.length]);

  return (
    <div className={`hhero${moving ? ' hhero--moving' : ''}`} data-hero>
      <div className="hhero-reel" aria-hidden>
        {stills.length ? (
          stills.map((m, i) => (
            <div key={m.id + i} className={`hhero-shot${i === shot ? ' is-on' : ''}`} style={{ animationDuration: `${HOLD + 1600}ms` }}>
              <Photo media={m} surface="project-hero" showPlay={false} alt="" priority={i === 0} />
            </div>
          ))
        ) : (
          <div className="hhero-shot is-on hhero-shot--empty" />
        )}
      </div>
      <span className="hhero-shade" aria-hidden />
      {bar}
      <div className="hhero-intro">
        {slate && (
          <p className="hhero-slate">
            <span>{slate.label}</span>
            {slate.title}
          </p>
        )}
        <span className="hhero-mark">
          <Avatar party={o} size={52} />
        </span>
        <p className="hhero-eyebrow">Production house · {o.city}</p>
        <h1 className="hhero-name" lang={scriptLang(o.name)}>
          {own ? (
            <button className="profile-name-switch" onClick={onSwitch} aria-label={`${o.name}, switch identity`}>
              {o.name}
              {o.verified && <Verified size={22} label="Verified production house" />}
              <ChevronDown size={20} aria-hidden />
            </button>
          ) : (
            <>
              {o.name}
              {o.verified && <Verified size={22} label="Verified production house" />}
            </>
          )}
        </h1>
        {o.about && <p className="hhero-line">{o.about}</p>}
        <p className="hhero-record">{record.join(' · ')}</p>
        {actions}
      </div>
      <button className="profile-scroll-cue hhero-cue" onClick={onExplore}>
        Explore work <ChevronDown size={17} />
      </button>
    </div>
  );
}
