import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { ACCOUNTS, CURRENT_TERMS, findAccount, maskIdentity, registerAccount, resumeStep, routeAfterAuth, type AccountRecord } from './accounts';

const dir = () => ACCOUNTS.map((a) => ({ ...a, identities: [...a.identities] })) as AccountRecord[];

test('an existing account signs in, whichever way in it used', () => {
  const d = dir();
  for (const id of [{ provider: 'email', subject: 'Kiran@Example.com ' }, { provider: 'google', subject: 'google-1001' }, { provider: 'apple', subject: 'apple-1001' }] as const) {
    const r = routeAfterAuth('signin', id, d);
    assert.equal(r.kind, 'signed-in');
    assert.equal(r.kind === 'signed-in' && r.account.viewerId, 'kiran');
    // "Continue with…" from Welcome lands in the same account: the method never decides sign-up.
    assert.equal(routeAfterAuth('continue', id, d).kind, 'signed-in');
  }
});

test('never matches by name or by an address that merely contains a name', () => {
  const d = dir();
  assert.equal(findAccount({ provider: 'email', subject: 'kiran.someone@gmail.com' }, d), undefined);
  assert.equal(findAccount({ provider: 'apple', subject: 'apple-9999', name: 'Kiran Varma', email: 'kiran@example.com' }, d), undefined);
  assert.equal(findAccount({ provider: 'email', subject: 'mustara@example.com' }, d), undefined);
});

test('providers are never linked by email: a new Google identity with a known address is a new identity', () => {
  const d = dir();
  assert.equal(routeAfterAuth('continue', { provider: 'google', subject: 'google-7777', email: 'kiran@example.com' }, d).kind, 'new-account');
});

test('no account: Continue creates one, Sign in explains instead', () => {
  const d = dir();
  const id = { provider: 'apple' as const, subject: 'apple-5000', email: 'x7p2k@privaterelay.appleid.com' };
  assert.equal(routeAfterAuth('continue', id, d).kind, 'new-account');
  assert.equal(routeAfterAuth('signin', id, d).kind, 'not-found');
  assert.equal(maskIdentity(id), 'this Apple ID');
});

test('a house member restores the house acting identity; an older agreement renews only that', () => {
  const d = dir();
  const aditi = routeAfterAuth('signin', { provider: 'google', subject: 'google-1003' }, d);
  assert.equal(aditi.kind === 'signed-in' && aditi.account.house?.acting, 'konark');
  const tara = routeAfterAuth('signin', { provider: 'email', subject: 'tara@example.com' }, d);
  assert.deepEqual(tara.kind === 'signed-in' && tara.renewTerms, true);
});

test('an interrupted sign-up resumes at its first missing step, without the agreement again', () => {
  const d = dir();
  const r = routeAfterAuth('signin', { provider: 'google', subject: 'google-1004' }, d);
  assert.equal(r.kind, 'resume');
  assert.equal(r.kind === 'resume' && r.needsTerms, false);
  assert.equal(resumeStep(r.kind === 'resume' ? r.account.draft : {}), 'now');
  assert.equal(resumeStep({}), 'you');
  assert.equal(resumeStep({ name: 'A', craft: 'actor', intents: ['work'] }), 'where');
});

test('registering makes the next sign-in direct and never duplicates', () => {
  const d = dir();
  const id = { provider: 'email' as const, subject: 'maya@example.com' };
  registerAccount(id, 'you-1', d);
  registerAccount(id, 'you-1', d);
  assert.equal(d.filter((a) => a.viewerId === 'you-1').length, 1);
  const r = routeAfterAuth('signin', id, d);
  assert.equal(r.kind === 'signed-in' && r.account.viewerId, 'you-1');
  assert.equal(r.kind === 'signed-in' && r.account.termsVersion, CURRENT_TERMS);
  // Finishing a resumed sign-up completes that same record.
  const ravi = { provider: 'google' as const, subject: 'google-1004' };
  registerAccount(ravi, 'you-2', d);
  assert.equal(routeAfterAuth('signin', ravi, d).kind, 'signed-in');
  assert.equal(d.length, ACCOUNTS.length + 1);
});
