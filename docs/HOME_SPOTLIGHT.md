# Home preview: This week (Spotlight Direction A) and the new section order

Preview only. Open the app with `?preview=home`; the default Home is unchanged. This builds the approved parts of
the Home audit, with Spotlight Direction A (a compact auto-advancing carousel) in place of Direction B.

Review aids, preview only: `?week=1` and `?week=2` limit This week to one or two cards; `?week=noimg` drops the images.

## Order

1. Header: city and notifications.
2. Shortcuts, District style: three large tiles (Opportunities, People, Projects) above two wide ones (Events, Reviews), each in its own soft tint, about 166 px in all.
3. Continue where you left off: a slim row, only for things saved in the last seven days.
4. **This week.**
5. For you, following intent: Opportunities for you, Collaborations and roles, People for your project. For the Network and Exploring intents it shows People to know.
6. Completion prompt, when due.
7. **From your network:** four updates (credits, new projects, availability, collaborations), with See all. When the network is empty, People near you takes this place.
8. Events.
9. **Film talk:** this week's releases with a featured review, plus "Seen *film*? Rate and review" for a film you may review and haven't yet.
10. New work.
11. People near you: a compact rail of up to eight 132 px cards (it was a 610 px grid of four).
12. "You're up to date." The end chips that repeated the shortcuts are gone.

The production-house Home is unchanged.

## This week: what qualifies

Defined in `domain/spotlight.ts` (`notable`, `pickSpotlight(…, 'week')`), with tests.

- **Events** this week:
  - premieres, festivals and screenings
  - anything you are speaking at or hosting
  - anything from someone you follow or have worked with
  - anything with 50 or more people interested
- **Projects:**
  - a stage change in the last three days (Now shooting, Just released)
  - or crewing in your city, but only from someone you know
- **Releases** people are rating.
- **Roles**, only when exceptional: your craft, from someone you know, closing within three days.
- **Posts**, never.

Limits:

- At most five cards, two of a kind, one per organiser.
- What you are part of comes first.
- The list is chosen once a day.
- Items shown here are removed from the sections below.

Every card says why it is there:

- **Chip on the image:** what it is and when ("Screening · Wed, 14 Oct", "Now shooting").
- **Reason line:** why it's here for you ("You're speaking", "Konark Pictures · since yesterday", "★ 4.1 · 9 ratings").
- **Title.**
- **One line of detail:** place and host, open roles, or a line from a review.

## The carousel

`screens/home/WeekSpotlight.tsx` and `styles/home-next.css`.

- **Card:** 16:9, the shape of the app's stills. It is 100% of the section width minus the gutters minus a 28 px peek: 325 × 263 at 393 px, 252 × 248 at 320 px, capped at 420 px wide. The next card shows by 28 px. A single card fills the width, without the peek.
- **Glass:** used only for the label chip and the Save control on the image. Text sits on the card's solid surface.
- **Scrolling is native.** A horizontal scroll-snap rail with `scroll-snap-stop: always`: one card per swipe, momentum and click suppression handled by the browser. It replaces the earlier transform carousel, which tripled the DOM and positioned cards by hand.
- **Loop:** the first card is repeated once after the last. Auto-advance (or a swipe) moves forward onto that copy, and once the rail settles it is moved instantly to the identical first card, so there is no jump and no rewind. Two cards cycle A, B, A, B. One card has no copy, no timer and no indicator.
- **Timer:** 5.2 s per card. It is the CSS animation of the current progress segment; the animation's end advances the rail, so pausing the animation pauses the timer exactly. It only runs while all of these hold:
  - at least 60% of the rail is on screen
  - the page is visible
  - Home is uncovered: no sheet, no pushed screen, Home tab selected
  - nothing inside has keyboard focus
  - nobody is touching it

  It never runs with Reduced Motion, on a low-power device, or after Pause.
- **Touch** holds it. Five quiet seconds after the last touch, it restarts the count from the card you're on.
- **Indicator:** one short segment per card. The current one is wider and fills over the interval; tap a segment to jump. A Pause/Play button sits beside it (WCAG 2.2.2).
- **Keyboard:** the rail is focusable; ← and → move one card. The rail is announced politely only while it isn't moving on its own.
- **Video:** cards don't play video (the earlier Spotlight's autoplaying clip is gone), so nothing can be interrupted.

## Verified

The checks run at 393 × 852, 320 × 640 and 430 × 932, in light and dark, with touch:

- Auto-advance runs 1 → 2 → 3 → 4 → 1, at 5.24, 5.25 and 5.23 s between cards. The loop goes forward onto the copy and resets to 0 without scrolling back.
- A swipe moves exactly one card. Rapid swipes and a direction change settle on a card. Swiping past the last card wraps to the first. A swipe never opens a card, and a tap does.
- It pauses on touch and is still paused 3.5 s later; it resumes after about 5 s.
- It pauses when scrolled away, when the tab is hidden, while focus is inside, while a sheet is open, while a screen covers Home, and after Pause. It resumes when each of those ends.
- With Reduced Motion there is no timer and no movement.
- One card, two cards and missing images (type-set fallback) behave as described above.
- No layout shift (the section stays 365 px tall), no page overflow, and the default Home is unchanged.
