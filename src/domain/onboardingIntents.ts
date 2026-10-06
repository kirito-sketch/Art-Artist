import type { Intent } from './relevance';

export const MAX_ONBOARDING_INTENTS = 3;

/** Exploring stands alone; other goals keep their selection order for the first Home. */
export function toggleOnboardingIntent(selected: Intent[], next: Intent): Intent[] {
  if (selected.includes(next)) return selected.filter((id) => id !== next);
  if (next === 'explore') return ['explore'];
  const goals = selected.filter((id) => id !== 'explore');
  return goals.length < MAX_ONBOARDING_INTENTS ? [...goals, next] : selected;
}

export const needsAvailability = (selected: Intent[]) => selected.some((id) => id === 'work' || id === 'collaborate');
