import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canReview, featured, isOutThisWeek, opensLater, releaseAt, releaseWeekStart, reviewsOpen, sortReviews, stats, topRated, validStars, type Review } from './reviews';

// Monday 5 Oct 2026, 15:00 India time.
const NOW = Date.parse('2026-10-05T15:00:00+05:30');
const r = (p: Partial<Review> = {}): Review => ({ id: 'r', projectId: 'f', personId: 'p', stars: 4, at: NOW, helpful: [], ...p });

test('a release week starts on the most recent Friday, midnight India time', () => {
  assert.equal(releaseWeekStart(NOW), releaseAt('2026-10-02'));
  // Friday itself, just after midnight: that Friday.
  assert.equal(releaseWeekStart(Date.parse('2026-10-09T00:05:00+05:30')), releaseAt('2026-10-09'));
  // Thursday night still belongs to the week before.
  assert.equal(releaseWeekStart(Date.parse('2026-10-08T23:59:00+05:30')), releaseAt('2026-10-02'));
});

test('reviews open on the release date, and only for released films', () => {
  assert.equal(reviewsOpen({ stage: 'Released', releaseDate: '2026-10-02' }, NOW), true);
  assert.equal(reviewsOpen({ stage: 'Released', releaseDate: '2026-10-09' }, NOW), false);
  assert.equal(reviewsOpen({ stage: 'Post-production', releaseDate: '2026-10-02' }, NOW), false);
  assert.equal(reviewsOpen({ stage: 'Released' }, NOW), false);
  assert.equal(opensLater({ stage: 'Post-production', releaseDate: '2026-10-09' }, NOW), true);
});

test('out this week means released since Friday', () => {
  assert.equal(isOutThisWeek({ stage: 'Released', releaseDate: '2026-10-02' }, NOW), true);
  assert.equal(isOutThisWeek({ stage: 'Released', releaseDate: '2026-09-25' }, NOW), false);
});

test('stars are half steps from 0.5 to 5', () => {
  assert.equal(validStars(4.5), true);
  assert.equal(validStars(0), false);
  assert.equal(validStars(4.3), false);
  assert.equal(validStars(5.5), false);
});

test('credited people and house members never review; acting for a house never reviews', () => {
  const base = { viewerId: 'kiran', acting: 'self', memberships: [], creditedIds: ['devika'], houseIds: ['bluelotus'] };
  assert.equal(canReview(base), true);
  assert.equal(canReview({ ...base, creditedIds: ['kiran'] }), false);
  assert.equal(canReview({ ...base, memberships: ['bluelotus'] }), false);
  assert.equal(canReview({ ...base, acting: 'konark' }), false);
});

test('the average needs five ratings and rounds to one decimal', () => {
  assert.equal(stats([r(), r(), r(), r()]).enough, false);
  const s = stats([r({ stars: 5 }), r({ stars: 4.5 }), r({ stars: 4 }), r({ stars: 3 }), r({ stars: 4 })]);
  assert.equal(s.enough, true);
  assert.equal(s.avg, 4.1);
  assert.deepEqual(s.dist, [2, 2, 1, 0, 0]);
});

test('the featured review is the most helpful one with text and no spoiler', () => {
  const list = [r({ id: 'a', text: 'Good', helpful: ['x', 'y', 'z'], spoiler: true }), r({ id: 'b', text: 'Fine', helpful: ['x'] }), r({ id: 'c', helpful: ['x', 'y'] })];
  assert.equal(featured(list)?.id, 'b');
});

test('with nothing marked helpful, the longest well-rated review is featured', () => {
  const list = [r({ id: 'a', text: 'A very long but harsh review of it', stars: 2 }), r({ id: 'b', text: 'Lovely light', stars: 4.5 }), r({ id: 'c', text: 'Yes', stars: 5 })];
  assert.equal(featured(list)?.id, 'b');
  assert.equal(featured([r()]), undefined);
});

test('sorting by most helpful, then newest', () => {
  const list = [r({ id: 'a', at: 1 }), r({ id: 'b', at: 2, helpful: ['x'] }), r({ id: 'c', at: 3 })];
  assert.deepEqual(sortReviews(list, 'helpful').map((x) => x.id), ['b', 'c', 'a']);
  assert.deepEqual(sortReviews(list, 'newest').map((x) => x.id), ['c', 'b', 'a']);
});

test('sorting by highest rating, then newest', () => {
  const list = [r({ id: 'a', at: 1, stars: 3 }), r({ id: 'b', at: 2, stars: 5 }), r({ id: 'c', at: 3, stars: 3 })];
  assert.deepEqual(sortReviews(list, 'rating').map((x) => x.id), ['b', 'c', 'a']);
});

test('top rated leaves out films without enough ratings', () => {
  const by: Record<string, Review[]> = { a: Array(5).fill(r({ stars: 3 })), b: Array(6).fill(r({ stars: 4.5 })), c: [r({ stars: 5 })] };
  assert.deepEqual(topRated([{ id: 'a' }, { id: 'b' }, { id: 'c' }], (id) => by[id]).map((f) => f.id), ['b', 'a']);
});
