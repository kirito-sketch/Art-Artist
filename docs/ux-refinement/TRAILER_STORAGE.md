# Trailer storage proposal (D6)

**Status:** proposal for approval. Nothing here is paid for or set up.

**Where things stand.** Trailers can be added in the house workspace, but each file stays a `blob:` URL in the browser tab that chose it. They are labelled "this session only" in the workspace and on the public page, and they disappear on reload.

To make trailers real, the prototype needs storage, playback, permissions and encoding. Below are the three smallest options that fit the existing stack. The research study already uses Supabase.

## What any option must do

- **Accept uploads from a house member only.** The server checks the acting identity and verified-house status; the client checks in `domain/trailers.ts` are advisory.
- **Keep drafts private.** Only `published` versions of a shared project are readable by others; draft files are never publicly addressable.
- **Store per version:** project, language, kind (trailer or teaser), status, poster frame, duration and dimensions. This is the `Trailer` shape in `state/world.ts`.
- **Play muted inline on phones** (H.264 MP4 at minimum, `playsInline`), and support seeking for the language switch, which keeps your place.
- **Limits:** 500 MB, 5 minutes and 1080p per file. These match the client-side rules.

## Options

| | A. Supabase Storage + client MP4 | B. Cloudflare R2 + Stream | C. Hosted video link (YouTube or Vimeo, unlisted) |
|---|---|---|---|
| Upload | Resumable (TUS) upload to a private bucket; signed URLs for published files | Direct creator upload to Stream; R2 not needed for video | The house pastes a link; nothing is uploaded |
| Encoding | None: the house must upload a web-ready MP4 (H.264/AAC). Validate codec on upload | Automatic HLS ladder, poster frames | Done by the host |
| Playback | Native `<video>` (our player as built) | HLS: needs hls.js on Android/desktop Chrome; native on iOS | Iframe embed: muted autoplay works, but the controls and branding are the host's, and our minimal player and language switch can't keep place across embeds |
| Permissions | Row-level security on a `trailers` table plus storage policies (drafts private) | Signed playback tokens for drafts; public for published | "Unlisted" only. Anyone with the link can watch drafts |
| Cost at prototype scale | Within the free tier (1 GB storage, 2 GB egress/month); then about $25/month (Pro) | About $5 per 1,000 minutes stored, plus $1 per 1,000 minutes delivered; usage-based from day one | Free |
| Effort | Small: one bucket, one table, two policies, an upload step in `TrailerManager` | Medium: Stream API, webhook for ready state, hls.js | Smallest, but a different player experience |
| Risk | Large files over mobile networks; no adaptive bitrate | A new vendor and billing | Weak privacy for drafts; host ads and branding; breaks "one video at a time" control |

## Recommendation

**A, Supabase Storage**, for the prototype and the study period:

- It reuses the existing Supabase project and auth.
- It keeps our player and the D2 interaction rules intact.
- It stays inside the free tier for a handful of houses.

Move to **B** when trailers become a core public feature and adaptive streaming matters (slow networks, long trailers).

Keep **C** as a fallback: the house can paste a link if they already host the trailer. `Showreel.tsx` already handles YouTube and Vimeo embeds.

## Approval needed

1. Use the existing Supabase project for a `trailers` bucket. This stays within the free tier; no paid plan without approval.
2. Accept that houses upload a web-ready MP4 (no server-side encoding) until option B is approved.

After approval:
- Replace `previewTrailer`'s `blob:` URL with an upload step that has real progress and retry.
- Store the row.
- Drop the `temporary` flag on saved versions.
