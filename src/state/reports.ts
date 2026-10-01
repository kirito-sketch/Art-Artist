/**
 * Reports sent from the app in this session, in the shape the moderation console reads (kind,
 * object id, author, reason). The prototype has no report store in the shared world; this log only
 * makes the payload inspectable in QA. The reporter is kept apart from what the author ever sees.
 */
export interface SentReport {
  kind: 'Post' | 'Person' | 'Production house' | 'Role' | 'Project' | 'Other';
  objectId?: string;
  authorId?: string;
  subject: string;
  reason: string;
  note?: string;
  reporterId: string;
}

export const sentReports: SentReport[] = [];
