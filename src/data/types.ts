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
  width?: number;
  height?: number;
  contentType?: 'photo' | 'portrait' | 'artwork';
  focal?: { x: number; y: number };
  /** Original stays unchanged. Destination framing never becomes another surface's crop. */
  presentations?: Partial<Record<MediaSurface, MediaFraming>>;
  alt?: string;
  poster?: string;
  /** Optional delivered derivatives. The frontend never fabricates these URLs. */
  variants?: { src: string; width: number }[];
}

export type MediaSurface = 'preview' | 'post' | 'discover-bento' | 'profile-hero' | 'portfolio-thumbnail' | 'credit-card' | 'project-card' | 'project-hero' | 'event-card' | 'event-hero' | 'spotlight' | 'search-thumbnail' | 'showreel' | 'original' | 'avatar' | 'logo';
export type MediaFraming = { fit?: 'cover' | 'contain'; focal?: { x: number; y: number } };
export type PostPresentation = 'original' | 'portrait' | 'square' | 'landscape';

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
  avatarFraming?: MediaFraming;
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
  presentation?: PostPresentation;
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
  kind: 'credit' | 'message' | 'interest' | 'follow' | 'response' | 'event';
  text: string;
  actorId: string;
  time: string;
  unread: boolean;
  route?: { name: 'conversation' | 'profile' | 'opportunity' | 'project' | 'hproject' | 'association' | 'event'; id: string };
  /** The organisation this belongs to. Absent means it's for the person. */
  forId?: string;
}

export interface Viewer {
  id: string;
  craft: Craft;
  firstName: string;
}

/**
 * A dated, material change to a project: the supply that keeps Home alive without anyone having to post
 * (docs/HOME.md). Significance is decided by the Home candidate adapter, never stored.
 */
export interface ProjectUpdate {
  id: string;
  /** A Work id (src/domain/discovery.ts discoverableProjects). */
  projectId: string;
  kind: 'stage' | 'crew' | 'dates';
  /** Stage changes: the new stage. Crew: the line ("Editor"). Dates: what was confirmed. */
  to: string;
  from?: string;
  /** People the change is about (a crew member who joined). */
  actorIds?: string[];
  /** Hours before the prototype loads, so the data is always "this week". */
  hoursAgo: number;
}

/**
 * An industry event (docs/EVENTS.md): a screening or premiere, a workshop, a meetup or a festival. Always
 * hosted by a verified production house or a verified adult; optionally linked to a project and speakers.
 * Auditions are never events: they are roles. Saved is a private bookmark; attendance uses a separate request.
 */
export type EventType = 'screening' | 'workshop' | 'meetup' | 'festival' | 'talk' | 'exhibition' | 'other';
export interface IndustryEvent {
  id: string;
  type: EventType;
  title: string;
  hostId: string;
  projectId?: string;
  speakerIds?: string[];
  city: string;
  venue: string;
  /** Epoch ms. */
  start: number;
  end?: number;
  /** Pricing type. V1 events are always free; 'paid' is kept for the future paid-event flow (docs/EVENTS.md). */
  price: { kind: 'free' } | { kind: 'paid'; amount: string };
  /** Registration, RSVP or tickets link, opened outside the app. Separate from price: a free event can need it too. */
  link?: string;
  /** Optional cover. Without one, the event uses its film's or its host's imagery. */
  cover?: Media;
  summary: string;
  /** 'under_review' belongs to the future paid flow; V1 never creates it. */
  status: 'scheduled' | 'closed' | 'draft' | 'cancelled' | 'under_review';
  capacity?: number;
  location?: 'physical' | 'online';
  /** Only returned to the organiser and confirmed attendees; never used on public cards. */
  joiningUrl?: string;
  /** Checked by the curation team (lets a reviewed event mention, say, casting directors). */
  reviewed?: boolean;
  /** Set when the host changes the date, time or place after people requested attendance. */
  changed?: string;
  /** Who it's for: crafts, or everyone (the default). Used to rank Home's events, never to hide an event. */
  audience?: Craft[] | 'everyone';
  /** When it was published (epoch ms). */
  publishedAt?: number;
  /** People who marked Interested (a count; who they are stays private to them). */
  interestedCount?: number;
  /** Chosen by the curation team (at most one per city per week). Never sold. */
  editorial?: boolean;
}
