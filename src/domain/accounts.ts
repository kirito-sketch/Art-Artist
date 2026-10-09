/*
 * Who is signing in, and where they go next (docs/ux-refinement/PLAN.md, Auth and onboarding repair).
 *
 * One decision for every way in. Apple, Google and email all produce an Identity; routeAfterAuth looks the
 * identity up and returns the destination. The method never decides sign-up versus sign-in; the account does.
 *
 * Matching rules (no guessing):
 * - Apple and Google: by the provider's stable subject only. Never by display name, and an Apple private-relay
 *   address is just another address, never parsed or compared with other providers' emails.
 * - Email: by the verified address (the one-time code proves the person owns it), exact and case-insensitive.
 * - Different provider identities are never linked automatically.
 *
 * This is the prototype's account directory: the providers themselves are simulated (no Apple or Google SDK, no
 * email is sent). A real backend replaces ACCOUNTS and these lookups; routeAfterAuth stays the same.
 */
import type { Craft } from '../data/types';

export type Provider = 'apple' | 'google' | 'email';
export interface Identity {
  provider: Provider;
  /** Apple/Google: the provider's stable user id. Email: the normalised address. */
  subject: string;
  /** What the provider shares. Apple may share a private relay address. */
  email?: string;
  name?: string;
}

/** The current mandatory agreement version. Accounts that accepted an older one renew only that. */
export const CURRENT_TERMS = 'Draft 0.3';

export interface OnboardingDraft {
  name?: string;
  craft?: Craft;
  intents?: string[];
  city?: string;
}

export interface AccountRecord {
  /** The person's id once their profile exists (seed id or a created one). */
  viewerId?: string;
  identities: { provider: Provider; subject: string }[];
  termsVersion?: string;
  onboarding: 'complete' | 'incomplete';
  /** What an interrupted sign-up already saved, so it resumes instead of restarting. */
  draft?: OnboardingDraft;
  /** Acting identity restored with the account. Membership and permissions live with the house, not here. */
  house?: { acting: string; label: string };
}

export const normaliseEmail = (e: string) => e.trim().toLowerCase();

/** Prototype directory. Emails are the demo accounts' verified addresses; relay addresses are opaque. */
export const ACCOUNTS: AccountRecord[] = [
  {
    viewerId: 'kiran',
    identities: [
      { provider: 'email', subject: 'kiran@example.com' },
      { provider: 'google', subject: 'google-1001' },
      { provider: 'apple', subject: 'apple-1001' },
    ],
    termsVersion: CURRENT_TERMS,
    onboarding: 'complete',
  },
  {
    viewerId: 'tara',
    identities: [
      { provider: 'email', subject: 'tara@example.com' },
      { provider: 'google', subject: 'google-1002' },
    ],
    // Accepted an earlier version: signs in, then sees only the updated agreement.
    termsVersion: 'Draft 0.2',
    onboarding: 'complete',
  },
  {
    viewerId: 'aditi',
    identities: [
      { provider: 'email', subject: 'aditi@example.com' },
      { provider: 'google', subject: 'google-1003' },
      { provider: 'apple', subject: 'apple-1003' },
    ],
    termsVersion: CURRENT_TERMS,
    onboarding: 'complete',
    house: { acting: 'konark', label: 'Konark Pictures' },
  },
  {
    // Started signing up, agreed, saved name and craft, then left. Resumes where they stopped.
    identities: [{ provider: 'google', subject: 'google-1004' }],
    termsVersion: CURRENT_TERMS,
    onboarding: 'incomplete',
    draft: { name: 'Ravi Kumar', craft: 'editor' },
  },
];

export function findAccount(identity: Identity, directory: AccountRecord[] = ACCOUNTS): AccountRecord | undefined {
  const subject = identity.provider === 'email' ? normaliseEmail(identity.subject) : identity.subject;
  return directory.find((a) => a.identities.some((i) => i.provider === identity.provider && i.subject === subject));
}

export type AuthIntent = 'signin' | 'continue';
export type AuthOutcome =
  | { kind: 'signed-in'; account: AccountRecord; renewTerms: boolean }
  | { kind: 'resume'; account: AccountRecord; needsTerms: boolean }
  | { kind: 'new-account'; identity: Identity }
  | { kind: 'not-found'; identity: Identity };

/**
 * The one post-authentication decision.
 * - An existing, complete account signs in (renewing only an updated agreement if needed).
 * - An existing, incomplete account resumes onboarding (agreeing first only if it never did, or the version changed).
 * - No account: "Continue with…" creates one; an explicit "Sign in" says so and offers to create one instead.
 */
export function routeAfterAuth(intent: AuthIntent, identity: Identity, directory: AccountRecord[] = ACCOUNTS, terms = CURRENT_TERMS): AuthOutcome {
  const account = findAccount(identity, directory);
  if (!account) return intent === 'signin' ? { kind: 'not-found', identity } : { kind: 'new-account', identity };
  const current = account.termsVersion === terms;
  if (account.onboarding === 'incomplete' || !account.viewerId) return { kind: 'resume', account, needsTerms: !current };
  return { kind: 'signed-in', account, renewTerms: !current };
}

/** Records a newly created account, so the same identity signs straight in next time (no duplicate accounts). */
export function registerAccount(identity: Identity, viewerId: string, directory: AccountRecord[] = ACCOUNTS): AccountRecord {
  const existing = findAccount(identity, directory);
  if (existing) {
    Object.assign(existing, { viewerId, onboarding: 'complete', termsVersion: CURRENT_TERMS, draft: undefined });
    return existing;
  }
  const subject = identity.provider === 'email' ? normaliseEmail(identity.subject) : identity.subject;
  const record: AccountRecord = { viewerId, identities: [{ provider: identity.provider, subject }], termsVersion: CURRENT_TERMS, onboarding: 'complete' };
  directory.push(record);
  return record;
}

/** The first onboarding step an interrupted sign-up still needs. */
export function resumeStep(draft: OnboardingDraft = {}): 'you' | 'now' | 'where' | 'work' {
  if (!draft.name || !draft.craft) return 'you';
  if (!draft.intents?.length) return 'now';
  if (!draft.city) return 'where';
  return 'work';
}

/** "k•••@example.com", or a relay address shortened to "your Apple ID". */
export function maskIdentity(identity: Identity): string {
  const e = identity.email ?? (identity.provider === 'email' ? identity.subject : '');
  if (/@privaterelay\.appleid\.com$/i.test(e)) return 'this Apple ID';
  return e ? e.replace(/^(.).*(@.+)$/, '$1•••$2') : identity.provider === 'apple' ? 'this Apple ID' : 'this Google account';
}
