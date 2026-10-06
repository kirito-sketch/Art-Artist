# District production houses

## Direction

Approved on 6 October 2026: keep Ana's District visual language and organise the house experience around its projects, roles, people and professional records. Current and /test retain their existing screens and rules.

## Screen plan

| House job | Screen | District change | Keep |
| --- | --- | --- | --- |
| Decide what needs attention | Home | At most three actionable records, then equal-sized project cards, open roles, people for roles, hosted events and released films | Slate, existing project stages |
| Find people | Discover | People by default, an optional own-role filter, taxonomy matching, availability and verified-credit filters | Search scope, per-type filters, personal Saved |
| Present the house | House profile | Work-first artwork rails, announced projects, open roles, accepted-credit collaborators, events and film scores | Member/visitor actions and public visibility |
| Run a project | Private workspace | Project artwork, concise visibility, roles and people before secondary details; credits in their own section | Existing permissions and records |
| Recruit | Role and Interest review | District spacing, concise contextual rows and clearly grouped review states | New, In conversation, Not now, No longer interested |
| Record who worked | Association and credit flows | Private association clearly separated from the credit preview and correction/amendment actions | Production-issued credits, acceptance and history |
| Publish | Share preview, public project, event | Public preview, short privacy summary, common District page anatomy | Deliberate announcement, accepted credits only, free events |
| Manage identity | Setup, verification, settings, identity switch, Inbox | Common surfaces and spacing, explicit house identity | Membership, credit authority, messaging and theme system |

## Decisions and conflicts

- The handoff's shortlist/decline language conflicts with the frozen Interest model. Preserve its existing review states; introduce no shortlist, hired or rejected status.
- A pending acceptance or a person without a credit is not automatically an urgent task. Needs you includes corrections, amendments, flagged associations, new unreviewed Interest and roles closing soon. Prepared credits stay in the workspace, with Issue available only to an authorised issuer.
- Use equal-sized project cards rather than a large lead card and smaller projects, consistent with the earlier project-card feedback.
- Operational See all opens the complete owned list. Public discovery See all opens the relevant Discover chip; owned roles must not lead to other houses' opportunities.
- No scheduling, payroll, task lists, bulk credits or new permission model. No matching percentages. New Interest means the existing unreviewed state, not an invented last-visit timestamp.
- Private role needs may also inform people matching without disclosing those roles publicly.
- Missing artwork and release dates stay in project details rather than becoming Home tasks.

## Validation

Check Konark and Tidewater at 390 px in light and dark; new/quiet/unverified houses; private and public projects; roles and Interest through messaging/filling; private associations, credit preparation/proposal/correction/amendment; announcement, event publishing and identity switching. Check Current and /test isolation. Run unit tests, both TypeScript configurations, Vite build and the existing edge suite.


## Completed implementation and checks

- District house Home and Discover, owned lists, work-first house profile, private project workspace, role and Interest review, association and credit surfaces, announcement preview, public project, events, Inbox, identity and settings presentation are implemented. Studio Compare includes Konark and Tidewater.
- Both TypeScript configurations and the Vite production build pass. The build retains the existing large-chunk warning.
- All 143 unit tests pass, including six tests for actionable house records and taxonomy matching.
- Browser walkthroughs cover house discovery, direct correction navigation, Interest to conversation, project creation, public role disclosure, private association, announcement and public title/privacy boundaries, credit proposal and acceptance, amendment and revision acceptance, role editing/filling, free event publishing, quiet/unverified houses and identity/theme settings.
- At 320, 390 and 430 px, project rails have a 20 px first/last card inset, native snap and no horizontal page overflow. Current house Home/Discover, individual District Home and /test isolation pass. No browser runtime errors were observed.
- The existing edge suite remains at 23 pass, 10 baseline failures and four scenarios without a model. This UI work does not change those frozen domain flows.
- Artwork binaries are unavailable in the reconstructed local checkout. Layout and interactions were checked with their existing media dimensions; image assets are preserved in the remote repository. Final artwork composition should be reviewed in the deployed prototype.
