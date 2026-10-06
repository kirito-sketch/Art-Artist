# District Showreel and Portfolio

6 October 2026. This supersedes the external-link-only product model in REVIEW_EVENTS_PROFILE §7 for District. Current and /test keep their prior screens.

## Product decisions

- One optional primary Showreel per person. A source is implementation data; viewers see a 16:9 cover, display title, duration when known and Play showreel.
- Add showreel opens Upload video and Add video link. Do not offer Choose from Ana: existing posts/project media have no usable durable video asset model.
- Supported new links are specific HTTPS YouTube/Vimeo videos. Provider homepages and Drive links are not embedded. Existing demo homepage URLs stay unchanged and display Video link unavailable until replaced.
- Links play inside Ana through supported provider players, with an external fallback after opening the player. Title and cover remain editable. Metadata failure does not invent a title, thumbnail or duration: the user can supply title/cover and embedding remains subject to provider permissions.
- Edit Profile separates Showreel, Portfolio and Featured work. Reels are prominent for relevant crafts and a collapsed optional choice for other crafts. Writers start with Featured work. No asset is mandatory.
- Portfolio retains individual add/remove/reorder/Make cover actions. The first image is the cover. Image-only pickers exclude video items. Existing pickers use prototype media fixtures; image hosting has not been added by this pass.
- Featured work is an ordered selection of owned shared independent projects, accepted credits on shared projects or titled external work links. It creates no credit or project authority. Eligibility is checked again on the public profile; private working titles and unaccepted credits cannot be featured.
- Optional onboarding says Show your work, offers asset actions, and has Skip for now. Source choices appear only inside Add showreel. Completion still accepts any appropriate work asset and retains existing prompt pacing.

## Architecture audit and implemented boundary

`src/state/profile.ts` and `seed.portfolio` hold browser fixture state. There is no durable profile/media database. Supabase's only migration is the research data foundation, which explicitly separates research from prototype content. `api/research.ts` accepts bounded research JSON, not media. No video bucket, signed upload service, transcoder, processing worker, webhook or adaptive delivery service exists.

The implemented native path chooses a real device file, validates it, decodes a browser preview, generates an initial thumbnail and reads actual duration. It stores an explicitly private device preview in `reelDraft`, separate from the current public `reel`. Nothing is uploaded, no upload percentage is simulated, and no draft is exposed to other viewers. As with other prototype profile edits, it survives persona switching in this browser session, not a reload or another device. Failed inspection retains the previous draft, supports choosing another file, and never changes the public reel. Replacing/removing a saved draft releases its object URL; discarded previews are released when the editor unmounts.

Native source contracts include draft, uploading, processing, ready and failed. Progress/error/processing presentation is defined for a future adapter; without that adapter this build intentionally reaches only private preview. A current public reel remains live until a replacement has completed real processing and is deliberately published.

`GET /api/showreel?url=...` performs bounded public oEmbed lookup. It accepts only validated provider URLs, constructs fixed provider endpoints, disallows redirects, times out, caps metadata response size, and returns data rather than provider HTML. The client cancels stale requests and preserves a title the user edits. Vimeo duration is used when returned. YouTube oEmbed does not supply duration; it is omitted rather than guessed. The Vite and Vercel paths share the same handler. Provider embeds are constructed from validated video IDs; no pasted HTML is executed.

## Recommended production pipeline

1. Real authenticated profile ownership, durable Showreel/asset records and authorisation independent of research credentials. Never send research service keys to the media client or reuse researcher/participant identity as content ownership.
2. Managed video ingestion/delivery, such as Cloudflare Stream or Mux, with a server-issued one-time upload URL. Prefer direct resumable transfer for mobile networks. An alternative is private object storage plus an authenticated queue and managed encoder; object storage alone is not the video pipeline.
3. Server validation of file bytes, container, codecs, duration and dimensions. An interrupted upload resumes; retries reuse a draft but cannot publish an unprocessed original.
4. Processing generates mobile/desktop adaptive renditions, duration and thumbnails. Verify signed webhooks, make updates idempotent and use explicit processing/failed states. Never expose a large original as the profile playback URL.
5. Promote a processed replacement atomically. Keep the prior primary reel until ready; delete abandoned originals/assets according to retention policy. Remove and replace require ownership checks.
6. Authorised playback/delivery, cache policy, abuse/rate controls, per-person quota, expired upload cleanup, deletion, consent and observability. Provider embed restrictions and availability remain outside Ana's control.

## Pilot limits and tradeoffs

Proposed product pilot: one primary reel, up to 180 seconds, a 200 MiB exported file, MP4/MOV/WebM, with a 1920 × 1080 envelope including portrait orientation. These are explicit pilot choices, not existing backend limits or a promise of production support. A three-minute reel at roughly 9 Mbps fits within 200 MiB; larger editing masters and 4K exports are not efficient mobile previews. Some MOV/WebM codecs cannot decode in a particular browser; the preview explains how to use an MP4 export.

Production duration controls processed storage, encoding and viewing cost; file size controls transfer time and retry burden. Confirm limits with the selected provider budget and real mobile upload/encode/playback measurements before enabling native publication. Serving 720p/1080p adaptive renditions is preferable to serving the original. Use resumable transfer even below a provider's basic-upload ceiling where mobile connections are unreliable.

Primary references checked: [YouTube iframe player](https://developers.google.com/youtube/iframe_api_reference), [Vimeo oEmbed](https://help.vimeo.com/hc/en-us/articles/12427952430481-Overview-oEmbed), [Cloudflare direct uploads](https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/), [Supabase resumable uploads](https://supabase.com/docs/guides/storage/uploads/resumable-uploads). Provider maximums are not Ana product limits.

## Spotlight reference dependency

The accompanying brief supersedes the earlier first-card-left-grid rule: use a centred active card and symmetric previous/next peeks with stable dimensions, deliberate steps, manual swipe, reduced motion and visibility-aware autoplay. Only the text brief was received; the District recording is missing. Timing has not been observed. A provisional 6-second rest and 600 ms ease-in-out transition is a proposal from the brief, not a measured reference. Spotlight implementation is pending review of that recording; the existing carousel is unchanged in this pass.


## Verification

Both TypeScript configurations, the production build and all 150 unit tests pass. Seven new unit tests cover provider URL validation, bounded metadata lookup, pilot file/metadata limits and Featured work privacy. Browser walkthroughs cover metadata success/failure, title editing during preview preparation, embedded playback, invalid-file retry, native file/thumbnail/duration preview, old reel preservation, private drafts, title/cover edits, image removal/reordering/cover selection, public-project selection, external work, Featured work ordering, discard and reel removal. Optional onboarding completes with Skip, source choices stay inside Add showreel, and Back retains a playable draft. The writer layout starts with Featured work, leaves Showreel optional, and passes dark-theme text/overflow checks. Current and /test retain their presentation. No runtime page errors were observed.

Metadata responses were controlled during browser checks; unit tests exercise the shared server lookup with provider response fixtures. Actual third-party embed permissions and delivery need deployment testing with a real allowed video. Local image binaries are unavailable; existing remote artwork is preserved. The existing edge suite's ten baseline failures are documented in DISTRICT_HOUSE.md and were not changed by this work.
