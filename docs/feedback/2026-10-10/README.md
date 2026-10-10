# Stakeholder feedback, 10 October 2026

Collected by Arun after the client review. Recorded as said, with our reading of each point. **Nothing here is decided or built yet**; the next step is to agree what to change.

## Feedback

### Home

| # | They said | Our reading |
|---|---|---|
| 1 | Remove the spotlight (This week) pause and play buttons | Remove the button under the This week carousel. It exists for WCAG 2.2.2 (moving content must be stoppable), so the carousel should then stop auto-advancing and move only when swiped |
| 2 | Film Talk shows one film and a small suggestion. If the signed-in person has reviewed the film, hide the suggestion; if not, show it | Add the rule. The "Seen it? Rate and review" prompt only appears for films the person hasn't reviewed |
| 3 | Only one film is shown now; think about how it works with several films and how suggestions behave then | Open design question: with several films the single prompt doesn't fit. Options to compare (a prompt per unreviewed film, or one prompt for the most likely film) |
| 4 | New work (the bento grid) isn't working; find another way to show it | Replace the 3-post mosaic with a different representation; needs options |
| 5 | "You're up to date" at the end of Home isn't needed; maybe something else | Replace the end of Home with something useful, or nothing |
| 6 | Sections look plain; treat each section differently, like District does | Give Home rhythm: sections differ in surface, layout, header and scale (District by Zomato as the model) |

### Everywhere

| # | They said | Our reading |
|---|---|---|
| 7 | Headings, text and typography feel too big; see what sizes other apps use and correct it | Benchmark type scales from reference apps and reduce ours (today: 34 px titles, 62 sizes in use; `docs/premium/VISUAL_MATERIALS.md`) |
| 8 | The white of the cards, on Home and elsewhere, isn't sitting right | Rethink the card surface (colour, edge, shadow, or no card) against the page ground |
| 9 | The teal-green brand colour isn't working; find another | New brand and action colour. System-wide: buttons, Follow, Save, tab bar, + button, links. Needs options shown on real screens |

### Discover

| # | They said | Our reading |
|---|---|---|
| 10 | Consider Airbnb's embossed, 3D tabs for Discover | Try tactile, 3D-rendered icons for Discover's category tabs (Posts, People, Opportunities, Projects, Events, Reviews) |

### Profiles

| # | They said | Our reading |
|---|---|---|
| 11 | Own profile: as you scroll, it becomes text-heavy and doesn't look good | Lower sections need visual structure and imagery, not runs of text |
| 12 | Other people's profiles look extremely empty. They should show what your own profile shows; the only difference is Edit on yours and Follow on theirs | Parity of public content between own and others' profiles. Private-by-design items (pending credits, Projects you're on, private tools) stay owner-only |

### Sharing (from the WhatsApp reference)

| # | They said | Our reading |
|---|---|---|
| 13 | Work and profile sharing have no in-app sharing to connections (they go straight to the phone's share sheet). This week has in-app sharing but not outside sharing | Make every Share the same: send to people on Ana **and** share outside (phone share sheet, copy link). Confirmed in code: posts and profiles call the phone share sheet directly; items without a link (This week, events, roles, projects, houses) show recent people but "Share outside" only shows a placeholder message; sending to a person doesn't create a message |

## References

| File | What it is | What we take from it |
|---|---|---|
| `ref-share-whatsapp.webp` | Sai Charan's WhatsApp message with a screen recording: sharing a post opens only the iOS share sheet | Point 13 above |
| `ref-flow-home.png` | Home screen of Flow (Wispr Flow) | Typography: a serif display heading at a modest size with a small sans line under it; body and labels small and quiet. Surfaces: a soft lilac-grey ground, white cards with large radii and a very soft shadow, so cards float gently instead of sitting as hard white blocks. Tactility: the app icons sit in **embossed, raised discs** (the soft 3D feel they mean in point 10). Tab bar: floating pill, selected tab in a tonal capsule, quiet icons |
| `ref-wabi-onboarding-frames.jpg` (from a Mobbin screen recording) | Wabi's welcome and sign-in | The welcome builds itself: starts on "Meet Wabi." with a single + button; glossy circular images bubble up out of the +, the headline completes line by line, then the Google and Apple buttons fade in. A second screen ("A new era of software is here") has a glowing orb and "Swipe up to enter". A strong model for Ana's welcome (crafts and work flowing out of the + that later becomes Create), and for the premium entrance |

## Not yet asked

- What the Flow and Wabi references are meant for exactly (our reading above is an assumption).
- Any brand-colour direction they already like.
