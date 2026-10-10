# District's Home sections, and what each could be on Ana

From Arun's District references (10 October 2026): the screen recordings in `README.md` plus `ref-district-*`. This is a menu of section formats, each matched to Ana content we already have. **Proposal only; nothing is built.** The aim is the one stakeholders named: every section on Home looks different, so the page has rhythm instead of a stack of identical white cards.

## The formats

| # | District section | What makes it work | Ana version | Ana content it uses |
|---|---|---|---|---|
| 1 | **In the spotlight**: tall poster carousel with an offer line under it | One big, image-led moment at the top | **This week** (already this; loses the pause button, gets the Netflix-style rail and colour reflected in the tab bar) | This week items |
| 2 | **Category tiles**: pastel tiles with 3D icons (Dining, Movies, Events…) | Colour and objects, instantly scannable | Our top tiles (Opportunities, People, Projects, Events, Reviews), restyled to match | Existing |
| 3 | **Continue where you left off**: a rail of small cards with "View details" | Picks up intent; small and quick | **Pick up where you left off**: the role you were reading, a half-finished interest, a draft post, a conversation waiting on you | Recently viewed roles, drafts, open conversations |
| 4 | **What's hot**: editorial cards, serif italic headline on a pastel panel, "By District · 207 saves" | Feels written by people, not generated; breaks the sans rhythm | **From Ana**: short guides and stories ("Getting your first verified credit", "Where Hyderabad crews eat near Ramoji"), saved like posts | New editorial content (needs an owner) |
| 5 | **Top movies near you**: 2 × 2 poster grid, title, certificate and language, "41.7k+ are hyped!", a flame button | Posters do the work; a dense, calm grid | **Films releasing near you**, or Film Talk with several films: each poster carries its own state, a "Rate" button if you haven't reviewed it, your stars if you have. **This answers the Film Talk question**: the suggestion moves into each film's card instead of one prompt for one film | Released films, reviews |
| 6 | **Upcoming movies**: dark cards; the centred one **plays its trailer inside the card**; "Releasing on 5 Mar 2027 · 54.8k+ are hyped!" | Motion on Home without a video feed; the rail feels alive | **Coming soon**: projects in post-production or about to release, the centred card plays its trailer muted, with "Releasing 15 Oct" and "6 people you know worked on it" | Projects with trailers (trailer model already built) |
| 7 | **Collection cards** ("Shop in your District"): one card per theme (title in the accent colour, a line under it, a chevron), holding four rows with logo, distance and a benefit tag; cards page sideways | Groups many small items into one tidy object; replaces long lists | **Crews and houses by theme**: "Hiring this week: camera department" with four houses (logo, open roles, distance, Verified); "Gaffers in Hyderabad" with four people (photo, credits, Open to work). Swipe to the next theme | Houses with open roles, people near you |
| 8 | **Artists in your District**: a soft grey-gradient card with the round portrait **breaking out of its top edge**, name, role, three stats with platform icons, next show date, save | The most "designed" card on the page; the portrait gives each card a face | **People near you / from your network**: portrait breaking out of the card, name, craft, three stats (verified credits · years active · projects), and "Open to work from 3 Oct" or "On set: Kaaval" | People, credits, availability |
| 9 | **Event posters**: tall art-forward posters, location pin line, title, dates, save | Event art carries the section | **Events near you** in poster form (the location line above the title, as District does) | Events |
| 10 | **Go out and play**: grey-gradient tiles, each a large 3D object (racket, goggles, football) | The visual-interest section Arun pointed to: soft gradient, big object, breaks the monotony | **Explore by craft**: Cinematography (camera), Sound (boom mic), Lighting (lamp), Editing, Art direction, Costume, each a large craft object on a grey gradient; opens Discover on that craft | Crafts, our craft objects |
| 11 | **Banner** ("Book your salon visit"): a full-width grey gradient with a big 3D object and two lines of text | One loud moment, used once | **One prompt at a time**: "Add your showreel" with a 3D clapper, or "Open to work?" with the availability control; shown only when it applies to you | Profile completion, availability |
| 12 | **Photo cards with a coloured strip** ("Flat 30% off", "Bank benefits") on the image's lower edge | A brand-colour strip makes the useful fact jump out | **Saved roles closing soon**: role cards with a strip "Closes in 2 days" | Saved roles |

Not for Ana: bank offers and paid promotions (no paid features in v1).

## A possible Home order

Alternating big and small, image and text, light and dark, so no two neighbours share a format:

1. Header with tiles (2)
2. This week (1)
3. Pick up where you left off (3), when there is something
4. Opportunities for you, in the role-card format
5. Explore by craft (10)
6. People near you (8)
7. Coming soon with trailers (6)
8. Film Talk as a poster grid with per-film Rate (5)
9. Crews and houses by theme (7)
10. Events near you as posters (9)
11. From Ana editorial (4)
12. New work: replaces the bento (format to choose; options include a two-column masonry of posts, or a single large post per row as on a contact sheet)
13. End of Home: replaces "You're up to date" (for example a prompt from 11, or a last "Explore Discover" tile row)

## Decisions this raises

- **Public counts.** District shows "41.7k+ are hyped!". Ana's rules keep interest private between a person and a house, so a count like "38 people interested" on a role would change that rule. Counts of follows or saves on projects are safer. Needs a decision.
- **Editorial content** (4) needs someone to write it.
- **Autoplaying trailers** (6) need muted playback, a reduced-motion fallback (poster only), and a data-saver rule.
