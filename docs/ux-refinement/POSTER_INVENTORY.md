# Poster inventory

Verified credits and a house's "Made by us" show each film as a 2:3 theatrical poster (`src/ui/PosterCard.tsx`, decision D4). Six posters are supplied (2026-10-08) and live in `public/images/posters/`. Any other film shows the **type-set poster**: the title in the display face on a deep ground, with the production and year.

**Prototype posters.** The product owner approved generated posters for these fictional films on 2026-10-08. The prompts are in `POSTER_PROMPTS.md`.

**Rules (D4)**

- Use only the production's own poster.
- Never crop a still into a poster, and never present generated art as an official poster.
- The four `posters/…` paths in `src/data/works.ts` are placeholders that point at stills; they are not posters.

**How to add a poster**

1. Save the production's poster as `public/images/posters/<project id>.jpg`. It should be 2:3 and at least 600 × 900 px.
2. Add the project id to `SUPPLIED` in `src/data/posters.ts`.

The card switches automatically, and its `data-poster` attribute changes from `typeset` to `supplied`.

## Supplied (2026-10-08)

All six posters are in. They were cut from one contact sheet, so each is 334 × 501 px and slightly cropped at the sides to reach 2:3:

- Neeli Raat loses part of the nurse's shoulder.
- Dhoop loses the lighthouse at the right edge.

Sharper, full-frame originals (600 × 900 or larger) can be dropped in over the same files.

## Originally needed

These projects are public and appear as poster cards: in a verified credit, or in "Made by us" once released.

| Priority | Project id | Title | Year | Production | Format | Where it shows | Credited people |
|---|---|---|---|---|---|---|---|
| 1 | `faultlines` | Fault Lines · S1 | 2024 | Blue Lotus Originals | Web series · Hindi | Credits on 9 profiles; Blue Lotus "Made by us" | Kiran Varma, Tara Menon, Vikram Sen, Sana Mirza, Raghu Teja, Priya Raghavan, Dev Malhotra, Anvi Reddy, Sai Teja |
| 1 | `neeliraat` | Neeli Raat | 2023 | Konark Pictures | Feature film · Telugu | Credits on 8 profiles; Konark "Made by us" | Kiran Varma, Aditi Ghosh, Arjun Rao, Ishaan Bose, Farhan Qureshi, Raghu Teja, Zoya Khan, Lakshmi Pillai |
| 1 | `monsoon` | Monsoon Letters | 2025 | Tidewater Films | Feature film · Malayalam | Credits on 6 profiles; Tidewater "Made by us" | Kiran Varma, Aditi Ghosh, Meera Krishnan, Vikram Sen, Devika Sharma, Lakshmi Pillai |
| 1 | `kaaval` | Kaaval | 2026 | Saffron Reel Studios | Feature film · Tamil | Credits on 5 profiles (post-production) | Kiran Varma, Rhea Kapoor, Sameer Ali, Nandini Rao, Kabir Nair |
| 2 | `ratri` | Ratri | 2026 | Saffron Reel Studios | Feature film · Telugu | Credits on 2 profiles; Saffron "Made by us" | Raghu Teja, Priya Raghavan |
| 2 | `dhoop` | Dhoop | 2026 | Blue Lotus Originals | Feature film · Hindi | Credits on 2 profiles; Blue Lotus "Made by us" | Devika Sharma, Farhan Qureshi |

**Priority.** Priority 1 is the films seen on the most profiles, including the study profiles: Kiran, Tara, Vikram and Anvi. Priority 2 is the rest.

## Later

| Project id | Title | Year | Production | Stage | Note |
|---|---|---|---|---|---|
| `neela` | Neela Akasham | 2027 | Konark Pictures | Pre-production | Not a poster card yet: no public credits, not released |
| `backwaters` | Backwaters | 2027 | Tidewater Films | Development | Same |
| `salt` | Salt | 2022 | Independent | Released | Independent projects stay as rows with the owner's still; a poster is optional |
| `chairain` | Chai & Rain | 2021 | Independent | Released | Music video; a poster is optional |
| `tworooms` | Two Rooms | 2023 | Independent | Released | Theatre; a play poster is optional |

The list was generated from `world.projects` (shared projects) and `publicCreditsFor` on 2026-10-08. Regenerate it when projects change.
