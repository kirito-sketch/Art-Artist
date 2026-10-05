/*
 * Industry reviews: sample content for the District Home direction (?home=district). There is no review
 * feature yet; who may review (public or verified industry only) is still a stakeholder decision. The
 * comparison page in Studio says this is sample content; nothing inside the app does.
 */
export interface IndustryReview {
  id: string;
  projectId: string;
  personId: string;
  /** Out of 5. */
  score: number;
  quote: string;
  daysAgo: number;
}

export const REVIEWS: IndustryReview[] = [
  { id: 'rv1', projectId: 'neeliraat', personId: 'vikram', score: 4.5, quote: 'The night scenes are the best I have seen this year.', daysAgo: 2 },
  { id: 'rv2', projectId: 'neeliraat', personId: 'rhea', score: 4.5, quote: 'A grade that never shows off. Every colour has a reason.', daysAgo: 4 },
  { id: 'rv3', projectId: 'neeliraat', personId: 'kabir', score: 4, quote: 'Patient, quiet and very hard to forget.', daysAgo: 6 },
  { id: 'rv4', projectId: 'monsoon', personId: 'zoya', score: 4, quote: 'Quiet, patient editing that trusts its actors.', daysAgo: 3 },
  { id: 'rv5', projectId: 'monsoon', personId: 'sameer', score: 4.5, quote: 'Lit almost entirely with practicals. It works.', daysAgo: 8 },
  { id: 'rv6', projectId: 'faultlines', personId: 'devika', score: 4, quote: 'The best ensemble work on a streaming series this year.', daysAgo: 5 },
  { id: 'rv7', projectId: 'faultlines', personId: 'ishaan', score: 3.5, quote: 'Strong sets, uneven second half.', daysAgo: 9 },
];

export const reviewsFor = (projectId: string) => REVIEWS.filter((r) => r.projectId === projectId);
export const averageScore = (projectId: string) => {
  const rs = reviewsFor(projectId);
  return rs.length ? Math.round((rs.reduce((a, r) => a + r.score, 0) / rs.length) * 10) / 10 : null;
};
/** Films with reviews, best first. */
export const reviewedProjects = () => [...new Set(REVIEWS.map((r) => r.projectId))].sort((a, b) => (averageScore(b) ?? 0) - (averageScore(a) ?? 0));
