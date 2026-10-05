/**
 * Reports sent from the app in this session, in the shape the moderation console reads (kind,
 * object id, author, reason). The prototype has no report store in the shared world; this log only
 * makes the payload inspectable in QA. The reporter is kept apart from what the author ever sees.
 */
export interface SentReport {
  kind: 'Post' | 'Person' | 'Production house' | 'Role' | 'Project' | 'Event' | 'Review' | 'Other';
  objectId?: string;
  authorId?: string;
  subject: string;
  reason: string;
  note?: string;
  reporterId: string;
  /** Where it lands first (stakeholder escalation: Support, Trust and Safety, Child Safety, Admin). */
  level?: ReportLevel;
}

export type ReportLevel = 'Support' | 'Trust and Safety' | 'Child Safety' | 'Admin';

/** Anything about a child goes to Child Safety; money for a role or a fake listing to Trust and Safety. */
export function reportLevel(reason: string): ReportLevel {
  if (/child|minor/i.test(reason)) return 'Child Safety';
  if (/money|fake|not a real|impersonation|harassment|unsafe|misleading|stolen/i.test(reason)) return 'Trust and Safety';
  return 'Support';
}

export const sentReports: SentReport[] = [];
