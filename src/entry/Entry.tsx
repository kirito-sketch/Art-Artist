import { MediaFramingEditor } from '../ui/MediaFraming';
import type { MediaFraming } from '../data/types';
import { ShowreelManager, releaseUnusedShowreelPreviews } from '../screens/profile/Showreel';
import { getFeatures } from '../ui/features';
import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, Camera, Check, ChevronLeft, ChevronRight, Lock, Mail, Users } from 'lucide-react';
import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react';
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
import { launchSplashPending } from '../ui/launchSession';
import { isStandalone } from '../dev/viewMode';
import { StatusBar } from '../ui/chrome';
import { Sheet } from '../ui/Sheet';
import { DateField, fmtDay } from '../ui/fields';
import { MediaPicker } from '../ui/MediaPicker';
import { research } from '../research-data/client';
import { TEST_MODE } from '../research-data/surface';
import { INTENTS, type Intent } from '../domain/relevance';
import { MAX_ONBOARDING_INTENTS, needsAvailability, toggleOnboardingIntent } from '../domain/onboardingIntents';
import { CITY_LANGUAGES, craftProfile, LANGUAGES } from '../data/profileSchema';
import { type ProfileExtra, type Reel } from '../state/profile';
import { TEST_CODE as MOBILE_TEST_CODE } from '../ui/MobileVerify';
import { maskedPhone, normalisePhone, validPhone } from '../state/profile';
import { maskIdentity, normaliseEmail, registerAccount, resumeStep, routeAfterAuth, type AuthIntent, type Identity } from '../domain/accounts';
import { useEntryNav, type NavState } from './entryNav';
import { clearEntry, restoredEntry, saveEntry } from '../state/session';

/*
 * How someone enters Art and Artist. One splash (only as long as loading), one entry screen, then account,
 * consent, a short onboarding, and (for an invited person) the organisation invitation.
 * Apple, Google and email are the ways in. Phone is verification and linking only, never a login, and it is
 * skippable (docs/REVIEW_EVENTS_PROFILE.md §5).
 */

type Step = 'splash' | 'intro' | 'entry' | 'email' | 'signin' | 'consent' | 'verify' | 'notfound' | 'you' | 'mobile' | 'now' | 'where' | 'work' | 'invite' | 'inviteTip';
/** Screens that are passed through, never returned to with Back (a code that was already used, a notice). */
const TRANSIENT: ReadonlySet<Step> = new Set<Step>(['splash', 'intro', 'verify', 'notfound']);
const ONBOARDING: Step[] = ['you', 'mobile', 'now', 'where', 'work'];
/** Steps that can be skipped: labelled Optional and drawn as an open segment in the progress bar. */
const OPTIONAL: ReadonlySet<Step> = new Set<Step>(['mobile', 'work']);
/** The crafts most people pick first; the rest are one tap away ("More crafts"). */
const COMMON_CRAFTS: Craft[] = ['actor', 'director', 'cinematographer', 'editor', 'writing', 'sound'];
/** The intro is for a first visit on this device; later visits go straight to Welcome. A per-device convenience only. */
const INTRO_KEY = 'aa_intro_seen';
const introSeen = () => {
  try {
    return localStorage.getItem(INTRO_KEY) === '1';
  } catch {
    return false;
  }
};
const markIntroSeen = () => {
  try {
    localStorage.setItem(INTRO_KEY, '1');
  } catch {
    /* ignore */
  }
};

/** The demo invitation: Art and Artist's team set up Saffron Reel Studios and invited Meena by work email. */
const INVITE = { orgId: 'saffron', email: 'meena@saffronreel.in', name: 'Meena Iyer', invitedBy: 'the Art and Artist team', canIssue: true };
/** A simulated provider account: the provider's stable id, what it shares, and (prototype only) a hint for testers. */
type ProviderAccount = { name: string; subject: string; email: string; hint?: string };
const CITIES = ['Hyderabad', 'Mumbai', 'Chennai', 'Kochi', 'Bengaluru', 'Kolkata'];
/** One-time codes expire after ten minutes, like a real sign-in code. */
const CODE_TTL = 10 * 60 * 1000;

/** Everything typed during sign-up, kept across Back and Forward and across a refresh (sessionStorage only). */
interface Snapshot {
  mode: string;
  nav: NavState<Step>;
  authIntent: AuthIntent;
  identity: Identity | null;
  resuming: boolean;
  email: string;
  name: string;
  photo?: string;
  primary: Craft | null;
  intent: Intent | null;
  selectedIntents: Intent[];
  city: string;
  avail: 'now' | 'from';
  availFrom: string;
  phone: { number: string; verified: boolean } | null;
  phoneDraft: string;
  langs: string[];
  travel: boolean;
  link: string;
  consent: ConsentDraft;
}
type ConsentDraft = { terms: boolean; age: boolean; marketing: boolean };
const SESSION = !TEST_MODE;

export function EntryFlow() {
  const store = useStore();
  const { entry, endEntry, recordConsent, createPerson, switchViewer, setActing, addMembership, showToast, setPolicyUpdate, attempt } = store;
  const invite = entry?.mode === 'invite';
  // A refresh mid-sign-up comes back to the same step with everything typed so far (never on a fresh visit).
  const saved = useRef(restoredEntry<Snapshot>(SESSION && !invite)).current;
  const resumed = saved && saved.mode === entry?.mode ? saved : null;
  // The installed app's launch splash is the splash: while it is still owed, onboarding starts under it, at
  // its first screen, instead of drawing a second mark. (Later entries, such as a house invite, keep theirs.)
  const launchOwed = launchSplashPending(isStandalone());
  const showIntro = entry?.mode === 'new' && (TEST_MODE || !introSeen());
  const firstStep: Step = entry?.mode === 'signin' ? 'entry' : launchOwed ? (showIntro ? 'intro' : 'entry') : 'splash';
  const nav = useEntryNav<Step>(resumed?.nav ?? { step: firstStep, history: [] }, TRANSIENT);
  const { step, go, back } = nav;
  const [provider, setProvider] = useState<null | 'apple' | 'google'>(null);
  const [legal, setLegal] = useState<DocId | null>(null);
  // Account: how this person came in ("Continue with…" or an explicit "Sign in") and the identity it produced.
  const [authIntent, setAuthIntent] = useState<AuthIntent>(resumed?.authIntent ?? 'continue');
  const [identity, setIdentity] = useState<Identity | null>(resumed?.identity ?? null);
  const [resuming, setResuming] = useState(resumed?.resuming ?? false);
  // A resumed sign-up says so once, on the step it picks up at.
  const [resumeNote, setResumeNote] = useState<{ step: Step; text: string } | null>(null);
  const [allCrafts, setAllCrafts] = useState(false);
  const [reposition, setReposition] = useState(false);
  // The email field holds only what this person typed in this sign-in: a provider's address never lands in it.
  const [email, setEmail] = useState(resumed?.email ?? (invite ? INVITE.email : ''));
  const [codeSentAt, setCodeSentAt] = useState(0);
  const [consent, setConsent] = useState<ConsentDraft>(resumed?.consent ?? { terms: false, age: false, marketing: false });
  // Profile
  const [name, setName] = useState(resumed?.name ?? '');
  const [photo, setPhoto] = useState<string | undefined>(resumed?.photo);
  const [avatarFraming, setAvatarFraming] = useState<MediaFraming>();
  // V30: onboarding asks only what personalises the first Home (identity, craft, intent, city, and
  // availability when it matters). Everything else is profile completion, later. Every choice is
  // kept when you go Back, and can be changed or cleared.
  const [primary, setPrimary] = useState<Craft | null>(resumed?.primary ?? (invite ? 'production' : null));
  const [intent, setIntent] = useState<Intent | null>(resumed?.intent ?? (invite ? 'hire' : null));
  const district = !TEST_MODE && getFeatures().home === 'district';
  const [selectedIntents, setSelectedIntents] = useState<Intent[]>(resumed?.selectedIntents ?? (invite ? ['hire'] : []));
  const hasIntent = district ? selectedIntents.length > 0 : !!intent;
  const [city, setCity] = useState(resumed?.city ?? '');
  const [avail, setAvail] = useState<'now' | 'from'>(resumed?.avail ?? 'now');
  const [availFrom, setAvailFrom] = useState(resumed?.availFrom ?? '');
  const [personId, setPersonId] = useState<string | null>(null);
  const asksAvailability = district ? needsAvailability(selectedIntents) : intent === 'work' || intent === 'collaborate';
  // Approved direction (docs/REVIEW_EVENTS_PROFILE.md §4): the rest is recommended and skippable, and all of it
  // lands in the same profile fields Edit Profile uses.
  const [phone, setPhone] = useState<{ number: string; verified: boolean } | null>(resumed?.phone ?? null);
  const [phoneDraft, setPhoneDraft] = useState(resumed?.phoneDraft ?? '');
  const [langs, setLangs] = useState<string[]>(resumed?.langs ?? []);
  const [travel, setTravel] = useState(resumed?.travel ?? false);
  const [reelUrl, setReelUrl] = useState('');
  const [showreel, setShowreel] = useState<Reel | undefined>();
  const [showreelDraft, setShowreelDraft] = useState<Reel | undefined>();
  const previewUrls = useRef(new Set<string>());
  useEffect(() => { const urls = previewUrls.current; return () => releaseUnusedShowreelPreviews(urls); }, []);
  const [work, setWork] = useState<Media[]>([]);
  const [link, setLink] = useState(resumed?.link ?? '');

  // Keep the sign-up draft for a refresh, from the account step onward (session only; device photos, which can't
  // survive a reload, are dropped).
  useEffect(() => {
    if (!SESSION || invite) return;
    if (!['consent', 'notfound', ...ONBOARDING].includes(step)) return;
    const snap: Snapshot = { mode: entry?.mode ?? 'new', nav: { step, history: nav.history }, authIntent, identity, resuming, email, name, photo: photo?.startsWith('blob:') ? undefined : photo, primary, intent, selectedIntents, city, avail, availFrom, phone, phoneDraft, langs, travel, link, consent };
    saveEntry(snap);
  });
  useEffect(() => clearEntry, []);

  // Splash: the mark draws itself once (about 1.2s), then the next screen follows as soon as its first
  // image is ready. A slow load holds the finished mark still (no replay); capped so it never hangs.
  const [markDone, setMarkDone] = useState(false);
  const [nextReady, setNextReady] = useState(false);
  const after: Step = showIntro ? 'intro' : 'entry';
  useEffect(() => {
    if (step !== 'splash') return;
    let live = true;
    const ready = () => live && setNextReady(true);
    const img = new Image();
    img.onload = img.onerror = ready;
    img.src = artSrc(after === 'intro' ? INTRO[0].art : 'chair');
    if (img.complete) ready();
    const cap = window.setTimeout(ready, 4000);
    return () => {
      live = false;
      window.clearTimeout(cap);
    };
  }, [step]);
  useEffect(() => {
    if (step === 'splash' && markDone && nextReady) go(after);
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

  const goBack = () => {
    if (nav.canGoBack) research.track('onboarding_step_back', { metadata: { from: step } });
    back();
  };

  const signInAs = (id: string, acting = 'self') => {
    clearEntry();
    endEntry();
    switchViewer(id);
    setActing(acting);
    const first = seed.parties[id]?.name.split(' ')[0] ?? id;
    showToast({ text: acting !== 'self' ? `Welcome back, ${first}. You're acting for ${org(acting).name}.` : `Welcome back, ${first}` });
  };

  /**
   * After Apple, Google or an email code: the one routing decision (domain/accounts.ts). Existing accounts go
   * straight in; only a genuinely new or unfinished account sees consent and onboarding.
   */
  const afterAuth = (id: Identity, how: AuthIntent) => {
    const r = routeAfterAuth(how, id);
    if (r.kind === 'signed-in') {
      if (invite) return startNew(id); // the invite demo always creates the invited person
      signInAs(r.account.viewerId!, r.account.house?.acting);
      if (r.renewTerms) setPolicyUpdate(true); // only the updated agreement, nothing else
      return;
    }
    setIdentity(id);
    if (r.kind === 'not-found') return go('notfound');
    if (r.kind === 'new-account') return startNew(id);
    // An unfinished sign-up: what it saved comes back, and it continues from its first missing step.
    const d = r.account.draft ?? {};
    if (d.name) setName(d.name);
    if (d.craft) setPrimary(d.craft);
    if (d.city) setCity(d.city);
    if (d.intents?.length) setSelectedIntents(d.intents as Intent[]);
    setResuming(true);
    if (r.needsTerms) return go('consent');
    const at = resumeStep(d);
    setResumeNote({ step: at, text: `Welcome back${d.name ? `, ${d.name.split(' ')[0]}` : ''}. Pick up where you left off.` });
    resumeAt(at);
  };
  const startNew = (id: Identity) => {
    setIdentity(id);
    setResuming(false);
    if (id.name && !name) setName(id.name);
    go('consent');
  };
  const resumeAt = (to: Step) => {
    const before = steps.slice(0, Math.max(0, steps.indexOf(to)));
    // Back from the resumed step walks through the steps already done (prefilled), then the screen you came from.
    const base = [...nav.history, ...(TRANSIENT.has(step) ? [] : [step])];
    nav.reset({ step: to, history: [...base, ...before].filter((x, i, a) => a.indexOf(x) === i) });
  };

  const finishProfile = () => {
    const role = headline(primary!);
    const availability: Availability = asksAvailability ? { open: true, from: avail === 'from' && availFrom ? fmtDay(availFrom) : 'Now', scope: city.trim() } : { open: false, from: 'Now', scope: city.trim() };
    const words = craftProfile(primary!).work;
    const extra: Partial<ProfileExtra> = {
      ...(district ? { onboardingIntents: selectedIntents } : {}),
      phone: phone ?? undefined,
      reel: district ? showreel : words.reel && validLink(reelUrl) ? { url: reelUrl.trim(), title: words.reel } : undefined,
      ...(district ? { reelDraft: showreelDraft, featuredWork: validLink(link) ? [{ id: 'w-onboard', kind: 'external' as const, title: 'Selected work', url: link.trim() }] : [] } : {}),
      workLinks: validLink(link) ? [{ id: 'w-onboard', label: words.links, url: link.trim() }] : [],
    };
    const id = createPerson({ name: name.trim(), photo, avatarFraming, craft: primary!, crafts: [], specialisation: '', role, city: city.trim(), travel, languages: langs, availability, work, email: identity?.provider === 'email' ? identity.subject : email, intent: district ? selectedIntents[0] : intent ?? undefined, extra });
    // The identity now belongs to this account: signing in with it again goes straight to Home, never a second sign-up.
    registerAccount(identity ?? { provider: 'email', subject: email }, id);
    setPersonId(id);
    clearEntry();
    if (invite) return go('invite');
    endEntry();
    setActing('self');
    switchViewer(id);
    // The new Home says hello on the page itself (its first step card); a toast there would cover the first cards.
    if (getFeatures().home !== 'next') showToast({ text: `Welcome to Art and Artist, ${name.split(' ')[0]}` });
  };

  // The /test study keeps the onboarding it was designed with (two screens); see docs/REVIEW_EVENTS_PROFILE.md §15.
  // The mobile number is asked only where it does something now (a phone-checked house invite). Everyone else is asked
  // later, from profile completion, where it is the first suggestion (state/profile.ts openSteps).
  const steps: Step[] = TEST_MODE ? ['you', 'now'] : invite ? ['you', 'mobile', 'where'] : ['you', 'now', 'where', 'work'];
  const stepIndex = steps.indexOf(step);
  const optionalSteps = steps.map((x) => OPTIONAL.has(x));
  // The primary action sits in a sticky bar clear of the safe area (not in /test, whose study layout is frozen).
  const sticky = !TEST_MODE;
  const ob = { step: stepIndex, total: steps.length, optional: optionalSteps, note: resumeNote?.step === step ? resumeNote.text : undefined };

  const overImage = ['intro', 'entry', 'you', 'mobile', 'now', 'where', 'work', 'invite', 'inviteTip'].includes(step);
  return (
    <div className="entry">
      <div className="entry-status">
        <StatusBar tone={overImage ? 'light' : 'dark'} />
      </div>
      <AnimatePresence mode="wait">
        {step !== 'splash' && (
        <motion.div key={step} className="entry-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          {step === 'intro' && <Intro onDone={() => (markIntroSeen(), go('entry'))} />}

          {step === 'entry' && (
            <div className="entry-home">
              {/* Full-bleed hero: the artwork runs under the status bar and melts into the page colour (both themes). */}
              <div className="entry-art" aria-hidden>
                <EntryArt name="chair" priority />
                <div className="entry-fade" />
              </div>
              {/* The mark sits in the hero's dark top corner, so the headline is the only thing on the blended edge. */}
              <div className="entry-hero-logo">
                <Logo />
              </div>
              <div className="entry-body">
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
                  <button className="auth-btn auth-btn--apple" onClick={() => (setAuthIntent('continue'), setProvider('apple'))}>
                    <AppleMark /> Continue with Apple
                  </button>
                  <button className="auth-btn" onClick={() => (setAuthIntent('continue'), setProvider('google'))}>
                    <span className="g-mark">G</span> Continue with Google
                  </button>
                  <button className="auth-btn" onClick={() => (setAuthIntent('continue'), go('email'))}>
                    <Mail size={17} /> Continue with email
                  </button>
                </div>
                <p className="entry-signin">
                  Already on Art and Artist?{' '}
                  <button className="link" onClick={() => (setAuthIntent('signin'), go('signin'))}>
                    Sign in
                  </button>
                </p>
                <p className="entry-legal">
                  <button onClick={() => setLegal('terms')}>Terms</button> · <button onClick={() => setLegal('privacy')}>Privacy</button> · <button onClick={() => setLegal('conduct')}>Community guidelines</button>
                </p>
              </div>
              {entry?.notice && <TransientNotice text={entry.notice} />}
            </div>
          )}

          {/* Email is passwordless, the industry standard (a one-time code). The account, not this screen, decides
              whether it signs in or creates an account (domain/accounts.ts). */}
          {step === 'email' && (
            <Form title="Continue with email" onBack={goBack}>
              <EmailForm value={email} onChange={setEmail} onSubmit={() => (setCodeSentAt(Date.now()), go('verify'))} />
            </Form>
          )}

          {step === 'signin' && (
            <SignIn email={email} onEmail={setEmail} onBack={goBack} onSubmit={() => (setCodeSentAt(Date.now()), go('verify'))} onProvider={(p) => (setAuthIntent('signin'), setProvider(p))} />
          )}

          {step === 'consent' && (
            <Consent
              value={consent}
              onChange={setConsent}
              onBack={goBack}
              openDoc={setLegal}
              onAgree={() => {
                recordConsent(['Terms of Service', 'Privacy Policy', 'Age 18 or older', ...(consent.marketing ? ['Product emails'] : [])], 'Signup');
                // Email was already confirmed with its code before this screen.
                if (resuming) {
                  const at = resumeStep({ name, craft: primary ?? undefined, intents: selectedIntents, city });
                  setResumeNote({ step: at, text: `Thanks${name ? `, ${name.split(' ')[0]}` : ''}. Pick up where you left off.` });
                  return resumeAt(at);
                }
                go('you');
              }}
            />
          )}

          {step === 'verify' && (
            <Verify
              email={email}
              sentAt={codeSentAt}
              onResend={() => setCodeSentAt(Date.now())}
              onBack={goBack}
              onDone={(done, fail) =>
                attempt(
                  'auth-email',
                  () => (done(), afterAuth({ provider: 'email', subject: normaliseEmail(email), email: normaliseEmail(email) }, authIntent)),
                  () => fail("Couldn't check your code. Nothing was changed. Try again."),
                  400,
                )
              }
            />
          )}

          {step === 'notfound' && identity && (
            <Form title="No account yet" onBack={goBack}>
              <p className="body">
                We couldn't find an Art and Artist account for <b>{maskIdentity(identity)}</b>. Nothing was created.
              </p>
              <p className="meta">If you've used Art and Artist before, try the way you signed up the first time: Apple, Google or another email.</p>
              <Button block size="l" onClick={() => startNew(identity)}>
                Create an account
              </Button>
              <Button block size="l" variant="secondary" onClick={goBack}>
                Try another way
              </Button>
            </Form>
          )}

          {step === 'you' && (() => {
            const actions = (
              <>
                <Button block size="l" disabled={!name.trim() || !primary} aria-describedby="you-missing" onClick={() => go(invite ? 'mobile' : 'now')}>
                  Continue
                </Button>
                <Missing id="you-missing" items={[!name.trim() && 'your name', !primary && 'your main craft']} />
              </>
            );
            const crafts = TEST_MODE || allCrafts ? CRAFTS : CRAFTS.filter((c) => COMMON_CRAFTS.includes(c.id) || c.id === primary);
            return (
              <Onboard {...ob} image="badge" title="About you" lede="The name you're credited by, and the craft you're known for." onBack={goBack} footer={sticky ? actions : undefined}>
                <div className="ob-photo">
                  <Avatar party={{ id: 'draft', kind: 'person', name: name || 'You', role: '', craft: 'actor', city: '', tone: 3, photo, avatarFraming }} size={88} />
                  <span className="ob-photo-actions">
                    <PhotoPicker onPick={src => { setPhoto(src); setAvatarFraming(undefined); setReposition(false); }} has={!!photo} />
                    {photo && !TEST_MODE && !reposition && (
                      <button className="link" onClick={() => setReposition(true)}>
                        Reposition photo
                      </button>
                    )}
                  </span>
                </div>
                {photo && (TEST_MODE || reposition) && <MediaFramingEditor title="Reposition photo" surface="avatar" media={{ id: 'avatar', kind: 'image', src: photo, contentType: 'portrait', presentations: { avatar: avatarFraming } }} onChange={m => setAvatarFraming(m.presentations?.avatar)} />}
                <Field label="Your name">
                  <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="As it appears in credits" autoComplete="name" autoFocus />
                </Field>
                {TEST_MODE && <p className="meta">The name you work under. Productions credit you by it. Photo is optional.</p>}
                <p className="field-label">Your main craft</p>
                <div className="craft-grid" role="radiogroup" aria-label="Your main craft" onKeyDown={(e) => rovingKeys(e)}>
                  {crafts.map((c, i) => (
                    <button key={c.id} role="radio" aria-checked={primary === c.id} tabIndex={rovingIndex(primary === c.id, i, !!primary)} className={`craft-tile ${primary === c.id ? 'is-on' : ''}`} onClick={() => setPrimary(primary === c.id ? null : c.id)}>
                      {c.label}
                    </button>
                  ))}
                </div>
                {!TEST_MODE && (
                  <button className="link ob-more" aria-expanded={allCrafts} onClick={() => setAllCrafts((v) => !v)}>
                    {allCrafts ? 'Fewer crafts' : `More crafts (${CRAFTS.length - crafts.length})`}
                  </button>
                )}
                {TEST_MODE && <p className="meta">Do more than one thing? Add other crafts from your profile later.</p>}
                {!sticky && actions}
              </Onboard>
            );
          })()}

          {step === 'mobile' && (
            <Onboard {...ob} image="file" title="Your mobile number" lede="Optional. It helps productions match your credits to you. It's never shown on your profile." onBack={goBack}>
              <PhoneStep value={phone} onChange={setPhone} draft={phoneDraft} onDraft={setPhoneDraft} onContinue={() => go(invite ? 'where' : 'now')} />
            </Onboard>
          )}

          {step === 'now' && (
            <Onboard {...ob} image="search" title="What brings you here?" onBack={goBack} footer={sticky && !TEST_MODE ? (
              <>
                <Button block size="l" disabled={!hasIntent} aria-describedby="now-missing" onClick={() => go('where')}>
                  Continue
                </Button>
                <Missing id="now-missing" items={[!hasIntent && 'what brings you here']} />
              </>
            ) : undefined}>
              {TEST_MODE && <p className="meta">This shapes what Art and Artist shows you first. Change it any time from Home.</p>}
              {district && <p className="meta" id="intent-help" aria-live="polite">{selectedIntents.length === MAX_ONBOARDING_INTENTS ? '3 selected. Deselect one to change.' : 'Choose up to 3'}</p>}
              <div className={`intent-list ${district ? 'intent-list--multi' : ''}`} role={district ? 'group' : 'radiogroup'} aria-label="What are you looking to do right now?" aria-describedby={district ? 'intent-help' : undefined} onKeyDown={district ? undefined : (e) => rovingKeys(e)}>
                {INTENTS.map((it, i) => (
                  <button key={it.id} role={district ? 'checkbox' : 'radio'} aria-checked={district ? selectedIntents.includes(it.id) : intent === it.id} aria-disabled={district && selectedIntents.length === MAX_ONBOARDING_INTENTS && it.id !== 'explore' && !selectedIntents.includes(it.id) ? true : undefined} tabIndex={district ? 0 : rovingIndex(intent === it.id, i, !!intent)} className={`intent-option ${(district ? selectedIntents.includes(it.id) : intent === it.id) ? 'is-on' : ''}`} onClick={() => district ? setSelectedIntents((goals) => toggleOnboardingIntent(goals, it.id)) : setIntent(it.id)}>
                    <span className="intent-option-label">{district && it.id === 'collaborate' ? 'Join a collaboration' : it.label}</span>
                    <span className="meta">{it.hint}</span>
                    {district && selectedIntents.includes(it.id) && <Check size={18} className="intent-check" aria-hidden />}
                  </button>
                ))}
              </div>
              {TEST_MODE ? (
                <>
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
                          <button key={k} role="radio" aria-checked={avail === k} tabIndex={avail === k ? 0 : -1} className={avail === k ? 'is-on' : ''} onClick={() => (setAvail(k), k === 'now' && setAvailFrom(''))}>
                            {l}
                          </button>
                        ))}
                      </div>
                      {avail === 'from' && <DateField className="field" value={availFrom} onChange={setAvailFrom} label="Open to work from" placeholder="Choose a start date" />}
                    </>
                  )}
                  <Button block size="l" disabled={!intent || !city.trim()} aria-describedby="now-missing" onClick={finishProfile}>
                    Show me what matters
                  </Button>
                  <Missing id="now-missing" items={[!intent && 'what brings you here', !city.trim() && 'where you are based']} />
                  <p className="meta ob-later">Your work, other crafts, languages and a bio can be added from your profile whenever you like.</p>
                </>
              ) : null}
            </Onboard>
          )}

          {step === 'where' && (
            <Onboard {...ob} image="valley" title="Where you work" lede="So productions near you, and in your languages, can find you." onBack={goBack} footer={
              <>
                <Button block size="l" disabled={!city.trim()} aria-describedby="where-missing" onClick={() => (invite ? finishProfile() : go('work'))}>
                  Continue
                </Button>
                <Missing id="where-missing" items={[!city.trim() && 'where you are based']} />
              </>
            }>
              <Field label="Where are you based?">
                <input className="field" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your base city" autoComplete="address-level2" />
              </Field>
              <div className="chips chips--tight">
                {CITIES.map((c) => (
                  <button
                    key={c}
                    className={`chip ${city === c ? 'is-on' : ''}`}
                    onClick={() => {
                      const next = city === c ? '' : c;
                      setCity(next);
                      // One tap: the languages people there usually work in, until the person chooses their own.
                      if (next && !langs.length) setLangs(CITY_LANGUAGES[next] ?? []);
                    }}
                    aria-pressed={city === c}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <p className="field-label">Languages you work in</p>
              <div className="chips chips--tight" role="group" aria-label="Languages you work in">
                {LANGUAGES.slice(0, 9).map((l) => (
                  <button key={l} className={`chip ${langs.includes(l) ? 'is-on' : ''}`} aria-pressed={langs.includes(l)} onClick={() => setLangs((x) => (x.includes(l) ? x.filter((y) => y !== l) : [...x, l]))}>
                    {l}
                  </button>
                ))}
              </div>
              <div className="ob-toggle-row">
                <span id="ob-travel">Open to travel for work</span>
                <Toggle on={travel} onChange={setTravel} label="Open to travel for work" />
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
                  {avail === 'from' && <DateField className="field" value={availFrom} onChange={setAvailFrom} label="Open to work from" placeholder="Choose a start date" />}
                </>
              )}
            </Onboard>
          )}

          {step === 'work' && primary && (
            <Onboard className={district ? 'ana-show-work' : undefined} {...ob} image="moodboard" title={district ? 'Show your work' : 'Add your work'} onBack={goBack} onSkip={finishProfile} skipLabel={district ? 'Skip for now' : 'Skip'} footer={
              <Button block size="l" onClick={finishProfile}>
                {showreel || showreelDraft || reelUrl || work.length || link ? 'Finish' : 'Show me Art and Artist'}
              </Button>
            }>
              {district ? <DistrictAddWork previewUrls={previewUrls.current} craft={primary} reel={showreel} draft={showreelDraft} setReel={setShowreel} setDraft={setShowreelDraft} work={work} setWork={setWork} link={link} setLink={setLink} /> : <AddWork craft={primary} reelUrl={reelUrl} setReelUrl={setReelUrl} work={work} setWork={setWork} link={link} setLink={setLink} />}
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
              <div className="ob-top"><EntryArt name="badge" /></div>
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
            onPick={(acct, done, fail) =>
              attempt(
                `auth-${provider}`,
                () => {
                  done();
                  setProvider(null);
                  // The provider's stable id identifies the person; its email never fills the email field.
                  afterAuth({ provider, subject: acct.subject, email: acct.email, name: acct.name }, authIntent);
                },
                () => fail(`Couldn't sign in with ${provider === 'apple' ? 'Apple' : 'Google'}. Nothing was changed. Try again.`),
                400,
              )
            }
            onCancel={() => setProvider(null)}
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

const validLink = (s: string) => /^https?:\/\/\S+\.\S+/.test(s.trim());

/** Onboarding's optional "Add your work", worded for the craft. Lands in the same portfolio Edit Profile manages. */
function AddWork({ craft, reelUrl, setReelUrl, work, setWork, link, setLink }: { craft: Craft; reelUrl: string; setReelUrl: (s: string) => void; work: Media[]; setWork: (m: Media[]) => void; link: string; setLink: (s: string) => void }) {
  const words = craftProfile(craft).work;
  const [picker, setPicker] = useState(false);
  return (
    <>
      {words.reel && (
        <Field label={`${words.reel} link`} hint="YouTube, Vimeo or Google Drive">
          <input className="field" type="url" inputMode="url" value={reelUrl} onChange={(e) => setReelUrl(e.target.value)} placeholder="https://vimeo.com/…" />
        </Field>
      )}
      {words.images && (
        <div>
          <p className="field-label">{words.images}</p>
          <div className="ob-work-grid">
            {work.map((m) => (
              <Photo surface="portfolio-thumbnail" key={m.id} media={m} showPlay={false} className="ob-work-thumb" />
            ))}
            <button className="ob-work-add" onClick={() => setPicker(true)} aria-label={`Add ${words.images.toLowerCase()}`}>
              <Camera size={20} aria-hidden />
            </button>
          </div>
        </div>
      )}
      <Field label={`${words.links} (a link)`}>
        <input className="field" type="url" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
      </Field>
      <Sheet open={picker} onClose={() => setPicker(false)} title={words.images ?? 'Add images'} size="tall">
        <MediaPicker
          selected={[]}
          onDone={(ms: Media[]) => {
            setPicker(false);
            setWork([...work, ...ms.filter((m) => m.kind === 'image' && !work.some((x) => x.id === m.id))]);
          }}
        />
      </Sheet>
    </>
  );
}

/** Source choices appear only after Add showreel. No profession must add video. */
function DistrictAddWork({ craft, reel, draft, setReel, setDraft, work, setWork, link, setLink, previewUrls }: { previewUrls: Set<string>; craft: Craft; reel?: Reel; draft?: Reel; setReel: (r?: Reel) => void; setDraft: (r?: Reel) => void; work: Media[]; setWork: (m: Media[]) => void; link: string; setLink: (s: string) => void }) {
  const words = craftProfile(craft).work;
  const [images, setImages] = useState(false);
  const [workLink, setWorkLink] = useState(false);
  return <div className="ana-onboard-work">
    <p className="meta">Add something that helps people understand what you do. Everything here is optional.</p>
    {words.reel ? <ShowreelManager previewUrls={previewUrls} value={reel} draft={draft} onChange={setReel} onDraftChange={setDraft} /> : <details className="ana-optional-reel"><summary>Showreel (optional)</summary><ShowreelManager previewUrls={previewUrls} value={reel} draft={draft} onChange={setReel} onDraftChange={setDraft} /></details>}
    {words.images && <><div className="ob-work-grid">{work.map((m) => <Photo surface="portfolio-thumbnail" key={m.id} media={m} showPlay={false} className="ob-work-thumb" />)}</div><Button variant="secondary" onClick={() => setImages(true)}>Add portfolio images</Button></>}
    <Button variant="secondary" onClick={() => setWorkLink(true)}>{link ? 'Edit work link' : 'Add work link'}</Button>
    <Sheet className="ana-work-sheet" open={workLink} onClose={() => setWorkLink(false)} title="Work link"><div className="stack"><Field label="A project, sample or selected work"><input className="field" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" aria-label="Work link" /></Field><Button block onClick={() => setWorkLink(false)} disabled={!!link && !validLink(link)}>Done</Button></div></Sheet>
    <Sheet className="ana-work-sheet" open={images} onClose={() => setImages(false)} title="Portfolio images" size="tall"><MediaPicker kind="image" selected={[]} onDone={(ms) => { setWork([...work, ...ms.filter((m) => m.kind === 'image' && !work.some((old) => old.id === m.id))]); setImages(false); }} /></Sheet>
  </div>;
}

/*
 * Entry and onboarding artwork (docs/ux-refinement/PLAN.md, Auth and onboarding repair). These are illustrations,
 * not user media, so they don't go through the media framing rules (which show unknown-size images whole on a grey
 * fill: that is what turned them into narrow strips with gutters after the media system landed). They always fill
 * their frame (cover), each with a focal point that keeps its subject in view at any width.
 */
const artSrc = (n: string) => `images/brand/entry/${n}.jpg`;
const ART_FOCUS: Record<string, string> = { chair: '50% 38%', badge: '50% 62%', file: '50% 58%', search: '50% 56%', valley: '50% 52%', moodboard: '50% 48%', star: '50% 55%', camera: '50% 50%' };
function EntryArt({ name, priority }: { name: string; priority?: boolean }) {
  return <img className="entry-art-img" src={artSrc(name)} alt="" width={640} height={990} decoding="async" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} style={{ objectPosition: ART_FOCUS[name] ?? '50% 50%' }} />;
}

/** Brief, announced, then gone: a sign-out confirmation never takes permanent space on Welcome. */
function TransientNotice({ text }: { text: string }) {
  const [shown, setShown] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(false), 4000);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="entry-notice-host" role="status" aria-live="polite">
      <AnimatePresence>
        {shown && (
          <motion.p className="entry-notice" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <Check size={15} strokeWidth={2.6} aria-hidden /> {text.replace(/\.$/, '')}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function Onboard({ step, total, optional = [], note, image, title, lede, onBack, onSkip, skipLabel = 'Skip', footer, children, className }: { className?: string; step: number; total: number; optional?: boolean[]; note?: string; image: string; title: string; lede?: string; onBack: () => void; onSkip?: () => void; skipLabel?: string; footer?: ReactNode; children: ReactNode }) {
  const isOptional = !!optional[step];
  return (
    <div className={`ob${footer ? ' ob--sticky' : ''}${className ? ` ${className}` : ''}`}>
      <div className="ob-top">
        <EntryArt name={image} priority />
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
        <div className="ob-progress" role="progressbar" aria-label="Profile setup" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1} aria-valuetext={`Step ${step + 1} of ${total}${isOptional ? ', optional' : ''}`}>
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={`${i <= step ? 'is-on' : ''}${optional[i] ? ' is-opt' : ''}`} />
          ))}
        </div>
        <p className="ob-count" aria-hidden>
          Step {step + 1} of {total}
          {isOptional && <span className="ob-opt">Optional</span>}
        </p>
        {note && (
          <p className="ob-note" role="status">
            {note}
          </p>
        )}
        <h1 className="ob-title">{title}</h1>
        {lede && <p className="ob-lede">{lede}</p>}
        <div className="stack">{children}</div>
        {footer && <div className="ob-footer">{footer}</div>}
      </div>
    </div>
  );
}

/**
 * The optional mobile step: one primary action at a time (Send code, then Verify, then Continue) with Skip for now
 * always beside it. The number is kept across Back and Forward. Phone-based invitations keep their own check.
 */
function PhoneStep({ value, onChange, draft, onDraft, onContinue }: { value: { number: string; verified: boolean } | null; onChange: (v: { number: string; verified: boolean } | null) => void; draft: string; onDraft: (s: string) => void; onContinue: () => void }) {
  const { verifyPhone } = useStore();
  const [sentAt, setSentAt] = useState(0);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [wait, setWait] = useState(0);
  const id = useId();
  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);
  const valid = validPhone(draft);
  const invalid = touched && draft.trim() !== '' && !valid;
  const send = () => {
    setSentAt(Date.now());
    setWait(30);
    setCode('');
    setError('');
  };
  const verify = () => {
    if (Date.now() - sentAt > CODE_TTL) return setError('This code has expired. Send a new one.');
    if (code !== MOBILE_TEST_CODE) return setError("That code didn't match. Check it and try again.");
    const r = verifyPhone(draft, true);
    if (r === 'taken') return setError('This number is already verified on another account. Sign in there, or skip for now.');
    if (r === 'invalid') return setError('Enter a 10-digit mobile number.');
    onChange({ number: normalisePhone(draft), verified: true });
  };
  const skip = (
    <button className="btn btn--l btn--block btn--plain ob-secondary" onClick={onContinue}>
      Skip for now
    </button>
  );
  if (value?.verified)
    return (
      <>
        <div className="ob-verified" role="status">
          <Check size={18} aria-hidden />
          <span>
            <b>{maskedPhone(value.number)}</b> verified
          </span>
          <button className="link link--small" onClick={() => (onChange(null), setSentAt(0), setCode(''))}>
            Change
          </button>
        </div>
        <Button block size="l" onClick={onContinue}>
          Continue
        </Button>
      </>
    );
  return (
    <>
      <div>
        <label className="field-label" htmlFor={`${id}-n`}>
          Mobile number
        </label>
        <div className="ob-phone">
          <span className="ob-phone-cc" aria-hidden>
            +91
          </span>
          <input id={`${id}-n`} className="field" type="tel" inputMode="tel" value={draft} readOnly={!!sentAt} onChange={(e) => (onDraft(e.target.value), setError(''))} onBlur={() => setTouched(true)} placeholder="10-digit number" autoComplete="tel-national" aria-invalid={invalid || undefined} aria-describedby={`${id}-h`} />
        </div>
        <p className={invalid ? 'field-error' : 'meta field-hint'} id={`${id}-h`} role={invalid ? 'alert' : undefined}>
          {invalid ? 'Enter a 10-digit mobile number.' : 'Never shown on your profile or shared automatically.'}
        </p>
      </div>
      {sentAt ? (
        <>
          <div className="test-code" role="note">
            <p>
              <b>This is a test version, so no text message is sent.</b> Use this code:
            </p>
            <button type="button" className="test-code-btn" onClick={() => (setCode(MOBILE_TEST_CODE), setError(''))} aria-label={`Use code ${MOBILE_TEST_CODE.split('').join(' ')}`}>
              <span className="test-code-digits">
                {MOBILE_TEST_CODE.slice(0, 3)} {MOBILE_TEST_CODE.slice(3)}
              </span>
              <span className="test-code-use">Use code</span>
            </button>
          </div>
          <input className="field code-input" inputMode="numeric" maxLength={6} value={code} onChange={(e) => (setCode(e.target.value.replace(/\D/g, '')), setError(''))} placeholder="••••••" aria-label="6-digit code" autoComplete="one-time-code" aria-invalid={error ? true : undefined} />
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <p className="meta ob-code-links">
            {wait > 0 ? `Resend code in ${wait}s` : <button className="link" onClick={send}>Resend code</button>}
            {' · '}
            <button className="link" onClick={() => (setSentAt(0), setCode(''), setError(''))}>
              Change number
            </button>
          </p>
          <Button block size="l" disabled={code.length !== 6} onClick={verify}>
            Verify
          </Button>
        </>
      ) : (
        <Button block size="l" disabled={!valid} onClick={send}>
          Send code
        </Button>
      )}
      {skip}
    </>
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
          kind="image"
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

/**
 * Apple / Google account chooser. Simulated: there is no Apple or Google SDK in this prototype, so this sheet stands
 * in for the system one and says so. Each account carries the provider's stable id; Apple shares a private relay
 * address, which is used only as an address and never compared with anything else.
 */
const PROVIDER_ACCOUNTS: Record<'apple' | 'google', ProviderAccount[]> = {
  apple: [
    { name: 'Kiran Varma', subject: 'apple-1001', email: 'k3n8w@privaterelay.appleid.com', hint: 'Has an account' },
    { name: 'Aditi Ghosh', subject: 'apple-1003', email: 'm4q9d@privaterelay.appleid.com', hint: 'Has an account · acts for Konark Pictures' },
    { name: 'Nila Varghese', subject: 'apple-5000', email: 'x7p2k@privaterelay.appleid.com', hint: 'New to Art and Artist' },
  ],
  google: [
    { name: 'Kiran Varma', subject: 'google-1001', email: 'kiran.varma@gmail.com', hint: 'Has an account' },
    { name: 'Aditi Ghosh', subject: 'google-1003', email: 'aditi@konarkpictures.in', hint: 'Has an account · acts for Konark Pictures' },
    { name: 'Tara Menon', subject: 'google-1002', email: 'tara.menon@gmail.com', hint: 'Has an account · Terms updated since' },
    { name: 'Ravi Kumar', subject: 'google-1004', email: 'ravi.kumar@gmail.com', hint: 'Started signing up, didn’t finish' },
    { name: 'Nila Varghese', subject: 'google-5001', email: 'nila.varghese@gmail.com', hint: 'New to Art and Artist' },
  ],
};
const INVITE_ACCOUNTS: Record<'apple' | 'google', ProviderAccount[]> = {
  apple: [{ name: INVITE.name, subject: 'apple-inv-1', email: 'r8t2v@privaterelay.appleid.com' }],
  google: [
    { name: INVITE.name, subject: 'google-inv-1', email: INVITE.email },
    { name: INVITE.name, subject: 'google-inv-2', email: 'meena.iyer@gmail.com' },
  ],
};

function ProviderSheet({ kind, invite, onPick, onCancel }: { kind: 'apple' | 'google'; invite: boolean; onPick: (a: ProviderAccount, done: () => void, fail: (msg: string) => void) => void; onCancel: () => void }) {
  const accounts = (invite ? INVITE_ACCOUNTS : PROVIDER_ACCOUNTS)[kind];
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  return (
    <div className="stack provider-sheet">
      <p className="title-2">{kind === 'google' ? 'Choose an account' : 'Sign in with Apple'}</p>
      <p className="meta">to continue to Art and Artist</p>
      <p className="provider-note">Prototype: a simulated {kind === 'apple' ? 'Apple' : 'Google'} sign-in. Pick an account to see each path.</p>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="list list--flush">
        {accounts.map((a) => (
          <button
            key={a.subject}
            className="prow provider-row"
            disabled={!!busy}
            aria-busy={busy === a.subject || undefined}
            onClick={() => {
              setBusy(a.subject);
              setError('');
              onPick(a, () => setBusy(null), (msg) => (setBusy(null), setError(msg)));
            }}
          >
            <span className="ph-initial">{a.name[0]}</span>
            <span className="prow-text">
              <span className="item-title">{a.name}</span>
              <span className="meta">{kind === 'apple' ? 'Hide my email' : a.email}</span>
              {a.hint && <span className="meta provider-house">{a.hint}</span>}
            </span>
            {busy === a.subject && <span className="spinner" aria-hidden />}
          </button>
        ))}
      </div>
      <button className="btn btn--l btn--block btn--plain" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

function SignIn({ email, onEmail, onBack, onSubmit, onProvider }: { email: string; onEmail: (s: string) => void; onBack: () => void; onSubmit: () => void; onProvider: (p: 'apple' | 'google') => void }) {
  return (
    <Form title="Sign in" onBack={onBack}>
      <button className="auth-btn auth-btn--apple" onClick={() => onProvider('apple')}>
        <AppleMark /> Continue with Apple
      </button>
      <button className="auth-btn" onClick={() => onProvider('google')}>
        <span className="g-mark">G</span> Continue with Google
      </button>
      <p className="or">or</p>
      <EmailForm value={email} onChange={onEmail} onSubmit={onSubmit} />
      <p className="provider-note">Prototype accounts: kiran@example.com, tara@example.com, aditi@example.com. Any other address shows the "no account" path.</p>
    </Form>
  );
}

/** One field and one button. An error appears only after Continue, never before anyone has typed. */
function EmailForm({ value, onChange, onSubmit }: { value: string; onChange: (s: string) => void; onSubmit: () => void }) {
  const [tried, setTried] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  return (
    <form
      className="stack"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (valid) onSubmit();
      }}
    >
      <Field label="Email" error={tried && !valid ? 'Enter an email address, like name@example.com.' : undefined}>
        <input className="field" type="email" value={value} onChange={(e) => onChange(e.target.value)} placeholder="you@example.com" autoComplete="email" inputMode="email" autoFocus />
      </Field>
      <p className="meta">We'll send you a 6-digit code. No password needed.</p>
      <Button block size="l" type="submit">
        Continue
      </Button>
    </form>
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

function Consent({ value, onChange, onBack, openDoc, onAgree }: { value: ConsentDraft; onChange: (v: ConsentDraft) => void; onBack: () => void; openDoc: (d: DocId) => void; onAgree: () => void }) {
  // Held by the flow, so going Back and returning keeps what was ticked. Required boxes are never pre-ticked.
  const { terms, age, marketing } = value;
  const setTerms = (v: boolean) => onChange({ ...value, terms: v });
  const setAge = (v: boolean) => onChange({ ...value, age: v });
  const setMarketing = (v: boolean) => onChange({ ...value, marketing: v });
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
      <p className="consent-lede">A few things to know about how Art and Artist works.</p>

      <section className="consent-group" aria-labelledby="consent-know">
        <h2 className="consent-h" id="consent-know">What to know</h2>
        <div className="know-list">
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
      </section>

      <section className="consent-group consent-required" aria-labelledby="consent-req">
        <h2 className="consent-h" id="consent-req">
          To join, confirm <span className="consent-tag">Required</span>
        </h2>
        <CheckRow on={terms} set={setTerms} id="consent-terms">
          I agree to the {link('terms', 'Terms of Service')} and have read the {link('privacy', 'Privacy Policy')}
        </CheckRow>
        <CheckRow on={age} set={setAge} id="consent-age">
          I'm 18 or older
        </CheckRow>
      </section>

      <section className="consent-group consent-optional" aria-labelledby="consent-opt">
        <span className="consent-optional-text">
          <span className="consent-h" id="consent-opt">
            Product emails <span className="consent-tag consent-tag--quiet">Optional</span>
          </span>
          <span className="meta">Occasional emails about new features. Off unless you turn it on.</span>
        </span>
        <Toggle on={marketing} onChange={setMarketing} label="Product emails (optional)" />
      </section>

      <Button block size="l" disabled={!terms || !age} onClick={onAgree} aria-describedby="consent-missing">
        Agree and continue
      </Button>
      <Missing id="consent-missing" items={[!terms && 'agreement to the Terms', !age && 'confirmation that you\'re 18 or older']} />

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

/** The one-time code shown on the code screen. This is a test version: no email is ever sent. */
const TEST_CODE = '246810';

function Verify({ email, sentAt, onResend, onBack, onDone }: { email: string; sentAt: number; onResend: () => void; onBack: () => void; onDone: (done: () => void, fail: (msg: string) => void) => void }) {
  const [code, setCode] = useState('');
  const [wait, setWait] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);
  // Like the real thing: the sixth digit verifies, no extra tap. Only the shown code works, and only for ten minutes.
  const check = (d: string) => {
    if (busy) return;
    // The /test research study keeps its original rule (any six digits), so the frozen study behaves as before.
    if (!TEST_MODE && Date.now() - sentAt > CODE_TTL) return setError('This code has expired. Send a new one.');
    if (!TEST_MODE && d !== TEST_CODE) return setError("That code didn't match. Check it and try again.");
    setBusy(true);
    setError('');
    onDone(() => setBusy(false), (msg) => (setBusy(false), setError(msg)));
  };
  const enter = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 6);
    setCode(d);
    setError('');
    if (d.length === 6) check(d);
  };
  return (
    <Form title="Check your email" onBack={onBack}>
      <p className="meta">
        Enter the 6-digit code for <b>{email}</b>.
      </p>
      {/* People testing the app type their real address and wait for a code that never comes. Say so, and give it. */}
      <div className="test-code" role="note">
        <p>
          <b>This is a test version, so no email is sent.</b> Use this code:
        </p>
        <button type="button" className="test-code-btn" onClick={() => enter(TEST_CODE)} aria-label={`Use code ${TEST_CODE.split('').join(' ')}`}>
          <span className="test-code-digits">{TEST_CODE.slice(0, 3)} {TEST_CODE.slice(3)}</span>
          <span className="test-code-use">Use code</span>
        </button>
      </div>
      <input className="field code-input" inputMode="numeric" maxLength={6} value={code} onChange={(e) => enter(e.target.value)} placeholder="••••••" aria-label="6-digit code" autoComplete="one-time-code" autoFocus aria-invalid={error ? true : undefined} />
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <Button block size="l" loading={busy} disabled={code.length !== 6} onClick={() => check(code)}>
        Verify
      </Button>
      <p className="meta">
        {wait > 0 ? (
          `Resend code in ${wait}s`
        ) : (
          <button className="link" onClick={() => (onResend(), setWait(30), setCode(''), setError(''))}>
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
        <EntryArt name="badge" />
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
          <EntryArt name={s.art} priority />
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
