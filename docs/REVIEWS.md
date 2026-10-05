# Film reviews

Reviews by people in the industry, on released films. In both versions of the app (current Home and the District direction).

## Rules (`src/domain/reviews.ts`, tested in `reviews.test.ts`)

| Rule | Detail |
| --- | --- |
| When | Reviews open on the release date the house set (`releaseDate`, India time). Only released, shared films. Before that the film page says "Reviews open Fri, 16 Oct". |
| What | Stars from 0.5 to 5 in half steps, required. Text optional, at most 280 characters. A "Contains spoilers" switch hides the text until tapped. |
| How many | One review per person per film. Saving again edits it and marks it "edited". It can be deleted (with Undo). |
| Who | Anyone acting as themselves. Never people credited on the film (in any credit state), never members of a house that made it, never while acting for a house. |
| Average | Shown only at 5 ratings or more, as "★ 4.3 · 128 ratings", with a breakdown on the film page. Fewer: "Not enough ratings yet". |
| Helpful | Anyone can mark someone else's review with text as helpful. Never on your own. |
| Featured review | The most helpful review with text and no spoiler. If nothing is marked helpful: the longest well-rated (3.5+) one, newest first on a tie. |
| Release week | Friday 00:00 to Thursday, India time. Out this Friday shows films released since the most recent Friday and hides when there are none. |
| Reports | A review can be reported: personal attack or harassment, spoilers not marked, not about the film, fake or paid review, something else. Harassment and fake reviews go to Trust and Safety. |

## Where it shows

| Place | Current version | District version |
| --- | --- | --- |
| Home | "Out this Friday", right after Opportunities: poster, score, featured review. See all opens Reviews. | "Out this Friday" quote cards, See all opens Reviews. The Reviews tile opens the same page. |
| Film page | Reviews section after the production rows: summary, your review or "Rate and review", top three, See all (sort by Most helpful or Newest). | Same. |
| Profile | Reviews section after Verified credits and Showreel: latest three, See all. | Same. |
| Discover › Projects | Stage filter has "Out this week" and "Top rated". Released films with enough ratings show their score. | Same. |
| Reviews page | Out this Friday, Top rated, Recent reviews. | Same. |

Not in the `/test` study Home, so participant sessions stay as designed.

## Data

- `world.reviews` (`src/state/world.ts`), seeded from `src/data/reviews.ts`. Seed times count from each film's release.
- Two films, Dhoop (Blue Lotus) and Ratri (Saffron), are released on the most recent Friday whenever the prototype opens, so Out this Friday always has content. Kaaval releases the Friday after its festival premiere, so its page shows when reviews open.
- Store actions: `saveReview`, `deleteReview`, `toggleHelpful`, `mayReview` (rules enforced in `src/domain/actions.ts`, not only in the screens).

## Open questions

- Whether a production can reply to a review.
- Whether reviews show to people outside Art and Artist (shared links).
- Rating-only entries count toward the average but are not listed; Letterboxd lists them. Keep or change.
