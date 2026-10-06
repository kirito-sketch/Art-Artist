import type { EventRequest } from '../domain/eventAttendance';
/** Prototype session records, separate from Saved and public profile data. Production needs authenticated storage. */
export const eventRequests: EventRequest[] = [];
/** Clearly fictitious seed-account emails; onboarding supplies a real private account value in-session. */
export const accountEmails: Record<string, string> = {
  kiran: 'kiran@example.com',
  tara: 'tara@example.com',
  aditi: 'aditi@example.com',
};
