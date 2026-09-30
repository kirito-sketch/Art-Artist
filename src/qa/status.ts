import type { Outcome } from './checks';
import type { Scenario, Status } from './types';

/*
 * A scenario's status combines what the manifest says with what its automated checks found. Any failing
 * check makes it Failed; all passing makes it Passed. Checks that cannot run yet leave the written status.
 */

export interface Effective {
  status: Status;
  auto?: { pass: number; fail: number; missing: number };
}

export function effective(s: Scenario, results: Record<string, Outcome>): Effective {
  if (!s.auto?.length) return { status: s.status };
  const rs = s.auto.map((id) => results[id]).filter(Boolean);
  const auto = { pass: rs.filter((r) => r.result === 'pass').length, fail: rs.filter((r) => r.result === 'fail').length, missing: rs.filter((r) => r.result === 'missing').length };
  if (auto.fail) return { status: 'Failed', auto };
  if (auto.pass && !auto.missing) return { status: 'Passed', auto };
  return { status: s.status, auto };
}

/** Is this scenario done: its behaviour verified by a passing check, or checked by hand as implemented? */
export const isSettled = (st: Status) => st === 'Passed' || st === 'Automated' || st === 'Implemented';
