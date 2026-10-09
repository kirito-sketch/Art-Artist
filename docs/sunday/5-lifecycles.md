# 5. Lifecycles

The states each key object moves through, and what moves it. These are the rules developers will enforce on the server.

Each diagram shows what the prototype does today. Steps marked **(proposed)** come from the edge-case catalogue and aren't built yet; they need approval (document 7).

## Project

```mermaid
stateDiagram-v2
  [*] --> Private: House creates
  Private --> Shared: Share on Ana (verified house)
  Private --> Cancelled: (proposed) archived privately
  Shared --> Cancelled: (proposed) page marked, credits stay
  Shared --> Private: (proposed) unshare, credits stay on profiles
```

Stages shown on the page (development, pre-production, production, post-production, released) are information, not states. A public project in post-production or released needs a trailer or teaser.

## Role

```mermaid
stateDiagram-v2
  [*] --> Open: Published (verified house)
  Open --> Open: Edit location, dates, description
  Open --> Filled: Filled through Art and Artist (who was chosen) or another way
  Open --> Closed: No longer needed / Project paused
  Closed --> Open: Reopen
  Filled --> [*]: Final. "Open a new role" creates a new one
```

## Interest

```mermaid
stateDiagram-v2
  [*] --> New: Person shows interest
  New --> Withdrawn: Person withdraws (before a conversation)
  New --> InConversation: House messages
  New --> NotNow: House marks "Not now"
  NotNow --> New: House moves back
  Withdrawn --> New: Person shows interest again
```

Interest is never deleted. The person is never told "Not now".

## Credit

```mermaid
stateDiagram-v2
  [*] --> Prepared: Member without authority
  [*] --> Proposed: Issued by someone with authority
  Prepared --> Proposed: Issued
  Proposed --> Accepted: Person accepts
  Proposed --> Correction: Something's wrong
  Correction --> Proposed: House issues corrected credit
  Accepted --> Amending: Person asks to amend
  Amending --> Accepted: House keeps it, or person accepts the revision
```

Only Accepted credits are public. An accepted credit can't be deleted by anyone, including Ana moderators.

## House verification

```mermaid
stateDiagram-v2
  [*] --> Pending: House set up or invited
  Pending --> Verified: Ana approves (outside the app)
  Pending --> Pending: (proposed) more evidence requested
  Verified --> Restricted: (proposed) temporary limits with an end date
  Restricted --> Verified: (proposed) limits end
  Verified --> Revoked: (proposed) verification revoked
```

In the prototype, verification is a placeholder: a house is either Pending or Verified, and nothing moves it between them inside the app. Revoked (proposed): new public roles and credits stop, open roles close with a neutral reason, accepted credits stay on the films.

## Person account

```mermaid
stateDiagram-v2
  [*] --> Onboarding: Signed up
  Onboarding --> Active: Finished onboarding
  Active --> Suspended: Moderator suspends (console)
  Suspended --> Active: (proposed) reinstated after review
  Active --> Deleted: Person deletes account (Settings, Your data)
```

Deleted: the profile goes; accepted credits stay on the film as the person's name with no link (legal review pending). Suspended (proposed detail): the profile is hidden; credits stay on films as plain names.

**For approval:** these states and transitions, especially the credit and role rules, which are hard to change after launch.
