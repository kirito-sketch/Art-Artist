# Edge case matrix

> Generated from `src/qa/scenarios` by `npm run test:edge`. Do not edit by hand: change the manifest and regenerate.

Last automated run: 2026-09-30.

**What should Ana do?** is answered first for every scenario (the Expected behaviour column). Whether it then needs UI, an interaction test, a business rule, an automated test, a legal decision or user validation follows from that answer. Scenario IDs are permanent: numbers are only ever appended, never reused.

## Summary

| Total | P0 | P1 | P2 | Need UI | Need interaction test | Need automated test | Need backend/business rule | Need legal review | Need user validation | Reproducible in the Lab |
|---|---|---|---|---|---|---|---|---|---|---|
| 515 | 177 | 221 | 117 | 246 | 80 | 145 | 308 | 62 | 8 | 142 |

Status counts: Rule defined 99 · Needs product decision 120 · Implemented 104 · Needs UI 43 · Not reviewed 54 · Needs legal 29 · Failed 25 · Passed 40 · Needs user validation 1

## Automated checks

| Check | Rule | Result | Detail |
|---|---|---|---|
| AC-01 | Private project never enters public search | Pass | No unshared project or private role appears in public search. |
| AC-02 | Private working title never appears publicly | Pass | Public surfaces show "Untitled …" for unshared projects. |
| AC-03 | Private artwork never appears on a public role | Pass | Roles on unshared projects use the generic image. |
| AC-04 | Unaccepted credit never appears publicly | Pass | Only accepted credits on shared projects are public. |
| AC-05 | Accepted credit survives removing the association | Pass | Removing Kiran from Neeli Raat kept his accepted credit on the film and profile. |
| AC-06 | Accepted credit survives account deletion | No model yet | There is no account-deletion action in the prototype to test. The rule is written in Your data (Draft for legal review). |
| AC-07 | An individual cannot issue a credit | **Fail** | A credit (proposed) was created by Kiran on his own independent project. The action has no issuer check. |
| AC-08 | An unverified house cannot issue a credit | **Fail** | Credit proposed while Konark is unverified. The action has no verification check (the screen hides it). |
| AC-09 | An unverified house cannot publish a public role | **Fail** | 2 role(s) opened publicly while Konark is unverified. The action has no verification check (the screen disables it). |
| AC-10 | A member without credit authority can only prepare a credit | Pass | Held as prepared; Sana was not asked to accept. |
| AC-11 | A revoked member cannot continue house actions | **Fail** | After losing Konark access, Aditi still opened a role and issued a credit. Actions do not check membership. |
| AC-12 | Blocked people and houses are excluded from discovery | **Fail** | Roles from blocked parties still listed in Discover: Documentary DoP (tidewater). |
| AC-13 | Retry does not duplicate an Interest | Pass | One Interest after a retry. |
| AC-14 | Retry does not duplicate a message | No model yet | Messages live in per-session state, not the shared records. The retry path reuses the message id (verify by hand in EC-MSG-002). |
| AC-15 | Retry does not duplicate a project | **Fail** | 2 projects from one create plus a retry. Create has no request key, so a retry after a timeout makes a duplicate. |
| AC-16 | Retry does not duplicate a credit | Pass | One open credit per association. |
| AC-17 | A closed or filled role cannot receive new Interest | **Fail** | Interest was recorded on a closed role. The action does not check role status (the screen hides the button). |
| AC-18 | A filled role cannot be reopened as the same record | **Fail** | The filled role reopened. Reopen does not check filled versus closed (the screen offers Hire again instead). |
| AC-19 | A pending phone record never appears publicly | Pass | Not on any public surface. |
| AC-20 | Removing an association with no credit leaves no public trace | Pass | No credit, no public trace. |
| AC-21 | A deleted account cannot silently reclaim its old identity | No model yet | No account-deletion or re-registration model in the prototype. |
| AC-22 | House actions cannot run while acting personally | **Fail** | Acting personally, Aditi opened a role and added someone on Konark's Neela Akasham. Actions do not check the acting identity. |
| AC-23 | Personal credit acceptance cannot run as a house | **Fail** | Aditi accepted her credit while acting as Konark. Accept does not check identity (the profile hides it). |
| AC-24 | One event produces one notification | **Fail** | A retried Interest made 2 house notifications; a re-issued credit made 2 for Sana. |
| AC-25 | Deleting an account cannot orphan a sole house owner | No model yet | There is no ownership model: membership is a list, and Your data only blocks deletion for houses created in the session. Aditi, the only member of Konark, is not blocked. |
| AC-26 | An unverified house never appears in search | Pass | Not searchable. |
| AC-27 | A member who lost access receives none of the house's notifications | Pass | Scoped to current memberships. |
| AC-28 | Every notification has exactly one owner | Pass | One owner each. |
| AC-29 | Blocking never removes anyone from a film's credits | Pass | Records are independent of blocks. |
| AC-30 | Every credit points to a real association and project | Pass | 30 credits, none orphaned. |

Statuses: Not reviewed · Rule defined · Needs product decision · Needs user validation · Needs legal · Needs UI · Implemented (handled in the prototype, checked by hand) · Automated · Passed (automated checks pass) · Failed (an automated check fails, or checked by hand and wrong) · Blocked.

## 01 Authentication

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-AUTH-001 | Authentication | Email already has an account | P1 | Identity, Usability | Sign-up stops before creating anything and offers "Sign in instead" or "Reset password". It says an account exists only after the email is verified, so the form cannot be used to test which emails are on Ana. | Kiran | Personal | Entry (sign-up) | Yes | Yes |  | Yes |  |  | Rule defined | Prototype accepts any email; the conflict path is not drawn. · Lab: reproducible |
| EC-AUTH-002 | Authentication | Google email matches an existing email account | P0 | Identity, Security | Ana does not silently merge. The person proves they own the existing account (sign in with its method once), then Google is linked to it. One person, one account. | Not signed in | None | Entry screen | Yes | Yes | Yes | Yes |  |  | Needs product decision | Lab: Sign-in is simulated in the prototype; this needs a real identity provider and account store. |
| EC-AUTH-003 | Authentication | Apple private relay conflicts with an existing identity | P1 | Identity | A relay address is treated as a new email. If the person already has an account, they are offered "Already on Ana? Sign in and link Apple" before a new account is created. | Not signed in | None | Entry screen | Yes |  |  | Yes |  |  | Needs product decision | Lab: Sign-in is simulated in the prototype; this needs a real identity provider and account store. |
| EC-AUTH-004 | Authentication | Duplicate identity through another sign-in method | P0 | Identity, Record integrity, Trust | Ana detects likely duplicates (same verified phone, same email, same name and craft) and asks the person to sign in to their existing account. A second professional identity for the same person is never created without review. | Not signed in | None | Entry screen | Yes | Yes | Yes | Yes |  |  | Needs product decision | Lab: Sign-in is simulated in the prototype; this needs a real identity provider and account store. |
| EC-AUTH-005 | Authentication | Expired email verification code | P1 | Recovery | The code is refused with "This code has expired" and a one-tap resend. Nothing typed so far is lost. | Kiran | Personal | Entry (sign-up) | Yes | Yes |  |  |  |  | Implemented | The verify screen has a resend action; expiry itself is simulated. · Lab: reproducible |
| EC-AUTH-006 | Authentication | Wrong verification code | P1 | Security, Usability | Inline "That code doesn't match". After 5 wrong tries, a short cool-down and a resend. No account is created. | Kiran | Personal | Entry (sign-up) | Yes | Yes |  | Yes |  |  | Implemented | Lab: reproducible |
| EC-AUTH-007 | Authentication | Verification email never arrives | P1 | Recovery | After 30 seconds: resend, check the address, or use another sign-in method. The half-made account expires on its own. | Kiran | Personal | Entry (sign-up) | Yes | Yes |  |  |  |  | Rule defined | Lab: reproducible |
| EC-AUTH-008 | Authentication | Password reset link expired | P2 | Recovery | The link opens a page that says it expired and sends a new one on request. | Not signed in | None | Entry screen | Yes |  |  | Yes |  |  | Rule defined | Lab: Sign-in is simulated in the prototype; this needs a real identity provider and account store. |
| EC-AUTH-009 | Authentication | Person no longer has access to their email | P1 | Identity, Recovery | Recovery through another linked method (Apple, Google, verified phone). With none, a support-reviewed recovery; credits are never moved to a new account without review. | Not signed in | None | Entry screen | Yes |  |  | Yes | Yes |  | Needs product decision | Lab: Sign-in is simulated in the prototype; this needs a real identity provider and account store. |
| EC-AUTH-010 | Authentication | Suspended account attempts sign-in | P0 | Trust, Safety | Sign-in succeeds only far enough to show the suspension notice: why, until when, how to request review. No app access. Accepted credits stay on their films. | Not signed in | None | Entry screen | Yes | Yes |  | Yes |  |  | Needs UI | Lab: There is no account status model in the prototype yet. |
| EC-AUTH-011 | Authentication | Deactivated account signs in during the 30-day grace period | P0 | Record integrity, Identity | Signing in offers "Restore your account". Restoring brings everything back as it was; declining keeps the deletion scheduled. | Kiran | Personal | Your data | Yes | Yes | Yes | Yes |  |  | Needs UI | Deactivation routes to sign-in with a notice; there is no restore step yet. · Lab: reproducible |
| EC-AUTH-012 | Authentication | Deleted person creates a new account | P0 | Identity, Record integrity | A new account starts empty. It is never automatically reconnected to the old profile or to credits kept on films under the old name. | Not signed in | None | Entry screen |  |  | Yes | Yes |  |  | Rule defined | Checks: AC-21 · Lab: Account deletion has no data model in the prototype. |
| EC-AUTH-013 | Authentication | Invite sent to one email, person signs in with another | P0 | Identity, Permission, Security | The invite is not accepted silently. Ana shows "This invite was sent to m***@saffronreel.in" and asks the person to sign in with that address or ask the house to re-send it. | Aditi | Personal | Entry (house invite) | Yes | Yes |  | Yes |  |  | Needs product decision | The invite walkthrough assumes the invited address. · Lab: reproducible |
| EC-AUTH-014 | Authentication | Phone invite, account has no verified phone | P1 | Identity | The person is asked to verify that phone number before the invite links. | Not signed in | None | Entry screen | Yes |  |  | Yes |  |  | Rule defined | Lab: Sign-in is simulated in the prototype; this needs a real identity provider and account store. |
| EC-AUTH-015 | Authentication | Same phone attached to several accounts | P0 | Identity, Privacy | A verified phone belongs to one account. Verifying it on a second account asks to sign in to the first, or to release it from there. | Not signed in | None | Entry screen |  |  | Yes | Yes |  |  | Rule defined | Lab: Sign-in is simulated in the prototype; this needs a real identity provider and account store. |
| EC-AUTH-016 | Authentication | Sign-in provider succeeds but Ana account creation fails | P1 | Recovery | "We couldn't finish setting up your account" with Try again. A retry uses the same provider identity and never makes two accounts. | Kiran | Personal | Entry (sign-up) | Yes | Yes | Yes | Yes |  |  | Rule defined | Lab: reproducible |
| EC-AUTH-017 | Authentication | App closes halfway through account creation | P1 | Recovery | Reopening resumes at the step reached, with what was typed kept. | Not signed in | None | Entry screen | Yes |  |  | Yes |  |  | Rule defined | Lab: Onboarding progress is not persisted in the prototype. |
| EC-AUTH-018 | Authentication | Person returns to incomplete onboarding | P1 | Recovery, Usability | They land on the next unfinished required step. Optional steps stay skippable. | Not signed in | None | Entry screen | Yes | Yes |  |  |  |  | Rule defined | Lab: Onboarding progress is not persisted in the prototype. |
| EC-AUTH-019 | Authentication | Authentication request times out | P1 | Recovery | A clear timeout message and Try again. The form keeps its values. | Kiran | Personal | Entry (sign in) | Yes | Yes |  |  |  |  | Rule defined | Lab: reproducible |
| EC-AUTH-020 | Authentication | Repeated submit creates duplicate account attempt | P0 | Identity, Data integrity | The button locks after the first tap and the server treats repeat requests with the same key as one. Exactly one account. | Not signed in | None | Entry screen |  | Yes | Yes | Yes |  |  | Rule defined | Lab: Sign-in is simulated in the prototype; this needs a real identity provider and account store. |

## 02 Account linking

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-LINK-001 | Account linking | Link Google to an existing email account | P1 | Identity | From Settings, signed in: link a method after re-authenticating. It then works as a sign-in method for the same account. | Kiran | Personal | Settings | Yes |  |  | Yes |  |  | Rule defined | Lab: Sign-in is simulated in the prototype; this needs a real identity provider and account store. |
| EC-LINK-002 | Account linking | Link a method already used by another Ana account | P0 | Identity, Security | Refused with "This Google account is already used on Ana". No merge, no transfer, without support review. | Kiran | Personal | Settings | Yes |  | Yes | Yes |  |  | Rule defined | Lab: Sign-in is simulated in the prototype; this needs a real identity provider and account store. |
| EC-LINK-003 | Account linking | Unlink the only sign-in method | P1 | Recovery, Identity | Not allowed. At least one method must stay. | Kiran | Personal | Settings | Yes |  |  | Yes |  |  | Rule defined | Lab: Sign-in is simulated in the prototype; this needs a real identity provider and account store. |
| EC-LINK-004 | Account linking | Change email address | P1 | Identity, Security | The new address is verified before it replaces the old one. The old address is told. | Kiran | Personal | Settings | Yes |  |  | Yes |  |  | Rule defined | Lab: Sign-in is simulated in the prototype; this needs a real identity provider and account store. |
| EC-LINK-005 | Account linking | Change verified phone | P1 | Identity, Privacy | New phone verified first. Pending project records waiting on the old number are not moved automatically. | Kiran | Personal | Settings | Yes |  | Yes | Yes |  |  | Needs product decision | Lab: Sign-in is simulated in the prototype; this needs a real identity provider and account store. |
| EC-LINK-006 | Account linking | Two accounts discovered to belong to one person | P1 | Identity, Record integrity | Support-reviewed merge: accepted credits move to the kept account; the other is closed. Never self-serve. | Kiran | Personal | Settings |  |  |  | Yes | Yes |  | Needs product decision | Lab: Sign-in is simulated in the prototype; this needs a real identity provider and account store. |
| EC-LINK-007 | Account linking | Apple revokes Sign in with Apple | P2 | Recovery | The account asks for another method at next sign-in. Nothing is lost. | Kiran | Personal | Settings |  |  |  | Yes |  |  | Not reviewed | Lab: Sign-in is simulated in the prototype; this needs a real identity provider and account store. |
| EC-LINK-008 | Account linking | Compromised sign-in method | P0 | Security, Identity | Signing out everywhere and re-securing are available from Settings. Credit acceptance and house access need re-authentication in the meantime. | Kiran | Personal | Settings | Yes |  |  | Yes |  |  | Needs product decision | Lab: Sign-in is simulated in the prototype; this needs a real identity provider and account store. |

## 03 Age and eligibility

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-AGE-001 | Age and eligibility | Sign-up asks for 18+ confirmation | P0 | Legal, Safety | Sign-up requires confirming 18 or older before an account exists. Under 18 stops with a respectful explanation. | Kiran | Personal | Entry (sign-up) | Yes |  |  |  | Yes |  | Implemented | Lab: reproducible |
| EC-AGE-002 | Age and eligibility | Person claims 18+ but is reported as a minor | P0 | Safety, Legal | The report goes to child-safety handling: the account is restricted from messaging and roles while reviewed. Their professional records stay but are hidden from discovery. | New person | None | Sign-up |  |  |  | Yes | Yes |  | Needs legal | Lab: The report flow exists; minor handling does not. |
| EC-AGE-003 | Age and eligibility | Existing account found to belong to a minor | P0 | Safety, Legal, Record integrity | Account deactivated pending guardian contact; credits issued by productions remain on films; profile hidden. | New person | None | Sign-up |  |  |  | Yes | Yes |  | Needs legal | Lab: Needs legal rule. |
| EC-AGE-004 | Age and eligibility | Child actor exists in a project | P0 | Safety, Legal, Record integrity | A minor can be credited on a film without having an Ana account: the credit shows the name the production gives, with no profile link and no contact route. | New person | None | Sign-up |  |  |  | Yes | Yes |  | Needs legal | Lab: No minor credit model yet. |
| EC-AGE-005 | Age and eligibility | Minor cannot hold a normal adult account | P0 | Legal, Safety | Enforced at sign-up. No guardian-managed accounts at launch. | New person | None | Sign-up |  |  |  | Yes | Yes |  | Rule defined | Lab: Sign-in is simulated in the prototype; this needs a real identity provider and account store. |
| EC-AGE-006 | Age and eligibility | Guardian requests correction of a child's record | P1 | Legal, Record integrity | Goes to support with verification of guardianship. Out of scope for launch UI. | New person | None | Sign-up |  |  |  | Yes | Yes |  | Needs legal | Lab: Guardian flows not approved. |
| EC-AGE-007 | Age and eligibility | Person worked as a minor, now an adult | P1 | Record integrity, Identity | Credits issued while they were a minor can be linked to their new adult account through the production, like any pending credit. | New person | None | Sign-up |  |  |  | Yes | Yes |  | Needs product decision | Lab: Needs minor credit model. |
| EC-AGE-008 | Age and eligibility | Pending person added by phone is a minor | P0 | Safety, Privacy, Legal | Productions are told not to add minors by phone. A minor never receives Ana invites; the record stays private to the house. | New person | None | Sign-up |  |  |  | Yes | Yes |  | Needs legal | Lab: Needs legal rule. |
| EC-AGE-009 | Age and eligibility | Country-specific age rules later differ | P2 | Legal, Future architecture | Minimum age is a per-country setting, not a constant. | New person | None | Sign-up |  |  |  | Yes | Yes |  | Needs legal | Lab: Future architecture. |

## 04 Individual onboarding

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-ONB-001 | Individual onboarding | No photo | P1 | Usability | Initials avatar. Profile works; a gentle nudge later. | Kiran | Personal | Entry (sign-up) | Yes |  |  |  |  |  | Implemented | Lab: reproducible |
| EC-ONB-002 | Individual onboarding | Only one name | P1 | Identity, Usability | Single names are valid (common in India). No forced surname. | Kiran | Personal | Entry (sign-up) | Yes |  | Yes |  |  |  | Rule defined | Lab: reproducible |
| EC-ONB-003 | Individual onboarding | Professional name differs from legal name | P1 | Identity | The profile shows the professional name. Credits use the name the production issues; the person can ask for a correction. | New person | Personal | Onboarding |  |  |  | Yes |  | Yes | Needs product decision | Lab: Legal identity is not collected. |
| EC-ONB-004 | Individual onboarding | Duplicate professional names | P1 | Identity, Trust | Search and credit pickers show craft, city and photo alongside names so two people with one name are told apart. | Kiran | Personal | Discover | Yes |  | Yes |  |  |  | Implemented | Lab: reproducible |
| EC-ONB-005 | Individual onboarding | Craft not found | P1 | Usability | "Something else" lets the person type it. It is stored as free text and mapped later. | Kiran | Personal | Entry (sign-up) | Yes |  |  | Yes |  |  | Rule defined | Lab: reproducible |
| EC-ONB-006 | Individual onboarding | More crafts than the limit | P2 | Usability | Pick up to 3; the first is primary. Extra choices are refused with the reason. | Kiran | Personal | Entry (sign-up) | Yes |  |  |  |  |  | Implemented | Lab: reproducible |
| EC-ONB-007 | Individual onboarding | Changes primary craft later | P1 | Data integrity | Edit Profile lets them. For You refreshes; past credits and Interests are unchanged. | Kiran | Personal | Edit profile | Yes |  |  |  |  |  | Rule defined | Lab: reproducible |
| EC-ONB-008 | Individual onboarding | No city | P2 | Usability | Optional. Nearby filters simply do not apply. | New person | Personal | Onboarding | Yes |  |  |  |  |  | Rule defined |  |
| EC-ONB-009 | Individual onboarding | Works in several cities | P2 | Usability | One base city plus "will travel". Multiple bases is a later decision. | New person | Personal | Onboarding | Yes |  |  |  |  | Yes | Needs product decision |  |
| EC-ONB-010 | Individual onboarding | Uncommon language | P2 | Usability | Language list includes an "Add another" free-text option. | New person | Personal | Onboarding | Yes |  |  |  |  |  | Not reviewed |  |
| EC-ONB-011 | Individual onboarding | Skips all optional steps | P1 | Usability | They reach Home with a minimal profile and a short "finish your profile" prompt, never a blocker. | Kiran | Personal | Entry (sign-up) | Yes |  |  |  |  |  | Implemented | Lab: reproducible |
| EC-ONB-012 | Individual onboarding | No portfolio | P1 | Usability | Profile shows credits and an empty work state inviting them to add work. | New person | Personal | Onboarding | Yes |  |  |  |  |  | Implemented |  |
| EC-ONB-013 | Individual onboarding | Media upload fails during onboarding | P1 | Recovery | The failed item shows Retry. Onboarding can finish without it. | Kiran | Personal | Entry (sign-up) | Yes | Yes |  |  |  |  | Rule defined | Lab: reproducible |
| EC-ONB-014 | Individual onboarding | Reel link breaks | P2 | Recovery | The link shows as unavailable to the owner, hidden from others. | New person | Personal | Onboarding | Yes |  |  | Yes |  |  | Not reviewed |  |
| EC-ONB-015 | Individual onboarding | Portfolio used to imply a verified credit | P0 | Trust, Record integrity | Portfolio items are always labelled as shared by the person. Only production-issued, accepted credits carry the verified style. The two never mix on a profile. | Kiran | Personal | Profile | Yes |  | Yes |  |  |  | Implemented | Lab: reproducible |
| EC-ONB-016 | Individual onboarding | Abandons onboarding | P1 | Recovery | An incomplete account is not discoverable. After 30 days it is cleaned up. | New person | Personal | Onboarding |  |  |  | Yes |  |  | Rule defined |  |
| EC-ONB-017 | Individual onboarding | Resumes onboarding later | P1 | Recovery | Resumes at the step reached. | New person | Personal | Onboarding | Yes |  |  | Yes |  |  | Rule defined | Lab: Not persisted in the prototype. |
| EC-ONB-018 | Individual onboarding | Craft renamed or retired in the taxonomy | P2 | Data integrity, Future architecture | Crafts have stable ids. Renames change the label only; retired crafts map to a successor. | New person | Personal | Onboarding |  |  |  | Yes |  |  | Not reviewed |  |
| EC-ONB-019 | Individual onboarding | Profile created with incomplete data | P1 | Data integrity | Required: name, one craft, 18+ and consent. Anything else may be missing without breaking a screen. | New person | Personal | Onboarding |  |  | Yes | Yes |  |  | Rule defined |  |
| EC-ONB-020 | Individual onboarding | Sign-up finishes while offline | P1 | Recovery | The last step waits with "You're offline" and finishes when back online. Nothing typed is lost. | Kiran | Personal | Entry (sign-up) | Yes | Yes |  |  |  |  | Rule defined | Lab: reproducible |

## 05 Profile

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-PROF-001 | Profile | Zero credits | P1 | Usability | No empty "Credits" heading. Work and independent projects lead. | Kiran | Personal | Profile | Yes |  |  |  |  |  | Implemented | Lab: reproducible |
| EC-PROF-002 | Profile | Hundreds of credits | P2 | Scalability, Usability | Recent and notable first, then "All credits" grouped by year. | Kiran | Personal | Profile | Yes |  |  |  |  |  | Needs UI |  |
| EC-PROF-003 | Profile | Extremely long name | P2 | Usability | Wraps to two lines, then truncates with the full name available. | Kiran | Personal | Profile | Yes |  |  |  |  |  | Not reviewed |  |
| EC-PROF-004 | Profile | Multilingual name | P2 | Usability | Names render in any script with correct line height. | Kiran | Personal | Profile | Yes |  |  |  |  |  | Not reviewed |  |
| EC-PROF-005 | Profile | Deleted account with retained credits | P0 | Record integrity, Privacy | The profile is gone. On each film, the accepted credit shows the name as issued, with no link. | Kiran | Personal | Profile | Yes |  | Yes | Yes |  |  | Needs UI | Checks: AC-06 · Lab: Account deletion has no data model in the prototype. |
| EC-PROF-006 | Profile | Suspended person with accepted credits | P0 | Record integrity, Trust | Profile hidden while suspended. Credits stay on films as plain names. | Kiran | Personal | Profile | Yes |  |  | Yes |  |  | Needs product decision | Lab: No account status model. |
| EC-PROF-007 | Profile | Archived project still in credit history | P1 | Record integrity | The credit stays on the profile. The project opens as an archived page. | Kiran | Personal | Profile | Yes |  |  |  |  |  | Rule defined |  |
| EC-PROF-008 | Profile | Same project as independent work and as a verified credit | P1 | Trust, Record integrity | The verified credit wins; the independent entry offers "Remove duplicate". | Kiran | Personal | Profile | Yes |  |  | Yes |  |  | Needs product decision |  |
| EC-PROF-009 | Profile | Broken portfolio media | P2 | Recovery | Fallback image; the owner sees "Couldn't load". | Kiran | Personal | Profile | Yes |  |  |  |  |  | Implemented |  |
| EC-PROF-010 | Profile | Availability becomes stale | P1 | Trust | Availability older than 60 days asks the person to confirm and stops showing "Available now". | Kiran | Personal | Profile | Yes |  |  | Yes |  |  | Needs product decision |  |
| EC-PROF-011 | Profile | Availability changes after Interest | P2 | Data integrity | The poster sees current availability, with the Interest date for context. | Kiran | Personal | Profile |  |  |  | Yes |  |  | Needs product decision |  |
| EC-PROF-012 | Profile | Craft taxonomy changes | P2 | Data integrity, Future architecture | See EC-ONB-018. | Kiran | Personal | Profile |  |  |  | Yes |  |  | Not reviewed |  |
| EC-PROF-013 | Profile | Profile blocked by the viewer | P0 | Safety, Privacy | Viewer sees "You blocked Vikram". No work, no contact. Shared film credits still show the name. | Kiran | Personal | Profile | Yes |  | Yes |  |  |  | Implemented | Lab: reproducible |
| EC-PROF-014 | Profile | Viewer is blocked by the profile owner | P0 | Safety, Privacy | The viewer sees an unavailable profile, indistinguishable from a private one. They are never told they were blocked. | Kiran | Personal | Profile | Yes |  | Yes | Yes |  |  | Needs UI | Lab: Blocks are one-directional in the prototype. |

## 06 Identity switching

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-ID-001 | Identity switching | One person acts for several houses | P0 | Identity, Permission | The identity switcher lists the person and every house they may act for. The current one is always shown at the top of Home. | Aditi | Konark Pictures | Identity sheet | Yes |  | Yes |  |  |  | Implemented | Lab: reproducible |
| EC-ID-002 | Identity switching | House permission revoked while acting as the house | P0 | Permission, Security | The next action is refused, the app switches back to the person with "You no longer have access to Konark Pictures", and nothing is written as the house. | Aditi | Konark Pictures | Project workspace | Yes | Yes | Yes | Yes |  |  | Failed | Domain actions do not check membership. · Checks: AC-11 · Lab: reproducible |
| EC-ID-003 | Identity switching | Permission changes while editing | P0 | Permission, Data integrity | The draft is kept locally; saving is refused with the reason. The person can copy their text. | Aditi | Konark Pictures | House Home | Yes | Yes |  | Yes |  |  | Needs UI | Lab: Permission change mid-session is not simulated. |
| EC-ID-004 | Identity switching | Credit authority removed while issuing | P0 | Permission, Record integrity | The credit is saved as prepared, not issued: "You can prepare this credit. Someone with credit authority has to issue it." | Aditi | Konark Pictures | Project workspace | Yes | Yes | Yes | Yes |  |  | Passed | Checks: AC-10 · Lab: reproducible |
| EC-ID-005 | Identity switching | Personal notification opened while acting as the house | P0 | Identity | Opening it does not change identity. The destination shows who you are, and personal actions (accept credit) ask to switch back first. | Aditi | Konark Pictures | Notifications sheet | Yes | Yes | Yes |  |  |  | Implemented | Lab: reproducible |
| EC-ID-006 | Identity switching | House notification opened while personal | P0 | Identity | The house item opens in context with a clear "Switch to Konark to act on this". No house action runs as the person. | Aditi | Personal | Notifications sheet | Yes | Yes | Yes |  |  |  | Implemented | Lab: reproducible |
| EC-ID-007 | Identity switching | Starts a post as the house, then switches identity | P1 | Identity | Switching with a draft open asks "Keep this draft for Konark?" The post never changes author silently. | Aditi | Konark Pictures | Post composer | Yes | Yes |  | Yes |  |  | Needs UI | Lab: reproducible |
| EC-ID-008 | Identity switching | Starts a message, then switches identity | P0 | Identity | The conversation belongs to the identity it started in. Switching closes it; sending never changes sender. | Aditi | Konark Pictures | Inbox | Yes | Yes | Yes |  |  |  | Rule defined | Lab: reproducible |
| EC-ID-009 | Identity switching | Role response attempted while acting as the house | P0 | Identity, Permission | Interest is personal. As the house, a role shows "You're acting as the house" with a switch; the send action requires the personal identity. | Aditi | Konark Pictures | Role page | Yes | Yes | Yes | Yes |  |  | Implemented | Lab: reproducible |
| EC-ID-010 | Identity switching | Credit acceptance attempted while acting as the house | P0 | Identity, Record integrity | Accepting a credit is personal. The action refuses to run as a house even if called directly. | Aditi | Konark Pictures | Profile | Yes | Yes | Yes | Yes |  |  | Failed | The profile hides Accept as the house, but the action itself does not check identity. · Checks: AC-23 · Lab: reproducible |
| EC-ID-011 | Identity switching | Two tabs with different identities | P1 | Identity, Data integrity | Identity is per-session state sent with every request. Each tab shows its own identity; no request uses the other tab's. | Aditi | Konark Pictures | House Home |  |  | Yes | Yes |  |  | Rule defined | Lab: Single-page prototype. |
| EC-ID-012 | Identity switching | Stale console says wrong identity | P1 | Usability | The prototype console reads live app state. (Prototype tooling, fixed in the console redesign.) | Aditi | Konark Pictures | House Home |  |  | Yes |  |  |  | Passed | Lab: reproducible |
| EC-ID-013 | Identity switching | Organisation suspended while acting for it | P0 | Permission, Trust | Switched back to the person with a notice. House actions refused. | Aditi | Konark Pictures | House Home | Yes | Yes | Yes | Yes |  |  | Needs UI | Lab: No organisation status model. |
| EC-ID-014 | Identity switching | Organisation removed from the identity switcher | P1 | Permission | Revoked houses disappear from the switcher on the next refresh. | Aditi | Personal | Identity sheet | Yes |  | Yes |  |  |  | Implemented | Lab: reproducible |
| EC-ID-015 | Identity switching | Last owner tries to leave | P0 | Permission, Record integrity | Blocked until another owner is named or Ana support takes over. The house is never left without an owner. | Aditi | Konark Pictures | House Home | Yes | Yes |  | Yes |  |  | Needs UI | Lab: No ownership model beyond membership. |
| EC-ID-016 | Identity switching | Invited to several houses | P2 | Identity | Each invite is accepted separately; the switcher lists each. | Aditi | Konark Pictures | House Home | Yes |  |  |  |  |  | Rule defined |  |
| EC-ID-017 | Identity switching | Follow, Save, Report, Block while acting as the house stay personal | P0 | Identity, Privacy | These are always the person's. The UI says so while acting for a house. | Aditi | Konark Pictures | Discover | Yes | Yes | Yes |  |  |  | Implemented | Lab: reproducible |
| EC-ID-018 | Identity switching | House action attempted while acting personally | P0 | Identity, Permission | Opening a role, adding people or issuing credits on a house project requires acting as that house. Called personally, the action is refused. | Aditi | Personal | Project workspace |  |  | Yes | Yes |  |  | Failed | The workspace disables controls, but the action has no check. · Checks: AC-22 · Lab: reproducible |

## 07 Production house onboarding

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-HONB-001 | Production house onboarding | Set up a house | P1 | Permission | Self-serve: name, city, work, website. The house exists at once, unverified, visible only to its members. | Kiran | Personal | House setup | Yes |  |  |  |  |  | Implemented | Lab: reproducible |
| EC-HONB-002 | Production house onboarding | House name already exists on Ana | P0 | Identity, Trust | Setup warns "Konark Pictures is already on Ana" and offers to request access instead of creating a duplicate. | Kiran | Personal | House setup | Yes | Yes | Yes | Yes |  |  | Needs UI | Lab: reproducible |
| EC-HONB-003 | Production house onboarding | Setup abandoned | P2 | Recovery | Draft kept for 7 days; nothing public. | Kiran | Personal | Settings |  |  |  | Yes |  |  | Not reviewed |  |
| EC-HONB-004 | Production house onboarding | Setup while offline | P2 | Recovery | Submit waits for the connection. | Kiran | Personal | House setup | Yes |  |  |  |  |  | Not reviewed | Lab: reproducible |
| EC-HONB-005 | Production house onboarding | Setting up for a house the person does not represent | P0 | Trust, Legal | Verification checks the person's link to the house before anything unlocks. Until then nothing is public. | Kiran | Personal | Settings |  |  |  | Yes | Yes |  | Rule defined | Lab: Verification is manual (Ana team). |
| EC-HONB-006 | Production house onboarding | Logo upload fails | P2 | Recovery | Retry; setup continues without it. | Kiran | Personal | Settings | Yes |  |  |  |  |  | Not reviewed |  |

## 08 Production house verification

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-HOUSE-001 | Production house verification | Duplicate house | P0 | Identity, Trust | Ana's review catches it: merge into the existing house or reject. Credits stay with the original. | Aditi | Konark Pictures | House Home |  |  |  | Yes | Yes |  | Rule defined | Lab: Manual review. |
| EC-HOUSE-002 | Production house verification | Fake house impersonating a known banner | P0 | Trust, Legal, Safety | Rejected at verification; reportable afterwards; never searchable while unverified. | Aditi | Konark Pictures | House Home |  |  |  | Yes | Yes |  | Rule defined | Lab: Manual review. |
| EC-HOUSE-003 | Production house verification | House has no online presence to verify | P1 | Trust | Alternative evidence: registration documents, a credited film. Reviewed by the Ana team. | Aditi | Konark Pictures | House Home |  |  |  | Yes | Yes |  | Needs product decision |  |
| EC-HOUSE-004 | Production house verification | Verification rejected | P1 | Trust | Members see why and what to send. Nothing public unlocks. | Aditi | Konark Pictures | House Home | Yes |  |  | Yes |  |  | Needs UI |  |
| EC-HOUSE-005 | Production house verification | Verification pending | P0 | Trust, Permission | A calm notice: what works now (private projects, page), what unlocks after (public roles, credits). | Aditi | Konark Pictures | House Home | Yes |  | Yes |  |  |  | Implemented | Lab: reproducible |
| EC-HOUSE-006 | Production house verification | Verification revoked | P0 | Trust, Record integrity | New public roles and credits stop. Credits already accepted stay on films; open roles close with a neutral reason. | Aditi | Konark Pictures | House Home | Yes |  |  | Yes | Yes |  | Needs product decision | Lab: No revocation model. |
| EC-HOUSE-007 | Production house verification | Verified house becomes restricted | P1 | Trust | Restriction limits specific actions for a time. Members see what and until when. | Aditi | Konark Pictures | House Home | Yes |  |  | Yes |  |  | Needs product decision |  |
| EC-HOUSE-008 | Production house verification | House renames or rebrands | P1 | Record integrity, Identity | New name everywhere current; old credits show the name at the time with "now Konark Studios". | Aditi | Konark Pictures | House Home | Yes |  |  | Yes |  |  | Needs product decision |  |
| EC-HOUSE-009 | Production house verification | Organisations merge | P2 | Record integrity, Future architecture | Support-led. Both histories preserved. | Aditi | Konark Pictures | House Home |  |  |  | Yes | Yes |  | Needs product decision |  |
| EC-HOUSE-010 | Production house verification | Owner leaves | P1 | Permission | See EC-ID-015. | Aditi | Konark Pictures | House Home | Yes |  |  | Yes |  |  | Needs UI |  |
| EC-HOUSE-011 | Production house verification | House has no authorised members | P1 | Permission, Record integrity | Ana support becomes custodian. Page and credits stay; no new actions. | Aditi | Konark Pictures | House Home |  |  |  | Yes |  |  | Needs product decision |  |
| EC-HOUSE-012 | Production house verification | Invite expires | P1 | Permission | "This invite has expired. Ask Saffron Reel Studios to send a new one." | Aditi | Konark Pictures | House Home | Yes |  |  | Yes |  |  | Rule defined |  |
| EC-HOUSE-013 | Production house verification | Invite forwarded to the wrong person | P0 | Permission, Security | Invites bind to the address or phone they were sent to (EC-AUTH-013). The wrong person cannot accept. | Aditi | Personal | Entry (house invite) | Yes | Yes | Yes | Yes |  |  | Needs product decision | Lab: reproducible |
| EC-HOUSE-014 | Production house verification | Invite revoked before acceptance | P1 | Permission | The link says it is no longer valid. | Aditi | Konark Pictures | House Home | Yes |  |  | Yes |  |  | Rule defined |  |
| EC-HOUSE-015 | Production house verification | Invited person says they are not authorised | P1 | Permission | "This isn't for me" declines and tells the house. | Aditi | Personal | Entry (house invite) | Yes |  |  |  |  |  | Not reviewed | Lab: reproducible |
| EC-HOUSE-016 | Production house verification | Unverified house tries to post a public role | P0 | Trust, Permission | Refused. Roles can be prepared privately and open once verified. | Aditi | Konark Pictures | Project workspace | Yes | Yes | Yes | Yes |  |  | Failed | The workspace disables Open; the action itself does not check. · Checks: AC-09 · Lab: reproducible |
| EC-HOUSE-017 | Production house verification | Unverified house tries to issue a credit | P0 | Trust, Record integrity | Refused. Credits unlock after verification. | Aditi | Konark Pictures | Project workspace | Yes | Yes | Yes | Yes |  |  | Failed | The UI hides the action; the action itself does not check. · Checks: AC-08 · Lab: reproducible |
| EC-HOUSE-018 | Production house verification | Stale client attempts a restricted action | P0 | Permission, Security | Every rule is checked when the action runs, not only when the screen was drawn. | Aditi | Konark Pictures | House Home |  |  | Yes | Yes |  |  | Failed | Checks: AC-08, AC-09, AC-11 · Lab: Covered by the automated checks. |

## 09 Production house profile

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-HPROF-001 | Production house profile | House page with no public projects | P1 | Usability | "Nothing public yet"; past accepted credits still show the house's history. | Kiran | Personal | House page | Yes |  |  |  |  |  | Implemented | Lab: reproducible |
| EC-HPROF-002 | Production house profile | Unverified house page visited by a non-member | P0 | Trust | Not reachable. Only members see it, with the pending notice. | Aditi | Konark Pictures | Profile | Yes |  | Yes | Yes |  |  | Implemented | Lab: reproducible |
| EC-HPROF-003 | Production house profile | House page lists a private project | P0 | Privacy | Never. The public page is built only from shared projects. | Kiran | Personal | House page |  |  | Yes |  |  |  | Passed | Checks: AC-01 · Lab: reproducible |
| EC-HPROF-004 | Production house profile | Viewer blocked the house | P1 | Safety | "You blocked Konark Pictures." No roles or projects. | Kiran | Personal | House page | Yes |  |  |  |  |  | Implemented | Lab: reproducible |
| EC-HPROF-005 | Production house profile | Co-production shows on both houses | P1 | Record integrity | Monsoon Letters appears on Tidewater and Konark pages, lead first. | Kiran | Personal | House page | Yes |  |  |  |  |  | Implemented | Lab: reproducible |
| EC-HPROF-006 | Production house profile | House page with hundreds of projects | P2 | Scalability | Grouped by year, most recent first. | Kiran | Personal | House page | Yes |  |  |  |  |  | Needs UI |  |

## 10 Project creation

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-PROJ-001 | Project creation | Duplicate project | P1 | Data integrity, Record integrity | Creating a project whose title and format match an existing one from the same house asks "Is this Neela Akasham?" before creating. | Aditi | Konark Pictures | NewProject sheet | Yes | Yes |  | Yes |  |  | Needs UI | Lab: reproducible |
| EC-PROJ-002 | Project creation | Same project created by two co-producers | P1 | Record integrity, Data integrity | The second house is offered to join the first as co-producer. Only one project record per film. | Aditi | Konark Pictures | House Home |  |  |  | Yes |  | Yes | Needs product decision | Lab: Needs a multi-house project model beyond lead and co-producers. |
| EC-PROJ-003 | Project creation | Untitled project | P1 | Usability | A working title is required internally but never public. Public name falls back to "Untitled Telugu feature". | Aditi | Konark Pictures | NewProject sheet | Yes |  | Yes |  |  |  | Implemented | Lab: reproducible |
| EC-PROJ-004 | Project creation | Double-tap Create project | P0 | Data integrity | One project. The request carries a key and a repeat is recognised. | Aditi | Konark Pictures | NewProject sheet |  | Yes | Yes | Yes |  |  | Failed | Checks: AC-15 · Lab: reproducible |
| EC-PROJ-005 | Project creation | Wrong house creates the project | P1 | Record integrity | Before anything is shared, the house can delete it. After credits exist, support moves it. | Aditi | Konark Pictures | House Home | Yes |  |  | Yes |  |  | Needs product decision |  |
| EC-PROJ-006 | Project creation | Personal project while acting for a house | P1 | Identity | The composer says who will own it ("Owned by Konark Pictures"). No silent owner. | Aditi | Konark Pictures | NewProject sheet | Yes |  | Yes |  |  |  | Implemented | Lab: reproducible |
| EC-PROJ-007 | Project creation | Codename differs from working title | P2 | Privacy | One private working title field; a codename is just a working title. Public title is separate. | Aditi | Konark Pictures | House Home |  |  |  | Yes |  |  | Rule defined |  |
| EC-PROJ-008 | Project creation | Multilingual project | P2 | Data integrity | Several languages allowed; public name uses the first. | Aditi | Konark Pictures | House Home | Yes |  |  |  |  |  | Implemented |  |

## 11 Project privacy

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-PRIV-001 | Project privacy | Private working title leaks on a public role | P0 | Privacy | A role on an unannounced project shows "Untitled Hindi series", never the working title. | Kiran | Personal | Discover |  |  | Yes |  |  |  | Passed | Checks: AC-02 · Lab: reproducible |
| EC-PRIV-002 | Project privacy | Private cast leaks | P0 | Privacy | Who is on a private project is visible only to the house and to each person about themselves. | Kiran | Personal | Discover |  |  | Yes |  |  |  | Passed | Checks: AC-20 · Lab: Covered by the automated check. |
| EC-PRIV-003 | Project privacy | Private added-people list leaks | P0 | Privacy | Same as EC-PRIV-002, for crew. | Kiran | Personal | Discover |  |  | Yes |  |  |  | Passed | Checks: AC-20 · Lab: Covered by the automated check. |
| EC-PRIV-004 | Project privacy | Pending credits leak | P0 | Privacy, Record integrity | Only accepted credits on shared projects are public. | Tara | Personal | Project page |  |  | Yes |  |  |  | Passed | Checks: AC-04 · Lab: reproducible |
| EC-PRIV-005 | Project privacy | Private artwork leaks onto a public role | P0 | Privacy | Roles on unshared projects use a generic image until the project is shared. | Kiran | Personal | Discover |  |  | Yes |  |  |  | Passed | Checks: AC-03 · Lab: reproducible |
| EC-PRIV-006 | Project privacy | Private project appears in search | P0 | Privacy | Never. | Kiran | Personal | Discover |  |  | Yes |  |  |  | Passed | Checks: AC-01 · Lab: reproducible |
| EC-PRIV-007 | Project privacy | Private project appears in autocomplete | P0 | Privacy | Autocomplete uses the same public index as search. | Kiran | Personal | Discover |  |  | Yes | Yes |  |  | Passed | Checks: AC-01 · Lab: No autocomplete in the prototype. |
| EC-PRIV-008 | Project privacy | Private title in lock-screen notification copy | P0 | Privacy | Push text for private projects says "a Konark Pictures project". The full title shows only inside the app. | Tara | Personal | Notifications sheet | Yes |  | Yes | Yes |  |  | Needs product decision | In-app notifications use the working title (correct in-app). Push copy is not modelled: rule needed. · Lab: reproducible |
| EC-PRIV-009 | Project privacy | Private title in URL metadata | P0 | Privacy | Links to private projects carry an id, never the title; unauthorised requests get a generic not-found. | Kiran | Personal | Discover |  |  | Yes | Yes |  |  | Rule defined | Lab: No real URLs in the prototype. |
| EC-PRIV-010 | Project privacy | Private image in social share preview | P0 | Privacy | Share previews are generated only for shared projects. | Kiran | Personal | Discover |  |  | Yes | Yes |  |  | Rule defined | Lab: No link previews in the prototype. |
| EC-PRIV-011 | Project privacy | Collaborator should not see the real title | P2 | Privacy, Future architecture | Future: a per-person codename. Not at launch. | Kiran | Personal | Discover |  |  |  | Yes |  |  | Needs product decision |  |
| EC-PRIV-012 | Project privacy | Public role exists while parent project stays private | P0 | Privacy | Allowed. The role says "Untitled" and the house; it does not link to a project page. | Kiran | Personal | Discover | Yes |  | Yes |  |  |  | Passed | Checks: AC-02 · Lab: reproducible |
| EC-PRIV-013 | Project privacy | Project becomes public while roles already exist | P1 | Privacy, Data integrity | Roles pick up the public title and artwork at that moment. | Kiran | Personal | Discover |  |  | Yes |  |  |  | Implemented |  |

## 12 Project publication

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-PUB-001 | Project publication | Share with no artwork | P1 | Usability | Allowed; the public page uses a neutral cover. | Aditi | Konark Pictures | Project workspace | Yes |  |  |  |  |  | Implemented |  |
| EC-PUB-002 | Project publication | Share with no public title | P1 | Privacy | Sharing asks for a public title; the working title is never used by default. | Aditi | Konark Pictures | Project workspace | Yes |  | Yes |  |  |  | Implemented | Lab: reproducible |
| EC-PUB-003 | Project publication | Share, then want to unshare | P1 | Privacy, Record integrity | Unsharing hides the page but accepted credits stay on profiles as the film's record. | Aditi | Konark Pictures | Project workspace | Yes |  |  | Yes |  |  | Needs product decision |  |
| EC-PUB-004 | Project publication | Title changes after sharing | P1 | Record integrity | Credits follow the project, so they show the new title. Old title kept in history. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes |  |  | Needs product decision |  |
| EC-PUB-005 | Project publication | Share while unverified | P0 | Trust | Refused until verified. | Aditi | Konark Pictures | Project workspace | Yes | Yes | Yes |  |  |  | Implemented | Lab: reproducible |

## 13 Project lifecycle

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-LIFE-001 | Project lifecycle | Title changes after credits | P1 | Record integrity | Credits reference the project, so they update. Profiles show the current public title. | Aditi | Konark Pictures | Project workspace |  |  | Yes |  |  |  | Implemented |  |
| EC-LIFE-002 | Project lifecycle | Project changes format | P2 | Data integrity | Allowed; roles and credits unaffected. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes |  |  | Rule defined |  |
| EC-LIFE-003 | Project lifecycle | Cancelled while private | P1 | Privacy | Archived privately. People added are told it ended; nothing becomes public. | Aditi | Konark Pictures | Project workspace | Yes |  |  | Yes |  |  | Needs product decision |  |
| EC-LIFE-004 | Project lifecycle | Cancelled after public | P1 | Record integrity | Page marked "Cancelled"; accepted credits stay (work was done). | Aditi | Konark Pictures | Project workspace | Yes |  |  | Yes |  |  | Needs product decision |  |
| EC-LIFE-005 | Project lifecycle | Project has multiple productions | P1 | Record integrity | Lead plus co-producers shown on the page. | Kiran | Personal | Project page | Yes |  |  |  |  |  | Implemented | Lab: reproducible |
| EC-LIFE-006 | Project lifecycle | Lead production changes | P2 | Record integrity, Permission | Support-led. Credit authority moves with lead. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes |  |  | Needs product decision | Lab: Needs a multi-house project model beyond lead and co-producers. |
| EC-LIFE-007 | Project lifecycle | Co-producer declines | P2 | Record integrity | Removed from the page; credits issued by the lead unaffected. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes |  |  | Needs product decision | Lab: Needs a multi-house project model beyond lead and co-producers. |
| EC-LIFE-008 | Project lifecycle | Private project must merge with an existing public record | P1 | Record integrity, Data integrity | Support merges; associations and credits consolidated without duplicates. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes |  |  | Needs product decision |  |
| EC-LIFE-009 | Project lifecycle | Project archived | P1 | Record integrity | Read-only; credits stay. | Aditi | Konark Pictures | Project workspace | Yes |  |  | Yes |  |  | Needs UI |  |
| EC-LIFE-010 | Project lifecycle | Legal removal request for a project | P0 | Legal, Record integrity | Page hidden pending legal review. Accepted credits kept in the record, hidden from public if legally required. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes | Yes |  | Needs legal | Lab: Needs legal rule. |
| EC-LIFE-011 | Project lifecycle | Old working title leaks after rename | P0 | Privacy | Old notifications and shares do not reveal a working title publicly. In-app history is private to the house. | Aditi | Konark Pictures | Project workspace |  |  | Yes | Yes |  |  | Passed | Checks: AC-02 · Lab: Covered by the automated check. |
| EC-LIFE-012 | Project lifecycle | Wrong production created the project | P1 | Record integrity | See EC-PROJ-005. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes |  |  | Needs product decision |  |

## 14 Roles and opportunities

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-ROLE-001 | Roles and opportunities | Role on a private project | P0 | Privacy | See EC-PRIV-012. | Kiran | Personal | Discover |  |  | Yes |  |  |  | Passed | Checks: AC-02, AC-03 · Lab: reproducible |
| EC-ROLE-002 | Roles and opportunities | Role reveals secret character information | P1 | Privacy | Houses write what they choose; a hint in the form says the text will be public. | Aditi | Konark Pictures | Project workspace | Yes |  |  |  |  |  | Rule defined |  |
| EC-ROLE-003 | Roles and opportunities | No location | P2 | Usability | "To be confirmed". | Aditi | Konark Pictures | Project workspace | Yes |  |  |  |  |  | Implemented |  |
| EC-ROLE-004 | Roles and opportunities | Multiple locations | P2 | Usability | Free text for now. | Aditi | Konark Pictures | Project workspace | Yes |  |  |  |  |  | Needs product decision |  |
| EC-ROLE-005 | Roles and opportunities | Remote role | P2 | Usability | "Remote" as a location. | Aditi | Konark Pictures | Project workspace | Yes |  |  |  |  |  | Not reviewed |  |
| EC-ROLE-006 | Roles and opportunities | Dates change after people showed Interest | P1 | Data integrity, Trust | Interested people are told what changed; the role shows "Updated". | Aditi | Konark Pictures | Role page | Yes | Yes |  |  |  |  | Implemented | Lab: reproducible |
| EC-ROLE-007 | Roles and opportunities | Material details change after responses | P1 | Trust | Same as dates: changes are listed and people are told. | Aditi | Konark Pictures | Project workspace | Yes | Yes |  |  |  |  | Implemented |  |
| EC-ROLE-008 | Roles and opportunities | Zero Interest | P2 | Usability | Workspace says "No one yet" with a tip, no shame counter. | Aditi | Konark Pictures | Project workspace | Yes |  |  |  |  |  | Implemented |  |
| EC-ROLE-009 | Roles and opportunities | Extremely high response volume | P2 | Scalability | List virtualised; sorting by match. Not an ATS. | Aditi | Konark Pictures | Project workspace | Yes |  |  |  |  | Yes | Needs product decision |  |
| EC-ROLE-010 | Roles and opportunities | Duplicate Interest | P0 | Data integrity | One Interest per person per role. Re-sending replaces. | Aditi | Konark Pictures | Project workspace |  |  | Yes |  |  |  | Passed | Checks: AC-13 · Lab: Covered by the automated check. |
| EC-ROLE-011 | Roles and opportunities | Interest while the role closes | P0 | Data integrity | If the role closed first, the Interest is refused with "This role just closed". | Kiran | Personal | Role page |  | Yes | Yes | Yes |  |  | Failed | Checks: AC-17 · Lab: reproducible |
| EC-ROLE-012 | Roles and opportunities | Role fills during a response | P1 | Data integrity | Same as EC-ROLE-011. | Aditi | Konark Pictures | Project workspace |  | Yes | Yes |  |  |  | Failed | Checks: AC-17 |
| EC-ROLE-013 | Roles and opportunities | Filled outside Ana | P2 | Usability | Close with reason "Filled outside Ana". Interested people told politely. | Aditi | Konark Pictures | Project workspace | Yes |  |  |  |  |  | Implemented |  |
| EC-ROLE-014 | Roles and opportunities | Selected person drops out | P2 | Data integrity | Open a new role for the same craft (EC-ROLE-016). | Aditi | Konark Pictures | Project workspace | Yes |  |  |  |  |  | Implemented |  |
| EC-ROLE-015 | Roles and opportunities | Closed role reopened | P1 | Data integrity | Reopening a closed role is allowed; earlier Interests are still there. | Aditi | Konark Pictures | Role page | Yes |  |  |  |  |  | Implemented | Lab: reproducible |
| EC-ROLE-016 | Roles and opportunities | Filled role cannot reopen | P0 | Record integrity | A filled role is a record of who was chosen. "Hire again" creates a new role. | Aditi | Konark Pictures | Role page |  | Yes | Yes | Yes |  |  | Failed | The UI offers Hire again; the reopen action itself does not check. · Checks: AC-18 · Lab: reproducible |
| EC-ROLE-017 | Roles and opportunities | Craft or title changed after responses | P1 | Trust | Title and project are fixed once published; other fields change with notice. | Aditi | Konark Pictures | Project workspace | Yes |  | Yes |  |  |  | Implemented |  |
| EC-ROLE-018 | Roles and opportunities | Role deleted after Interest | P1 | Data integrity | Roles are closed, not deleted. Interested people see "Closed". | Aditi | Konark Pictures | Project workspace |  |  |  | Yes |  |  | Rule defined |  |
| EC-ROLE-019 | Roles and opportunities | Role attached to the wrong project | P1 | Data integrity | Close it and open it on the right project. | Aditi | Konark Pictures | Project workspace | Yes |  |  |  |  |  | Rule defined |  |
| EC-ROLE-020 | Roles and opportunities | Duplicate role | P2 | Data integrity | Warning when the same craft is open twice on one project. | Aditi | Konark Pictures | Project workspace | Yes |  |  |  |  |  | Not reviewed |  |
| EC-ROLE-021 | Roles and opportunities | Private role appears in search | P0 | Privacy | Private roles never appear in Discover. | Kiran | Personal | Discover |  |  | Yes |  |  |  | Passed | Checks: AC-01 · Lab: reproducible |
| EC-ROLE-022 | Roles and opportunities | Questions edited after answers exist | P2 | Data integrity | Existing answers keep the question they answered. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes |  |  | Needs product decision |  |
| EC-ROLE-023 | Roles and opportunities | Answer contains abuse or spam | P1 | Safety | Report from the Interest review sheet. | Aditi | Konark Pictures | Project workspace | Yes |  |  |  |  |  | Rule defined |  |
| EC-ROLE-024 | Roles and opportunities | House member responds to their own house's role | P2 | Permission | Allowed only personally; the house sees it like any other. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes |  |  | Needs product decision |  |
| EC-ROLE-025 | Roles and opportunities | Unverified house opens a role | P0 | Trust | See EC-HOUSE-016. | Aditi | Konark Pictures | Project workspace |  | Yes | Yes |  |  |  | Failed | Checks: AC-09 · Lab: reproducible |

## 15 Interest

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-INT-001 | Interest | Interest sent with an incomplete profile | P2 | Usability | Allowed; the sheet suggests adding work first. | Kiran | Personal | Role page | Yes |  |  |  |  |  | Rule defined |  |
| EC-INT-002 | Interest | Profile changes after Interest | P2 | Data integrity | The house sees the live profile. | Kiran | Personal | Role page |  |  |  | Yes |  |  | Needs product decision |  |
| EC-INT-003 | Interest | Craft changes after Interest | P2 | Data integrity | Same: live profile. | Kiran | Personal | Role page |  |  |  | Yes |  |  | Needs product decision |  |
| EC-INT-004 | Interest | Withdraw before review | P1 | Usability | Quiet withdrawal with Undo. The house list drops them. | Kiran | Personal | Role page | Yes | Yes |  |  |  |  | Implemented | Lab: reproducible |
| EC-INT-005 | Interest | Withdraw after review | P1 | Usability | Same, and the house sees "Withdrew" on their history. | Kiran | Personal | Role page | Yes |  |  | Yes |  |  | Needs product decision |  |
| EC-INT-006 | Interest | Withdraw while the house starts messaging | P1 | Data integrity | The conversation stays; it is about the role, not the Interest. | Kiran | Personal | Role page | Yes |  |  | Yes |  |  | Needs product decision |  |
| EC-INT-007 | Interest | Withdraw, then express Interest again | P1 | Data integrity | One record, re-activated. | Kiran | Personal | Role page |  |  | Yes |  |  |  | Implemented |  |
| EC-INT-008 | Interest | Person blocks the house after Interest | P1 | Safety | Interest withdrawn automatically. | Kiran | Personal | Role page |  |  | Yes | Yes |  |  | Needs UI |  |
| EC-INT-009 | Interest | House blocks the person | P1 | Safety | Interest hidden from the house. | Kiran | Personal | Role page |  |  |  | Yes |  |  | Needs product decision |  |
| EC-INT-010 | Interest | Role closes while Interest is in flight | P0 | Data integrity | See EC-ROLE-011. | Kiran | Personal | Role page |  | Yes | Yes |  |  |  | Failed | Checks: AC-17 · Lab: reproducible |
| EC-INT-011 | Interest | Retry creates a duplicate Interest | P0 | Data integrity | Retrying after a failure records one Interest. | Kiran | Personal | Role page |  |  | Yes |  |  |  | Passed | Checks: AC-13 · Lab: reproducible |
| EC-INT-012 | Interest | Interested in several roles | P2 | Usability | Each role separately. | Kiran | Personal | Role page | Yes |  |  |  |  |  | Implemented |  |
| EC-INT-013 | Interest | Selected for one role while interested in another | P2 | Usability | Nothing automatic. | Kiran | Personal | Role page |  |  |  | Yes |  |  | Needs product decision |  |
| EC-INT-014 | Interest | House needs history of withdrawn Interest | P2 | Data integrity | Kept, marked withdrawn. | Kiran | Personal | Role page |  |  |  | Yes |  |  | Needs product decision |  |
| EC-INT-015 | Interest | Live profile versus snapshot | P1 | Data integrity | Live profile; answers are a snapshot. | Kiran | Personal | Role page |  |  |  | Yes |  | Yes | Needs product decision |  |
| EC-INT-016 | Interest | High volume needs sorting | P2 | Scalability | Sort by match, then time. Not an ATS. | Kiran | Personal | Role page | Yes |  |  |  |  | Yes | Needs product decision |  |
| EC-INT-017 | Interest | Interest as a house | P0 | Identity | See EC-ID-009. | Aditi | Konark Pictures | Role page | Yes | Yes | Yes |  |  |  | Implemented | Lab: reproducible |

## 16 Added to a project

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-ADD-001 | Added to a project | Added to the wrong project | P1 | Record integrity | "This isn't right" tells the house privately. | Tara | Personal | Notifications sheet | Yes | Yes |  |  |  |  | Implemented | Lab: reproducible |
| EC-ADD-002 | Added to a project | Duplicate add | P1 | Data integrity | Someone already on the project cannot be added twice for the same role. | Tara | Personal | Profile |  |  | Yes | Yes |  |  | Implemented |  |
| EC-ADD-003 | Added to a project | Wrong craft | P1 | Record integrity | The house edits the working role; the person is told. | Tara | Personal | Profile | Yes |  |  |  |  |  | Implemented |  |
| EC-ADD-004 | Added to a project | Several roles on one project | P1 | Record integrity | Allowed as separate associations. | Tara | Personal | Profile |  |  |  | Yes |  |  | Needs product decision |  |
| EC-ADD-005 | Added to a project | Working role changes | P2 | Record integrity | Edit; no credit changes until issued. | Tara | Personal | Profile | Yes |  |  |  |  |  | Implemented |  |
| EC-ADD-006 | Added to a project | "This isn't right" | P1 | Record integrity | Flags the association to the house. | Tara | Personal | Profile | Yes | Yes |  |  |  |  | Implemented |  |
| EC-ADD-007 | Added to a project | House ignores the correction | P1 | Record integrity | After 14 days the person can remove themselves. | Tara | Personal | Profile |  |  |  | Yes |  |  | Needs product decision |  |
| EC-ADD-008 | Added to a project | Person leaves the project | P1 | Record integrity | They can remove the association from their side. | Tara | Personal | Profile | Yes |  |  |  |  |  | Needs UI |  |
| EC-ADD-009 | Added to a project | Removed before credit | P1 | Record integrity | Association and any unaccepted credit gone. | Tara | Personal | Profile |  |  | Yes |  |  |  | Passed | Checks: AC-20 |
| EC-ADD-010 | Added to a project | Cannot remove after accepted credit | P0 | Record integrity | Removing someone with an accepted credit is replaced by "Credit accepted. Changes go through a correction." | Aditi | Konark Pictures | Project workspace | Yes | Yes | Yes |  |  |  | Passed | Checks: AC-05 · Lab: reproducible |
| EC-ADD-011 | Added to a project | Remove association, keep accepted credit | P0 | Record integrity | If an association is removed, the accepted credit survives. | Tara | Personal | Profile |  |  | Yes |  |  |  | Passed | Checks: AC-05 · Lab: Covered by the automated check. |
| EC-ADD-012 | Added to a project | Never starts work | P2 | Record integrity | House removes them; nothing public. | Tara | Personal | Profile |  |  |  | Yes |  |  | Rule defined |  |
| EC-ADD-013 | Added to a project | Replaced | P2 | Record integrity | Removed, new person added. | Tara | Personal | Profile |  |  |  | Yes |  |  | Rule defined |  |
| EC-ADD-014 | Added to a project | Left but deserves credit | P1 | Record integrity, Trust | House can still issue a credit after removal. | Tara | Personal | Profile |  |  |  | Yes |  | Yes | Needs product decision |  |
| EC-ADD-015 | Added to a project | Deletes account before credit | P1 | Record integrity | Association removed; nothing kept. | Tara | Personal | Profile |  |  |  | Yes |  |  | Rule defined |  |
| EC-ADD-016 | Added to a project | Blocks the production | P1 | Safety, Record integrity | Association stays (it's the house's record); notifications stop. | Tara | Personal | Profile |  |  |  | Yes |  |  | Needs product decision |  |
| EC-ADD-017 | Added to a project | Added person is a minor | P0 | Safety, Legal | See EC-AGE-004. | Tara | Personal | Profile |  |  |  | Yes | Yes |  | Needs legal | Lab: Needs legal rule. |
| EC-ADD-018 | Added to a project | Private association leaks | P0 | Privacy | Associations are never public. | Tara | Personal | Profile |  |  | Yes |  |  |  | Passed | Checks: AC-20 · Lab: Covered by the automated check. |
| EC-ADD-019 | Added to a project | Person thinks Added means a confirmed credit | P1 | Usability, Trust | Notification and page say "This isn't a credit". | Tara | Personal | Notifications sheet | Yes |  |  |  |  | Yes | Needs user validation | Lab: reproducible |
| EC-ADD-020 | Added to a project | Two co-producers add the same person | P2 | Data integrity | Two associations, one per house. | Tara | Personal | Profile |  |  |  | Yes |  |  | Needs product decision | Lab: Needs a multi-house project model beyond lead and co-producers. |

## 17 People not yet on Ana

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-PEND-001 | People not yet on Ana | Same phone added twice | P1 | Data integrity | One pending record per phone per project. | Aditi | Konark Pictures | Project workspace |  |  | Yes | Yes |  |  | Needs UI |  |
| EC-PEND-002 | People not yet on Ana | Wrong phone number | P0 | Privacy | The invite SMS names only the house, never the project. Recipient can say "Not me", which stops invites. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes | Yes |  | Needs product decision | Lab: SMS not modelled. |
| EC-PEND-003 | People not yet on Ana | Recycled phone number | P0 | Identity, Privacy | Pending records match on join only after the person confirms the project and role. A match is never automatic. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes | Yes |  | Needs product decision | Lab: Needs matching model. |
| EC-PEND-004 | People not yet on Ana | Added by several houses | P2 | Data integrity | Separate records; merged on join. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes |  |  | Needs product decision |  |
| EC-PEND-005 | People not yet on Ana | Joins with email instead of invited phone | P1 | Identity | Pending records wait until the phone is verified. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes |  |  | Rule defined |  |
| EC-PEND-006 | People not yet on Ana | Joins with a different phone | P1 | Identity | House can re-link manually. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes |  |  | Needs product decision |  |
| EC-PEND-007 | People not yet on Ana | Never joins | P2 | Record integrity | Record stays private to the house. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes |  |  | Rule defined |  |
| EC-PEND-008 | People not yet on Ana | Wants no more invites | P1 | Privacy, Legal | Opt-out stops all future invites to that number. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes | Yes |  | Needs legal |  |
| EC-PEND-009 | People not yet on Ana | Pending person is a minor | P0 | Safety | See EC-AGE-008. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes | Yes |  | Needs legal | Lab: Needs legal rule. |
| EC-PEND-010 | People not yet on Ana | Phone visible to the wrong member | P1 | Privacy | Phones visible only to members of the house that added them. | Aditi | Konark Pictures | Project workspace |  |  | Yes | Yes |  |  | Rule defined |  |
| EC-PEND-011 | People not yet on Ana | Pending record leaks publicly | P0 | Privacy | Pending names and phones never appear on public surfaces. | Kiran | Personal | Project page |  |  | Yes |  |  |  | Passed | Checks: AC-19 · Lab: reproducible |
| EC-PEND-012 | People not yet on Ana | Joins after the project is public | P2 | Record integrity | Credit can then be issued. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes |  |  | Rule defined |  |
| EC-PEND-013 | People not yet on Ana | Joins after expected credit timing | P2 | Record integrity | Same. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes |  |  | Rule defined |  |
| EC-PEND-014 | People not yet on Ana | Duplicate pending records need merging | P2 | Data integrity | Merged by phone. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes |  |  | Not reviewed |  |
| EC-PEND-015 | People not yet on Ana | Wrong Ana account linked | P0 | Identity, Record integrity | Person says "Not me"; the link undoes, no credit issued. | Aditi | Konark Pictures | Project workspace | Yes |  |  | Yes |  |  | Needs product decision | Lab: Needs matching model. |
| EC-PEND-016 | People not yet on Ana | Pending record deleted | P2 | Privacy | Phone erased. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes |  |  | Rule defined |  |
| EC-PEND-017 | People not yet on Ana | Member loses access but saw phones | P1 | Privacy | Access removed immediately; phones not exportable. | Aditi | Konark Pictures | Project workspace |  |  |  | Yes |  |  | Needs product decision |  |

## 18 Credits

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-CREDIT-001 | Credits | Credit issued to the wrong person | P0 | Record integrity, Identity | The person declines with "This isn't me". The credit is withdrawn; nothing public ever showed. | Kiran | Personal | Profile | Yes | Yes | Yes | Yes |  |  | Needs UI | Profile offers Accept and Ask for a correction; no explicit "not me". · Lab: reproducible |
| EC-CREDIT-002 | Credits | Wrong spelling of name | P1 | Record integrity | Ask for a correction; house re-issues. | Kiran | Personal | Profile | Yes | Yes |  |  |  |  | Implemented | Lab: reproducible |
| EC-CREDIT-003 | Credits | Wrong role | P1 | Record integrity | Ask for a correction with the right role. | Kiran | Personal | Profile | Yes | Yes |  |  |  |  | Implemented | Lab: reproducible |
| EC-CREDIT-004 | Credits | Wrong character name | P1 | Record integrity | Same as wrong role. | Kiran | Personal | Profile | Yes | Yes |  |  |  |  | Implemented |  |
| EC-CREDIT-005 | Credits | Wrong department | P2 | Record integrity | Same. | Kiran | Personal | Profile | Yes | Yes |  |  |  |  | Implemented |  |
| EC-CREDIT-006 | Credits | Duplicate proposed credit | P0 | Record integrity, Data integrity | Re-issuing replaces the open proposal; one open credit per association. | Kiran | Personal | Profile |  |  | Yes |  |  |  | Passed | Checks: AC-16 · Lab: Covered by the automated check. |
| EC-CREDIT-007 | Credits | Same person legitimately has several credits on one film | P1 | Record integrity | Allowed through separate associations (Director and Writer). | Kiran | Personal | Profile |  |  |  | Yes |  |  | Needs product decision |  |
| EC-CREDIT-008 | Credits | Accepted by accident | P1 | Record integrity | Undo for a few seconds; afterwards a correction request. | Kiran | Personal | Profile | Yes |  |  | Yes |  |  | Needs product decision |  |
| EC-CREDIT-009 | Credits | Correction requested | P1 | Record integrity | The house sees it on the project and in notifications. | Aditi | Konark Pictures | Project workspace | Yes | Yes |  |  |  |  | Implemented | Lab: reproducible |
| EC-CREDIT-010 | Credits | Correction accepted by the house | P1 | Record integrity | House re-issues; person accepts the corrected credit. | Kiran | Personal | Profile | Yes | Yes |  |  |  |  | Implemented |  |
| EC-CREDIT-011 | Credits | Correction rejected by the house | P1 | Record integrity, Trust | The person is told why and can still accept, decline or report. | Kiran | Personal | Profile | Yes |  |  | Yes |  |  | Needs UI |  |
| EC-CREDIT-012 | Credits | Correction stalls | P2 | Record integrity | Reminders after 7 and 21 days. | Kiran | Personal | Profile |  |  |  | Yes |  |  | Needs product decision |  |
| EC-CREDIT-013 | Credits | Production withdraws a proposal | P1 | Record integrity | Removed from the person's pending list. | Kiran | Personal | Profile | Yes |  |  | Yes |  |  | Needs UI |  |
| EC-CREDIT-014 | Credits | Accepted credit edited by the house | P0 | Record integrity | Not allowed directly. Changes to an accepted credit are proposals the person accepts again. | Kiran | Personal | Profile |  |  | Yes | Yes |  |  | Rule defined | Lab: No edit path exists; rule recorded. |
| EC-CREDIT-015 | Credits | Accepted credit disputed years later | P1 | Record integrity, Trust | Report as fraudulent credit; moderation hides pending review, never deletes. | Kiran | Personal | Profile |  |  |  | Yes | Yes |  | Needs product decision |  |
| EC-CREDIT-016 | Credits | Project title changes after acceptance | P1 | Record integrity | See EC-LIFE-001. | Kiran | Personal | Profile |  |  | Yes |  |  |  | Implemented |  |
| EC-CREDIT-017 | Credits | Production name changes | P1 | Record integrity | See EC-HOUSE-008. | Kiran | Personal | Profile |  |  |  | Yes |  |  | Needs product decision |  |
| EC-CREDIT-018 | Credits | Co-producer disputes credit authority | P1 | Record integrity, Permission | Lead production issues credits at launch; disputes go to support. | Kiran | Personal | Profile |  |  |  | Yes | Yes |  | Needs product decision |  |
| EC-CREDIT-019 | Credits | Unauthorised member prepares a credit | P0 | Permission, Record integrity | A member without authority can prepare; only someone with authority proposes it to the person. | Aditi | Konark Pictures | Project workspace | Yes | Yes | Yes |  |  |  | Passed | Checks: AC-10 · Lab: reproducible |
| EC-CREDIT-020 | Credits | Authority revoked before issue | P0 | Permission, Record integrity | Checked when issuing, not when the screen opened. | Kiran | Personal | Profile |  |  | Yes | Yes |  |  | Failed | Checks: AC-11 · Lab: Covered by the automated check. |
| EC-CREDIT-021 | Credits | Accepted credit survives account deletion | P0 | Record integrity, Privacy, Legal | The profile disappears; the accepted credit stays on the film with the name as issued and no link. No self-claim pathway appears. | Tara | Personal | Your data | Yes |  | Yes | Yes | Yes |  | Needs UI | Your data explains the rule, but there is no deletion model to act on it. Policy is Draft for legal review. · Checks: AC-06 · Lab: reproducible |
| EC-CREDIT-022 | Credits | Fraudulent authorised issuer | P0 | Trust, Record integrity, Safety | Reports route to moderation; credits issued by that person hidden pending review, never deleted. | Kiran | Personal | Profile |  |  |  | Yes | Yes |  | Needs product decision | Lab: Moderation console exists; this flow does not. |
| EC-CREDIT-023 | Credits | House suspended after legitimate credits | P0 | Record integrity | Accepted credits stay. No new ones. | Kiran | Personal | Profile |  |  |  | Yes |  |  | Needs product decision | Lab: No account or organisation status model (suspended, deleted) in the prototype. |
| EC-CREDIT-024 | Credits | House verification revoked | P0 | Record integrity, Trust | See EC-HOUSE-006. | Kiran | Personal | Profile |  |  |  | Yes | Yes |  | Needs product decision | Lab: No account or organisation status model (suspended, deleted) in the prototype. |
| EC-CREDIT-025 | Credits | Person suspended after acceptance | P0 | Record integrity | Credits stay on films as names; profile hidden. | Kiran | Personal | Profile |  |  |  | Yes |  |  | Needs product decision | Lab: No account or organisation status model (suspended, deleted) in the prototype. |
| EC-CREDIT-026 | Credits | Person deletes their account | P0 | Record integrity | See EC-CREDIT-021. | Kiran | Personal | Profile |  |  | Yes | Yes |  |  | Needs UI | Checks: AC-06 · Lab: Account deletion has no data model in the prototype. |
| EC-CREDIT-027 | Credits | Credit accepted while the project is private | P0 | Privacy, Record integrity | Accepted, but public only once the project is shared. The person sees "public when the project is shared". | Kiran | Personal | Profile | Yes |  | Yes |  |  |  | Passed | Checks: AC-04 · Lab: reproducible |
| EC-CREDIT-028 | Credits | Project never becomes public | P1 | Record integrity | Accepted credits stay private to the person and house. | Kiran | Personal | Profile |  |  |  | Yes |  |  | Rule defined |  |
| EC-CREDIT-029 | Credits | Legal project removal | P0 | Legal, Record integrity | See EC-LIFE-010. | Kiran | Personal | Profile |  |  |  | Yes | Yes |  | Needs legal | Lab: Needs legal rule. |
| EC-CREDIT-030 | Credits | Impersonator accepts someone else's credit | P0 | Identity, Trust, Safety | Credits are issued to a specific account, and accepting needs that account. Impersonation reports can freeze acceptance. | Kiran | Personal | Profile |  |  |  | Yes | Yes |  | Needs product decision | Lab: Needs identity verification model. |
| EC-CREDIT-031 | Credits | Independent project has no trusted issuer | P1 | Trust | Independent work is shown as "Shared by" the person; no credits. | Kiran | Personal | Project page | Yes |  |  |  |  |  | Implemented | Lab: reproducible |
| EC-CREDIT-032 | Credits | Co-producers issue conflicting credits | P2 | Record integrity | Only the lead issues at launch. | Kiran | Personal | Profile |  |  |  | Yes |  |  | Needs product decision |  |
| EC-CREDIT-033 | Credits | Two houses issue different roles to one person | P2 | Record integrity | Separate associations; both can be accepted. | Kiran | Personal | Profile |  |  |  | Yes |  |  | Needs product decision |  |
| EC-CREDIT-034 | Credits | Credit reported as fraud | P0 | Trust, Record integrity | Moderator can hide from public pending review, and route to the issuing production. Never delete. | Ana staff | Moderator | Moderation console | Yes | Yes |  | Yes |  |  | Implemented | Lab: reproducible |
| EC-CREDIT-035 | Credits | Production tries to remove a credit after a conflict | P0 | Record integrity, Trust | Accepted credits cannot be removed by the production. Only a correction the person accepts, or a moderated fraud outcome. | Aditi | Konark Pictures | Project workspace | Yes | Yes | Yes | Yes |  |  | Passed | Checks: AC-05 · Lab: reproducible |
| EC-CREDIT-036 | Credits | Person wants a credit hidden on their profile but kept on the film | P1 | Privacy, Record integrity | Allowed: hide from my profile. The film still lists them. | Kiran | Personal | Profile | Yes |  |  | Yes |  |  | Needs product decision |  |
| EC-CREDIT-037 | Credits | Multilingual credit lines | P2 | Data integrity | Credit lines in any script. | Kiran | Personal | Profile | Yes |  |  |  |  |  | Not reviewed |  |
| EC-CREDIT-038 | Credits | Individual cannot self-issue a credit | P0 | Trust, Record integrity | Individuals never issue credits, for themselves or anyone, on any project. | Kiran | Personal | Project page |  |  | Yes | Yes |  |  | Failed | UI never offers it; the action itself does not check. · Checks: AC-07 · Lab: reproducible |
| EC-CREDIT-039 | Credits | Accepted credit is re-issued | P1 | Record integrity | Re-issuing on an association with an accepted credit is a correction proposal, not a second credit. | Kiran | Personal | Profile |  |  | Yes | Yes |  |  | Needs product decision |  |

## 19 Independent projects

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-INDIE-001 | Independent projects | Fake project resembling a real production | P1 | Trust | Independent projects never show a house and are labelled "Shared by". Reportable. | Kiran | Personal | Project page | Yes |  |  | Yes |  |  | Implemented | Lab: reproducible |
| EC-INDIE-002 | Independent projects | Used to imply a celebrity association | P1 | Trust | Only the owner shows on an independent project. No tagging of others. | Kiran | Personal | Independent project |  |  |  | Yes |  |  | Rule defined |  |
| EC-INDIE-003 | Independent projects | Adds another Ana user without permission | P1 | Privacy, Trust | Added people are told privately and can remove themselves. | Kiran | Personal | Independent project | Yes |  |  | Yes |  |  | Needs product decision |  |
| EC-INDIE-004 | Independent projects | Several creators dispute ownership | P2 | Record integrity | Support-led. | Kiran | Personal | Independent project |  |  |  | Yes |  |  | Needs product decision |  |
| EC-INDIE-005 | Independent projects | Creator deletes their account | P2 | Record integrity | Independent project goes with them. | Kiran | Personal | Independent project |  |  |  | Yes |  |  | Needs product decision |  |
| EC-INDIE-006 | Independent projects | Creator wants a co-owner | P2 | Future architecture | Not at launch. | Kiran | Personal | Independent project |  |  |  | Yes |  |  | Needs product decision |  |
| EC-INDIE-007 | Independent projects | Later becomes a house project | P2 | Record integrity, Future architecture | A house can adopt it; credits then issued by the house. | Kiran | Personal | Independent project |  |  |  | Yes |  |  | Needs product decision |  |
| EC-INDIE-008 | Independent projects | Project is acquired | P2 | Future architecture | Same as EC-INDIE-007. | Kiran | Personal | Independent project |  |  |  | Yes |  |  | Needs product decision |  |
| EC-INDIE-009 | Independent projects | Later gains trusted credit authority | P2 | Future architecture, Trust | Not solved at launch. | Kiran | Personal | Independent project |  |  |  | Yes |  |  | Needs product decision |  |
| EC-INDIE-010 | Independent projects | Spam or fake project creation | P1 | Safety, Scalability | Rate limits and reporting. | Kiran | Personal | Independent project |  |  |  | Yes |  |  | Rule defined |  |
| EC-INDIE-011 | Independent projects | Copyright complaint | P1 | Legal | Takedown process. | Kiran | Personal | Independent project |  |  |  | Yes | Yes |  | Needs legal |  |
| EC-INDIE-012 | Independent projects | Reported as fraudulent | P1 | Trust | Moderation queue. | Kiran | Personal | Independent project |  |  |  | Yes |  |  | Rule defined |  |
| EC-INDIE-013 | Independent projects | Official house later claims the same project | P1 | Record integrity | House version is verified; independent one offers "Remove duplicate". | Kiran | Personal | Independent project |  |  |  | Yes |  |  | Needs product decision |  |
| EC-INDIE-014 | Independent projects | Independent project has no credit issuing | P0 | Trust | See EC-CREDIT-038. | Kiran | Personal | Project page |  |  | Yes | Yes |  |  | Failed | Checks: AC-07 · Lab: reproducible |

## 20 Search and discovery

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-SRCH-001 | Search and discovery | No results | P1 | Usability | "No results for …" with suggestions. | Kiran | Personal | Discover | Yes |  |  |  |  |  | Implemented | Lab: reproducible |
| EC-SRCH-002 | Search and discovery | Same-name people | P1 | Identity | Craft, city, photo shown. | Kiran | Personal | Discover | Yes |  |  |  |  |  | Implemented |  |
| EC-SRCH-003 | Search and discovery | Same-name houses | P1 | Identity | City and verification shown. | Kiran | Personal | Discover | Yes |  |  |  |  |  | Implemented |  |
| EC-SRCH-004 | Search and discovery | Spelling mistakes | P2 | Usability | Fuzzy matching later. | Kiran | Personal | Discover |  |  |  | Yes |  |  | Not reviewed |  |
| EC-SRCH-005 | Search and discovery | Craft synonyms | P2 | Usability | DoP, Cinematographer map together. | Kiran | Personal | Discover |  |  |  | Yes |  |  | Not reviewed |  |
| EC-SRCH-006 | Search and discovery | Multiple scripts and languages | P2 | Usability | Transliteration later. | Kiran | Personal | Discover |  |  |  | Yes |  |  | Not reviewed |  |
| EC-SRCH-007 | Search and discovery | Blocked people and houses excluded | P0 | Safety | People, houses and their roles are hidden from someone who blocked them. | Kiran | Personal | Discover |  |  | Yes |  |  |  | Failed | People and houses are filtered; roles are not. · Checks: AC-12 · Lab: reproducible |
| EC-SRCH-008 | Search and discovery | Suspended user in search | P0 | Safety, Trust | Hidden. | Kiran | Personal | Discover |  |  | Yes | Yes |  |  | Needs UI | Lab: No account or organisation status model (suspended, deleted) in the prototype. |
| EC-SRCH-009 | Search and discovery | Deleted user in search | P0 | Privacy | Gone. | Kiran | Personal | Discover |  |  | Yes | Yes |  |  | Needs UI | Lab: No account or organisation status model (suspended, deleted) in the prototype. |
| EC-SRCH-010 | Search and discovery | Archived project in search | P2 | Usability | Shown, labelled archived. | Kiran | Personal | Discover |  |  |  | Yes |  |  | Not reviewed |  |
| EC-SRCH-011 | Search and discovery | Unverified house in search | P0 | Trust | Never. | Kiran | Personal | Discover |  |  | Yes |  |  |  | Passed | Checks: AC-26 · Lab: reproducible |
| EC-SRCH-012 | Search and discovery | Stale search index | P1 | Data integrity | Privacy changes remove results immediately, not on next index. | Kiran | Personal | Discover |  |  | Yes | Yes |  |  | Rule defined |  |
| EC-SRCH-013 | Search and discovery | Hidden discoverability | P1 | Privacy | Private profiles excluded. | Kiran | Personal | Discover |  |  | Yes |  |  |  | Implemented |  |
| EC-SRCH-014 | Search and discovery | Private project or title leak | P0 | Privacy | See EC-PRIV-006. | Kiran | Personal | Discover |  |  | Yes |  |  |  | Passed | Checks: AC-01, AC-02 · Lab: reproducible |
| EC-SRCH-015 | Search and discovery | Private role leak | P0 | Privacy | See EC-ROLE-021. | Kiran | Personal | Discover |  |  | Yes |  |  |  | Passed | Checks: AC-01 · Lab: reproducible |
| EC-SRCH-016 | Search and discovery | Same person as account and pending record | P1 | Privacy | Pending records are never searchable. | Kiran | Personal | Discover |  |  | Yes |  |  |  | Passed | Checks: AC-19 |
| EC-SRCH-017 | Search and discovery | Person already on the project suggested | P2 | Usability | Excluded from suggestions. | Kiran | Personal | Discover |  |  |  | Yes |  |  | Not reviewed |  |
| EC-SRCH-018 | Search and discovery | Film and Fine Arts become noisy | P2 | Future architecture | Domain filter later. | Kiran | Personal | Discover |  |  |  | Yes |  |  | Not reviewed |  |

## 21 Messaging

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-MSG-001 | Messaging | Send failure | P1 | Recovery | Message marked failed with Retry. | Kiran | Personal | Inbox | Yes | Yes |  |  |  |  | Implemented | Lab: reproducible |
| EC-MSG-002 | Messaging | Duplicate message after retry | P0 | Data integrity | Retrying sends the same message, not a copy. | Kiran | Personal | Inbox |  | Yes | Yes |  |  |  | Implemented | Checks: AC-14 · Lab: reproducible |
| EC-MSG-003 | Messaging | Offline while composing | P1 | Recovery | Draft kept; sends when back. | Kiran | Personal | Inbox | Yes | Yes |  |  |  |  | Rule defined | Lab: reproducible |
| EC-MSG-004 | Messaging | Attachment failure | P2 | Recovery | Not at launch. | Kiran | Personal | Inbox | Yes |  |  |  |  |  | Not reviewed |  |
| EC-MSG-005 | Messaging | Block mid-conversation | P0 | Safety | Conversation closes for both; history kept for reports. | Kiran | Personal | Inbox | Yes | Yes |  | Yes |  |  | Needs UI | Lab: Block does not touch conversations in the prototype. |
| EC-MSG-006 | Messaging | House member loses access | P0 | Permission, Privacy | House conversations disappear from their inbox immediately. | Kiran | Personal | Inbox |  |  | Yes | Yes |  |  | Needs UI | Lab: Conversations are per persona in the prototype. |
| EC-MSG-007 | Messaging | Several house members reply | P2 | Usability | Each message shows the member's first name. | Kiran | Personal | Inbox | Yes |  |  |  |  |  | Needs product decision |  |
| EC-MSG-008 | Messaging | Wrong identity sends | P0 | Identity | See EC-ID-008. | Aditi | Konark Pictures | Inbox |  |  | Yes | Yes |  |  | Rule defined | Lab: reproducible |
| EC-MSG-009 | Messaging | Role closes while conversation continues | P2 | Usability | Context shows "Role closed". | Kiran | Personal | Inbox | Yes |  |  |  |  |  | Not reviewed |  |
| EC-MSG-010 | Messaging | Interest withdrawn after chat exists | P2 | Usability | Chat continues. | Kiran | Personal | Inbox |  |  |  | Yes |  |  | Needs product decision |  |
| EC-MSG-011 | Messaging | Account suspended mid-chat | P1 | Safety | Other side sees "Account unavailable". | Kiran | Personal | Inbox | Yes |  |  | Yes |  |  | Needs UI |  |
| EC-MSG-012 | Messaging | Deleted account in a conversation | P1 | Privacy | "Deleted account"; history stays with the other person. | Kiran | Personal | Inbox | Yes |  |  | Yes |  |  | Needs UI |  |
| EC-MSG-013 | Messaging | Organisation suspended | P1 | Trust | Same as suspended account. | Kiran | Personal | Inbox | Yes |  |  | Yes |  |  | Needs UI |  |
| EC-MSG-014 | Messaging | Personal and house conversation with the same person | P1 | Identity | Two threads, labelled. | Kiran | Personal | Inbox | Yes |  |  |  |  |  | Implemented |  |
| EC-MSG-015 | Messaging | Attempted identity transfer of a conversation | P1 | Identity | Not possible. | Kiran | Personal | Inbox |  |  |  | Yes |  |  | Rule defined |  |
| EC-MSG-016 | Messaging | Abusive or scam message report | P1 | Safety | Report from the conversation includes the reported messages only. | Kiran | Personal | Inbox | Yes |  |  | Yes |  |  | Implemented |  |
| EC-MSG-017 | Messaging | Report exposes unrelated private content | P0 | Privacy | Reports carry the reported message and minimal context, not whole histories. | Ana staff | Moderator | Moderation console |  |  |  | Yes | Yes |  | Rule defined | Lab: reproducible |

## 22 Notifications

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-NOTIF-001 | Notifications | Duplicate notification for one event | P0 | Data integrity | One event, one notification. A retry updates the same one. | Kiran | Personal | Notifications |  |  | Yes |  |  |  | Failed | Checks: AC-24 · Lab: Covered by the automated check. |
| EC-NOTIF-002 | Notifications | Stale notification | P1 | Data integrity | Opening shows current state ("Credit already accepted"). | Kiran | Personal | Notifications | Yes |  |  |  |  |  | Rule defined |  |
| EC-NOTIF-003 | Notifications | Destination deleted | P1 | Recovery | "This is no longer available". | Kiran | Personal | Notifications | Yes |  |  |  |  |  | Rule defined |  |
| EC-NOTIF-004 | Notifications | Permission lost before opening | P0 | Permission | The house item no longer shows; if opened from a stale list, it says access ended. | Aditi | Personal | Notifications sheet |  |  | Yes | Yes |  |  | Passed | Checks: AC-27 · Lab: reproducible |
| EC-NOTIF-005 | Notifications | Credit accepted but notification still actionable | P1 | Data integrity | Action replaced by the result. | Kiran | Personal | Notifications | Yes |  |  |  |  |  | Needs UI |  |
| EC-NOTIF-006 | Notifications | Role closes before Interest notification opens | P2 | Usability | Shows closed. | Kiran | Personal | Notifications | Yes |  |  |  |  |  | Not reviewed |  |
| EC-NOTIF-007 | Notifications | Removed before Added notification opens | P1 | Privacy | Shows "No longer on this project". | Kiran | Personal | Notifications | Yes |  |  |  |  |  | Implemented |  |
| EC-NOTIF-008 | Notifications | Wrong personal or house ownership | P0 | Identity | Every notification has exactly one owner: a person or a house. | Kiran | Personal | Notifications |  |  | Yes |  |  |  | Passed | Checks: AC-28 · Lab: Covered by the automated check. |
| EC-NOTIF-009 | Notifications | All filter opens a house item | P0 | Identity | See EC-ID-006. | Aditi | Personal | Notifications sheet | Yes | Yes | Yes |  |  |  | Implemented | Lab: reproducible |
| EC-NOTIF-010 | Notifications | Hundreds of notifications | P2 | Scalability | Grouped by day; older collapse. | Kiran | Personal | Notifications | Yes |  |  |  |  |  | Needs UI |  |
| EC-NOTIF-011 | Notifications | Mark all as read scope | P1 | Identity | Marks only the filter in view. | Aditi | Konark Pictures | Notifications sheet | Yes | Yes |  |  |  |  | Implemented | Lab: reproducible |
| EC-NOTIF-012 | Notifications | Lock-screen privacy | P0 | Privacy | See EC-PRIV-008. | Kiran | Personal | Notifications |  |  |  | Yes |  |  | Needs product decision |  |
| EC-NOTIF-013 | Notifications | Confidential title in push | P0 | Privacy | See EC-PRIV-008. | Kiran | Personal | Notifications |  |  |  | Yes |  |  | Needs product decision |  |
| EC-NOTIF-014 | Notifications | Notifications disabled | P2 | Usability | In-app list still works. | Kiran | Personal | Notifications |  |  |  | Yes |  |  | Not reviewed |  |
| EC-NOTIF-015 | Notifications | Multiple house identities | P1 | Identity | Filter per identity. | Aditi | Personal | Notifications sheet | Yes |  |  |  |  |  | Implemented | Lab: reproducible |
| EC-NOTIF-016 | Notifications | Moderation notice reveals reporter | P0 | Privacy, Safety | Never. | Ana staff | Moderator | Moderation console | Yes |  |  | Yes |  |  | Implemented | Lab: reproducible |
| EC-NOTIF-017 | Notifications | Policy update requires action | P1 | Legal | Blocking sheet on next open. | Kiran | Personal | Notifications | Yes |  |  |  | Yes |  | Implemented | Lab: reproducible |

## 23 Follow and Save

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-SAVE-001 | Follow and Save | Save or Follow while acting for a house | P1 | Identity | Stays personal (EC-ID-017). | Aditi | Konark Pictures | Discover | Yes | Yes |  |  |  |  | Implemented | Lab: reproducible |
| EC-SAVE-002 | Follow and Save | Saved role closes | P2 | Usability | Shows closed. | Kiran | Personal | Discover | Yes |  |  |  |  |  | Not reviewed |  |
| EC-SAVE-003 | Follow and Save | Saved project archived | P2 | Usability | Shows archived. | Kiran | Personal | Discover | Yes |  |  |  |  |  | Not reviewed |  |
| EC-SAVE-004 | Follow and Save | Saved house suspended | P2 | Usability | Shows unavailable. | Kiran | Personal | Discover | Yes |  |  |  |  |  | Not reviewed |  |
| EC-SAVE-005 | Follow and Save | Followed person later blocked | P1 | Safety | Blocking unfollows both ways. | Kiran | Personal | Discover |  |  | Yes | Yes |  |  | Needs UI |  |
| EC-SAVE-006 | Follow and Save | Duplicate Save | P2 | Data integrity | Idempotent. | Kiran | Personal | Discover |  |  | Yes |  |  |  | Implemented |  |
| EC-SAVE-007 | Follow and Save | Deleted owner | P2 | Data integrity | Saved item removed. | Kiran | Personal | Discover |  |  |  | Yes |  |  | Not reviewed |  |
| EC-SAVE-008 | Follow and Save | Personal Save used as house shortlist | P1 | Identity | Not supported; saves are personal. | Kiran | Personal | Discover |  |  |  | Yes |  |  | Rule defined |  |
| EC-SAVE-009 | Follow and Save | House browsing reflected in personal Saved | P1 | Privacy | Saves while acting are clearly personal (toast). No house-level save. | Kiran | Personal | Discover | Yes |  |  |  |  |  | Implemented |  |

## 24 Report and Block

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-BLOCK-001 | Report and Block | Repeated report | P2 | Safety | Merged into the open case. | Kiran | Personal | Profile |  |  |  | Yes |  |  | Rule defined |  |
| EC-BLOCK-002 | Report and Block | Report and block together | P1 | Safety | Both from the same sheet. | Kiran | Personal | Profile | Yes | Yes |  |  |  |  | Implemented |  |
| EC-BLOCK-003 | Report and Block | Block and a shared credit | P0 | Record integrity, Safety | Blocking never removes either person from a film's credits. | Kiran | Personal | Project page |  |  | Yes |  |  |  | Passed | Checks: AC-29 · Lab: reproducible |
| EC-BLOCK-004 | Report and Block | Block and an active project | P1 | Safety, Record integrity | Associations stay; notifications stop. | Kiran | Personal | Profile |  |  |  | Yes |  |  | Needs product decision |  |
| EC-BLOCK-005 | Report and Block | Block the house that issued a credit | P0 | Record integrity, Safety | Credit stays. The house cannot contact them. | Tara | Personal | Profile |  |  | Yes | Yes |  |  | Passed | Checks: AC-29 · Lab: reproducible |
| EC-BLOCK-006 | Report and Block | Block someone on the same project | P1 | Safety | Both still on the project. | Kiran | Personal | Profile |  |  |  | Yes |  |  | Rule defined |  |
| EC-BLOCK-007 | Report and Block | Block a house while privately associated | P1 | Safety | Association stays private. | Kiran | Personal | Profile |  |  |  | Yes |  |  | Needs product decision |  |
| EC-BLOCK-008 | Report and Block | Blocked person in accepted project history | P0 | Record integrity | Still listed on the film. | Kiran | Personal | Project page |  |  | Yes |  |  |  | Passed | Checks: AC-29 · Lab: reproducible |
| EC-BLOCK-009 | Report and Block | Unblock | P1 | Safety | From the blocked profile or Settings. | Kiran | Personal | Profile | Yes | Yes |  |  |  |  | Implemented | Lab: reproducible |
| EC-BLOCK-010 | Report and Block | Report while acting for a house stays personal | P0 | Identity | The sheet says the report comes from the person. | Aditi | Konark Pictures | Profile | Yes |  | Yes |  |  |  | Implemented | Lab: reproducible |
| EC-BLOCK-011 | Report and Block | Malicious report | P1 | Trust | Moderators see reporter history; repeated bad-faith reports reduce weight. | Kiran | Personal | Profile |  |  |  | Yes |  |  | Needs product decision |  |
| EC-BLOCK-012 | Report and Block | Reported content edited | P1 | Data integrity | Report keeps the snapshot at report time. | Ana staff | Moderator | Moderation console |  |  |  | Yes |  |  | Implemented | Lab: reproducible |
| EC-BLOCK-013 | Report and Block | Reported content deleted | P1 | Data integrity | Snapshot kept for the case. | Kiran | Personal | Profile |  |  |  | Yes |  |  | Rule defined |  |
| EC-BLOCK-014 | Report and Block | Multiple reports on one incident | P2 | Safety | Grouped. | Kiran | Personal | Profile |  |  |  | Yes |  |  | Rule defined |  |
| EC-BLOCK-015 | Report and Block | Minor involved | P0 | Safety, Legal | Escalated to child-safety handling. | Kiran | Personal | Profile |  |  |  | Yes | Yes |  | Needs legal | Lab: Needs legal rule. |
| EC-BLOCK-016 | Report and Block | Impersonation | P0 | Identity, Safety | Report reason "Pretending to be someone"; moderator compares identities. | Ana staff | Moderator | Moderation console | Yes |  |  | Yes |  |  | Implemented | Lab: reproducible |
| EC-BLOCK-017 | Report and Block | Scam recruitment | P0 | Safety | Report reason; moderator can suspend fast. | Ana staff | Moderator | Moderation console | Yes |  |  | Yes |  |  | Implemented | Lab: reproducible |
| EC-BLOCK-018 | Report and Block | Fraudulent credit | P0 | Record integrity, Trust | See EC-CREDIT-034. | Ana staff | Moderator | Moderation console | Yes |  |  | Yes |  |  | Implemented | Lab: reproducible |
| EC-BLOCK-019 | Report and Block | Account owner reported | P1 | Trust | Same process. | Kiran | Personal | Profile |  |  |  | Yes |  |  | Rule defined |  |
| EC-BLOCK-020 | Report and Block | Reporter deletes their account | P1 | Privacy | Case continues without reporter identity. | Kiran | Personal | Profile |  |  |  | Yes |  |  | Needs product decision |  |
| EC-BLOCK-021 | Report and Block | Reported user deletes their account | P1 | Safety | Case continues; evidence kept for a limited time. | Kiran | Personal | Profile |  |  |  | Yes | Yes |  | Needs legal |  |

## 25 Moderation

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-MOD-001 | Moderation | Two moderators open the same report | P1 | Data integrity | The case shows "Being reviewed by Priya". A second action asks to confirm. | Ana staff | Moderator | Moderation console | Yes |  |  | Yes |  |  | Needs UI | Lab: The moderation console is a single-moderator prototype with sample cases. |
| EC-MOD-002 | Moderation | Conflicting moderator actions | P0 | Data integrity, Trust | The first action wins; the second is refused with the current state. Both are in the audit log. | Ana staff | Moderator | Moderation console |  |  | Yes | Yes |  |  | Needs product decision | Lab: The moderation console is a single-moderator prototype with sample cases. |
| EC-MOD-003 | Moderation | Wrong account suspended | P0 | Trust | Reversible from the case with a reason; the person is told and restored. | Ana staff | Moderator | Moderation console | Yes |  |  | Yes |  |  | Needs product decision | Lab: The moderation console is a single-moderator prototype with sample cases. |
| EC-MOD-004 | Moderation | Action fails | P1 | Recovery | Error shown; case stays open. | Ana staff | Moderator | Moderation console | Yes |  |  |  |  |  | Not reviewed | Lab: reproducible |
| EC-MOD-005 | Moderation | Moderator lacks permission | P0 | Permission, Security | High-impact actions (suspend, legal) need a senior role. | Ana staff | Moderator | Moderation console |  |  | Yes | Yes |  |  | Needs product decision | Lab: The moderation console is a single-moderator prototype with sample cases. |
| EC-MOD-006 | Moderation | Compromised admin account | P0 | Security | Admin access needs strong auth; every action is logged and reversible. | Ana staff | Moderator | Moderation console |  |  |  | Yes |  |  | Needs product decision | Lab: The moderation console is a single-moderator prototype with sample cases. |
| EC-MOD-007 | Moderation | Snapshot differs from current content | P1 | Data integrity | Both shown: as reported, and now. | Ana staff | Moderator | Moderation console | Yes |  |  |  |  |  | Implemented | Lab: reproducible |
| EC-MOD-008 | Moderation | Credit report | P0 | Record integrity | Options: hide pending review, send to production. No delete. | Ana staff | Moderator | Moderation console | Yes | Yes |  |  |  |  | Implemented | Lab: reproducible |
| EC-MOD-009 | Moderation | Private project report | P0 | Privacy | Moderators see only what the reporter could see, plus metadata. | Ana staff | Moderator | Moderation console |  |  |  | Yes | Yes |  | Needs product decision | Lab: The moderation console is a single-moderator prototype with sample cases. |
| EC-MOD-010 | Moderation | Direct message report | P0 | Privacy | See EC-MSG-017. | Ana staff | Moderator | Moderation console |  |  |  | Yes | Yes |  | Rule defined | Lab: reproducible |
| EC-MOD-011 | Moderation | Excessive internal data exposure | P0 | Privacy, Security | Console shows the minimum needed. Phone numbers and emails masked. | Ana staff | Moderator | Moderation console | Yes |  |  | Yes |  |  | Rule defined | Lab: reproducible |
| EC-MOD-012 | Moderation | Suspended last owner of a house | P1 | Permission | Ana support becomes custodian (EC-HOUSE-011). | Ana staff | Moderator | Moderation console |  |  |  | Yes |  |  | Needs product decision |  |
| EC-MOD-013 | Moderation | Suspended organisation | P1 | Trust | See EC-ID-013. | Ana staff | Moderator | Moderation console |  |  |  | Yes |  |  | Needs product decision |  |
| EC-MOD-014 | Moderation | Warning ignored | P2 | Safety | Escalation guidance in the console. | Ana staff | Moderator | Moderation console |  |  |  | Yes |  |  | Not reviewed |  |
| EC-MOD-015 | Moderation | Restriction expires | P1 | Recovery | Lifted automatically; person told. | Ana staff | Moderator | Moderation console |  |  |  | Yes |  |  | Rule defined |  |
| EC-MOD-016 | Moderation | Appeal succeeds | P1 | Trust | Restore action, reason logged. | Ana staff | Moderator | Moderation console | Yes |  |  |  |  |  | Implemented | Lab: reproducible |
| EC-MOD-017 | Moderation | Restored content | P1 | Recovery | Restore returns the item as it was. | Ana staff | Moderator | Moderation console | Yes |  |  |  |  |  | Implemented | Lab: reproducible |
| EC-MOD-018 | Moderation | Audit log correction | P1 | Data integrity | Logs are append-only; corrections are new entries. | Ana staff | Moderator | Moderation console |  |  |  | Yes |  |  | Rule defined |  |
| EC-MOD-019 | Moderation | Reporter communication | P1 | Privacy | Reporter told an outcome without details about the other person. | Ana staff | Moderator | Moderation console | Yes |  |  |  |  |  | Implemented | Lab: reproducible |
| EC-MOD-020 | Moderation | Legal emergency takedown | P0 | Legal | Senior staff can hide immediately; legal review follows. | Ana staff | Moderator | Moderation console |  |  |  | Yes | Yes |  | Needs legal | Lab: Needs legal process. |
| EC-MOD-021 | Moderation | Law-enforcement request | P0 | Legal, Privacy | Handled by legal, outside the console. | Ana staff | Moderator | Moderation console |  |  |  | Yes | Yes |  | Needs legal | Lab: Needs legal process. |
| EC-MOD-022 | Moderation | Child-safety escalation | P0 | Safety, Legal | Escalate action routes to a trained team with mandated reporting. | Ana staff | Moderator | Moderation console |  |  |  | Yes | Yes |  | Needs legal | Lab: reproducible |
| EC-MOD-023 | Moderation | Fraudulent credit needs special flow | P0 | Record integrity | See EC-MOD-008. | Ana staff | Moderator | Moderation console | Yes | Yes |  |  |  |  | Implemented | Lab: reproducible |
| EC-MOD-024 | Moderation | Verification revoked after fraud | P0 | Trust, Record integrity | See EC-HOUSE-006. | Ana staff | Moderator | Moderation console |  |  |  | Yes | Yes |  | Needs product decision | Lab: The moderation console is a single-moderator prototype with sample cases. |

## 26 Terms and consent

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-TERMS-001 | Terms and consent | Terms accepted, Privacy not | P0 | Legal | Both required separately; Continue stays disabled. | Kiran | Personal | Entry (sign-up) | Yes | Yes |  |  | Yes |  | Implemented | Lab: reproducible |
| EC-TERMS-002 | Terms and consent | Required box missing from the form | P1 | Legal | Consent is validated server-side too. | New person | None | Sign-up consent |  |  | Yes | Yes |  |  | Rule defined |  |
| EC-TERMS-003 | Terms and consent | Policy updated | P1 | Legal | Update sheet summarises changes. | Kiran | Personal | Sign-up consent | Yes |  |  |  | Yes |  | Implemented | Lab: reproducible |
| EC-TERMS-004 | Terms and consent | Re-consent required mid-session | P1 | Legal | Shown at next app open; mid-action work is not lost. | New person | None | Sign-up consent | Yes |  |  | Yes |  |  | Rule defined |  |
| EC-TERMS-005 | Terms and consent | Person refuses the new policy | P0 | Legal, Record integrity | They can download or delete their data. Their accepted credits stay on films regardless. | Kiran | Personal | Sign-up consent | Yes | Yes |  |  | Yes |  | Needs legal | Lab: reproducible |
| EC-TERMS-006 | Terms and consent | Legal page unavailable | P2 | Recovery | Cached copy; consent waits. | New person | None | Sign-up consent | Yes |  |  |  |  |  | Not reviewed |  |
| EC-TERMS-007 | Terms and consent | Consent logging fails | P0 | Legal | Account creation does not complete without a consent record. | New person | None | Sign-up consent |  |  | Yes | Yes |  |  | Rule defined | Lab: Consent log is local state. |
| EC-TERMS-008 | Terms and consent | Duplicate consent event | P2 | Data integrity | Idempotent per document version. | New person | None | Sign-up consent |  |  | Yes |  |  |  | Not reviewed |  |
| EC-TERMS-009 | Terms and consent | Person asks for the version they accepted | P1 | Legal | Your data lists document, version, date. | Kiran | Personal | Your data | Yes |  |  |  | Yes |  | Implemented | Lab: reproducible |
| EC-TERMS-010 | Terms and consent | Marketing consent bundled | P0 | Legal | Marketing is a separate, unticked, optional choice. | Kiran | Personal | Entry (sign-up) | Yes |  |  |  | Yes |  | Implemented | Lab: reproducible |
| EC-TERMS-011 | Terms and consent | Marketing consent withdrawn | P1 | Legal | One tap in Settings. | New person | None | Sign-up consent | Yes |  |  |  | Yes |  | Rule defined |  |
| EC-TERMS-012 | Terms and consent | Analytics consent differs by region | P2 | Legal, Future architecture | Per-region consent config. | New person | None | Sign-up consent |  |  |  | Yes | Yes |  | Needs legal |  |

## 27 Privacy and data rights

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-DATA-001 | Privacy and data rights | Data export | P1 | Legal | Requested from Your data; delivered by email. | Kiran | Personal | Your data | Yes |  |  |  | Yes |  | Implemented | Lab: reproducible |
| EC-DATA-002 | Privacy and data rights | Data correction | P1 | Legal | Profile is editable; credits via correction. | Kiran | Personal | Your data | Yes |  |  |  |  |  | Implemented |  |
| EC-DATA-003 | Privacy and data rights | Deletion request | P0 | Legal | See EC-DEL. | Kiran | Personal | Your data | Yes |  |  |  | Yes |  | Needs legal | Lab: reproducible |
| EC-DATA-004 | Privacy and data rights | Questions about what houses see | P1 | Privacy | Privacy page explains house visibility plainly. | Kiran | Personal | Your data | Yes |  |  |  | Yes |  | Needs legal |  |
| EC-DATA-005 | Privacy and data rights | Pending phone data privacy | P0 | Privacy, Legal | People added by phone who never join: phone kept only for matching, deleted after a set period. | Kiran | Personal | Your data |  |  |  | Yes | Yes |  | Needs legal | Lab: Needs legal rule. |
| EC-DATA-006 | Privacy and data rights | Refuses update but records must remain | P0 | Legal, Record integrity | See EC-TERMS-005. | Kiran | Personal | Your data |  |  |  | Yes | Yes |  | Needs legal |  |

## 28 Account deletion

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-DEL-001 | Account deletion | Cancels during the 30-day period | P0 | Recovery | Signing in restores everything. | Tara | Personal | Your data | Yes | Yes |  | Yes |  |  | Needs UI | Lab: reproducible |
| EC-DEL-002 | Account deletion | Signs in during deactivation | P0 | Recovery | See EC-AUTH-011. | Tara | Personal | Your data | Yes | Yes |  | Yes |  |  | Needs UI | Lab: reproducible |
| EC-DEL-003 | Account deletion | Proposed credits exist | P0 | Record integrity | Unanswered proposals are withdrawn; the house is told the person left. | Tara | Personal | Your data |  |  | Yes | Yes |  |  | Needs UI | Lab: Account deletion has no data model in the prototype; Your data describes the rule. |
| EC-DEL-004 | Account deletion | Accepted credits exist | P0 | Record integrity | See EC-CREDIT-021. | Tara | Personal | Your data |  |  | Yes | Yes | Yes |  | Needs UI | Checks: AC-06 · Lab: Account deletion has no data model in the prototype; Your data describes the rule. |
| EC-DEL-005 | Account deletion | Private project associations exist | P0 | Privacy | Removed. Houses see "Left Ana". | Tara | Personal | Your data |  |  | Yes | Yes |  |  | Needs UI | Lab: Account deletion has no data model in the prototype; Your data describes the rule. |
| EC-DEL-006 | Account deletion | Open Interests | P1 | Data integrity | Withdrawn. | Tara | Personal | Your data |  |  | Yes | Yes |  |  | Needs UI |  |
| EC-DEL-007 | Account deletion | Active conversations | P1 | Privacy | Stay with the other side as "Deleted account". | Tara | Personal | Your data |  |  |  | Yes |  |  | Rule defined |  |
| EC-DEL-008 | Account deletion | Sole organisation owner | P0 | Permission, Record integrity | Blocked until ownership is transferred or Ana takes custody. | Aditi | Personal | Your data | Yes | Yes | Yes | Yes |  |  | Failed | Only houses created in this session count as owned; seeded memberships do not. · Checks: AC-25 · Lab: reproducible |
| EC-DEL-009 | Account deletion | Open moderation case | P1 | Safety | Deletion allowed; case evidence kept for a limited time. | Tara | Personal | Your data |  |  |  | Yes | Yes |  | Needs legal |  |
| EC-DEL-010 | Account deletion | Has reported others | P1 | Privacy | Reports continue anonymously. | Tara | Personal | Your data |  |  |  | Yes |  |  | Rule defined |  |
| EC-DEL-011 | Account deletion | Under investigation | P0 | Safety, Legal | Deletion paused while a safety investigation is open. | Tara | Personal | Your data |  |  |  | Yes | Yes |  | Needs legal | Lab: Account deletion has no data model in the prototype; Your data describes the rule. |
| EC-DEL-012 | Account deletion | Re-registers after deletion | P0 | Identity | See EC-AUTH-012. | Tara | Personal | Your data |  |  | Yes | Yes |  |  | Rule defined | Checks: AC-21 · Lab: Account deletion has no data model in the prototype; Your data describes the rule. |
| EC-DEL-013 | Account deletion | Old profile must not reconnect | P0 | Identity, Record integrity | See EC-AUTH-012. | Tara | Personal | Your data |  |  | Yes | Yes |  |  | Rule defined | Checks: AC-21 · Lab: Account deletion has no data model in the prototype; Your data describes the rule. |
| EC-DEL-014 | Account deletion | Requests name suppression on retained credits | P0 | Legal, Privacy, Record integrity | Legal decides; if granted, the credit stays with "Name withheld". | Tara | Personal | Your data |  |  |  | Yes | Yes |  | Needs legal | Lab: Needs legal rule. |
| EC-DEL-015 | Account deletion | Legal erasure conflicts with record integrity | P0 | Legal, Record integrity | Legal review per request. | Tara | Personal | Your data |  |  |  | Yes | Yes |  | Needs legal | Lab: Needs legal rule. |
| EC-DEL-016 | Account deletion | Deleted member still has organisation access | P0 | Permission, Security | Deactivation removes all memberships immediately. | Tara | Personal | Your data |  |  | Yes | Yes |  |  | Needs UI | Lab: Account deletion has no data model in the prototype; Your data describes the rule. |
| EC-DEL-017 | Account deletion | Pending phone associations remain | P1 | Privacy | Irrelevant once they had an account; removed. | Tara | Personal | Your data |  |  |  | Yes |  |  | Rule defined |  |
| EC-DEL-018 | Account deletion | Compromised account requests deletion | P0 | Security, Record integrity | Deletion needs re-authentication; the grace period protects the real owner. | Tara | Personal | Your data |  |  |  | Yes |  |  | Rule defined | Lab: Account deletion has no data model in the prototype; Your data describes the rule. |

## 29 Organisation closure

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-ORG-001 | Organisation closure | Company closes | P1 | Record integrity | Archive, never delete. Page says "No longer active". | Aditi | Konark Pictures | House settings | Yes |  |  | Yes |  |  | Needs product decision |  |
| EC-ORG-002 | Organisation closure | House leaves Ana | P1 | Record integrity | Same as closure. | Aditi | Konark Pictures | House settings |  |  |  | Yes |  |  | Needs product decision |  |
| EC-ORG-003 | Organisation closure | Public projects remain | P0 | Record integrity | Shared projects and their accepted credits stay public. | Aditi | Konark Pictures | House settings |  |  | Yes | Yes |  |  | Rule defined | Lab: No organisation status model (closed, archived) in the prototype. |
| EC-ORG-004 | Organisation closure | Accepted credits remain | P0 | Record integrity | Yes. | Aditi | Konark Pictures | House settings |  |  | Yes | Yes |  |  | Rule defined | Lab: No organisation status model (closed, archived) in the prototype. |
| EC-ORG-005 | Organisation closure | Active roles | P1 | Data integrity | Closed with a neutral reason. | Aditi | Konark Pictures | House settings |  |  |  | Yes |  |  | Rule defined |  |
| EC-ORG-006 | Organisation closure | Active conversations | P2 | Usability | Read-only. | Aditi | Konark Pictures | House settings |  |  |  | Yes |  |  | Not reviewed |  |
| EC-ORG-007 | Organisation closure | Pending corrections | P1 | Record integrity | Go to support. | Aditi | Konark Pictures | House settings |  |  |  | Yes |  |  | Needs product decision |  |
| EC-ORG-008 | Organisation closure | Multiple authorised members | P2 | Permission | All lose access. | Aditi | Konark Pictures | House settings |  |  |  | Yes |  |  | Rule defined |  |
| EC-ORG-009 | Organisation closure | Owner attempts deletion | P1 | Record integrity | Offered archive instead. | Aditi | Konark Pictures | House settings | Yes |  |  | Yes |  |  | Needs product decision |  |
| EC-ORG-010 | Organisation closure | Company merges | P2 | Record integrity | See EC-HOUSE-009. | Aditi | Konark Pictures | House settings |  |  |  | Yes |  |  | Needs product decision |  |
| EC-ORG-011 | Organisation closure | Rebrand | P1 | Record integrity | See EC-HOUSE-008. | Aditi | Konark Pictures | House settings |  |  |  | Yes |  |  | Needs product decision |  |
| EC-ORG-012 | Organisation closure | Fraudulent house removed | P0 | Trust, Record integrity | Page removed; credits it issued are reviewed one by one, not mass-deleted. | Aditi | Konark Pictures | House settings |  |  |  | Yes | Yes |  | Needs product decision | Lab: No organisation status model (closed, archived) in the prototype. |
| EC-ORG-013 | Organisation closure | Co-productions reference the old organisation | P2 | Record integrity | Name at the time kept. | Aditi | Konark Pictures | House settings |  |  |  | Yes |  |  | Needs product decision |  |

## 30 Media and portfolio

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-MEDIA-001 | Media and portfolio | Unsupported type | P2 | Usability | Refused with supported types listed. | Kiran | Personal | Composer | Yes |  |  |  |  |  | Not reviewed |  |
| EC-MEDIA-002 | Media and portfolio | Oversized upload | P2 | Usability | Refused with the limit. | Kiran | Personal | Composer | Yes |  |  |  |  |  | Not reviewed |  |
| EC-MEDIA-003 | Media and portfolio | Interrupted upload | P1 | Recovery | Upload bar shows failed with Retry and Cancel (draft kept). | Kiran | Personal | Post composer | Yes | Yes |  |  |  |  | Implemented | Lab: reproducible |
| EC-MEDIA-004 | Media and portfolio | Duplicate upload | P2 | Data integrity | Allowed. | Kiran | Personal | Composer |  |  |  | Yes |  |  | Not reviewed |  |
| EC-MEDIA-005 | Media and portfolio | Video too long | P2 | Usability | Limit stated. | Kiran | Personal | Composer | Yes |  |  |  |  |  | Not reviewed |  |
| EC-MEDIA-006 | Media and portfolio | External link breaks | P2 | Recovery | See EC-ONB-014. | Kiran | Personal | Composer | Yes |  |  |  |  |  | Not reviewed |  |
| EC-MEDIA-007 | Media and portfolio | Copyrighted material | P1 | Legal | Takedown process. | Kiran | Personal | Composer |  |  |  | Yes | Yes |  | Needs legal |  |
| EC-MEDIA-008 | Media and portfolio | Watermark | P2 | Usability | Allowed. | Kiran | Personal | Composer |  |  |  | Yes |  |  | Not reviewed |  |
| EC-MEDIA-009 | Media and portfolio | Nudity or graphic filmmaking context | P1 | Safety | Allowed in professional context behind a sensitive-content cover; reportable. | Kiran | Personal | Composer | Yes |  |  | Yes | Yes |  | Needs product decision |  |
| EC-MEDIA-010 | Media and portfolio | Child actor media | P0 | Safety, Legal | Allowed only on project pages issued by the production; not in personal portfolios of others. | Kiran | Personal | Composer |  |  |  | Yes | Yes |  | Needs legal | Lab: Needs legal rule. |
| EC-MEDIA-011 | Media and portfolio | Image reveals a private project | P1 | Privacy | Person's own responsibility; houses can report. | Kiran | Personal | Composer |  |  |  | Yes |  |  | Needs product decision |  |
| EC-MEDIA-012 | Media and portfolio | Moderation false positive | P1 | Trust | Appeal restores. | Kiran | Personal | Composer | Yes |  |  |  |  |  | Rule defined |  |
| EC-MEDIA-013 | Media and portfolio | Missing alt text | P2 | Usability | Optional alt field; fallback description. | Kiran | Personal | Composer | Yes |  |  |  |  |  | Not reviewed |  |
| EC-MEDIA-014 | Media and portfolio | Deleted media still referenced | P2 | Data integrity | Placeholder. | Kiran | Personal | Composer | Yes |  |  |  |  |  | Not reviewed |  |

## 31 Accessibility

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-A11Y-001 | Accessibility | Large text | P1 | Usability | Layouts reflow; nothing clipped. | Kiran | Personal | Any | Yes |  |  |  |  |  | Not reviewed |  |
| EC-A11Y-002 | Accessibility | Screen reader order | P1 | Usability | Logical order; labelled icons. | Kiran | Personal | Any | Yes |  |  |  |  |  | Not reviewed |  |
| EC-A11Y-003 | Accessibility | Focus management in sheets | P1 | Usability | Focus moves into sheets and back. | Kiran | Personal | Any | Yes | Yes |  |  |  |  | Not reviewed |  |
| EC-A11Y-004 | Accessibility | Keyboard navigation in admin | P1 | Usability | All actions reachable by keyboard. | Ana staff | Moderator | Moderation console | Yes | Yes |  |  |  |  | Not reviewed | Lab: reproducible |
| EC-A11Y-005 | Accessibility | Insufficient contrast | P1 | Usability | Meta text meets 4.5:1. | Kiran | Personal | Any | Yes |  |  |  |  |  | Not reviewed |  |
| EC-A11Y-006 | Accessibility | Colour-only status | P1 | Usability | Status always has text or an icon. | Kiran | Personal | Any | Yes |  |  |  |  |  | Not reviewed |  |
| EC-A11Y-007 | Accessibility | Long translated labels | P2 | Usability | Buttons wrap. | Kiran | Personal | Any | Yes |  |  |  |  |  | Not reviewed |  |
| EC-A11Y-008 | Accessibility | Regional-language text | P2 | Usability | Fonts cover Indic scripts. | Kiran | Personal | Any | Yes |  |  |  |  |  | Not reviewed |  |
| EC-A11Y-009 | Accessibility | Very small device | P2 | Usability | 320pt width works. | Kiran | Personal | Any | Yes |  |  |  |  |  | Not reviewed |  |
| EC-A11Y-010 | Accessibility | Tablet | P2 | Usability | Centred column. | Kiran | Personal | Any | Yes |  |  |  |  |  | Not reviewed |  |
| EC-A11Y-011 | Accessibility | Landscape | P2 | Usability | Portrait only at launch. | Kiran | Personal | Any | Yes |  |  |  |  |  | Needs product decision |  |
| EC-A11Y-012 | Accessibility | Dynamic text clips a call to action | P1 | Usability | CTAs grow in height. | Kiran | Personal | Any | Yes |  |  |  |  |  | Not reviewed |  |

## 32 Network and failure

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-NET-001 | Network and failure | Slow network | P1 | Recovery | Skeletons, then content. | Kiran | Personal | Home | Yes | Yes |  |  |  |  | Implemented | Lab: reproducible |
| EC-NET-002 | Network and failure | Offline | P1 | Recovery | Offline banner; cached content; actions wait. | Kiran | Personal | Home | Yes | Yes |  |  |  |  | Implemented | Lab: reproducible |
| EC-NET-003 | Network and failure | Request timeout | P1 | Recovery | Error with Retry; nothing half-done. | Kiran | Personal | Home | Yes | Yes |  |  |  |  | Implemented | Lab: reproducible |
| EC-NET-004 | Network and failure | Succeeds on server, UI thinks it failed | P0 | Data integrity | Retries carry the same key; the server returns the earlier result instead of doing it again. | Kiran | Personal | Home |  |  | Yes | Yes |  |  | Failed | Checks: AC-15, AC-16, AC-13, AC-14 · Lab: Covered by the automated checks. |
| EC-NET-005 | Network and failure | Retry causes a duplicate | P0 | Data integrity | See EC-NET-004. | Kiran | Personal | Home |  |  | Yes |  |  |  | Failed | Checks: AC-15, AC-24 · Lab: Covered by the automated checks. |
| EC-NET-006 | Network and failure | App closes while processing | P1 | Recovery | Server completes or rolls back atomically. | Kiran | Personal | Home |  |  |  | Yes |  |  | Rule defined |  |
| EC-NET-007 | Network and failure | Stale cache | P1 | Data integrity | Privacy-relevant data never served from stale cache. | Kiran | Personal | Home |  |  |  | Yes |  |  | Rule defined |  |
| EC-NET-008 | Network and failure | Attachment fails | P2 | Recovery | See EC-MEDIA-003. | Kiran | Personal | Home | Yes |  |  |  |  |  | Implemented |  |
| EC-NET-009 | Network and failure | Deep link after login | P1 | Usability | Lands on the linked item after sign-in. | Kiran | Personal | Home | Yes |  |  |  |  |  | Not reviewed |  |
| EC-NET-010 | Network and failure | Old client against new model | P1 | Data integrity | Server enforces rules; old clients get a clear upgrade message. | Kiran | Personal | Home |  |  |  | Yes |  |  | Rule defined |  |
| EC-NET-011 | Network and failure | Push opens the wrong context | P0 | Identity | Push carries identity; opening shows which identity it is for (EC-ID-005). | Aditi | Konark Pictures | Notifications sheet | Yes |  |  | Yes |  |  | Rule defined | Lab: reproducible |
| EC-NET-012 | Network and failure | Repeated submit | P0 | Data integrity | Buttons lock while working. | Kiran | Personal | Role page | Yes | Yes | Yes |  |  |  | Implemented | Lab: reproducible |
| EC-NET-013 | Network and failure | Partial save | P1 | Data integrity | Saves are all-or-nothing. | Kiran | Personal | Home |  |  |  | Yes |  |  | Rule defined |  |
| EC-NET-014 | Network and failure | For You fails to load | P1 | Recovery | Inline error with Retry; the rest of Home works. | Kiran | Personal | Home | Yes | Yes |  |  |  |  | Implemented | Lab: reproducible |

## 33 Data integrity

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-INTEG-001 | Data integrity | Accepted credit cannot be erased by removing the association | P0 | Record integrity | See EC-ADD-011. | System | None | Records |  |  | Yes |  |  |  | Passed | Checks: AC-05 · Lab: Covered by the automated check. |
| EC-INTEG-002 | Data integrity | Unaccepted credit never public | P0 | Record integrity, Privacy | See EC-PRIV-004. | System | None | Records |  |  | Yes |  |  |  | Passed | Checks: AC-04 · Lab: Covered by the automated check. |
| EC-INTEG-003 | Data integrity | Every credit points to a real association and project | P0 | Data integrity | No orphans. | System | None | Records |  |  | Yes |  |  |  | Passed | Checks: AC-30 · Lab: Covered by the automated check. |
| EC-INTEG-004 | Data integrity | Audit state differs from visible state | P1 | Data integrity | Visible state is derived from records; audit is append-only. | System | None | Records |  |  |  | Yes |  |  | Rule defined |  |
| EC-INTEG-005 | Data integrity | Notification before transaction completes | P1 | Data integrity | Notifications are written in the same transaction. | System | None | Records |  |  |  | Yes |  |  | Rule defined |  |
| EC-INTEG-006 | Data integrity | Search index stale after privacy change | P0 | Privacy | See EC-SRCH-012. | System | None | Records |  |  | Yes | Yes |  |  | Passed | Checks: AC-01 · Lab: Covered by the automated check. |
| EC-INTEG-007 | Data integrity | Project created twice | P0 | Data integrity | See EC-PROJ-004. | System | None | Records |  |  | Yes |  |  |  | Failed | Checks: AC-15 · Lab: Covered by the automated check. |
| EC-INTEG-008 | Data integrity | Credit accepted twice | P1 | Data integrity | Idempotent. | System | None | Records |  |  | Yes |  |  |  | Implemented |  |

## 34 Concurrency

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-CONC-001 | Concurrency | Two members edit a project | P1 | Data integrity | Last write per field, with a notice when someone else changed it. | System | Two sessions | Records |  |  |  | Yes |  |  | Needs product decision |  |
| EC-CONC-002 | Concurrency | Two members fill the same role | P0 | Data integrity, Record integrity | The second is refused: "Already filled by Aditi". | System | Two sessions | Records |  |  | Yes | Yes |  |  | Needs UI | Lab: Single-session prototype. |
| EC-CONC-003 | Concurrency | Two people issue the same credit | P0 | Record integrity | One open credit per association (EC-CREDIT-006). | System | Two sessions | Records |  |  | Yes |  |  |  | Passed | Checks: AC-16 · Lab: Covered by the automated check. |
| EC-CONC-004 | Concurrency | Project shared while privacy edited | P1 | Privacy | Share rechecks the current state. | System | Two sessions | Records |  |  |  | Yes |  |  | Rule defined |  |
| EC-CONC-005 | Concurrency | Person accepts while production withdraws | P0 | Record integrity | Whichever lands first wins; the other sees the result. | System | Two sessions | Records |  |  | Yes | Yes |  |  | Needs UI | Lab: Withdraw does not exist yet. |
| EC-CONC-006 | Concurrency | Correction while production edits | P1 | Record integrity | Correction attaches to the version it was about. | System | Two sessions | Records |  |  |  | Yes |  |  | Needs product decision |  |
| EC-CONC-007 | Concurrency | Association removed while acceptance processes | P0 | Record integrity | If accepted first, the credit stays (EC-ADD-011). | System | Two sessions | Records |  |  | Yes |  |  |  | Passed | Checks: AC-05 · Lab: Covered by the automated check. |
| EC-CONC-008 | Concurrency | Role closes while Interest submits | P0 | Data integrity | See EC-ROLE-011. | System | Two sessions | Records |  |  | Yes |  |  |  | Failed | Checks: AC-17 · Lab: Covered by the automated check. |
| EC-CONC-009 | Concurrency | Permission revoked mid-request | P0 | Permission | Checked at write time. | System | Two sessions | Records |  |  | Yes |  |  |  | Failed | Checks: AC-11 · Lab: Covered by the automated check. |
| EC-CONC-010 | Concurrency | Verification revoked mid-request | P0 | Trust | Checked at write time. | System | Two sessions | Records |  |  | Yes |  |  |  | Failed | Checks: AC-08, AC-09 · Lab: Covered by the automated checks. |
| EC-CONC-011 | Concurrency | Duplicate API requests | P0 | Data integrity | See EC-NET-004. | System | Two sessions | Records |  |  | Yes | Yes |  |  | Failed | Checks: AC-15 · Lab: Covered by the automated check. |
| EC-CONC-012 | Concurrency | Withdraw or undo races with messaging | P2 | Data integrity | Independent records. | System | Two sessions | Records |  |  |  | Yes |  |  | Rule defined |  |

## 35 Fine Arts future-proofing

| ID | Area | Scenario | Priority | Risk | Expected behaviour | Starting persona | Starting identity | Starting state | Needs UI? | Needs interaction test? | Needs automated test? | Needs backend/business rule? | Needs legal review? | Needs user validation? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EC-ARTS-001 | Fine Arts future-proofing | Person works in Film and Fine Arts | P2 | Future architecture | One person, several domains. Crafts carry a domain. | Future | None | Architecture |  |  |  | Yes |  |  | Needs product decision |  |
| EC-ARTS-002 | Fine Arts future-proofing | Terminology differs | P2 | Future architecture | Labels per domain; one model. | Future | None | Architecture |  |  |  | Yes |  |  | Needs product decision |  |
| EC-ARTS-003 | Fine Arts future-proofing | Project becomes Exhibition or Show | P2 | Future architecture | Project has a type; Exhibition is a type. | Future | None | Architecture |  |  |  | Yes |  |  | Needs product decision |  |
| EC-ARTS-004 | Fine Arts future-proofing | Gallery as organisation | P2 | Future architecture | Organisation has a kind; Gallery is one. | Future | None | Architecture |  |  |  | Yes |  |  | Needs product decision |  |
| EC-ARTS-005 | Fine Arts future-proofing | Artist works independently and with a gallery | P2 | Future architecture | Same as independent and house projects. | Future | None | Architecture |  |  |  | Yes |  |  | Needs product decision |  |
| EC-ARTS-006 | Fine Arts future-proofing | Same work in portfolio and exhibition | P2 | Future architecture, Record integrity | One work record referenced twice. | Future | None | Architecture |  |  |  | Yes |  |  | Needs product decision |  |
| EC-ARTS-007 | Fine Arts future-proofing | Fine Arts may not use film-style credit authority | P1 | Future architecture, Trust | Credit authority is per organisation kind; the model must not assume film. | Future | None | Architecture |  |  |  | Yes |  |  | Needs product decision |  |
| EC-ARTS-008 | Fine Arts future-proofing | Gallery does not own artist identity | P1 | Future architecture, Identity | Same rule as houses: organisations never own people. | Future | None | Architecture |  |  |  | Yes |  |  | Rule defined |  |
| EC-ARTS-009 | Fine Arts future-proofing | Cross-domain discovery becomes noisy | P2 | Future architecture | Domain filter. | Future | None | Architecture |  |  |  | Yes |  |  | Needs product decision |  |
| EC-ARTS-010 | Fine Arts future-proofing | Organisation spans several domains | P2 | Future architecture | Organisation kinds are a set. | Future | None | Architecture |  |  |  | Yes |  |  | Needs product decision |  |
| EC-ARTS-011 | Fine Arts future-proofing | Profile with film credits and art work | P2 | Future architecture | Sections per domain. | Future | None | Architecture | Yes |  |  |  |  |  | Needs product decision |  |
