# Text load

People say the app is "too text heavy". A 23-perspective review (October 2026) found that most of the words left are the ones people decide with: name, craft, city, dates, pay and verified credits. What makes the app feel heavy is:

- the same fact said two to five times on one screen;
- the app explaining its rules every time, not only the first time;
- lists made only of text.

## The rule

> **Words to decide. Pictures to prove. State instead of explanation.**

- **Words to decide:** keep every fact someone needs to choose (who, craft, where, when, how much, verified). Say each one once per screen.
- **Pictures to prove:** a reel frame, a credit poster or a still shows the work; words only claim it.
- **State instead of explanation:** "Interest sent" replaces a paragraph. Explain a rule in full the first time, then one line plus "How it works".
- **Trust copy always stays:** "Art and Artist never charges to apply or audition", "{poster} sees your profile and decides whether to message you", and where credits come from (one tap away).

## Done (step 1 and 2)

**Each fact once**

| Screen | Before | Now |
| --- | --- | --- |
| Role page | Pay in the facts and in the bar | Pay in the bar only. It returns to the facts when the bar shows a state instead ("Interest sent", "Role filled") |
| Role page | "Closes in 4 days" on the photo and "Closes 3 Oct" in the bar | Once, in the bar: "Closes in 4 days" (accent) when 5 days or fewer remain, otherwise "Closes 3 Oct" |
| Role page | "Feature film · Telugu" and a Language fact | The Language fact appears only when the kicker doesn't already name it |
| Role page | "They may ask (optional)" questions, then the same questions in the sheet | Asked once, in the Show interest sheet. Owners and the Respond model still see them on the page |
| Show interest | "(optional)" on every field, the same placeholder under every answer | "Everything below is optional. Paste a link if you have one." once, no repeated placeholder |
| Profile | "ACTING" above "Actor" | The role only, under the name |
| Discover › Opportunities | The city cut to its first word ("Shoot in Araku" showed as "Shoot") | The full city |

**Explain once** (`src/ui/learned.ts`, unit-tested)

What each person has learned is kept per account on this device, so it doesn't come back after a relaunch. On `/test` nothing is stored: every participant starts new.

| Lesson | First time | After |
| --- | --- | --- |
| How interest works | The three steps in full | One line ("{poster} sees your profile and decides whether to message you") plus "How interest works". Learned when interest is first sent |
| Where credits come from | "Issued by productions, confirmed by {name}." plus "How credits work" | "How credits work" only. Learned on the first profile shown (the Profile tab counts only while it's in view) |
| First Home next step | "Later" hid it until relaunch | "Later" is kept for that step |

## Next (not built yet)

3. **Work on People rows:** 2 or 3 stills from verified credits or the portfolio; the production's poster when someone has no stills; credits as an icon plus a number.
4. **Two-line rows:** a title plus one line of facts. Role cards always read City · Pay · Closes. Discover's header and filters down to one band (today 42% of the first screen).
5. **A word budget for the new Home:** about 120 words, enforced by a unit test; reason lines only for relationships.

## Discover opens on Posts

Product decision (October 2026): Discover opens on the Posts grid, with People, Opportunities, Projects and Events beside it. The review advised against it as the default (it adds a tap to finding a person and removes none of the repeated text), so it ships with these conditions:

- **The grid is pictures only.** Posts without a picture or clip stay out of the default grid; searching within Posts still finds them.
- **Same visibility as People search.** The grid shows posts only from people Discover could show anyway: public profiles, nobody blocked either way (`discoverPosts`, checked in AC-12). Children cannot hold accounts at launch.
- **`/test` stays on People**, so the Home comparison changes one thing only.
- **Watch:** time to the first person or role opened from Discover. If it gets slower, People goes back to first.

## How we'll know

- Five or six short calls with people who said "too much text": they mark screenshots green ("helps me decide") and red ("I skip this").
- A first-click test with about 30 people: "You need a cinematographer in Hyderabad, where do you tap?"
- Success: unprompted text complaints drop by about half; finding a person or a role takes no longer; people can still say what the app is for.
