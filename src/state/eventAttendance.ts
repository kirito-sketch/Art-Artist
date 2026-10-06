import { HOME_REQUEST_EVENT_ID } from '../data/seed';
import type { EventRequest } from '../domain/eventAttendance';
/** Prototype session records, separate from Saved and public profile data. Production needs authenticated storage. */
/** Two fictitious requests let the hosting house try review/accept. Kiran starts with no request. */
export const eventRequests: EventRequest[] = [
  { id: 'er-home-sameer', eventId: HOME_REQUEST_EVENT_ID, personId: 'sameer', email: 'sameer.event@example.com', note: 'I would love to meet the camera and lighting team before the Araku shoot.', status: 'pending', requestedAt: Date.now() - 2 * 36e5 },
  { id: 'er-home-sana', eventId: HOME_REQUEST_EVENT_ID, personId: 'sana', email: 'sana.event@example.com', note: 'Interested in the camera-team discussion and meeting other assistants.', status: 'pending', requestedAt: Date.now() - 36e5 },
];
/** Clearly fictitious seed-account emails; onboarding supplies a real private account value in-session. */
export const accountEmails: Record<string, string> = {
  kiran: 'kiran@example.com',
  tara: 'tara@example.com',
  aditi: 'aditi@example.com',
};
