# 7. Open decisions from the edge cases

The edge-case catalogue (`docs/EDGE_CASE_MATRIX.md`, 520 cases, re-run on 9 October 2026) has a proposed answer for every case. **118 are waiting for a product decision** and **29 for legal review**. They condense into the 13 themes below. Each theme has the proposed answer already written in the catalogue; the client approves the theme, not 118 rows.

| # | Theme | Cases | Proposed answer (from the catalogue) | Examples |
|---|---|---|---|---|
| 1 | **One person, one account** | 11 (5 urgent) | Never merge accounts automatically. A person proves they own the existing account before another sign-in method is linked. Merges of two accounts are support-reviewed. Invites only work for the address or phone they were sent to | Google email matches an email account · invite forwarded to the wrong person · lost access to email · recycled phone number |
| 2 | **When a house loses trust** | 11 (9 urgent) | New public roles and credits stop; open roles close with a neutral reason; credits already accepted stay on the films; credits from a fraudulent issuer are hidden pending review, never mass-deleted | Verification revoked · house suspended · fraudulent house removed |
| 3 | **When a house changes** | 13 | Archive, never delete. A rename shows the new name with "formerly" on old credits. A house with no owners is held by Ana support. Merges are support-led | Company closes · rebrand · owner leaves · merger |
| 4 | **Co-productions** | 7 | One project record per film; the second house joins as co-producer. Only the lead production issues credits at launch; disputes go to support | Two houses create the same film · co-producer disputes credit authority |
| 5 | **Credit corner cases** | 9 | Undo for a few seconds after accepting · reminders when a correction stalls (7 and 21 days) · a person can hide a credit from their profile while the film keeps it · after 14 days of an ignored correction the person can remove themselves | Accepted by accident · house ignores a correction · two credits on one film |
| 6 | **Project changes** | 10 | Cancelled projects keep accepted credits · unsharing hides the page but credits stay on profiles · a title change carries over to credits · wrong-house projects are deleted before sharing or moved by support after | Cancelled after going public · wrong house created it |
| 7 | **Privacy in notifications** | 3 (all urgent) | Push text for a private project names only the house ("a Konark Pictures project"); the title shows only inside the app | Lock-screen shows a confidential title |
| 8 | **Interest at volume** | 15 | The house sees the person's live profile; answers are a snapshot. Sort by match, then time. Still no applicant tracking | 100+ responses · profile changes after interest |
| 9 | **People not on Ana yet** | 6 (3 urgent) | Invite texts name only the house. A pending record links to an account only after the person confirms project and role. "Not me" stops it | Wrong phone number · wrong account linked |
| 10 | **Independent projects** | 8 | No trusted credit authority at launch. People added are told privately and can remove themselves. A house can later adopt the project | Several creators dispute ownership · house claims the same project |
| 11 | **Moderation operations** | 9 (5 urgent) | High-impact actions need a senior moderator · every action logged and reversible · moderators see only what the reporter could see · repeated bad-faith reports carry less weight | Wrong account suspended · compromised admin |
| 12 | **Content and profile policies** | 6 | Nudity or graphic work allowed in professional context behind a sensitive-content cover · availability older than 60 days asks to confirm · one base city plus "will travel" · portrait-only at launch | Graphic filmmaking stills · stale availability |
| 13 | **Fine arts readiness** | 10 | Keep the model general: crafts carry a domain, organisations have kinds (gallery), projects have types (exhibition). No fine-arts screens yet | Person works in film and fine arts |

**Urgent** = priority P0 in the catalogue (could cause harm, fraud or a privacy breach if wrong).

## Legal review (29 cases)

Age and eligibility (6) · account deletion and what happens to credits (4) · privacy and data rights (4) · moderation and suspension notices (3) · terms and consent wording (2) · report and block (2) · media rights (2) · people not on Ana (2) · others (4). These need the lawyer named in brief item C2.

## For the developers, not the client: rules the real backend must enforce

The re-run found **10 automated checks failing**. They aren't new bugs in the design. The prototype hides the button on screen but the underlying action doesn't check the rule. In the real app these checks belong on the server:

| Check | Rule the server must enforce |
|---|---|
| AC-07 | Only an authorised house issuer can create a credit |
| AC-08, AC-09 | An unverified house can't issue credits or publish public roles |
| AC-11 | A person removed from a house can't act for it |
| AC-15 | Retrying a create never makes a duplicate |
| AC-17 | Closed or filled roles can't receive interest |
| AC-18 | A filled role can't be reopened |
| AC-22, AC-23 | House actions need the house identity; personal actions need the personal identity |
| AC-24 | One event produces one notification, even after a retry |

Four more checks (account deletion and sole house owners, among others) have no model yet.

**For approval on Sunday:** the 13 themes, by agreeing or changing each proposed answer. Themes 1, 2, 7, 9 and 11 contain the urgent cases and matter most.
