# Foundation pass: entry, onboarding, access, legal, moderation

Status: **architecture for review. Nothing built yet.** Version 19 (the research prototype) stays frozen; this work sits in front of it and beside it, not inside the validated flows.

Questions this answers: How does someone enter Ana? How does Ana establish who they are? How does an organisation gain legitimate access? What do users agree to? What happens when someone reports a problem?

One design throughout, in Minimal. The earlier onboarding exploration is archived and doesn't constrain this.

---

## 1. Splash and entry

**No marketing carousel.** People arrive at Ana because someone sent them, a production invited them, or they were told about it. A carousel delays them and tells them little. One line of value is enough.

```
Launch ─► Splash (brand over one illustration; shown only while the app loads, never a timer)
       ├─ signed in ─► Home (last identity used)
       ├─ has an invite link ─► Entry with the invite banner ("Konark Pictures invited you")
       └─ otherwise ─► Entry
```

**Splash:** the director's-chair illustration (tile 1 of the supplied set), full bleed, with the Ana mark. It lasts as long as loading takes, typically under a second, and cross-fades into Entry. No promotional sequence.

**Entry** (one screen):
- The same illustration, cropped to the top half. The mark and one line: "Where film people find each other and build a record of their work." (Film for now; see §9 on fine arts.)
- Buttons: **Continue with Apple**, **Continue with Google**, **Continue with email**.
- "Already on Ana? **Sign in**"
- Footer: Terms · Privacy · Community guidelines (readable before signing up).

## 2. Authentication

| Surface | Behaviour |
|---|---|
| Create account (email) | Email and password (with a show toggle and a strength hint) → consent screen → verify email with a 6-digit code → onboarding |
| Create account (Apple / Google) | Provider sheet → consent screen → onboarding. The email is already verified by the provider |
| Sign in | Email and password, or Apple / Google. On success: last identity used |
| Forgot password | Email → 6-digit code → new password → signed in |
| Email verification | Code screen with resend (after 30 s) and "change email". Signing in with an unverified account resumes here |
| Sign out | Settings → Sign out → confirm sheet ("You'll need to sign in again on this phone") |
| Error states | Wrong password, account already exists (offer Sign in), no connection, account suspended (plain notice with a support link) |

**Phone number:** collected and verified by one-time code, **optional for individuals** ("Productions that added you by phone can find you") and **required to accept an organisation invite sent by phone**. This is what later links "not on Ana" project records to a real person (CONSOLIDATION §7). Phone never appears publicly.

## 3. Individual onboarding

Goal: enough to be understood and matched, then straight into Ana. **Four short steps, with a progress bar.** Everything after step 3 can be skipped.

| Step | Screen | Required | Skippable |
|---|---|---|---|
| 1 | **You**: name (prefilled from Apple/Google), photo | Name | Photo |
| 2 | **What you do**: primary craft (one), additional crafts (up to 4), optional specialisation line | Primary craft | Additional crafts, specialisation |
| 3 | **Where you work**: city, "open to travel", languages | City, at least one language | Travel |
| 4 | **What you're looking for**: availability (available now / from a date / not looking), kinds of work (paid crew or cast work, collaborations, short films, ads, series) | No | Whole step |
| 5 | **Show your work**: add photos or a reel from the phone, or an independent project. **Skip for now** is a first-class button | No | Whole step |

Then **Home**.

- **Bio, gear, website and further languages** move to Edit Profile. The first Home suggests them once, as a single card.
- **No credits step.** A plain line on step 5: "Credits come from productions. When a production credits you on Ana, you'll be asked to accept it." Nothing in onboarding lets anyone say "I worked on Film X" as a verified record. Independent projects are labelled as such (DECISIONS §6).
- **Age:** the consent screen asks people to confirm they're 18 or older. Minors are out of scope until the guardian flow is designed (see open questions).

### Crafts: resolving free text vs structure

**Primary craft + up to 4 additional crafts + an optional free-text specialisation.**

- **Crafts are a short structured list**, grouped for scanning rather than as a taxonomy tree: Direction · Writing · Acting · Cinematography · Camera crew · Lighting · Editing · Colour · Sound · Music · Production design · Costume · Make-up & hair · VFX & animation · Production. It's one screen of tiles with search, and "Something else" opens a text field that the Ana team reviews to grow the list.
- **The specialisation is free text** ("Anamorphic, night exteriors", "Telugu dubbing", "Steadicam"). It's shown on the profile and searched, but never used as a category.
- **The profile headline is derived**: primary craft plus specialisation (for example "Cinematographer · Anamorphic, nights"). Editable later.
- **Data model:** `crafts: { id, label, domain }` with `domain: 'film' | 'art'`. A person has `primaryCraft`, `crafts[]` and `specialisation`. Fine arts adds crafts (painter, sculptor, photographer, curator…) to the same list without a new model. No employer field anywhere: companies relate to people only through projects, credits and memberships.

### First Home (Large Cards)

Built only from real data for a new person, and never fake engagement:
- **Roles for you**: open roles matching primary craft, city and languages. If there are few, it says so ("3 roles match. More appear as productions post.") rather than padding.
- **Productions near you**: verified houses in their city, with what they're making now.
- **People in your craft**: same craft and city, generated rather than curated. Follow buttons.
- **One setup card**: "Add your work", "Add a bio" or "Verify your phone", whichever matters most, dismissible.
- The **network activity** section is hidden until it has content (it already behaves like this for new users).

## 4. Production house access

Principle: **a human account always exists first**; an organisation is an identity that person is authorised to act for.

### A. Sales-assisted invite (the main path)

The Ana team creates the house (name, logo, description, city, type of work, **verified**) and invites a named person by email or phone, marking whether they can issue credits.

```
Invite (email or SMS link) ─► Entry, with a banner: "Konark Pictures invited you to act for them"
   ─► Sign in / create account (normal)
   ─► Short personal onboarding (steps 1–3, prefilled where possible; step 2 suggests "Production")
   ─► Invitation screen:
        house card (logo, name, verified, city)
        "You'll be able to: create projects, open roles, review interest and message as Konark Pictures"
        "Credits: you can issue credits for Konark Pictures"  (or "Credits are issued by others at Konark")
        invited by: Ana team or [owner name]
        consent: "I'm authorised by Konark Pictures to act for it" (explicit checkbox; for legal review)
        [Accept]   "This isn't for me"
   ─► "Switch between yourself and Konark from your name, any time" (shown once, pointing at the switcher)
   ─► Switch now ─► Slate (house Home), as built
```

- **Security:** the invite is tied to the email or phone it was sent to. Accepting requires the signed-in account to have that email or phone verified. If they differ: "This invite was sent to a•••@konark.in. Sign in with that address, or ask them to send it again."
- **Existing Ana users** (for example a producer who already has a profile) accept from a notification or the link. No new account.
- **Expired or revoked invites:** a plain screen with a "Contact Konark Pictures" link.

### B. Self-serve setup (when the house isn't on Ana yet)

From Create or Settings: **Set up a production house**.

1. **Basics:** name, logo, city, type of work (features, series, ads, documentary, music videos).
2. **About:** a two-line description, website or Instagram (optional).
3. **Verification:** one step asking for proof (registration or GST document, or a link to an official listing), plus the person's role at the house. "Ana checks this within 2 working days."
4. The person becomes the **owner** (can act, can issue credits).

**Until verified:** the house page exists and can hold **private projects**, but it **can't open public roles or issue credits**. A clear banner reads "Verification pending". This protects people from fake productions (Ana already promises "never charges to apply") and keeps credits trustworthy. *Open question:* allow unverified houses to post roles with an "Unverified" label?

### C. Adding more people who can act for a house

House settings → **Who can act for this house** → **Invite someone** (email or phone), with one toggle: **Can issue credits**. It's the same invitation screen as A. It's still a permission list, not a team product: no roles beyond owner / member / can-issue-credits, and no org chart.

### After setup

The identity switcher gains the house; the first switch lands on **Slate**, and the Profile tab shows the **Work-first** house page. A new house sees Slate's existing empty state ("Nothing in production · Start a project"). No new house Home.

## 5. Legal and consent

**Placeholder content, clearly marked "Draft for legal review".** We design the structure, not the law.

| Surface | Where it appears | Consent? |
|---|---|---|
| **Terms of Service** | Entry footer; consent screen; Settings → Legal | **Explicit** at signup, versioned |
| **Privacy Policy** | Entry footer; consent screen; Settings → Legal; next to phone verification | **Explicit** at signup (acknowledged together with Terms) |
| **Community and professional conduct** | Consent screen summary; Settings → Legal; linked from Report and from moderation notices | Part of Terms; summarised in plain language |
| **Acting for an organisation** | Invitation and house-setup screens | **Explicit** each time a person gains access to a house |
| Marketing emails | Consent screen | Optional, **off** by default |
| Age (18+) | Consent screen | **Explicit** |

**Consent screen ("Before you join"):** three short plain-language cards (what Ana is for and what you agree to; what we collect and why; how people treat each other here), each with "Read in full". Then two required checkboxes (Terms and Privacy; 18 or older), one optional toggle (emails), and **Agree and continue**. It's readable and never tiny print.

**Consent record:** `{ userId, document (terms | privacy | org-authority), version, acceptedAt, method (signup | re-consent | invite), locale }`. When a document changes materially: a one-time full-screen notice on next launch with a summary of changes, and Agree to continue.

**Settings → Legal and safety:** Terms, Privacy, Community guidelines, How reporting works, How blocking works. **Settings → Your data:** download your data, delete your account. **Settings → Help:** contact support.

## 6. Account deletion (proposal; needs legal and product decisions)

Deleting an account must not destroy other people's professional records.

| Data | Proposed outcome |
|---|---|
| Profile, photo, portfolio, posts, follows, saved items, interest sent, availability | Deleted |
| Private project associations, pending (unaccepted) credits | Deleted |
| **Accepted credits** | **Kept on the project page** as part of the film's record, but unlinked from any profile. Whether the name stays or becomes "Credit withheld" at the person's choice is *open (legal)* |
| Messages | Others keep their copies; the author shows as "Deleted account" |
| Organisation memberships | Removed. **The last owner of a house can't delete** until ownership is transferred or Ana is contacted |
| Reports made by or about them | Retained for a safety retention period, then deleted |
| Consent records | Retained as long as legally required |

**Flow:** Settings → Your data → Delete account → what happens (the table above in plain words) → option to download data first → confirm with password or code → **30-day deactivation** (the profile is hidden, and signing in within 30 days restores it) → permanent deletion.

## 7. Admin and moderation console

**Internal web tool, separate from the app.** Staff sign in with company accounts. It's never an identity in the app's switcher. Desktop layout. In the prototype it's a separate page (`?admin`).

### Queue

- Tabs: **New · Under review · Resolved**.
- Columns: priority, what was reported (type and name: person, house, project, role, post, message), reason, reports on this item, first reported, assignee.
- **Priority** comes from the reason: *urgent* (harassment or unsafe behaviour, asking for money to apply or audition, impersonating a person or production) and *normal* (misleading role, stolen work, other).
- Filters: type, reason, priority. Search by name.

### Report detail

- **Left:**
  - What was reported, as a snapshot captured at report time. Content can change after a report, so both "as reported" and "now" are shown.
  - All reports on this item, grouped, each with its reason and optional note.
  - Context: account age, identity or house verification, earlier reports and actions, current restrictions.
  - For houses: verification, open roles, projects.
  - For roles: interest received.
- **Right:** actions and the **audit history** (who did what, when, and why).
- **Reporter identity** is visible to moderators only, never shown to the reported person.

### Actions (proportionate; high impact needs a typed reason and confirmation)

| Action | Effect | Confirmation |
|---|---|---|
| Dismiss | No violation; the reporter is told the report was reviewed | Reason (pick) |
| Warn | The person is told which guideline, with a link | Reason |
| Remove content | A post, role, profile photo or text, or house page field is hidden; it can be restored | Reason |
| Restore | Undo a removal | Note |
| Restrict | Time-limited limits: can't message people who don't follow them, can't show interest, or (houses) can't open roles | Reason and duration |
| Suspend | Account or house can't be used; the profile is hidden | Typed reason, duration or indefinite, **second confirmation** |
| Escalate | Moves to a senior or legal reviewer, with a note | Note |

Every action writes an audit entry: `{ reportId, item, action, actorStaffId, reason, note, createdAt, reversibleUntil }`.

### Professional records are different

- **Moderators can't delete credits.** Credits are records issued by productions and accepted by people.
- A reported **credit** (for example, fake or wrong) goes back into the existing correction flow with the production, or, if fraud is suspected, the credit is **hidden from public pending review** and escalated. It's never deleted.
- **Suspending a person** hides their profile and stops their actions, but their accepted credits stay on the films they worked on, unlinked while suspended.
- **Suspending a house** stops anyone acting for it and closes its open roles. Its members' personal accounts are unaffected, and credits it issued stay.
- **Messages:** moderators see only the reported messages plus limited context, not whole inboxes.

### Telling people

| Event | Affected person | Reporter |
|---|---|---|
| Report dismissed | Nothing | "We reviewed your report. It didn't break our guidelines." |
| Warning | In-app notice naming the guideline | "We took action." (no detail) |
| Content removed | Notice naming the item and guideline, with "Request a review" (email support) | "We took action." |
| Restricted / suspended | Notice (in-app plus email) with what's limited, until when, which guideline, and "Request a review" | "We took action." |

The reporter's identity is never revealed. A formal appeals system is out of scope; for now "Request a review" goes to support, and the review is logged in audit history.

## 8. How it fits the prototype (build plan after approval)

- A new `entry` layer in front of the app: splash → entry → auth → consent → onboarding → Home. The prototype controls get "Start as a new person" and "Accept a house invite" to run the flows. **The default start and research mode stay exactly as they are**, and Version 19 flows are untouched.
- New people use the existing Home in its new-user state, with the one setup card added.
- House invite and setup end in the existing identity switcher and Slate.
- Settings gains Legal and safety, Your data (delete account, as a designed flow) and Help, only as new rows.
- Admin console is a separate desktop page (`?admin`) seeded with realistic reports, including those made in the app.

Build order: 1 splash and entry → 2 signup and onboarding → 3 house invite and setup → 4 legal and consent → 5 admin queue → 6 admin detail and actions.

## 9. Open questions (not decided silently)

1. **Sign-in methods:** Apple + Google + email is proposed. Is **phone OTP as a sign-in method** wanted for the Indian market, not just for verification?
2. **Phone verification** required for everyone, or only for org invites (proposed)?
3. **Minors:** 18+ at signup for now. When does the guardian flow come, and are child actors in scope for launch?
4. **Unverified houses:** can they post public roles with an "Unverified" label, or nothing until verified (proposed)?
5. **Verification evidence** for houses: which documents, who checks, and turnaround.
6. **Deleted accounts and accepted credits:** keep the name, withhold it, or let the person choose (legal, including India's DPDP Act).
7. **Retention periods** for reports, audit logs and consent records (legal).
8. **Organisation authority consent** wording and liability: legal review.
9. **Entry line** says "film people": when fine arts arrives, the line and the craft list widen; the model doesn't change.
10. **Appeals:** support email for now. A formal process later?
11. **Who at Ana moderates**, service levels for urgent reports, and whether houses can see reports about their own roles.
