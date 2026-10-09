import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { navReducer, type NavState } from './entryNav';

type S = 'entry' | 'email' | 'verify' | 'consent' | 'you' | 'mobile' | 'now';
const r = navReducer<S>(new Set<S>(['verify']));
const walk = (steps: S[]) => steps.reduce<NavState<S>>((st, to) => r(st, { type: 'go', to }), { step: 'entry', history: [] });

test('Back after a code screen returns to the screen before it, never into the code again', () => {
  const st = walk(['email', 'verify', 'consent']);
  assert.deepEqual(st.history, ['entry', 'email']);
  assert.equal(r(st, { type: 'back' }).step, 'email');
});

test('each Back is exactly one step, in order, and stops at the start', () => {
  let st = walk(['email', 'verify', 'consent', 'you', 'mobile', 'now']);
  const seen: S[] = [];
  for (let i = 0; i < 8; i++) {
    st = r(st, { type: 'back' });
    seen.push(st.step);
  }
  assert.deepEqual(seen, ['mobile', 'you', 'consent', 'email', 'entry', 'entry', 'entry', 'entry']);
});

test('several Backs at once (browser history jump) land on the right step', () => {
  const st = walk(['email', 'verify', 'consent', 'you', 'mobile']);
  assert.equal(r(st, { type: 'back', times: 3 }).step, 'email');
});

test('going to the current step is a no-op (double-tapped Continue)', () => {
  const st = walk(['email']);
  assert.equal(r(st, { type: 'go', to: 'email' }), st);
});
