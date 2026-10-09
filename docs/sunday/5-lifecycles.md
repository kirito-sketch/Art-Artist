# 5. Lifecycles

The states each key object moves through, and what moves it. These are the rules developers will enforce on the server.

## Project

```mermaid
stateDiagram-v2
  [*] --> Private: House creates
  Private --> Shared: Share on Ana (verified house)
  Private --> Cancelled: Cancelled (archived privately)
  Shared --> Cancelled: Cancelled (page marked, credits stay)
  Shared --> Private: Unshare (accepted credits stay on profiles)
```

Stages shown on the page (development, pre-production, production, post-production, released) are information, not states. A public project in post-production or released needs a trailer or teaser.

## Role

```mermaid
stateDiagram-v2
  [*] --> Open: Published (verified house)
  Open --> Open: Edit location, dates, description
  Open --> Filled: Filled through Ana (who was chosen)
  Open --> Closed: Filled another way / No longer needed / Paused
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
  Pending --> Verified: Ana approves evidence
  Pending --> Pending: More evidence requested
  Verified --> Restricted: Temporary limits (stated, with an end date)
  Restricted --> Verified: Limits end
  Verified --> Revoked: Verification revoked
```

Revoked: new public roles and credits stop, open roles close with a neutral reason, accepted credits stay on the films. (Proposed in the edge-case catalogue; needs approval, see document 7.)

## Person account

```mermaid
stateDiagram-v2
  [*] --> Onboarding: Signed up
  Onboarding --> Active: Finished onboarding
  Active --> Suspended: Moderation
  Suspended --> Active: Reinstated
  Active --> Deleted: Person deletes account
```

Deleted: the profile goes; accepted credits stay on the film as the person's name with no link (legal review pending). Suspended: the profile is hidden; credits stay on films as plain names.

**For approval:** these states and transitions, especially the credit and role rules, which are hard to change after launch.
