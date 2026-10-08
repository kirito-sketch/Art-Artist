import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareHome, homeArms, type HealthEvent } from './health';
import type { StudyData } from './data';

const ev = (session_id: string, event_name: string, metadata: Record<string, unknown> | null = null): HealthEvent => ({ session_id, task_attempt_id: null, sequence: 0, event_name, screen: null, object_type: null, object_id: null, metadata, created_at: '2026-10-03T10:00:00Z' });
const session = (id: string, status: string) => ({ id, status, started_at: '2026-10-03T10:00:00Z', completed_at: status === 'completed' ? '2026-10-03T10:20:00Z' : null, device_type: 'desktop' }) as unknown as StudyData['sessions'][number];
test('New Home sessions are labelled separately from archived experiments', () => {
  assert.equal(homeArms([ev('new', 'session_started', { homeVariant: 'district' })]).get('new'), 'district');
});

test('home arms come from session_started; older sessions are unassigned', () => {
  const a = homeArms([ev('s1', 'session_started', { homeVariant: 'next' }), ev('s2', 'session_started', { homeVariant: 'current' }), ev('s3', 'session_started', { persona: 'kiran' })]);
  assert.equal(a.get('s1'), 'next');
  assert.equal(a.get('s2'), 'current');
  assert.equal(a.get('s3'), 'unassigned');
});

test('compareHome splits sessions and counts Home use per arm', () => {
  const d: StudyData = { tasks: [], sessions: [session('s1', 'completed'), session('s2', 'completed'), session('s3', 'abandoned')], attempts: [], feedback: [] };
  const events = [ev('s1', 'session_started', { homeVariant: 'next' }), ev('s1', 'home_end_reached'), ev('s1', 'home_unit_opened'), ev('s1', 'home_unit_opened'), ev('s2', 'session_started', { homeVariant: 'current' }), ev('s3', 'session_started', { homeVariant: 'next' })];
  const rows = compareHome(d, events, Date.parse('2026-10-03T12:00:00Z'));
  const next = rows.find((r) => r.arm === 'next')!;
  const cur = rows.find((r) => r.arm === 'current')!;
  assert.equal(next.sessions, 2);
  assert.equal(next.completed, 1);
  assert.equal(next.reachedEnd, 1);
  assert.equal(next.openedFromHome, 1);
  assert.equal(cur.sessions, 1);
  assert.ok(!rows.some((r) => r.arm === 'unassigned'));
});
