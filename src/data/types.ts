/**
 * A piece of visual media. `src` is the intended file; `fallback` is shown until that file exists, so
 * later image deliveries replace stand-ins without code changes.
 */
export interface Media {
  id: string;
  kind: 'image' | 'video';
  src: string;
  fallback?: string;
  duration?: string;
  caption?: string;
}

export type Craft =
  | 'cinematographer'
  | 'camera'
  | 'editor'
  | 'director'
  | 'actor'
  | 'colourist'
  | 'production-design'
  | 'sound'
  | 'costume'
  | 'lighting'
  | 'production'
  | 'writing'
  | 'music'
  | 'makeup'
  | 'vfx';

export interface Person {
  id: string;
  kind: 'person';
  name: string;
  role: string;
  craft: Craft;
  city: string;
  tone: number;
  photo?: string;
  gear?: string;
  years?: number;
  languages?: string[];
  identityVerified?: boolean;
  availableFrom?: string;
  /** Private or removed profiles still render as authors but cannot be opened. */
  visibility?: 'public' | 'private' | 'removed';
  /** Structured identity: up to four more crafts, and a free-text specialisation. */
  crafts?: Craft[];
  specialisation?: string;
  openToTravel?: boolean;
}

export interface Org {
  id: string;
  kind: 'org';
  name: string;
  city: string;
  tone: number;
  verified: boolean;
  about: string;
  logo?: string;
}

export type Party = Person | Org;

export type OpportunityKind = 'crew' | 'casting' | 'collab';

export interface Opportunity {
  id: string;
  kind: OpportunityKind;
  role: string;
  project: string;
  projectType: string;
  /** Verified production house for crew/casting. */
  orgId?: string;
  /** Peer author for collaborations. */
  authorId?: string;
  collabIntent?: 'looking' | 'available';
  allowDM?: boolean;
  city: string;
  distance?: string;
  dates: string;
  compensation: string;
  paid: boolean;
  closesInDays?: number;
  stage: string;
  language?: string;
  about: string;
  lookingFor: string[];
  questions?: string[];
  audition?: { place: string; when: string; notes: string };
  match: string[];
  /** A match reason worth surfacing on the card because the user could not guess it. */
  highlight?: string;
  forCrafts: Craft[];
  media: Media;
  postedAgo: string;
}

export type NetworkEventKind = 'credit' | 'project' | 'portfolio' | 'reel' | 'available' | 'collab';

export interface NetworkEvent {
  id: string;
  kind: NetworkEventKind;
  actorIds: string[];
  time: string;
  /** Lower number ranks higher. Credits outrank projects outrank availability outrank portfolio. */
  weight: number;
  title?: string;
  detail?: string;
  orgId?: string;
  media?: Media[];
  opportunityId?: string;
  isNew?: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  time: string;
  text: string;
  media: Media[];
  likes: number;
  comments: number;
  project?: string;
  status?: 'published' | 'uploading' | 'failed';
}

export interface Credit {
  id: string;
  title: string;
  year: string;
  role: string;
  department: string;
  orgId: string;
  format: string;
  status: 'Released' | 'Post-production' | 'Filming';
  media: Media;
}

export interface Project {
  id: string;
  title: string;
  year: string;
  role: string;
  format: string;
  note: string;
  media: Media;
}

export type ContextKind = 'crew' | 'casting' | 'collab' | 'project' | 'credit';

export interface Message {
  id: string;
  from: 'me' | 'them';
  text: string;
  time: string;
  senderName?: string;
  status?: 'sending' | 'failed';
}

export interface Conversation {
  id: string;
  withId: string;
  context: { kind: ContextKind; label: string; detail: string; refId?: string };
  orgOwned?: boolean;
  /** The identity the viewer uses in this conversation: 'self' or an organisation id. */
  asId?: string;
  /** One suggested next step shown in the inbox row, e.g. confirming a recce. */
  action?: { label: string; reply: string };
  media?: Media;
  unread: number;
  updated: string;
  messages: Message[];
}

export interface Interest {
  id: string;
  personId: string;
  opportunityId: string;
  note?: string;
  /** Optional short answers to the role's questions. Never required. */
  answers?: string[];
  /** The person withdrew. They stay in the list, greyed, so nothing silently disappears. */
  withdrawn?: boolean;
  /** The house's side of the review: messaged, or set aside for now. Never shown to the person. */
  review?: 'messaged' | 'notNow';
  time: string;
}

export interface Notification {
  id: string;
  kind: 'credit' | 'message' | 'interest' | 'follow' | 'response';
  text: string;
  actorId: string;
  time: string;
  unread: boolean;
  route?: { name: 'conversation' | 'profile' | 'opportunity' | 'project' | 'hproject' | 'association'; id: string };
  /** The organisation this belongs to. Absent means it's for the person. */
  forId?: string;
}

export interface Viewer {
  id: string;
  craft: Craft;
  firstName: string;
}
