import { useEffect } from 'react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useStore } from '../state/store';
import { TEST_STATES, type Flow, type Persona } from './studioData';

/*
 * Studio links (docs/STUDIO.md) open the app already set up: who you are (?as), a walkthrough (?flow) and
 * test states (?state). Read once at load; nothing persists, so a reload of the same link starts it again.
 */
const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
export const FROM_STUDIO = params.get('from') === 'studio';
/** Review only: Home as it would be six days on with nothing new since (the quiet-week Home). */
export const QUIET_WEEK = (params.get('state') ?? '').split(',').includes('quietWeek');
const STAND_IN = params.get('media') === 'standin';

const PERSONAS: Persona[] = ['kiran', 'tara', 'konark', 'tidewater'];
const FLOWS: Flow[] = ['new', 'signin', 'invite', 'policy'];

export function DeepLink() {
  const { setActing, switchViewer, setScenario, setCanIssue, verifyPendingHouses, startEntry, setPolicyUpdate, push, updateProject } = useStore();
  useEffect(() => {
    const as = params.get('as') as Persona | null;
    const flow = params.get('flow') as Flow | null;
    const states = (params.get('state') ?? '').split(',').filter(Boolean);
    if (as && PERSONAS.includes(as)) {
      if (as === 'kiran' || as === 'tara') {
        setActing('self');
        switchViewer(as);
      } else {
        switchViewer('aditi');
        setActing(as);
      }
    }
    const tests = TEST_STATES.filter((t) => states.includes(t.key));
    if (tests.length) setScenario(Object.fromEntries(tests.map((t) => [t.key, true])));
    if (states.includes('noIssue')) setCanIssue(false);
    if (states.includes('housesVerified')) verifyPendingHouses();
    if (flow === 'policy') {
      setActing('self');
      switchViewer('kiran');
      setPolicyUpdate(true);
    } else if (flow && FLOWS.includes(flow)) startEntry(flow);
    // ?announce=kaal: Konark shares Kaal before it has any pictures (the same action as "Share on Art and Artist").
    if (params.get('announce') === 'kaal') updateProject('kaal', { shared: true, publicTitle: 'Kaal' });
    // ?open=work:<id> opens a project page straight away (the project media states in Studio).
    const [kind, id] = (params.get('open') ?? '').split(':');
    if (kind === 'work' && id) window.setTimeout(() => push({ name: 'work', id }), 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Development only, no UI: walkthrough scripts switch persona mid-session (a house issues a credit, the
  // person accepts it), which a Studio link can't do because every link starts fresh.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as { __anaAs?: (p: Persona) => void; __anaFlow?: (f: Flow) => void };
    w.__anaAs = (p) => {
      if (p === 'kiran' || p === 'tara') {
        setActing('self');
        switchViewer(p);
      } else {
        switchViewer('aditi');
        setActing(p);
      }
    };
    w.__anaFlow = (f) => {
      if (f === 'policy') {
        setActing('self');
        switchViewer('kiran');
        setPolicyUpdate(true);
      } else startEntry(f);
    };
  });
  return null;
}

/** Outside the phone: the way back to Studio, only when Studio opened this page. */
export function BackToStudio() {
  if (!FROM_STUDIO) return null;
  return (
    <a className="studio-back" href="/studio">
      <ArrowLeft size={14} aria-hidden /> Studio
    </a>
  );
}

/** Outside the phone: says when a test state is on, so nobody reviews a failure state by accident. */
export function StageNotice() {
  const { scenario, setScenario } = useStore();
  const on = TEST_STATES.filter((t) => scenario[t.key]);
  const review = [QUIET_WEEK && 'Quiet week (Home six days on, nothing new)', STAND_IN && 'Stand-in clip on Kaaval, made from its own stills (no real footage yet)'].filter(Boolean);
  if (!on.length && !review.length) return null;
  return (
    <div className="stage-notice" role="status">
      {on.length > 0 && (
        <span className="stage-notice-item stage-notice-item--warn">
          <AlertTriangle size={13} /> Test state: {on.map((t) => t.label).join(', ')}
          <button onClick={() => setScenario(Object.fromEntries(TEST_STATES.map((t) => [t.key, false])))}>Clear</button>
        </span>
      )}
      {review.map((r) => (
        <span key={String(r)} className="stage-notice-item stage-notice-item--warn">
          <AlertTriangle size={13} /> Review: {r}
        </span>
      ))}
    </div>
  );
}
