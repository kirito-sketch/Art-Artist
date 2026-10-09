# 4. Journeys

The core v1 journeys, step by step, with their main branches drawn in. Under each one: the edge cases already catalogued for it in `docs/EDGE_CASE_MATRIX.md` (520 in total, re-run on 9 October 2026).

How to read the diagrams: rectangles are screens or steps, diamonds are decisions, and rounded boxes are where the journey ends.

---

## J1. A new person joins

```mermaid
flowchart TD
  A["Open Ana for the first time"] --> B["Intro screens (shown once)"]
  B --> C["Welcome"]
  C --> D{"Continue with"}
  D -- Apple / Google --> E["Provider sign-in"]
  D -- Email --> F["Enter email"] --> G["6-digit code"]
  G -- "wrong or expired" --> G
  E --> H{"Already has an account?"}
  G --> H
  H -- Yes --> HOME(["Signed in: Home"])
  H -- "Started before" --> RES["Resume at the first missing step"]
  H -- No --> I["Before you join<br/>(terms, privacy, 18+)"]
  I --> J["You: name and craft"]
  J --> K["What you're here for"]
  K --> L["Where you work"]
  L --> M["Add your work (optional)"]
  M --> FH(["First Home"])
  RES --> J
```

- Back always returns one step and never re-enters a code screen. A refresh keeps your place.
- An invite link skips the intro and adds an optional phone step.
- **Edge cases:** Authentication (20), Account linking (8), Age and eligibility (9), Individual onboarding (20), Terms and consent (12).

## J2. A returning person signs in

```mermaid
flowchart TD
  A["Welcome"] --> B["Sign in"]
  B --> C{"Method"}
  C --> D["Apple / Google / email code"]
  D --> E{"Which account?"}
  E -- "Found, complete" --> F{"Terms changed since?"}
  F -- No --> HOME(["Home, acting as last identity"])
  F -- Yes --> T["Agree to the updated terms only"] --> HOME
  E -- "Found, unfinished" --> R(["Resume onboarding where they stopped"])
  E -- "Not found" --> N["No account yet"]
  N -- "Create one" --> J1(["J1: Before you join"])
  N -- "Try another way" --> B
```

- Accounts are matched only by the provider's ID or the verified email, never by name. Different sign-in methods are never merged automatically.
- **Edge cases:** Authentication (20), Account linking (8). 5 need a product decision (see document 7, theme 1).

## J3. A person finds work and shows interest

```mermaid
flowchart TD
  A["Home: Opportunities for you<br/>or Discover: Opportunities<br/>or a project / house page"] --> B["Role page"]
  B --> C{"Role status"}
  C -- Closed / Filled --> X(["Outcome shown; no interest possible"])
  C -- Open --> D["Show interest (optional note, short answers)"]
  D -- "fails" --> D2["Couldn't send. Nothing was shared. Try again"] --> D
  D --> E["Interest sent"]
  E -- "Withdraw (undo)" --> W(["Withdrawn; house sees 'No longer interested'"])
  E --> F{"House response"}
  F -- Messages --> G(["In conversation (withdraw disappears)"])
  F -- "Not now" --> S(["Nothing shown to the person"])
  F -- "Filled by someone else" --> O(["Told the outcome"])
  F -- "Role details change" --> U["'Updated since you showed interest'"] --> E
```

- Interest is your live profile plus an optional note. Nothing to edit; withdraw and send again to change the note.
- **Edge cases:** Roles and opportunities (25), Interest (17), Search and discovery (18).

## J4. A production house gets onto Ana

```mermaid
flowchart TD
  A{"How the house arrives"} -- "Sales-assisted invite" --> B["Invite link"]
  A -- "Self-serve" --> S["Set up a house page"]
  B --> C["Sign in or sign up"] --> D{"Signed in with the invited address?"}
  D -- No --> D2["'This invite was sent to m***@…'"] --> C
  D -- Yes --> E["Accept: you can act for the house"]
  S --> V["Verification pending"]
  E --> V
  V --> P["Prepare privately: page, private projects, members"]
  V --> Q{"Ana verifies"}
  Q -- Approved --> OK(["Verified: public roles, credits, sharing, search"])
  Q -- "More evidence" --> V
```

- Until verified, a house has no public label; it just can't publish.
- **Edge cases:** Production house onboarding (6), Production house verification (18). 7 need a product decision (verification evidence, revocation).

## J5. A house hires: publish a role and review interest

```mermaid
flowchart TD
  A["Acting as Konark: Create → Open a role"] --> B["Pick a project"]
  B --> C["Role details: craft, location, dates, description, up to 3 questions"]
  C --> D{"House verified?"}
  D -- No --> D2(["Saved privately; can't publish yet"])
  D -- Yes --> E["Published: on Discover, Home, project page"]
  E --> F["Interest arrives (notification)"]
  F --> G["Review interest: New · In conversation · Not now · No longer interested"]
  G --> H["Message as Konark Pictures"]
  E --> I["Edit: location, dates, description<br/>(title, craft and project are fixed)"]
  E --> J{"Close role"}
  J -- "Filled through Ana" --> K["Choose who"] --> L(["Filled: others told; can't reopen"])
  J -- "Filled another way / No longer needed / Paused" --> M(["Closed: can reopen"])
  L --> N["Open a new role (keeps the filled record)"]
```

- No applicant tracking: no stages, shortlists or rejections.
- **Edge cases:** Roles and opportunities (25), Interest (17), Identity switching (18).

## J6. Team and credits: from added to a verified credit

```mermaid
flowchart TD
  A["House workspace: add person to project"] --> B["Person: 'Project you're on' (private)"]
  B -- "This isn't right" --> B2["House sees the flag; edits or removes"]
  A --> C{"Member can issue credits?"}
  C -- No --> C2["Credit prepared, waiting for someone with authority"] --> D
  C -- Yes --> D["Credit issued"]
  D --> E["Person: Waiting for you"]
  E -- Accept --> F(["Accepted: on profile, project page, house 'Worked with'"])
  E -- "Something's wrong" --> G["Correction with reason"] --> H["House issues corrected credit"] --> E
  F -- "Ask to amend" --> I{"House"}
  I -- "Propose revision" --> J["Person accepts revision"] --> F
  I -- "Keep as is" --> F
```

- Nothing is public until the person accepts. An accepted credit can never be deleted, only amended with the person's agreement.
- If the project is private, accepted credits show only once the house shares it.
- **Edge cases:** Added to a project (20), Credits (41), People not yet on Ana (18), Independent projects (14). 32 need a product decision.

## J7. A person posts work or says they're available

```mermaid
flowchart TD
  A["Create"] --> B{"What"}
  B -- Post --> C["Pick photos / video from the device"]
  C --> D["Reorder, reposition, choose cover, caption"]
  D --> E["Preview"] --> F["Publish"]
  F -- "fails" --> F2["Posting failed: draft kept, try again"] --> F
  F --> G(["On the feed and the profile's work"])
  B -- "Open to work" --> H["Availability sheet"] --> I(["Profile shows availability; offer to share as a post"])
  B -- "Looking for someone" --> J(["Collaboration post"])
```

- Tall images are never cropped. Posting as a house never adds to anyone's personal portfolio.
- **Edge cases:** Media and portfolio (14), Profile (14), Network and failure (14).

## J8. Messaging between a person and a house

```mermaid
flowchart TD
  A{"Starts from"} -- "Person: Message on a house page" --> C["Conversation with Konark Pictures"]
  A -- "House: Message as Konark (from review or a profile)" --> C
  C --> D["Send"]
  D -- "fails" --> D2["Not delivered · Tap to retry"] --> D
  D --> E(["Delivered; the other side is notified"])
  C -- "One side blocks" --> F(["Closed both ways; history kept"])
```

- Members reply as the house and the composer says "Replying as Konark Pictures". A member acting as themselves can't reply as the house.
- **Edge cases:** Messaging (17), Notifications (17), Identity switching (18).

## J9. Staying safe: report and block

```mermaid
flowchart TD
  A["Profile, house, project, role or post: More"] --> B{"Action"}
  B -- Report --> C["Reason + optional detail"] --> D["Sent: Ana reviews; you aren't named"] --> E{"Also block?"}
  B -- Block --> F["Confirm: what blocking does"] --> G(["Hidden from each other everywhere; records kept"])
  E -- Yes --> F
  E -- No --> H(["Done"])
  D --> M["Moderator console: review → proportionate action"]
```

- Blocking is personal, even while acting for a house. Undo it from Settings or the blocked profile.
- **Edge cases:** Report and Block (23), Moderation (24).

---

## Also in the prototype (proposed for v1.1)

- **Events:** create a free event, request to attend, capacity, reminders.
- **Film reviews:** rate and review released films.

## Edge cases not tied to one journey

Account deletion (18) · Privacy and data rights (6) · Organisation closure (13) · Project privacy (13), publication (5) and lifecycle (12) · Data integrity (8) · Concurrency (12) · Accessibility (12) · Follow and Save (9) · Fine arts future-proofing (11).

**For approval:** each journey's main path and branches. Changes agreed on Sunday will be redrawn here after they're made in the prototype.
