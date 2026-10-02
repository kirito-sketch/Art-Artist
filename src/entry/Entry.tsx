import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, Camera, Check, ChevronLeft, ChevronRight, Eye, EyeOff, Lock, Mail, Users } from 'lucide-react';
import { cloneElement, isValidElement, useEffect, useId, useState, type ReactElement, type ReactNode } from 'react';
import { focusInto, rovingIndex, rovingKeys } from '../ui/a11y';
import { CRAFTS, headline } from '../data/crafts';
import * as seed from '../data/seed';
import type { Craft, Media } from '../data/types';
import { DraftTag, LegalDocView, type DocId } from '../legal/docs';
import { useStore, type Availability } from '../state/store';
import { org } from '../state/selectors';
import { Avatar, Button, Photo, Toggle, Verified } from '../ui/primitives';
import { Logo } from '../ui/Logo';
import { SplashMark } from '../ui/SplashMark';
import { StatusBar } from '../ui/chrome';
import { Sheet } from '../ui/Sheet';
import { DateField, fmtDay } from '../ui/fields';
import { MediaPicker } from '../screens/create/PostComposer';
import { research } from '../research-data/client';
import { INTENTS, type Intent } from '../domain/relevance';

/*
 * How someone enters Art and Artist. One splash (only as long as loading), one entry screen, then account,
 * consent, a short onboarding, and (for an invited person) the organisation invitation.
 * Apple, Google and email are the ways in. Phone is verification and linking only, never a login.
 */

type Step = 'splash' | 'intro' | 'entry' | 'email' | 'signin' | 'forgot' | 'consent' | 'verify' | 'you' | 'now' | 'invite' | 'inviteTip';

/** The demo invitation: Art and Artist's team set up Saffron Reel Studios and invited Meena by work email. */
const INVITE = { orgId: 'saffron', email: 'meena@saffronreel.in', name: 'Meena Iyer', invitedBy: 'the Art and Artist team', canIssue: true };
const KNOWN: Record<string, string> = { kiran: 'kiran', tara: 'tara', aditi: 'aditi' };
const CITIES = ['Hyderabad', 'Mumbai', 'Chennai', 'Kochi', 'Bengaluru', 'Kolkata'];
const art = (n: string): Media => ({ id: `entry-${n}`, kind: 'image', src: `images/brand/entry/${n}.jpg` });

export function EntryFlow() {
  const store = useStore();
  const { entry, endEntry, recordConsent, createPerson, switchViewer, setActing, addMembership, showToast } = store;
  const invite = entry?.mode === 'invite';
  const [step, setStep] = useState<Step>(entry?.mode === 'signin' ? 'entry' : 'splash');
  const [history, setHistory] = useState<Step[]>([]);
  const [via, setVia] = useState<'apple' | 'google' | 'email'>('email');
  const [provider, setProvider] = useState<null | 'apple' | 'google'>(null);
  const [legal, setLegal] = useState<DocId | null>(null);
  // Account
  const [email, setEmail] = useState(invite ? INVITE.email : '');
  const [password, setPassword] = useState('');
  // Profile
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string | undefined>();
  // V30: onboarding asks only what personalises the first Home (identity, craft, intent, city, and
  // availability when it matters). Everything else is profile completion, later. Every choice is
  // kept when you go Back, and can be changed or cleared.
  const [primary, setPrimary] = useState<Craft | null>(invite ? 'production' : null);
  const [intent, setIntent] = useState<Intent | null>(invite ? 'hire' : null);
  const [city, setCity] = useState('');
  const [avail, setAvail] = useState<'now' | 'from'>('now');
  const [availFrom, setAvailFrom] = useState('');
  const [personId, setPersonId] = useState<string | null>(null);
  const asksAvailability = intent === 'work' || intent === 'collaborate';

  // Splash: the mark draws itself once (about 1.2s), then the next screen follows as soon as its first
  // image is ready. A slow load holds the finished mark still (no replay); capped so it never hangs.
  const [markDone, setMarkDone] = useState(false);
  const [nextReady, setNextReady] = useState(false);
  const after: Step = entry?.mode === 'new' ? 'intro' : 'entry';
  useEffect(() => {
    if (step !== 'splash') return;
    let live = true;
    const ready = () => live && setNextReady(true);
    const img = new Image();
    img.onload = img.onerror = ready;
    img.src = art(after === 'intro' ? INTRO[0].art : 'chair').src;
    if (img.complete) ready();
    const cap = window.setTimeout(ready, 4000);
    return () => {
      live = false;
      window.clearTimeout(cap);
    };
  }, [step]);
  useEffect(() => {
    if (step === 'splash' && markDone && nextReady) setStep(after);
  }, [step, markDone, nextReady]);
  const [splashGone, setSplashGone] = useState(step !== 'splash');
  useEffect(() => {
    if (step === 'splash' || splashGone) return;
    const t = window.setTimeout(() => setSplashGone(true), 500); // in case transitionend never fires
    return () => window.clearTimeout(t);
  }, [step, splashGone]);

  // Research observation only (a no-op outside a test session): which first-run screen is showing.
  useEffect(() => {
    if (step !== 'intro') research.track('onboarding_step_viewed', { metadata: { step } });
  }, [step]);

  // Each step is a new screen: focus moves to its heading (or its auto-focused field), so keyboard and
  // screen-reader users start at the top of what is now showing.
  useEffect(() => {
    let f2 = 0;
    const f1 = requestAnimationFrame(() => {
      f2 = requestAnimationFrame(() => {
        const page = document.querySelector('.phone .entry-page');
        const a = document.activeElement;
        if (page && !(a && a !== document.body && page.contains(a))) focusInto(page);
      });
    });
    return () => {
      cancelAnimationFrame(f1);
      cancelAnimationFrame(f2);
    };
  }, [step]);

  const go = (s: Step) => {
    setHistory((h) => [...h, step]);
    setStep(s);
  };
  const back = () => {
    const h = [...history];
    const prev = h.pop();
    if (prev) research.track('onboarding_step_back', { metadata: { from: step } });
    setHistory(h);
    if (prev) setStep(prev);
  };

  const signInAs = (id: string) => {
    endEntry();
    setActing('self');
    switchViewer(id);
    showToast({ text: `Welcome back, ${id[0].toUpperCase()}${id.slice(1)}` });
  };

  const finishProfile = () => {
    const role = headline(primary!);
    const availability: Availability = asksAvailability ? { open: true, from: avail === 'from' && availFrom ? fmtDay(availFrom) : 'Now', scope: city.trim() } : { open: false, from: 'Now', scope: city.trim() };
    const id = createPerson({ name: name.trim(), photo, craft: primary!, crafts: [], specialisation: '', role, city: city.trim(), travel: false, languages: [], availability, work: [], email, intent: intent ?? undefined });
    setPersonId(id);
    if (invite) return go('invite');
    endEntry();
    setActing('self');
    switchViewer(id);
    showToast({ text: `Welcome to Art and Artist, ${name.split(' ')[0]}` });
  };

  const steps: Step[] = ['you', 'now'];
  const stepIndex = steps.indexOf(step);

  const overImage = ['intro', 'entry', 'you', 'now', 'invite', 'inviteTip'].includes(step);
  return (
    <div className="entry">
      <div className="entry-status">
        <StatusBar tone={overImage ? 'light' : 'dark'} />
      </div>
      <AnimatePresence mode="wait">
        {step !== 'splash' && (
        <motion.div key={step} className="entry-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          {step === 'intro' && <Intro onDone={() => setStep('entry')} />}

          {step === 'entry' && (
            <div className="entry-home">
              <div className="entry-art">
                <Photo media={art('chair')} className="splash-art" showPlay={false} />
                <div className="entry-fade" />
              </div>
              <div className="entry-body">
                <div className="entry-logo">
                  <Logo />
                </div>
                {entry?.notice && <p className="inline-note">{entry.notice}</p>}
                {invite && (
                  <div className="invite-banner">
                    <Avatar party={org(INVITE.orgId)} size={36} />
                    <span>
                      <b>{org(INVITE.orgId).name}</b> invited you to act for them on Art and Artist
                    </span>
                  </div>
                )}
                <h1 className="entry-line">Where film people find each other and build a record of their work.</h1>
                <div className="entry-actions">
                  <button className="auth-btn auth-btn--apple" onClick={() => (setVia('apple'), setProvider('apple'))}>
                    <AppleMark /> Continue with Apple
                  </button>
                  <button className="auth-btn" onClick={() => (setVia('google'), setProvider('google'))}>
                    <span className="g-mark">G</span> Continue with Google
                  </button>
                  <button className="auth-btn" onClick={() => (setVia('email'), go('email'))}>
                    <Mail size={17} /> Continue with email
                  </button>
                </div>
                <p className="entry-signin">
                  Already on Art and Artist?{' '}
                  <button className="link" onClick={() => go('signin')}>
                    Sign in
                  </button>
                </p>
                <p className="entry-legal">
                  <button onClick={() => setLegal('terms')}>Terms</button> · <button onClick={() => setLegal('privacy')}>Privacy</button> · <button onClick={() => setLegal('conduct')}>Community guidelines</button>
                </p>
              </div>
            </div>
          )}

          {step === 'email' && (
            <Form title="Create your account" onBack={back}>
              <Field label="Email">
                <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" autoFocus />
              </Field>
              <PasswordField value={password} onChange={setPassword} autoComplete="new-password" hint="At least 8 characters. A mix of words is easiest to remember." />
              <Button block size="l" disabled={!/.+@.+\..+/.test(email) || password.length < 8} aria-describedby="signup-missing" onClick={() => go('consent')}>
                Continue
              </Button>
              <Missing id="signup-missing" items={[!/.+@.+\..+/.test(email) && 'a valid email address', password.length < 8 && (password ? `${8 - password.length} more password ${8 - password.length === 1 ? 'character' : 'characters'}` : 'a password of at least 8 characters')]} />
            </Form>
          )}

          {step === 'signin' && <SignIn onBack={back} onForgot={() => go('forgot')} onDone={signInAs} onCreate={() => go('email')} onProvider={(p) => (setVia(p), setProvider(p))} />}
          {step === 'forgot' && <Forgot onBack={back} onDone={signInAs} />}

          {step === 'consent' && (
            <Consent
              onBack={back}
              openDoc={setLegal}
              onAgree={(marketing) => {
                recordConsent(['Terms of Service', 'Privacy Policy', 'Age 18 or older', ...(marketing ? ['Product emails'] : [])], 'Signup');
                go(via === 'email' ? 'verify' : 'you');
              }}
            />
          )}

          {step === 'verify' && <Verify email={email} onBack={back} onDone={() => go('you')} />}

          {step === 'you' && (
            <Onboard step={stepIndex} total={steps.length} image="badge" title="About you" onBack={back}>
              <div className="ob-photo">
                <Avatar party={{ id: 'draft', kind: 'person', name: name || 'You', role: '', craft: 'actor', city: '', tone: 3, photo }} size={88} />
                <PhotoPicker onPick={setPhoto} has={!!photo} />
              </div>
              <Field label="Your name">
                <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="As it appears in credits" autoComplete="name" autoFocus />
              </Field>
              <p className="meta">The name you work under. Productions credit you by it. Photo is optional.</p>
              <p className="field-label">Your main craft</p>
              <div className="craft-grid" role="radiogroup" aria-label="Your main craft" onKeyDown={(e) => rovingKeys(e)}>
                {CRAFTS.map((c, i) => (
                  <button key={c.id} role="radio" aria-checked={primary === c.id} tabIndex={rovingIndex(primary === c.id, i, !!primary)} className={`craft-tile ${primary === c.id ? 'is-on' : ''}`} onClick={() => setPrimary(primary === c.id ? null : c.id)}>
                    {c.label}
                  </button>
                ))}
              </div>
              <p className="meta">Do more than one thing? Add other crafts from your profile later.</p>
              <Button block size="l" disabled={!name.trim() || !primary} aria-describedby="you-missing" onClick={() => go('now')}>
                Continue
              </Button>
              <Missing id="you-missing" items={[!name.trim() && 'your name', !primary && 'your main craft']} />
            </Onboard>
          )}

          {step === 'now' && (
            <Onboard step={stepIndex} total={steps.length} image="search" title="What brings you here?" onBack={back}>
              <p className="meta">This shapes what Art and Artist shows you first. Change it any time from Home.</p>
              <div className="intent-list" role="radiogroup" aria-label="What are you looking to do right now?" onKeyDown={(e) => rovingKeys(e)}>
                {INTENTS.map((it, i) => (
                  <button key={it.id} role="radio" aria-checked={intent === it.id} tabIndex={rovingIndex(intent === it.id, i, !!intent)} className={`intent-option ${intent === it.id ? 'is-on' : ''}`} onClick={() => setIntent(it.id)}>
                    <span className="intent-option-label">{it.label}</span>
                    <span className="meta">{it.hint}</span>
                  </button>
                ))}
              </div>
              <Field label="Where are you based?">
                <input className="field" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your base city" autoComplete="address-level2" />
              </Field>
              <div className="chips chips--tight">
                {CITIES.map((c) => (
                  <button key={c} className={`chip ${city === c ? 'is-on' : ''}`} onClick={() => setCity(city === c ? '' : c)} aria-pressed={city === c}>
                    {c}
                  </button>
                ))}
              </div>
              {asksAvailability && (
                <>
                  <p className="field-label">When can you start?</p>
                  <div className="seg" role="radiogroup" aria-label="When can you start?" onKeyDown={(e) => rovingKeys(e)}>
                    {(
                      [
                        ['now', 'Now'],
                        ['from', 'From a date'],
                      ] as const
                    ).map(([k, l]) => (
                      <button
                        key={k}
                        role="radio"
                        aria-checked={avail === k}
                        tabIndex={avail === k ? 0 : -1}
                        className={avail === k ? 'is-on' : ''}
                        onClick={() => {
                          setAvail(k);
                          if (k === 'now') setAvailFrom(''); // a date never lingers behind "Now"
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  {avail === 'from' && <DateField className="field" value={availFrom} onChange={setAvailFrom} label="Available from" placeholder="Choose a start date" />}
                </>
              )}
              <Button block size="l" disabled={!intent || !city.trim()} aria-describedby="now-missing" onClick={finishProfile}>
                {invite ? 'Continue' : 'Show me what matters'}
              </Button>
              <Missing id="now-missing" items={[!intent && 'what brings you here', !city.trim() && 'where you are based']} />
              <p className="meta ob-later">Your work, other crafts, languages and a bio can be added from your profile whenever you like.</p>
            </Onboard>
          )}

          {step === 'invite' && personId && (
            <Invitation
              accountEmail={email}
              onSwitchEmail={() => setEmail(INVITE.email)}
              onAccept={() => {
                addMembership(personId, INVITE.orgId);
                recordConsent([`Authority to act for ${org(INVITE.orgId).name}`], 'Invite');
                go('inviteTip');
              }}
              onDecline={() => {
                endEntry();
                setActing('self');
                switchViewer(personId);
                showToast({ text: `Invitation declined. ${org(INVITE.orgId).name} has been told.` });
              }}
            />
          )}

          {step === 'inviteTip' && personId && (
            <div className="ob">
              <Photo media={art('badge')} className="ob-art" showPlay={false} />
              <div className="ob-body">
                <h1 className="ob-title">You can now act for {org(INVITE.orgId).name}</h1>
                <p className="body">Switch between yourself and {org(INVITE.orgId).name} from your name at the top of your profile, or from the house name on its Home. Your own profile and credits always stay yours.</p>
                <div className="switch-demo">
                  <span className="switch-demo-row is-on">
                    <Avatar party={seed.parties[personId]} size={28} /> {name}
                  </span>
                  <span className="switch-demo-row">
                    <Avatar party={org(INVITE.orgId)} size={28} /> {org(INVITE.orgId).name} <Verified size={12} />
                  </span>
                </div>
                <Button
                  block
                  size="l"
                  onClick={() => {
                    endEntry();
                    switchViewer(personId);
                    setActing(INVITE.orgId);
                  }}
                >
                  Switch to {org(INVITE.orgId).name}
                </Button>
                <Button
                  block
                  size="l"
                  variant="secondary"
                  onClick={() => {
                    endEntry();
                    setActing('self');
                    switchViewer(personId);
                  }}
                >
                  Stay as myself
                </Button>
              </div>
            </div>
          )}
        </motion.div>
        )}
      </AnimatePresence>
      {/* The splash sits above and fades out while the next screen fades in: one continuous crossfade,
          no empty frame between them. A CSS transition, so its last frame is never repainted. */}
      {!splashGone && (
        <div className={`splash${step === 'splash' ? '' : ' is-leaving'}`} aria-hidden={step !== 'splash' || undefined} onTransitionEnd={(e) => e.target === e.currentTarget && setSplashGone(true)}>
          <SplashMark onDone={() => setMarkDone(true)} />
          <span className="sr-only" role="status">
            Loading Art and Artist
          </span>
        </div>
      )}

      <Sheet open={!!provider} onClose={() => setProvider(null)} title="" label={provider === 'apple' ? 'Sign in with Apple' : 'Choose a Google account'}>
        {provider && (
          <ProviderSheet
            kind={provider}
            invite={invite}
            onPick={(acct) => {
              setProvider(null);
              setEmail(acct.email);
              setName(acct.name);
              if (history.includes('signin') || step === 'signin') {
                const k = Object.keys(KNOWN).find((x) => acct.email.includes(x));
                return k ? signInAs(KNOWN[k]) : undefined;
              }
              go('consent');
            }}
          />
        )}
      </Sheet>
      <Sheet open={!!legal} onClose={() => setLegal(null)} title="" label="Legal document" size="tall">
        {legal && <LegalDocView id={legal} />}
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------ pieces */

function Form({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return (
    <div className="auth">
      <header className="auth-bar">
        <button className="icon-btn" aria-label="Back" onClick={onBack}>
          <ChevronLeft size={26} />
        </button>
      </header>
      <h1 className="ob-title">{title}</h1>
      <div className="stack">{children}</div>
    </div>
  );
}

/**
 * A labelled field. Its hint and error are tied to the input (aria-describedby), an error marks it
 * invalid and is announced, so the label, the instructions and what went wrong are all read out.
 */
function Field({ label, hint, error, children }: { label: string; hint?: ReactNode; error?: ReactNode; children: ReactNode }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;
  const control = isValidElement(children) ? cloneElement(children as ReactElement<Record<string, unknown>>, { 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined }) : children;
  return (
    <div className="ob-field-wrap">
      <label className="ob-field">
        <span className="field-label">{label}</span>
        {control}
      </label>
      {hint && (
        <p className="meta field-hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" id={errId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Says what is still needed while a button is disabled, so nobody has to guess (WCAG 3.3.2). */
function Missing({ id, items }: { id: string; items: (string | false)[] }) {
  const need = items.filter(Boolean) as string[];
  if (!need.length) return <span id={id} hidden />;
  const list = need.length === 1 ? need[0] : `${need.slice(0, -1).join(', ')} and ${need[need.length - 1]}`;
  return (
    <p className="meta missing-hint" id={id}>
      To continue, add {list}.
    </p>
  );
}

function PasswordField({ value, onChange, autoComplete = 'current-password', hint, error }: { value: string; onChange: (s: string) => void; autoComplete?: string; hint?: ReactNode; error?: ReactNode }) {
  const [show, setShow] = useState(false);
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className="ob-field-wrap">
      <div className="ob-field">
        <label className="field-label" htmlFor={`${id}-pw`}>
          Password
        </label>
        <span className="pw">
          <input
            id={`${id}-pw`}
            className="field"
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete={autoComplete}
            aria-describedby={[hintId, errId].filter(Boolean).join(' ') || undefined}
            aria-invalid={error ? true : undefined}
          />
          <button type="button" className="pw-toggle" aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} onClick={() => setShow((s) => !s)}>
            {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </button>
        </span>
      </div>
      {hint && (
        <p className="meta field-hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" id={errId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Onboard({ step, total, image, title, onBack, onSkip, skipLabel = 'Skip', children }: { step: number; total: number; image: string; title: string; onBack: () => void; onSkip?: () => void; skipLabel?: string; children: ReactNode }) {
  return (
    <div className="ob">
      <div className="ob-top">
        <Photo media={art(image)} className="ob-art" showPlay={false} />
        <div className="ob-nav">
          <button className="icon-btn icon-btn--float" aria-label="Back" onClick={onBack}>
            <ChevronLeft size={24} />
          </button>
          {onSkip && (
            <button className="ob-skip" onClick={onSkip}>
              {skipLabel}
            </button>
          )}
        </div>
      </div>
      <div className="ob-body">
        <div className="ob-progress" role="progressbar" aria-label="Profile setup" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1} aria-valuetext={`Step ${step + 1} of ${total}`}>
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={i <= step ? 'is-on' : ''} />
          ))}
        </div>
        <h1 className="ob-title">{title}</h1>
        <div className="stack">{children}</div>
      </div>
    </div>
  );
}

function PhotoPicker({ onPick, has }: { onPick: (src: string) => void; has: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="link" onClick={() => setOpen(true)}>
        <Camera size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
        {has ? 'Change photo' : 'Add a photo (optional)'}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Profile photo" size="tall">
        <MediaPicker
          single
          selected={[]}
          onDone={(ms: Media[]) => {
            if (ms[0]) onPick(ms[0].src);
            setOpen(false);
          }}
        />
      </Sheet>
    </>
  );
}

/** Apple / Google account chooser (simulated system sheet). */
function ProviderSheet({ kind, invite, onPick }: { kind: 'apple' | 'google'; invite: boolean; onPick: (a: { name: string; email: string }) => void }) {
  const accounts =
    kind === 'google'
      ? invite
        ? [
            { name: INVITE.name, email: INVITE.email },
            { name: INVITE.name, email: 'meena.iyer@gmail.com' },
          ]
        : [
            { name: 'Nila Varghese', email: 'nila.varghese@gmail.com' },
            { name: 'Kiran Varma', email: 'kiran.varma@gmail.com' },
          ]
      : [{ name: invite ? INVITE.name : 'Nila Varghese', email: 'x7p2k@privaterelay.appleid.com' }];
  return (
    <div className="stack">
      <p className="title-2">{kind === 'google' ? 'Choose an account' : 'Sign in with Apple'}</p>
      <p className="meta">to continue to Art and Artist</p>
      <div className="list list--flush">
        {accounts.map((a) => (
          <button key={a.email} className="prow provider-row" onClick={() => onPick(a)}>
            <span className="ph-initial">{a.name[0]}</span>
            <span className="prow-text">
              <span className="item-title">{a.name}</span>
              <span className="meta">{kind === 'apple' ? 'Hide my email' : a.email}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SignIn({ onBack, onForgot, onDone, onCreate, onProvider }: { onBack: () => void; onForgot: () => void; onDone: (id: string) => void; onCreate: () => void; onProvider: (p: 'apple' | 'google') => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<'none' | 'nouser' | 'password'>('none');
  const [busy, setBusy] = useState(false);
  return (
    <Form title="Sign in" onBack={onBack}>
      <button className="auth-btn auth-btn--apple" onClick={() => onProvider('apple')}>
        <AppleMark /> Continue with Apple
      </button>
      <button className="auth-btn" onClick={() => onProvider('google')}>
        <span className="g-mark">G</span> Continue with Google
      </button>
      <p className="or">or</p>
      <Field label="Email" error={error === 'nouser' ? 'No Art and Artist account uses this email. Check the spelling, or create an account.' : undefined}>
        <input className="field" type="email" value={email} onChange={(e) => (setEmail(e.target.value), setError('none'))} autoComplete="email" />
      </Field>
      {error === 'nouser' && (
        <button className="link" onClick={onCreate}>
          Create an account
        </button>
      )}
      <PasswordField value={password} onChange={(s) => (setPassword(s), setError('none'))} error={error === 'password' ? "That password doesn't match. Try again, or reset it with Forgot password." : undefined} />
      <Button
        block
        size="l"
        loading={busy}
        disabled={!email || !password}
        aria-describedby="signin-missing"
        onClick={() => {
          setBusy(true);
          window.setTimeout(() => {
            setBusy(false);
            const k = Object.keys(KNOWN).find((x) => email.toLowerCase().includes(x));
            if (!k) return setError('nouser');
            if (password.length < 8) return setError('password');
            onDone(KNOWN[k]);
          }, 600);
        }}
      >
        Sign in
      </Button>
      <Missing id="signin-missing" items={[!email && 'your email', !password && 'your password']} />
      <button className="link" onClick={onForgot}>
        Forgot password?
      </button>
    </Form>
  );
}

function Forgot({ onBack, onDone }: { onBack: () => void; onDone: (id: string) => void }) {
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState<'email' | 'code' | 'new'>('email');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  return (
    <Form title={stage === 'new' ? 'New password' : 'Reset your password'} onBack={onBack}>
      {stage === 'email' && (
        <>
          <Field label="Email">
            <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </Field>
          <Button block size="l" disabled={!/.+@.+\..+/.test(email)} onClick={() => setStage('code')}>
            Send code
          </Button>
        </>
      )}
      {stage === 'code' && (
        <>
          <p className="meta">If an Art and Artist account uses {email}, we've sent it a 6-digit code.</p>
          <input className="field code-input" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="••••••" aria-label="6-digit code" autoComplete="one-time-code" />
          <Button block size="l" disabled={code.length !== 6} onClick={() => setStage('new')}>
            Continue
          </Button>
        </>
      )}
      {stage === 'new' && (
        <>
          <PasswordField value={pw} onChange={setPw} autoComplete="new-password" hint="At least 8 characters." />
          <Button block size="l" disabled={pw.length < 8} onClick={() => onDone(Object.keys(KNOWN).find((x) => email.includes(x)) ?? 'kiran')}>
            Save and sign in
          </Button>
        </>
      )}
    </Form>
  );
}

/** Explicit, readable consent. Recorded with document, version and date. */
/*
 * Before you join (V30). Same consent, lighter presentation: one reassuring line, three short "what to
 * know" rows that open the full explanation and documents, then the required consent, then a clearly
 * optional email preference. Required boxes are never pre-ticked; the documents are always one tap away.
 * Shared by every path into Art and Artist (individuals, invited house members, sign-up for a house):
 * organisation-specific agreements are asked where they apply (accepting an invite, setting up a house).
 * The legal substance is unchanged and still placeholder pending legal review (src/legal/docs.tsx).
 */
const KNOW: { d: DocId; icon: ReactNode; h: string; line: string; full: string }[] = [
  {
    d: 'terms',
    icon: <BadgeCheck size={20} />,
    h: 'Your work and credits',
    line: 'Credits come from productions. You accept or correct them.',
    // The original card copy, kept word for word in the detail view.
    full: 'Finding each other, working together, and a true record of work. Credits come from productions; you accept or correct them.',
  },
  {
    d: 'privacy',
    icon: <Lock size={20} />,
    h: 'Your privacy',
    line: 'Your phone number is never public. We never sell personal data.',
    full: 'Your profile, work and messages, to run Art and Artist. Your phone number is never public. We never sell personal data.',
  },
  {
    d: 'conduct',
    icon: <Users size={20} />,
    h: 'How people treat each other',
    line: 'Real identities, honest roles, no fees to apply or audition.',
    full: 'Real identities, no fees to apply or audition, no harassment, honest roles.',
  },
];

function Consent({ onBack, openDoc, onAgree }: { onBack: () => void; openDoc: (d: DocId) => void; onAgree: (marketing: boolean) => void }) {
  const [terms, setTerms] = useState(false);
  const [age, setAge] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [topic, setTopic] = useState<(typeof KNOW)[number] | null>(null);
  const link = (d: DocId, label: string) => (
    <button
      type="button"
      className="consent-link"
      onClick={(e) => {
        e.stopPropagation();
        openDoc(d);
      }}
    >
      {label}
    </button>
  );
  return (
    <Form title="Before you join" onBack={onBack}>
      <p className="meta consent-lede">A few things to know about how Art and Artist works.</p>

      <div className="know-list" role="group" aria-label="What to know">
        {KNOW.map((k) => (
          <button key={k.d} type="button" className="know-row" onClick={() => setTopic(k)} aria-haspopup="dialog">
            <span className="know-icon" aria-hidden>
              {k.icon}
            </span>
            <span className="know-text">
              <span className="item-title">{k.h}</span>
              <span className="meta">{k.line}</span>
            </span>
            <ChevronRight size={18} className="know-chevron" aria-hidden />
          </button>
        ))}
      </div>

      <div className="consent-required" role="group" aria-label="Required to join">
        <CheckRow on={terms} set={setTerms} id="consent-terms">
          I agree to the {link('terms', 'Terms of Service')} and have read the {link('privacy', 'Privacy Policy')}
        </CheckRow>
        <CheckRow on={age} set={setAge} id="consent-age">
          I'm 18 or older
        </CheckRow>
      </div>

      <div className="consent-optional">
        <span className="consent-optional-text">
          <span className="consent-optional-label">Optional</span>
          <span className="meta">Occasional emails about new features</span>
        </span>
        <Toggle on={marketing} onChange={setMarketing} label="Product emails (optional)" />
      </div>

      <Button block size="l" disabled={!terms || !age} onClick={() => onAgree(marketing)}>
        Agree and continue
      </Button>

      <Sheet open={!!topic} onClose={() => setTopic(null)} title="" label={topic?.h ?? 'What to know'} size="tall">
        {topic && (
          <div className="stack">
            <h2 className="ob-title know-sheet-title">{topic.h}</h2>
            <p className="body">{topic.full}</p>
            <LegalDocView id={topic.d} />
          </div>
        )}
      </Sheet>
    </Form>
  );
}

/** A required checkbox whose label can contain links: the box and the text toggle; links open documents. */
function CheckRow({ on, set, id, children }: { on: boolean; set: (v: boolean) => void; id: string; children: ReactNode }) {
  return (
    <div className={`check-row ${on ? 'is-on' : ''}`} onClick={() => set(!on)}>
      <button type="button" className="check-box" role="checkbox" aria-checked={on} aria-labelledby={id} onClick={(e) => (e.stopPropagation(), set(!on))}>
        {on && <Check size={14} strokeWidth={3} />}
      </button>
      <span id={id}>{children}</span>
    </div>
  );
}

function Check2({ on, set, children }: { on: boolean; set: (v: boolean) => void; children: ReactNode }) {
  return (
    <button className={`check-row ${on ? 'is-on' : ''}`} onClick={() => set(!on)} role="checkbox" aria-checked={on}>
      <span className="check-box">{on && <Check size={14} strokeWidth={3} />}</span>
      <span>{children}</span>
    </button>
  );
}

function Verify({ email, onBack, onDone }: { email: string; onBack: () => void; onDone: () => void }) {
  const [code, setCode] = useState('');
  const [wait, setWait] = useState(30);
  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);
  return (
    <Form title="Check your email" onBack={onBack}>
      <p className="meta">We sent a 6-digit code to {email}.</p>
      <input className="field code-input" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="••••••" aria-label="6-digit code" autoComplete="one-time-code" autoFocus />
      <Button block size="l" disabled={code.length !== 6} onClick={onDone}>
        Verify
      </Button>
      <p className="meta">
        {wait > 0 ? (
          `Resend code in ${wait}s`
        ) : (
          <button className="link" onClick={() => setWait(30)}>
            Resend code
          </button>
        )}
        {' · '}
        <button className="link" onClick={onBack}>
          Change email
        </button>
      </p>
    </Form>
  );
}

/** The organisation invitation: who invited you, what you'll be able to do, and an explicit authority confirmation. */
function Invitation({ accountEmail, onSwitchEmail, onAccept, onDecline }: { accountEmail: string; onSwitchEmail: () => void; onAccept: () => void; onDecline: () => void }) {
  const [authorised, setAuthorised] = useState(false);
  const o = org(INVITE.orgId);
  const mismatch = accountEmail.toLowerCase() !== INVITE.email;
  const masked = INVITE.email.replace(/^(.).+(@.+)$/, '$1•••$2');
  return (
    <div className="ob">
      <div className="ob-top">
        <Photo media={art('badge')} className="ob-art" showPlay={false} />
      </div>
      <div className="ob-body">
        <div className="invite-card">
          <Avatar party={o} size={56} />
          <span>
            <span className="item-title">
              {o.name} {o.verified && <Verified size={14} />}
            </span>
            <span className="meta">Production house · {o.city}</span>
            <span className="meta">Invited by {INVITE.invitedBy}</span>
          </span>
        </div>
        <h1 className="ob-title">Act for {o.name}</h1>
        {mismatch ? (
          <>
            <p className="inline-error" role="alert">This invite was sent to {masked}. You signed in as {accountEmail}. Sign in with the invited address, or ask them to invite this one.</p>
            <Button block size="l" variant="secondary" onClick={onSwitchEmail}>
              Use {masked}
            </Button>
          </>
        ) : (
          <>
            <ul className="block-list">
              <li>Create projects, open roles and review interest for {o.name}</li>
              <li>Message people as {o.name}</li>
              <li>{INVITE.canIssue ? `Issue credits for ${o.name}` : `Credits are issued by others at ${o.name}`}</li>
            </ul>
            <p className="meta">Your own profile and credits stay yours. {o.name} can remove your access at any time.</p>
            <DraftTag />
            <Check2 on={authorised} set={setAuthorised}>
              I'm authorised by {o.name} to act for it on Art and Artist
            </Check2>
            <Button block size="l" disabled={!authorised} onClick={onAccept}>
              Accept
            </Button>
          </>
        )}
        <button className="link link--muted" onClick={onDecline}>
          This isn't for me
        </button>
      </div>
    </div>
  );
}


function AppleMark() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 19" aria-hidden fill="currentColor">
      <path d="M13.2 10.1c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8C3.8 5 2.3 5.9 1.5 7.4c-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.7 2.4 3 2.4 1.2 0 1.6-.8 3.1-.8s1.8.8 3.1.8c1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7 0 0-2.5-1-2.5-3.9zM10.9 3.2c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.1-.5 2.8-1.3z" />
    </svg>
  );
}

/**
 * First-launch intro for people who arrive with no context: three screens, each saying one true thing
 * about Art and Artist. Skippable, swipeable, never shown to invited people or on sign-in.
 */
const INTRO = [
  { art: 'search', title: 'Find the people behind the work', body: 'Discover crew, cast and productions by craft, city and language.', chip: 'Real people, real work' },
  { art: 'star', title: 'Credits you can trust', body: "Credits come from productions, and you accept them. No one can claim a film they didn't work on.", chip: 'Verified credits from real productions' },
  { art: 'valley', title: 'Find your next role', body: 'Roles that fit your craft and dates come to you. Show interest, and the production decides whether to talk.', chip: 'No fees to apply, ever' },
];

function Intro({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const last = i === INTRO.length - 1;
  const s = INTRO[i];
  useEffect(() => {
    research.track('onboarding_step_viewed', { metadata: { step: `intro_${i + 1}` } });
  }, [i]);
  return (
    <div className="intro">
      <AnimatePresence initial={false}>
        <motion.div
          key={s.art}
          className="intro-art"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60 && !last) setI(i + 1);
            if (info.offset.x > 60 && i > 0) setI(i - 1);
          }}
        >
          <Photo media={art(s.art)} className="splash-art" showPlay={false} />
        </motion.div>
      </AnimatePresence>
      <div className="intro-shade" />
      <button className="intro-skip" onClick={() => (research.track('onboarding_step_skipped', { metadata: { step: `intro_${i + 1}` } }), onDone())}>
        Skip
      </button>
      <div className="intro-body">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }} className="intro-text">
            <h1 className="intro-title">{s.title}</h1>
            <p className="intro-copy">{s.body}</p>
            <span className="intro-chip">
              <Check size={13} strokeWidth={2.6} /> {s.chip}
            </span>
          </motion.div>
        </AnimatePresence>
        <div className="intro-dots" role="group" aria-label={`Screen ${i + 1} of ${INTRO.length}`}>
          {INTRO.map((_, k) => (
            <button key={k} className={k === i ? 'is-on' : ''} onClick={() => setI(k)} aria-label={`Screen ${k + 1} of ${INTRO.length}`} aria-current={k === i ? 'step' : undefined} />
          ))}
        </div>
        <Button block size="l" onClick={() => (last ? onDone() : setI(i + 1))}>
          {last ? 'Get started' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
