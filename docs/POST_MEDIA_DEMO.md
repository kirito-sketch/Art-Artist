# Post sizing and demo-content correction

## Reference comparison and cause

The supplied Instagram example shows tall vertical video. The Ana example shows two landscape film stills and an unnecessary "View original" CTA. Ana already had variable-ratio shared PostCard rendering. Its seed distribution, not a single fixed CSS height, made it look landscape-only: most source stills were undelivered and fell back to wide cover files. Several older video-labelled seeds also pointed to JPEG stand-ins.

## Actual asset audit

Audit used the repository asset tree at `6a5f98c`, decoded delivered images and ffprobe of the existing MP4s. No sources were stretched or replaced.

| Existing assets | Measured geometry | Use |
| --- | --- | --- |
| Covers: coastline, home-loan, salt-2 | 500–504 × 276 | Landscape film stills |
| Other covers: neela, backwaters, faultlines, morning-ritual, neon-monsoon, quiet-hours, paper-boats, journalist, salt-water | 500–504 × 215–245 | Landscape; extreme widths remain bounded/Fit |
| People: Sameer, Ishaan, Nandini, Lakshmi, Kiran and other delivered portraits | 480 × 600 | Naturally 4:5 portraits |
| People: Tara, Vikram, Meera | 400 × 500 | Naturally 4:5; Tara production portrait and Vikram boat/working portrait are suitable professional examples |
| QA crop-square / crop-portrait | 600 × 600 / 600 × 750 | Placeholder graphics; excluded from public demo content |
| All six existing MP4s: neela, backwaters, faultlines, kaaval, monsoon, neeliraat | 400 × 500, six seconds | Actual native 4:5 players, not 9:16 footage |

No genuine square professional-work file was found in the delivered content set. Superseded: the square framing of Ishaan's 4:5 portrait was a crop made only for variety, so it was removed; the Post now shows at its natural 4:5 (docs/MEDIA_PROFILE_AUDIT.md). No genuine 9:16 source video was found; the demo keeps the existing native 4:5 clip. The player supports genuine 9:16 source uploads without manufacturing one.

## Shared rules

- Images retain their natural ratio between 3:4 and 2.39:1 (was 1.91:1; see docs/MEDIA_PROFILE_AUDIT.md). Extreme ratios Fit in a bounded frame unless the creator explicitly chooses Fill.
- Normal image maximum height is 1.33 × media width. 4:5 is naturally 1.25 × width.
- Playable videos retain native ratio down to 9:16. An image labelled video but pointing to a JPEG does not get the vertical-player exception.
- Creator-selected Square/Portrait/Landscape still overrides natural framing. A carousel uses its first item or explicit creator selection for one stable frame, with per-slide scoped Fit/Fill/focal metadata.
- Post viewer offers no "View original" or equivalent media-inspection CTA. Creator framing is the viewing composition. The separate Portfolio media viewer is unchanged.
- Author stays outside media; compact Like/Share/Save stays inside; caption and Project attribution stay below. One PostCard is reused by Discover, Profile, Project and Post detail.
- Bento preview framing is independent. No account-following, visibility, ranking, Credit, messaging or other permission rules were changed.

## Seed sequence

The first six media seeds are Devika landscape (`p1`), Sameer portrait (`p-sameer-portrait`), Ishaan square (`p-ishaan-square`), Vikram portrait carousel (`p5`), Ishaan landscape (`p3`), and Vikram native video (`p-vikram-video`). They belong to the default viewer's existing followed people, so the actual default Discover viewer demonstrates this sequence without changing its ranking logic. Existing text/other Posts remain. Tara's additional actor portrait is visible from her Profile and Discover according to existing visibility rules.

The existing IDs and project relationships for `p1`, `p3` and `p5` are preserved. The video poster is one frame extracted from the existing video at 400 × 500, stored as a derivative; the MP4 is unchanged.

## Verification

Build/typecheck and 184 unit tests pass. Real seeded Discover → Post viewer and own/other Profile flows were checked at 393 × 852 and 320 × 568 in light and dark modes. No synthetic media replaced the seed content during these checks.

| Media | Height at 361px media width (393px phone) | Height at 288px width (320px phone) |
| --- | --- | --- |
| Landscape | 203px | 162px |
| 4:5 portrait / portrait carousel / native demo video | 451px | 360px |
| Square | 361px | 288px |

Checks passed for equal media widths, unchanged compact pill dimensions, 44px action targets, caption attachment, no View original CTA, stable three-slide carousel and index, working native video playback, no autoplay, playback/action separation, end-of-feed reachability and no runtime errors. These are browser-emulated phone viewports; no physical phone test is claimed.
