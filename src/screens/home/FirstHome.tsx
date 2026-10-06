import { motion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import * as seed from '../../data/seed';
import { useStore } from '../../state/store';
import { spring } from '../../ui/motion';
import { Button } from '../../ui/primitives';
import { useLearned } from '../../ui/learned';
import { TEST_MODE } from '../../research-data/surface';
import { craftProfile, setsFor, skillCategoriesFor, SKILL_CATEGORIES } from '../../data/profileSchema';
import { engaged, later, nextPrompt, openSteps, pendingForPhone, profileOf, readPacing, writePacing, type Step } from '../../state/profile';
import { org, person } from '../../state/selectors';
import { project as wproject } from '../../state/world';

/*
 * First-run Home: the first screen after onboarding. It is built only from what onboarding captured
 * (craft, other crafts, city, languages, availability, work) and from real, discoverable content.
 * No network events, no invented activity: a new person has none, so none is shown. As their
 * network grows, the returning Home's modules take over (see HomeScreen).
 *
 * Every block carries data-world so the Phase 2 onboarding → Home transition can resolve the
 * sections around the craft object without another layout.
 */

/*
 * Onboarding → first Home (signature, Level 3). The first time a person's world is shown, the craft
 * object arrives slightly larger and settles into its corner; the intro's words, then its counts,
 * then the sections nudge into place. Nothing starts hidden: the static layout is complete from the
 * first frame, motion only settles it. Once per person per session; reduced motion: no travel.
 */
const formed = new Set<string>();

export function useWorldForming(active: boolean) {
  const { viewer } = useStore();
  const forming = active && !formed.has(viewer.id);
  // Marked after the first paint: the motion values above are read only when each element mounts.
  useEffect(() => {
    if (active) formed.add(viewer.id);
  }, [active, viewer.id]);
  return forming;
}

/** A first-run section resolving into place after the intro. */
export function Resolve({ forming, i, children }: { forming: boolean; i: number; children: ReactNode }) {
  return (
    <motion.div initial={forming ? { y: 18 } : false} animate={{ y: 0 }} transition={{ ...spring.settle, delay: 0.3 + i * 0.07 }}>
      {children}
    </motion.div>
  );
}

/**
 * One quiet next step on Home (docs/REVIEW_EVENTS_PROFILE.md §10): one at a time, at most once per session;
 * Later snoozes it for 14 days and three Laters in a row mean 30 quiet days. No percentage. Each step opens
 * the same Edit Profile page. A record a production added against your verified number comes first.
 * On a first Home it also says hello by name (welcome), in place of a toast over the page.
 */
export function FirstStep({ welcome }: { welcome?: string } = {}) {
  if (TEST_MODE) return <StudyStep welcome={welcome} />;
  return <NextStep welcome={welcome} />;
}

/** This session's step per person: chosen once, never swapped while the person is looking. */
const sessionStep = new Map<string, Step | 'done'>();

function NextStep({ welcome }: { welcome?: string }) {
  const { viewer, push, availability, openSheet, intent, profileVersion } = useStore();
  void profileVersion;
  const me = person(viewer.id);
  const x = profileOf(viewer.id);
  const pending = x.phone?.verified ? pendingForPhone(x.phone.number) : [];
  const steps = openSteps({ person: me, extra: x, images: (seed.portfolio[viewer.id] ?? []).length, availabilityOpen: availability.open, wantsWork: intent === 'work' || intent === 'collaborate' });
  if (!sessionStep.has(viewer.id)) sessionStep.set(viewer.id, nextPrompt(steps, readPacing(viewer.id), Date.now()) ?? 'done');
  const chosen = sessionStep.get(viewer.id)!;
  const [, setHidden] = useState(false);

  if (pending.length) {
    const a = pending[0];
    const p = wproject(a.projectId);
    return (
      <Card welcome={welcome} title={`${p?.houseId ? org(p.houseId).name : 'A production'} added your number to ${p?.workingTitle}`} body={`As ${a.workingRole}. Is this you?`} action="Review" onAction={() => push({ name: 'editProfile', section: 'contact' })} />
    );
  }
  if (chosen === 'done' || !steps.includes(chosen)) return null;
  const crafts = [me.craft, ...(me.crafts ?? [])];
  const set = setsFor(crafts)[0];
  const cats = skillCategoriesFor(crafts).map((c) => SKILL_CATEGORIES.find((k) => k.id === c)?.label.toLowerCase()).filter(Boolean);
  const work = craftProfile(me.craft).work;
  const COPY: Record<Step, { t: string; b: string; a: string; go: () => void }> = {
    phone: { t: 'Verify your mobile number', b: 'Helps us match production credits and keep your professional record connected to you.', a: 'Verify', go: () => push({ name: 'editProfile', section: 'contact' }) },
    photo: { t: 'Add a profile photo', b: 'People recognise a face before a name.', a: 'Add photo', go: () => push({ name: 'editProfile', section: 'identity' }) },
    work: { t: work.prompt.title, b: work.prompt.body, a: 'Add', go: () => push({ name: 'editProfile', section: 'portfolio' }) },
    languages: { t: 'Add the languages you work in', b: 'Productions often look for people by language.', a: 'Add languages', go: () => push({ name: 'editProfile', section: 'languages' }) },
    availability: { t: 'Set your availability', b: 'Productions filter by dates. Say when you can take work.', a: 'Set dates', go: () => openSheet({ name: 'availability' }) },
    details: { t: `Add your ${set?.label.toLowerCase() ?? 'details'}`, b: 'The specifics productions look for in your craft.', a: 'Add', go: () => push({ name: 'editProfile', section: `details:${set?.id}` }) },
    skills: { t: 'Add your skills', b: cats.length ? `Productions look for ${cats.slice(0, 3).join(', ')}.` : 'What you can do on a set.', a: 'Add skills', go: () => push({ name: 'editProfile', section: 'skills' }) },
  };
  const c = COPY[chosen];
  return (
    <Card
      welcome={welcome}
      title={c.t}
      body={c.b}
      action={c.a}
      onAction={() => (writePacing(viewer.id, engaged(readPacing(viewer.id))), c.go())}
      onLater={() => {
        writePacing(viewer.id, later(readPacing(viewer.id), chosen, Date.now()));
        sessionStep.set(viewer.id, 'done');
        setHidden(true);
      }}
    />
  );
}

function Card({ welcome, title, body, action, onAction, onLater }: { welcome?: string; title: string; body: string; action: string; onAction: () => void; onLater?: () => void }) {
  return (
    <aside className="first-step" aria-label="Next step">
      <div>
        {welcome && <p className="first-step-welcome">Welcome, {welcome}</p>}
        <p className="item-title">{title}</p>
        <p className="meta">{body}</p>
      </div>
      <div className="first-step-actions">
        <Button size="s" variant="secondary" onClick={onAction}>
          {action}
        </Button>
        {onLater && (
          <button className="link link--small" onClick={onLater}>
            Later
          </button>
        )}
      </div>
    </aside>
  );
}

/** The /test study keeps the step it was designed with (portfolio, availability, bio). */
function StudyStep({ welcome }: { welcome?: string }) {
  const { viewer, push, availability, openSheet } = useStore();
  const hasWork = (seed.portfolio[viewer.id]?.length ?? 0) > 0 || !!profileOf(viewer.id).reel;
  const step = !hasWork
    ? { k: 'portfolio', t: 'Add to your portfolio', b: 'Stills or a reel let productions see what you do before they message you.', a: 'Add stills', go: () => push({ name: 'editProfile', section: 'portfolio' }) }
    : !availability.open
      ? { k: 'availability', t: 'Set your availability', b: 'Productions filter by dates. Say when you can take work.', a: 'Set dates', go: () => openSheet({ name: 'availability' }) }
      : !seed.about[viewer.id]
        ? { k: 'bio', t: 'Add a short bio', b: 'Two lines on the work you do and the work you want.', a: 'Add bio', go: () => push({ name: 'editProfile', section: 'about' }) }
        : null;
  const [dismissed, dismiss] = useLearned(viewer.id, `later:${step?.k ?? 'none'}`);
  if (!step || dismissed) return null;
  return <Card welcome={welcome} title={step.t} body={step.b} action={step.a} onAction={step.go} onLater={dismiss} />;
}
