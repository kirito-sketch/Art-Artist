import { ChevronDown, Play } from 'lucide-react';
import type { ReactNode, RefObject } from 'react';
import type { Direction } from '../../ui/designDirection';
import { Verified } from '../../ui/primitives';

/*
 * The identity layer of a profile hero for the three review directions (docs/PROFILE_GLASS_DIRECTIONS.md). The same
 * facts in every direction; only composition and CTA treatment differ. Actions come in as ready elements so the
 * Follow, Message and Edit rules stay where they are.
 */
export type HeroFacts = {
  name: string;
  verified?: boolean;
  /** The craft line ("Director of Photography") or, for a house, "Production house". */
  role: string;
  place: string;
  /** Credibility in a few words: "4 verified credits", "11 years", "3 projects". */
  facts: string[];
  /** "Open to work from 3 Oct", or for a house "2 open roles". */
  status?: string;
  /** A short line of context: the start of the bio, or what the house is making now. */
  lede?: string;
  /** A kicker for the lede card ("Now making"). */
  ledeKicker?: string;
  nameRef?: RefObject<HTMLHeadingElement>;
  nameSwitch?: { label: string; onPress: () => void };
};

export function HeroIntro({ dir, facts, primary, secondary, onPlay }: { dir: Exclude<Direction, 'current'>; facts: HeroFacts; primary: ReactNode; secondary?: ReactNode; onPlay?: () => void }) {
  const name = (
    <h1 ref={facts.nameRef} className="dirh-name" lang="en">
      {facts.nameSwitch ? (
        <button className="dirh-name-switch" onClick={facts.nameSwitch.onPress} aria-label={facts.nameSwitch.label}>
          {facts.name}
          {facts.verified && <Verified size={20} label="Verified" />}
          <ChevronDown size={18} aria-hidden />
        </button>
      ) : (
        <>
          {facts.name}
          {facts.verified && <Verified size={20} label="Verified" />}
        </>
      )}
    </h1>
  );
  const play = onPlay && (
    <button className="cta-icon cta-icon--glass" onClick={onPlay} aria-label="Play showreel">
      <Play size={18} fill="currentColor" aria-hidden />
    </button>
  );
  const actions = (
    <div className="dirh-actions">
      {primary}
      {secondary}
      {play}
    </div>
  );

  if (dir === 'a')
    // Poster: centred title, one glass card for context, one glass action group (the reference's composition).
    return (
      <div className="dirh dirh--a">
        {name}
        <p className="dirh-role">{facts.role}</p>
        <p className="dirh-place">{facts.place}</p>
        <div className="glass-card dirh-card">
          {facts.ledeKicker && <span className="dirh-kicker">{facts.ledeKicker}</span>}
          {facts.lede && <p className="dirh-lede">{facts.lede}</p>}
          <p className="dirh-facts">{[...facts.facts, facts.status].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="glass-group">{actions}</div>
      </div>
    );

  if (dir === 'b')
    // Title card: a film's lower third. Craft as an eyebrow, the name large, facts as small glass chips, then actions.
    return (
      <div className="dirh dirh--b">
        <p className="dirh-eyebrow">{facts.role}</p>
        {name}
        <p className="dirh-place">{facts.place}</p>
        <ul className="dirh-chips" aria-label="At a glance">
          {facts.facts.map((f) => (
            <li key={f} className="glass-chip">
              {f}
            </li>
          ))}
          {facts.status && <li className="glass-chip glass-chip--status">{facts.status}</li>}
        </ul>
        {actions}
      </div>
    );

  // Framed print: the photo is a framed print, the identity a solid panel below it. Glass only for controls on the image.
  return (
    <div className="dirh dirh--c">
      <p className="dirh-eyebrow">{facts.role}</p>
      {name}
      <p className="dirh-place">{[facts.place, ...facts.facts].join(' · ')}</p>
      {facts.status && <p className="dirh-status">{facts.status}</p>}
      {actions}
    </div>
  );
}
