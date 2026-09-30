import { motion } from 'framer-motion';
import { useState } from 'react';
import * as seed from '../../data/seed';
import { craftDef } from '../../data/crafts';
import type { Craft } from '../../data/types';
import { blockedBy, discoverableProjects, publicCreditsFor, recommendedRoles, searchableHouses } from '../../domain/discovery';
import { useStore } from '../../state/store';
import { forYou, person } from '../../state/selectors';
import { project as wproject } from '../../state/world';
import { CraftObject, type CraftObjectKind } from '../../ui/craft';
import { PortraitCard } from '../../ui/compose';
import { stagger } from '../../ui/motion';
import { Button, FollowButton, Photo, SectionHeader } from '../../ui/primitives';
import { FeaturedCard } from './OpportunityCard';

/*
 * First-run Home: the first screen after onboarding. It is built only from what onboarding captured
 * (craft, other crafts, city, languages, availability, work) and from real, discoverable content.
 * No network events, no invented activity: a new person has none, so none is shown. As their
 * network grows, the returning Home's modules take over (see HomeScreen).
 *
 * Every block carries data-world so the Phase 2 onboarding → Home transition can resolve the
 * sections around the craft object without another layout.
 */

const OBJECT_FOR: Partial<Record<Craft, CraftObjectKind>> = {
  cinematographer: 'lens',
  camera: 'lens',
  lighting: 'lens',
  editor: 'timeline',
  colourist: 'timeline',
  vfx: 'timeline',
  sound: 'microphone',
  music: 'microphone',
  'production-design': 'swatches',
  costume: 'swatches',
  makeup: 'swatches',
};

const jump = (id: string) => document.querySelector(`[data-world="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export function WorldIntro({ goDiscover }: { goDiscover: (scope?: string) => void }) {
  const { viewer, availability } = useStore();
  const me = person(viewer.id);
  const craft = craftDef(me.craft);
  const blocked = blockedBy(viewer.id);
  const roles = recommendedRoles(viewer.id, me.craft, blocked).length;
  const people = (seed.suggestedFor[viewer.id] ?? []).filter((id) => !blocked.includes(id)).length;
  const projects = discoverableProjects(blocked).length;
  const houses = searchableHouses(blocked).length;
  const kind = OBJECT_FOR[me.craft];
  const langs = me.languages?.length ? ` who works in ${listOf(me.languages)}` : '';
  const stills = discoverableProjects(blocked)
    .filter((w) => w.media.id !== 'ph')
    .slice(0, 3);

  return (
    <section className="world-intro" data-world="intro" aria-labelledby="world-title">
      <div className="world-visual" data-world-anchor aria-hidden>
        {kind ? (
          <span className="world-object">
            <span className="object-tile-shadow" />
            <span className="object-tile-asset">
              <CraftObject kind={kind} size={120} />
            </span>
          </span>
        ) : (
          <span className="world-stills">
            {stills.map((w) => (
              <Photo key={w.id} media={w.stills[0] ?? w.media} showPlay={false} />
            ))}
          </span>
        )}
      </div>
      <p className="world-kicker">
        {craft?.label ?? me.role} · {me.city}
      </p>
      <h1 className="world-title" id="world-title">
        Your world on Ana
      </h1>
      <p className="world-line">
        Picked for {article(craft?.person ?? me.role)} {(craft?.person ?? me.role).toLowerCase()} in {me.city}
        {langs}.{availability.open ? ` You're shown as available ${availability.from === 'Now' ? 'now' : `from ${availability.from}`}.` : ''}
      </p>
      <dl className="world-sheet">
        {(
          [
            ['roles', 'Roles', roles],
            ['people', 'People', people],
            ['projects', 'Projects', projects],
            ['houses', 'Houses', houses],
          ] as const
        ).map(([id, label, n]) => (
          <button key={id} className="world-sheet-cell" onClick={() => (id === 'roles' ? goDiscover('roles') : jump(id))} aria-label={id === 'roles' ? `${n} open roles in your craft, open in Discover` : `${n} ${label.toLowerCase()}, jump to section`}>
            <dt>{label}</dt>
            <dd>{n}</dd>
          </button>
        ))}
      </dl>
    </section>
  );
}

export function FirstRoles({ goDiscover }: { goDiscover: (scope?: string) => void }) {
  const { viewer, scenario, push } = useStore();
  const me = person(viewer.id);
  const opps = forYou(viewer, scenario);
  // Say only what matching actually used: the craft, and the city where the role is in it.
  const why = opps.some((o) => o.city.includes(me.city)) ? 'your craft and your city' : 'your craft';
  return (
    <section className="cards-roles v-section" data-world="roles">
      <SectionHeader title="Roles for you" action="See all" onAction={() => goDiscover('roles')} />
      <p className="world-why">Matched on {why}. Every open role is in Discover.</p>
      {opps.length ? (
        <div className="carousel carousel--roles">
          {opps.map((o, i) => (
            <motion.div key={o.id} className="carousel-item" {...stagger(i, 0.05)}>
              <FeaturedCard o={o} onOpen={() => push({ name: 'opportunity', id: o.id })} />
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="meta">No roles match your craft yet. More appear as productions post; every open role is in Discover.</p>
      )}
    </section>
  );
}

/** People in your craft, each shown on their own credited work, with the reason they are here. */
export function FirstPeople() {
  const { viewer, following, toggleFollow, push } = useStore();
  const me = person(viewer.id);
  const blocked = blockedBy(viewer.id);
  const ids = (seed.suggestedFor[viewer.id] ?? []).filter((id) => !blocked.includes(id));
  if (!ids.length) return null;
  return (
    <section className="v-section" data-world="people">
      <SectionHeader title="People in your craft" />
      <div className="portrait-rail">
        {ids.map((id) => {
          const p = person(id);
          const credit = publicCreditsFor(id)[0];
          const w = credit ? wproject(credit.projectId) : undefined;
          const sameCraft = p.craft === me.craft || (me.crafts ?? []).includes(p.craft);
          const reason = sameCraft && p.city === me.city ? `Your craft, in ${me.city}` : sameCraft ? `Your craft · ${p.city}` : `In ${p.city}`;
          return (
            <PortraitCard
              key={id}
              person={p}
              still={w?.artwork ?? seed.portfolio[id]?.[0]}
              context={reason}
              onPress={() => push({ name: 'profile', id })}
              action={<FollowButton on={following.includes(id)} onToggle={() => toggleFollow(id)} name={p.name} block />}
            />
          );
        })}
      </div>
    </section>
  );
}

/** One quiet next step, only while something useful is missing. Never a checklist. */
export function FirstStep() {
  const { viewer, push, userPortfolio, availability, openSheet } = useStore();
  const [dismissed, setDismissed] = useState(false);
  const hasWork = (seed.portfolio[viewer.id]?.length ?? 0) + userPortfolio.length > 0;
  const step = !hasWork
    ? { t: 'Add your work', b: 'Stills or a reel let productions see what you do before they message you.', a: 'Add work', go: () => push({ name: 'editProfile' }) }
    : !availability.open
      ? { t: 'Set your availability', b: 'Productions filter by dates. Say when you can take work.', a: 'Set dates', go: () => openSheet({ name: 'availability' }) }
      : !seed.about[viewer.id]
        ? { t: 'Add a short bio', b: 'Two lines on the work you do and the work you want.', a: 'Add bio', go: () => push({ name: 'editProfile' }) }
        : null;
  if (!step || dismissed) return null;
  return (
    <aside className="first-step" aria-label="Next step">
      <div>
        <p className="item-title">{step.t}</p>
        <p className="meta">{step.b}</p>
      </div>
      <div className="first-step-actions">
        <Button size="s" variant="secondary" onClick={step.go}>
          {step.a}
        </Button>
        <button className="link link--small" onClick={() => setDismissed(true)}>
          Later
        </button>
      </div>
    </aside>
  );
}

function listOf(xs: string[]) {
  return xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
}

function article(word: string) {
  return /^[aeiou]/i.test(word) ? 'an' : 'a';
}
