import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Check, ChevronLeft, Eye, EyeOff, Mail } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { CRAFTS, headline } from '../data/crafts';
import * as seed from '../data/seed';
import type { Craft, Media } from '../data/types';
import { DraftTag, LegalDocView, type DocId } from '../legal/docs';
import { useStore, type Availability } from '../state/store';
import { org } from '../state/selectors';
import { Avatar, Button, Photo, Toggle, Verified } from '../ui/primitives';
import { Logo } from '../ui/Logo';
import { StatusBar } from '../ui/chrome';
import { Sheet } from '../ui/Sheet';
import { MediaPicker } from '../screens/create/PostComposer';
import { research } from '../research-data/client';

/*
 * How someone enters Art and Artist. One splash (only as long as loading), one entry screen, then account,
 * consent, a short onboarding, and (for an invited person) the organisation invitation.
 * Apple, Google and email are the ways in. Phone is verification and linking only, never a login.
 */

type Step = 'splash' | 'intro' | 'entry' | 'email' | 'signin' | 'forgot' | 'consent' | 'verify' | 'you' | 'craft' | 'where' | 'looking' | 'work' | 'invite' | 'inviteTip';

/** The demo invitation: Art and Artist's team set up Saffron Reel Studios and invited Meena by work email. */
const INVITE = { orgId: 'saffron', email: 'meena@saffronreel.in', name: 'Meena Iyer', invitedBy: 'the Art and Artist team', canIssue: true };
const KNOWN: Record<string, string> = { kiran: 'kiran', tara: 'tara', aditi: 'aditi' };
const CITIES = ['Hyderabad', 'Mumbai', 'Chennai', 'Kochi', 'Bengaluru', 'Kolkata'];
const LANGS = ['Telugu', 'Hindi', 'Tamil', 'Malayalam', 'Kannada', 'Marathi', 'Bengali', 'English'];
const KINDS = ['Paid crew or cast work', 'Collaborations', 'Short films', 'Ads', 'Series', 'Features'];
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
  const [primary, setPrimary] = useState<Craft | null>(invite ? 'production' : null);
  const [more, setMore] = useState<Craft[]>([]);
  const [spec, setSpec] = useState('');
  const [city, setCity] = useState('');
  const [travel, setTravel] = useState(false);
  const [langs, setLangs] = useState<string[]>([]);
  const [avail, setAvail] = useState<'now' | 'from' | 'no'>('now');
  const [availFrom, setAvailFrom] = useState('');
  const [kinds, setKinds] = useState<string[]>([]);
  const [work, setWork] = useState<Media[]>([]);
  const [personId, setPersonId] = useState<string | null>(null);

  // Splash lasts only as long as "loading" (simulated as a moment), then fades into entry.
  useEffect(() => {
    if (step !== 'splash') return;
    const t = window.setTimeout(() => setStep(entry?.mode === 'new' ? 'intro' : 'entry'), 2300);
    return () => window.clearTimeout(t);
  }, [step]);

  // Research observation only (a no-op outside a test session): which first-run screen is showing.
  useEffect(() => {
    if (step !== 'intro') research.track('onboarding_step_viewed', { metadata: { step } });
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
    const role = headline(primary!, spec);
    const availability: Availability = avail === 'no' ? { open: false, from: 'Now', scope: city } : { open: true, from: avail === 'now' ? 'Now' : availFrom || 'Soon', scope: `${city}${travel ? ' · will travel' : ''}` };
    const id = createPerson({ name: name.trim(), photo, craft: primary!, crafts: more, specialisation: spec, role, city, travel, languages: langs, availability, work, email });
    setPersonId(id);
    if (invite) return go('invite');
    endEntry();
    setActing('self');
    switchViewer(id);
    showToast({ text: `Welcome to Art and Artist, ${name.split(' ')[0]}` });
  };

  const steps: Step[] = invite ? ['you', 'craft', 'where'] : ['you', 'craft', 'where', 'looking', 'work'];
  const stepIndex = steps.indexOf(step);

  const overImage = ['intro', 'entry', 'you', 'craft', 'where', 'looking', 'work', 'invite', 'inviteTip'].includes(step);
  return (
    <div className="entry">
      <div className="entry-status">
        <StatusBar tone={overImage ? 'light' : 'dark'} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} className="entry-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          {step === 'intro' && <Intro onDone={() => setStep('entry')} />}

          {step === 'splash' && (
            <div className="splash">
              <motion.img src="images/brand/logo.png" alt="" className="splash-logo" initial={{ opacity: 0, scale: 0.86 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }} />
              <motion.div className="splash-loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.3 }} aria-label="Loading">
                <span />
              </motion.div>
            </div>
          )}

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
                <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoFocus />
              </Field>
              <PasswordField value={password} onChange={setPassword} />
              <p className="meta">At least 8 characters. A mix of words is easiest to remember.</p>
              <Button block size="l" disabled={!/.+@.+\..+/.test(email) || password.length < 8} onClick={() => go('consent')}>
                Continue
              </Button>
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
            <Onboard step={stepIndex} total={steps.length} image="badge" title="How you'll appear" onBack={back}>
              <div className="ob-photo">
                <Avatar party={{ id: 'draft', kind: 'person', name: name || 'You', role: '', craft: 'actor', city: '', tone: 3, photo }} size={88} />
                <PhotoPicker onPick={setPhoto} has={!!photo} />
              </div>
              <Field label="Your name">
                <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="As it appears in credits" autoFocus />
              </Field>
              <p className="meta">Use the name you work under. It's how productions will credit you.</p>
              <Button block size="l" disabled={!name.trim()} onClick={() => go('craft')}>
                Continue
              </Button>
            </Onboard>
          )}

          {step === 'craft' && (
            <Onboard step={stepIndex} total={steps.length} image="camera" title="What do you do?" onBack={back}>
              <p className="meta">Pick your main craft. You can add more.</p>
              <div className="craft-grid">
                {CRAFTS.map((c) => (
                  <button
                    key={c.id}
                    className={`craft-tile ${primary === c.id ? 'is-on' : ''} ${more.includes(c.id) ? 'is-more' : ''}`}
                    onClick={() => {
                      setPrimary(c.id);
                      setMore((m) => m.filter((x) => x !== c.id));
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              {primary && (
                <>
                  <p className="field-label">Also do (up to 4)</p>
                  <div className="chips">
                    {CRAFTS.filter((c) => c.id !== primary).map((c) => (
                      <button
                        key={c.id}
                        className={`chip ${more.includes(c.id) ? 'is-on' : ''}`}
                        disabled={!more.includes(c.id) && more.length >= 4}
                        onClick={() => setMore((m) => (m.includes(c.id) ? m.filter((x) => x !== c.id) : [...m, c.id]))}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <Field label="Specialisation (optional)">
                    <input className="field" value={spec} onChange={(e) => setSpec(e.target.value)} placeholder="e.g. Anamorphic, night exteriors" maxLength={60} />
                  </Field>
                  <p className="meta">
                    Your profile will read: <b>{headline(primary, spec)}</b>
                  </p>
                </>
              )}
              <Button block size="l" disabled={!primary} onClick={() => go('where')}>
                Continue
              </Button>
            </Onboard>
          )}

          {step === 'where' && (
            <Onboard step={stepIndex} total={steps.length} image="valley" title="Where do you work?" onBack={back}>
              <Field label="City">
                <input className="field" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your base city" />
              </Field>
              <div className="chips chips--tight">
                {CITIES.map((c) => (
                  <button key={c} className={`chip ${city === c ? 'is-on' : ''}`} onClick={() => setCity(c)}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="ob-row">
                <span>Open to travel for work</span>
                <Toggle on={travel} onChange={setTravel} label="Open to travel" />
              </div>
              <p className="field-label">Languages you work in</p>
              <div className="chips">
                {LANGS.map((l) => (
                  <button key={l} className={`chip ${langs.includes(l) ? 'is-on' : ''}`} onClick={() => setLangs((x) => (x.includes(l) ? x.filter((y) => y !== l) : [...x, l]))}>
                    {l}
                  </button>
                ))}
              </div>
              <Button block size="l" disabled={!city.trim() || !langs.length} onClick={() => (invite ? finishProfile() : go('looking'))}>
                Continue
              </Button>
            </Onboard>
          )}

          {step === 'looking' && (
            <Onboard step={stepIndex} total={steps.length} image="search" title="What are you looking for?" onBack={back} onSkip={() => (research.track('onboarding_step_skipped', { metadata: { step: 'looking' } }), go('work'))}>
              <p className="field-label">Availability</p>
              <div className="seg">
                {(
                  [
                    ['now', 'Available now'],
                    ['from', 'From a date'],
                    ['no', 'Not looking'],
                  ] as const
                ).map(([k, l]) => (
                  <button key={k} className={avail === k ? 'is-on' : ''} onClick={() => setAvail(k)}>
                    {l}
                  </button>
                ))}
              </div>
              {avail === 'from' && <input className="field" value={availFrom} onChange={(e) => setAvailFrom(e.target.value)} placeholder="e.g. 15 Nov" />}
              <p className="field-label">Kinds of work</p>
              <div className="chips">
                {KINDS.map((k) => (
                  <button key={k} className={`chip ${kinds.includes(k) ? 'is-on' : ''}`} onClick={() => setKinds((x) => (x.includes(k) ? x.filter((y) => y !== k) : [...x, k]))}>
                    {k}
                  </button>
                ))}
              </div>
              <p className="meta">This shapes the roles we show you. Change it any time.</p>
              <Button block size="l" onClick={() => go('work')}>
                Continue
              </Button>
            </Onboard>
          )}

          {step === 'work' && (
            <Onboard step={stepIndex} total={steps.length} image="moodboard" title="Show your work" onBack={back} onSkip={() => (research.track('onboarding_step_skipped', { metadata: { step: 'work' } }), finishProfile())} skipLabel="Skip for now">
              <p className="meta">Stills, frames or a reel help people understand what you do. Add them now or later from your profile.</p>
              <WorkPicker work={work} setWork={setWork} />
              <p className="inline-note">Credits come from productions. When a production credits you on Art and Artist, you'll be asked to accept it.</p>
              <Button block size="l" onClick={finishProfile}>
                {work.length ? 'Finish' : 'Finish without work'}
              </Button>
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
      </AnimatePresence>

      <Sheet open={!!provider} onClose={() => setProvider(null)} title="">
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
      <Sheet open={!!legal} onClose={() => setLegal(null)} title="" size="tall">
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="ob-field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function PasswordField({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <Field label="Password">
      <span className="pw">
        <input className="field" type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="pw-toggle" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)}>
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </Field>
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
        <div className="ob-progress" aria-label={`Step ${step + 1} of ${total}`}>
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

function WorkPicker({ work, setWork }: { work: Media[]; setWork: (m: Media[]) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {work.length > 0 && (
        <div className="grid-3">
          {work.map((m) => (
            <span key={m.id} className="grid-item">
              <Photo media={m} />
            </span>
          ))}
        </div>
      )}
      <Button block variant="outline" onClick={() => setOpen(true)}>
        {work.length ? 'Change selection' : 'Add photos or a reel'}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Add your work" size="tall">
        <MediaPicker
          selected={work}
          onDone={(ms: Media[]) => {
            setWork(ms);
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
      <Field label="Email">
        <input className="field" type="email" value={email} onChange={(e) => (setEmail(e.target.value), setError('none'))} />
      </Field>
      <PasswordField value={password} onChange={(s) => (setPassword(s), setError('none'))} />
      {error === 'nouser' && (
        <p className="field-error">
          No Art and Artist account uses this email.{' '}
          <button className="link" onClick={onCreate}>
            Create one
          </button>
        </p>
      )}
      {error === 'password' && <p className="field-error">That password doesn't match. Try again or reset it.</p>}
      <Button
        block
        size="l"
        loading={busy}
        disabled={!email || !password}
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
            <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button block size="l" disabled={!/.+@.+\..+/.test(email)} onClick={() => setStage('code')}>
            Send code
          </Button>
        </>
      )}
      {stage === 'code' && (
        <>
          <p className="meta">If an Art and Artist account uses {email}, we've sent it a 6-digit code.</p>
          <input className="field code-input" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="••••••" />
          <Button block size="l" disabled={code.length !== 6} onClick={() => setStage('new')}>
            Continue
          </Button>
        </>
      )}
      {stage === 'new' && (
        <>
          <PasswordField value={pw} onChange={setPw} />
          <Button block size="l" disabled={pw.length < 8} onClick={() => onDone(Object.keys(KNOWN).find((x) => email.includes(x)) ?? 'kiran')}>
            Save and sign in
          </Button>
        </>
      )}
    </Form>
  );
}

/** Explicit, readable consent. Recorded with document, version and date. */
function Consent({ onBack, openDoc, onAgree }: { onBack: () => void; openDoc: (d: DocId) => void; onAgree: (marketing: boolean) => void }) {
  const [terms, setTerms] = useState(false);
  const [age, setAge] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const cards: { d: DocId; h: string; p: string }[] = [
    { d: 'terms', h: 'What Art and Artist is for', p: 'Finding each other, working together, and a true record of work. Credits come from productions; you accept or correct them.' },
    { d: 'privacy', h: 'What we collect and why', p: 'Your profile, work and messages, to run Art and Artist. Your phone number is never public. We never sell personal data.' },
    { d: 'conduct', h: 'How people treat each other', p: 'Real identities, no fees to apply or audition, no harassment, honest roles.' },
  ];
  return (
    <Form title="Before you join" onBack={onBack}>
      <DraftTag />
      {cards.map((c) => (
        <div key={c.d} className="consent-card">
          <p className="item-title">{c.h}</p>
          <p className="meta">{c.p}</p>
          <button className="link link--small" onClick={() => openDoc(c.d)}>
            Read in full
          </button>
        </div>
      ))}
      <Check2 on={terms} set={setTerms}>
        I agree to the <b>Terms of Service</b> and have read the <b>Privacy Policy</b>
      </Check2>
      <Check2 on={age} set={setAge}>
        I'm 18 or older
      </Check2>
      <div className="ob-row">
        <span className="meta">Occasional emails about new features (optional)</span>
        <Toggle on={marketing} onChange={setMarketing} label="Product emails" />
      </div>
      <Button block size="l" disabled={!terms || !age} onClick={() => onAgree(marketing)}>
        Agree and continue
      </Button>
    </Form>
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
      <input className="field code-input" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="••••••" autoFocus />
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
            <p className="inline-error">This invite was sent to {masked}. You signed in as {accountEmail}. Sign in with the invited address, or ask them to invite this one.</p>
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
  { art: 'valley', title: 'Get to the work', body: 'Roles that fit your craft and dates come to you. Show interest, and the production decides whether to talk.', chip: 'No fees to apply, ever' },
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
        <div className="intro-dots" aria-label={`Screen ${i + 1} of ${INTRO.length}`}>
          {INTRO.map((_, k) => (
            <button key={k} className={k === i ? 'is-on' : ''} onClick={() => setI(k)} aria-label={`Screen ${k + 1}`} />
          ))}
        </div>
        <Button block size="l" onClick={() => (last ? onDone() : setI(i + 1))}>
          {last ? 'Get started' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
