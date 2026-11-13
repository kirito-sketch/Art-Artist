import { Check, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as seed from '../../data/seed';
import type { Craft } from '../../data/types';
import { INDUSTRIES, industriesFor, LEVELS, rolesFor, WORK_TYPES, type FieldDef } from '../../data/profileSchema';
import { gateTotal, missingForGate, timeLeft, type GateItem } from '../../domain/profileGates';
import { TEST_MODE } from '../../research-data/surface';
import { profileOf, type DetailValue } from '../../state/profile';
import { person } from '../../state/selectors';
import { useStore } from '../../state/store';
import { MobileVerify } from '../../ui/MobileVerify';
import { Button, Chip } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { InstagramField } from './InstagramField';

/*
 * Finish your profile (gate 2, src/domain/profileGates.ts). One question per screen, chips wherever the Master
 * Database has a list, saved the moment it is answered. Three ways in:
 *   - the checklist card on Home and on your own profile ("Finish now");
 *   - an action that needs a complete profile (apply, message, post): the sheet asks only what is missing, then
 *     carries on with what the person was doing;
 *   - any single item, from the checklist row.
 * "Skip for now" moves past an item for this session only. Nothing here is shown in /test.
 */

type Open = { reason?: string; then?: () => void; only?: string };
let opener: ((o: Open) => void) | null = null;
let check: (() => GateItem[]) | null = null;

/** The person's own open items, for the viewer acting as themself. Empty when nothing is owed (or in /test). */
export function useGate() {
  const { viewer, acting, profileVersion } = useStore();
  void profileVersion;
  if (TEST_MODE || acting !== 'self' || person(viewer.id)?.kind !== 'person') return { items: [] as GateItem[], total: 0 };
  const facts = { person: person(viewer.id), extra: profileOf(viewer.id), images: (seed.portfolio[viewer.id] ?? []).length };
  return { items: missingForGate(facts), total: gateTotal(facts) };
}

/** Open the sheet: from a checklist, or to finish one item. */
export const openFinish = (o: Open = {}) => opener?.(o);

/** The one detail that describes a piece of work in each craft: asked straight after an upload, while it is fresh. */
const TOOL_FIELD: Partial<Record<Craft, string>> = {
  cinematographer: 'cameras', camera: 'cameras', lighting: 'lighting', editor: 'editSoftware', colourist: 'editSoftware', vfx: 'vfxSoftware',
  sound: 'soundTools', music: 'daws', photography: 'photoCameras', director: 'genres', writing: 'genres', dance: 'danceForms',
  painting: 'artMedium', sculpture: 'artMedium', 'digital-art': 'artMedium', illustration: 'artMedium', installation: 'artMedium', printmaking: 'artMedium', 'mixed-media': 'artMedium',
};

/**
 * After a reel or images are saved: if the craft's "what did you make this with" detail is still empty, ask it now,
 * one question, in a sheet over the profile. Answered or not, it is never asked twice in one session. Returns whether
 * it will ask, so the caller can leave out its own "Saved" toast (the question covers it).
 */
const askedAfterUpload = new Set<string>();
export function askAfterUpload(): boolean {
  const items = check?.() ?? [];
  const craft = currentCraft?.();
  const id = craft && TOOL_FIELD[craft];
  if (!id || askedAfterUpload.has(id) || !items.some((i) => i.id === `field:${id}`)) return false;
  askedAfterUpload.add(id);
  // After the editor has closed, so the question opens over the profile.
  window.setTimeout(() => openFinish({ only: `field:${id}`, reason: 'About the work you just added' }), 650);
  return true;
}
let currentCraft: (() => Craft | undefined) | null = null;

/**
 * Wrap an action that needs a complete profile. Complete: it runs now. Not: the sheet asks what is missing and
 * runs the action once the last item is answered. Acting for a house never asks (the house is the actor).
 */
export function gated(reason: string, run: () => void) {
  return () => {
    if (!check || !check().length) return run();
    openFinish({ reason, then: run });
  };
}

export function FinishProfileHost() {
  const { viewer, saveProfile, push, showToast } = useStore();
  const { items, total } = useGate();
  const [open, setOpen] = useState<Open | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);
  useEffect(() => {
    opener = (o) => (setSkipped([]), setOpen(o));
    return () => void (opener = null);
  }, []);
  check = () => items;
  currentCraft = () => person(viewer.id)?.craft;

  const queue = open?.only ? items.filter((i) => i.id === open.only) : items.filter((i) => !skipped.includes(i.id));
  const current = queue[0];
  const close = () => setOpen(null);

  // The last answer: carry on with what the person was doing, or say they're done.
  useEffect(() => {
    if (!open || current) return;
    if (!items.length) {
      const then = open.then;
      setOpen(null);
      if (then) then();
      else showToast({ text: 'Profile complete. You can now apply and message.', tone: 'success' });
    } else setOpen(null); // the one item asked for is answered, or everything left was skipped
  }, [open, current, items.length]);

  const done = total - items.length;
  return (
    <Sheet open={!!open && !!current} onClose={close} title="" label="Finish your profile" className="fin-sheet">
      {open && current && (
        <div className="fin">
          <header className="fin-head">
            <Ring done={done} total={total} />
            <div>
              <p className="fin-kicker">{open.reason ?? 'Finish your profile'}</p>
              <p className="meta">
                {items.length} left · {timeLeft(items)}
              </p>
            </div>
          </header>
          <Question key={current.id} item={current} viewerId={viewer.id} save={(p, x) => saveProfile(p, x)} onWork={() => (close(), push({ name: 'editProfile', section: 'portfolio' }))} />
          {!open.only && (
            <button className="link link--small fin-skip" onClick={() => setSkipped((s) => [...s, current.id])}>
              Skip for now
            </button>
          )}
        </div>
      )}
    </Sheet>
  );
}

function Ring({ done, total }: { done: number; total: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const f = total ? done / total : 0;
  return (
    <span className="fin-ring" role="img" aria-label={`${done} of ${total} done`}>
      <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden>
        <circle cx="24" cy="24" r={r} className="fin-ring-track" />
        <circle cx="24" cy="24" r={r} className="fin-ring-fill" strokeDasharray={`${c * f} ${c}`} transform="rotate(-90 24 24)" />
      </svg>
      <b>{done}</b>
    </span>
  );
}

type Save = (p: Partial<import('../../data/types').Person>, x?: Partial<import('../../state/profile').ProfileExtra>) => void;

/** One question. Single choices save on tap; lists save on Next. */
function Question({ item, viewerId, save, onWork }: { item: GateItem; viewerId: string; save: Save; onWork: () => void }) {
  const me = person(viewerId);
  const x = profileOf(viewerId);
  if (item.kind === 'role') return <Single title="What is your role?" options={rolesFor(me.craft)} onPick={(v) => save({}, { craftRole: v })} />;
  if (item.kind === 'level') return <Single title="What level are you at?" options={LEVELS} onPick={(v) => save({}, { level: v })} />;
  if (item.kind === 'industry') return <Multi title="Which industries do you work in?" options={INDUSTRIES.map((i) => i.id)} initial={industriesFor(me.languages ?? [])} onSave={(v) => save({}, { industries: v })} />;
  if (item.kind === 'workTypes') return <Multi title="What kinds of work do you take?" options={WORK_TYPES} initial={[]} onSave={(v) => save({}, { workTypes: v })} />;
  if (item.kind === 'field' && item.field) return <FieldQuestion field={item.field} onSave={(v) => save({}, { details: { ...x.details, [item.field!.id]: v } })} />;
  if (item.kind === 'instagram')
    return (
      <div className="fin-q">
        <h2 className="fin-title">Your Instagram</h2>
        <p className="meta">Productions often look here first. Shown as a link on your profile.</p>
        <InstagramField />
      </div>
    );
  if (item.kind === 'phone')
    return (
      <div className="fin-q">
        <h2 className="fin-title">Verify your mobile</h2>
        <MobileVerify value={null} onChange={() => undefined} />
      </div>
    );
  return <WorkQuestion onLink={(url) => save({}, { workLinks: [...x.workLinks, { id: `w-${Date.now()}`, label: 'Work', url }] })} onWork={onWork} />;
}

/** A link finishes it here, so a blocked apply can carry on; images and a reel need the full portfolio page. */
function WorkQuestion({ onLink, onWork }: { onLink: (url: string) => void; onWork: () => void }) {
  const [url, setUrl] = useState('');
  const valid = /^https?:\/\/\S+\.\S+/.test(url.trim());
  return (
    <div className="fin-q">
      <h2 className="fin-title">Add your work</h2>
      <p className="meta">A reel, a few images or a link. Productions look at work before anything else.</p>
      <label className="field-label" htmlFor="fin-work-link">Link to your work</label>
      <input id="fin-work-link" className="field" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="YouTube, Vimeo, Google Drive or a website" />
      <Button block disabled={!valid} onClick={() => onLink(url.trim())}>
        Save link
      </Button>
      <button className="link fin-alt" onClick={onWork}>
        Upload images or a reel instead <ChevronRight size={14} aria-hidden />
      </button>
    </div>
  );
}

function Single({ title, options, onPick }: { title: string; options: string[]; onPick: (v: string) => void }) {
  return (
    <div className="fin-q">
      <h2 className="fin-title">{title}</h2>
      <div className="chips fin-chips" role="radiogroup" aria-label={title}>
        {options.map((o) => (
          <Chip key={o} active={false} onClick={() => onPick(o)}>
            {o}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Multi({ title, hint, options, initial, onSave }: { title: string; hint?: string; options: string[]; initial: string[]; onSave: (v: string[]) => void }) {
  const [v, setV] = useState(initial);
  return (
    <div className="fin-q">
      <h2 className="fin-title">{title}</h2>
      <p className="meta">{hint ?? 'Choose all that apply.'}</p>
      <div className="chips fin-chips" role="group" aria-label={title}>
        {options.map((o) => {
          const on = v.includes(o);
          return (
            <Chip key={o} active={on} onClick={() => setV(on ? v.filter((y) => y !== o) : [...v, o])}>
              {on && <Check size={14} aria-hidden />} {o}
            </Chip>
          );
        })}
      </div>
      <Button block disabled={!v.length} onClick={() => onSave(v)}>
        Next
      </Button>
    </div>
  );
}

function FieldQuestion({ field: f, onSave }: { field: FieldDef; onSave: (v: DetailValue) => void }) {
  const [lo, setLo] = useState('');
  const [hi, setHi] = useState('');
  const title = f.label;
  if (f.type === 'choice') return <Single title={title} options={f.options!} onPick={onSave} />;
  if (f.type === 'multi') return <Multi title={title} options={f.options!} initial={[]} onSave={onSave} />;
  const n = (s: string) => Number(s);
  const ok = f.type === 'number' ? lo !== '' && n(lo) >= f.min! && n(lo) <= f.max! : lo !== '' && hi !== '' && n(lo) >= f.min! && n(hi) <= f.max! && n(lo) <= n(hi);
  return (
    <div className="fin-q">
      <h2 className="fin-title">{title}</h2>
      <div className="ep-range">
        <input className="field" type="number" inputMode="numeric" min={f.min} max={f.max} value={lo} onChange={(e) => setLo(e.target.value)} aria-label={f.type === 'number' ? title : `${title} from`} />
        {f.type === 'range' && (
          <>
            <span aria-hidden>to</span>
            <input className="field" type="number" inputMode="numeric" min={f.min} max={f.max} value={hi} onChange={(e) => setHi(e.target.value)} aria-label={`${title} to`} />
          </>
        )}
        <span className="meta">{f.unit}</span>
      </div>
      <Button block disabled={!ok} onClick={() => onSave(f.type === 'number' ? n(lo) : [n(lo), n(hi)])}>
        Next
      </Button>
    </div>
  );
}

/** The checklist: on Home (first) and on your own profile. Rows open the sheet at that item. */
export function GateChecklist({ where }: { where: 'home' | 'profile' }) {
  const { items, total } = useGate();
  if (!items.length) return null;
  const done = total - items.length;
  return (
    <section className={`gate-card gate-card--${where}`} aria-label="Finish your profile">
      <div className="gate-top">
        <Ring done={done} total={total} />
        <div className="gate-text">
          <b>{where === 'profile' ? 'Your profile is not finished' : 'Finish your profile'}</b>
          <span className="meta">
            {items.length} left · {timeLeft(items)}. Then you can apply and message.
          </span>
        </div>
      </div>
      <ul className="gate-list">
        {items.slice(0, 4).map((i) => (
          <li key={i.id}>
            <button className="gate-row" onClick={() => openFinish({ only: i.id })}>
              <span className="gate-dot" aria-hidden />
              <span>{i.label}</span>
              <span className="meta">{i.seconds < 60 ? `${i.seconds} sec` : `${Math.round(i.seconds / 60)} min`}</span>
            </button>
          </li>
        ))}
        {items.length > 4 && <li className="meta gate-more">and {items.length - 4} more</li>}
      </ul>
      <Button block onClick={() => openFinish()}>
        Finish now
      </Button>
    </section>
  );
}
