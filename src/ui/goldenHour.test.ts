import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eveningCrossing, goldenHour, goldenHourLine } from './goldenHour';

const IST = 5.5 * 3600e3;
const istMinutes = (ms: number) => Math.round((((ms + IST) % 864e5) + 864e5) % 864e5 / 60000);

test('Hyderabad sunset on 3 Oct 2026 is about 5:58 to 6:05 pm IST', () => {
  const set = eveningCrossing(Date.UTC(2026, 9, 3, 6), 17.385, 78.487, -0.833)!;
  const m = istMinutes(set);
  assert.ok(m >= 17 * 60 + 52 && m <= 18 * 60 + 8, `${Math.floor(m / 60)}:${m % 60}`);
});
test('golden hour starts about half an hour before sunset in Hyderabad', () => {
  const g = goldenHour('Hyderabad', Date.UTC(2026, 9, 3, 6))!;
  const mins = (g.end - g.start) / 60000;
  assert.ok(mins > 20 && mins < 35, String(mins));
  assert.equal(g.day, 'today');
});
test('after sunset it gives tomorrow', () => assert.equal(goldenHour('Hyderabad', Date.UTC(2026, 9, 3, 14))!.day, 'tomorrow'));
test('a readable line', () => assert.match(goldenHourLine('Hyderabad', Date.UTC(2026, 9, 3, 6))!, /^Golden hour in Hyderabad today: \d{1,2}:\d{2} to \d{1,2}:\d{2} pm$/));
test('unknown city gives nothing rather than a wrong time', () => assert.equal(goldenHourLine('Atlantis'), null));
test('city with a suffix still resolves', () => assert.ok(goldenHourLine('Mumbai · will travel', Date.UTC(2026, 9, 3, 6))));
