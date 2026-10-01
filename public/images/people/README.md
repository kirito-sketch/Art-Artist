# Person photos (prototype fixtures)

`{personId}.jpg` is that person's canonical profile photo. A seeded person gets a photo only when their
id is listed in `PHOTO_FIXTURES` (`src/data/seed.ts`); everyone else falls back to initials. Omar Sheikh
is left without a photo on purpose so the fallback is always visible in the demo.

These are prototype fixtures only, to be replaced by commissioned portraits:

- **tara, meera, vikram:** cropped from the project's own generated, fictional stills (docs/IMAGE_PROMPTS.md).
- **Everyone else:** stock portraits from Unsplash (Unsplash License: free to use, no attribution
  required), cropped to 480x600 around the face. The people pictured are models, not the fictional
  personas, and must not ship in production.

| id | Unsplash photo |
|---|---|
| aditi | photo-1592621385612-4d7129426394 |
| anvi | photo-1567532939604-b6b5b0db2604 |
| arjun | photo-1629425733761-caae3b5f2e50 |
| dev | photo-1620122830785-a18b43585b44 |
| devika | photo-1607746882042-944635dfe10e |
| farhan | photo-1610088441520-4352457e7095 |
| ishaan | photo-1654110455429-cf322b40a906 |
| kabir | photo-1645830166230-187caf791b90 |
| kiran | photo-1625504615927-c14f4f309b63 |
| lakshmi | photo-1488426862026-3ee34a7d66df |
| nandini | photo-1606122017369-d782bbb78f32 |
| nikhil | photo-1595152772835-219674b2a8a6 |
| priya | photo-1618835962148-cf177563c6c0 |
| raghu | photo-1624561172888-ac93c696e10c |
| rhea | photo-1531746020798-e6953c6e8e04 |
| sameer | photo-1557862921-37829c790f19 |
| sana | photo-1605993439219-9d09d2020fa5 |
| teja | photo-1500648767791-00dcc994a43e |
| zoya | photo-1609505848912-b7c3b8b4beda |

People created in onboarding use the photo they pick there.
