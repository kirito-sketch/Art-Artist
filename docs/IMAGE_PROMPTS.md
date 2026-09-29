# Ana v2 · image brief

Every image the v2 prototype needs, with a ready-to-paste prompt for each. The prototype stays neutral and
light, so the photography does all the emotional work. It has to look like **one production company shot
all of it**.

## Status

- **Delivered:** all 12 opportunity covers (one 3 × 4 sheet). Already in the app.
- **Next, in order of visual impact.** Generate each as **one grid image** exactly like the covers sheet
  (thin white gutters, no text, equal cells, filled row by row), then drop it in `design/sheets/` with the
  file name shown, or attach it in chat:

| Sheet file | Grid | Cells, row by row | Style |
| --- | --- | --- | --- |
| `people-1.png` | 3 × 3 square | kiran, tara, meera, arjun, rhea, vikram, devika, sameer, kabir | B |
| `people-2.png` | 3 × 3 square | nikhil, priya, omar, lakshmi, ishaan, nandini, sana, raghu, zoya | B |
| `posters.png` | 2 × 2 portrait | kaaval, monsoon-letters, fault-lines, neeli-raat | A |
| `stills-1.png` | 2 × 2 | reel-kiran, kiran-neeli-raat, kiran-monsoon-letters, kiran-fault-lines | A |
| `stills-2.png` | 2 × 2 | kiran-salt, kiran-kaaval-desert, reel-tara, tara-stage | A |
| `stills-3.png` | 2 × 2 | nandini-kaaval, sameer-charminar, devika-rushikonda, ishaan-set-1 | A |

Prompt for a sheet: paste the style block, then *"A grid of N separate photographs, equal cells, thin
white gutters, no text or numbers. Row by row:"* followed by the descriptions below for each cell in
order. Headshots are the biggest visible gain: every avatar in the app is currently a monogram.

Until a file exists, the app shows a related cover in its place, so nothing looks broken meanwhile.

---

## How to deliver

1. Generate each image with the prompt below. **Paste the matching style block first**, then the image prompt.
2. Save it with the **exact file name** shown (lowercase, `.png` or `.jpg` are both fine; any size of
   1024px or larger).
3. Upload to the repo on branch `claude/ana-product-strategy-in22y2`, folder `public/images/`, keeping the
   subfolders (`covers/`, `people/`, `posters/`, `stills/`). On GitHub: open the branch, **Add file → Upload
   files**, and drag in each subfolder.
   *Alternative:* zip the `images` folder and attach it in this chat.
4. Tell me when **Tier 1** is up. I can build with Tier 1 alone; Tier 2 slots in later by file name with no
   code changes.

If an image comes out wrong (text on it, extra fingers, a logo), regenerate it rather than keeping it. I
will look at every file before using it.

---

## Style blocks (paste one before each prompt)

### A · Scene style (covers, stills, posters, posts)
> Photograph, not illustration. Shot on a cinema camera with anamorphic-feeling lenses, natural motivated
> light, gentle film grain, true-to-life skin tones, slightly muted colour grade in the style of Kodak Vision3
> film stock. Contemporary Indian film industry, real locations in India, people of South Asian descent,
> realistic clothing and equipment. Candid and observational, never posed for the camera. Clean composition
> with breathing room. **No text, no letters, no logos, no watermarks, no borders, no frames.**

### B · Portrait style (everyone in `people/`)
> Head-and-shoulders portrait photograph, eye level, subject centred and looking at or near the camera,
> relaxed natural expression. Soft window light from the left, shallow depth of field, plain softly
> out-of-focus background in a light neutral grey-beige. Real skin texture, no retouching, no makeup glam.
> Everyday clothes a film professional would wear to work. Square 1:1 frame. **No text, no logos, no
> watermarks, no jewellery-heavy styling.**

All people are fictional adults. Do not ask for, or accept, a likeness of any real person.

---

## Tier 1 · needed to start (31 images)

### Opportunity covers · `covers/` · landscape 3:2 · style A
Shown on For You cards, Discover rows and at the top of each role. Keep the subject in the middle third;
I crop to 4:3 and 16:9.

| File | Prompt |
| --- | --- |
| `covers/neela.jpg` | A small film crew on a misty hillside in the Araku valley at golden hour, a cinema camera on a tripod in the foreground, a director pointing toward terraced coffee plantations, low clouds in the valley below. |
| `covers/quiet-hours.jpg` | Two teenage-looking young women (adults, early 20s) sitting on a sea wall in Visakhapatnam at dusk, seen from behind, the Bay of Bengal calm and pink, a small handheld camera rig just visible at the frame edge. |
| `covers/faultlines.jpg` | A night street in Mumbai after rain, sodium-vapour light reflecting on wet tarmac, a car rig with a camera mounted on the door, crew in dark clothes waiting under a flyover. |
| `covers/morning-ritual.jpg` | A bright studio tabletop set for a tea commercial: a steaming glass of chai on a wooden table, soft backlight catching the steam, a high-speed camera on a slider out of focus in the foreground. |
| `covers/neon-monsoon.jpg` | An indie band performing in heavy artificial rain at night, magenta and cyan practical neon tubes behind them, rain towers visible, a camera operator in a rain cover in silhouette. |
| `covers/backwaters.jpg` | A wooden boat under construction on the bank of a Kerala backwater at early morning, a boat-builder working with hand tools, mist on the water, a documentary camera operator on the bank. |
| `covers/paper-boats.jpg` | A woman in her early 30s in a simple cotton kurta standing at a Mumbai local train window during monsoon, rain streaks on the glass, looking out, lit by soft grey daylight. |
| `covers/journalist.jpg` | A woman in her late 20s with a notebook and a canvas bag walking along a red-earth road through a hill village at dawn, mist behind her, seen in a wide shot. |
| `covers/salt-water.jpg` | Two friends in their early 20s running into the sea at Rushikonda beach at sunset, splashes in warm backlight, shot from low on the sand. |
| `covers/home-loan.jpg` | A warm, bright middle-class apartment kitchen in the morning, a man in his 30s pouring tea at the counter, sunlight through a window with plants, a small film light on a stand at the edge of frame. (No children in the frame.) |
| `covers/coastline.jpg` | A lighting crew setting up a large diffusion frame on a beach in Alibaug at late afternoon, a gaffer adjusting a light on a stand, the sea behind. |
| `covers/salt-2.jpg` | A night road in Hyderabad's old city, a first assistant camera pulling focus on a handheld camera from the passenger seat of a moving auto-rickshaw, streetlights streaking past. |

### Posters · `posters/` · portrait 2:3 · style A
Key art for official credits. **No title text**: I set the titles in the app so they are consistent.

| File | Prompt |
| --- | --- |
| `posters/kaaval.jpg` | Key art for a period drama set in 1940s Rajasthan: a woman in a hand-dyed indigo odhni standing in a sandstone doorway, harsh afternoon light, dust in the air, strong negative space in the top third. |
| `posters/monsoon-letters.jpg` | Key art for a quiet Malayalam drama: an elderly postman on a bicycle on a narrow road between flooded paddy fields in heavy rain, holding an umbrella, cool green-grey tones, lots of sky. |
| `posters/fault-lines.jpg` | Key art for a Hindi crime series: a police inspector in plain clothes standing in a dark corridor of an old Mumbai police station, a ceiling fan above, a single hard light from a doorway. |
| `posters/neeli-raat.jpg` | Key art for a Telugu night thriller: a lone figure on an empty highway at night under a single streetlight, deep blue night sky, headlights approaching in the far distance. |

### People · `people/` · square 1:1 · style B
Used as avatars everywhere, so **consistency matters more than drama**: same framing, same light, same
background tone across the set.

| File | Person |
| --- | --- |
| `people/kiran.jpg` | **Kiran Varma**, man, late 30s, Director of Photography from Hyderabad. Short hair with some grey, trimmed beard, olive overshirt over a grey T-shirt, calm and observant. |
| `people/tara.jpg` | **Tara Menon**, woman, late 20s, actor from Mumbai with Malayali roots. Shoulder-length wavy hair, no-makeup look, plain white shirt, warm half-smile. |
| `people/meera.jpg` | **Meera Krishnan**, woman, mid 30s, film editor from Kochi. Hair in a low bun, rectangular glasses, dark kurta, thoughtful. |
| `people/arjun.jpg` | **Arjun Rao**, man, early 30s, director from Mumbai. Messy medium-length hair, light stubble, black T-shirt, energetic. |
| `people/rhea.jpg` | **Rhea Kapoor**, woman, early 30s, colourist from Hyderabad. Short bob, small nose stud, rust-coloured sweater, friendly. |
| `people/vikram.jpg` | **Vikram Sen**, man, late 40s, cinematographer from Kolkata. Salt-and-pepper hair, full grey beard, linen shirt, weathered and kind. |
| `people/devika.jpg` | **Devika Sharma**, woman, early 30s, director from Visakhapatnam. Long braid, denim shirt, confident. |
| `people/sameer.jpg` | **Sameer Ali**, man, early 40s, gaffer from Hyderabad. Stocky, short beard, cap turned backward, work vest over a T-shirt, cheerful. |
| `people/kabir.jpg` | **Kabir Nair**, man, mid 20s, first-time writer-director from Hyderabad. Curly hair, round glasses, faded hoodie, earnest. |
| `people/nikhil.jpg` | **Nikhil Das**, man, late 20s, first assistant camera. Short hair, clean shaven, black fleece jacket. |
| `people/priya.jpg` | **Priya Raghavan**, woman, early 30s, focus puller from Chennai. Hair tied back, small bindi, olive utility jacket. |
| `people/omar.jpg` | **Omar Sheikh**, man, early 20s, camera assistant. Short fade haircut, light moustache, plain navy T-shirt, slightly shy. |
| `people/lakshmi.jpg` | **Lakshmi Pillai**, woman, mid 40s, stage and film actor from Kochi. Hair with a centre parting and a few greys, simple cotton saree, composed and striking. |
| `people/ishaan.jpg` | **Ishaan Bose**, man, late 30s, production designer from Mumbai. Swept-back hair, thin moustache, mustard shirt, creative and precise. |

### Showreel cover · `stills/` · landscape 3:2 · style A

| File | Prompt |
| --- | --- |
| `stills/reel-kiran.jpg` | Behind the scenes: a cinematographer (the same man as `people/kiran.jpg` if possible, late 30s, olive overshirt) looking through an ARRI camera eyepiece on a monsoon exterior location, rain covers on the gear, soft grey light. |

---

## Tier 2 · slots in later (26 images)

### More people · `people/` · style B

| File | Person |
| --- | --- |
| `people/nandini.jpg` | **Nandini Rao**, woman, late 30s, costume designer from Chennai. Hair in a loose bun with a pencil through it, handloom cotton top, tape measure around neck. |
| `people/farhan.jpg` | **Farhan Qureshi**, man, mid 30s, sound recordist from Mumbai. Headphones around neck, short beard, grey sweatshirt. |
| `people/sana.jpg` | **Sana Mirza**, woman, late 20s, first assistant camera from Hyderabad. Hair in a ponytail, black cap, focused. |
| `people/raghu.jpg` | **Raghu Teja**, man, mid 30s, camera operator from Hyderabad. Close-cropped hair, thick moustache, checked shirt. |
| `people/zoya.jpg` | **Zoya Khan**, woman, mid 20s, film editor from Mumbai. Short curly hair, oversized cardigan, playful. |
| `people/anvi.jpg` | **Anvi Reddy**, woman, mid 20s, cinematographer from Hyderabad. Hair in two plaits, cargo jacket, determined. |
| `people/teja.jpg` | **Sai Teja**, man, early 30s, Steadicam operator. Athletic build, short hair, black compression T-shirt. |
| `people/dev.jpg` | **Dev Malhotra**, man, late 20s, actor from Mumbai. Well-groomed hair, clean shaven, plain black T-shirt. |

### Kiran's portfolio · `stills/` · landscape 3:2 · style A
Frames from his own films, so these should look like finished film frames, not behind-the-scenes.

| File | Prompt |
| --- | --- |
| `stills/kiran-neeli-raat.jpg` | Film frame: a car stopped on an empty highway at night, headlights on, a man standing beside it lit only by the headlights, blue night ambience. |
| `stills/kiran-monsoon-letters.jpg` | Film frame: a river in Kerala in heavy monsoon rain, a small country boat crossing, grey-green light, wide shot. |
| `stills/kiran-fault-lines.jpg` | Film frame: an interrogation room in an old police station, a single hanging bulb, two men across a table, one face in half shadow. |
| `stills/kiran-salt.jpg` | Film frame: salt pans at dawn on the Andhra coast, a worker walking with a basket on her head, pastel sky reflected in the pans. |
| `stills/kiran-kaaval-test.jpg` | Film frame: a candle-lit haveli interior, a woman in period costume reading a letter by a jharokha window. |
| `stills/kiran-kaaval-desert.jpg` | Film frame: a camel caravan crossing Thar desert dunes at midday, heat shimmer, a lone rider in the foreground. |

### Tara's work · `stills/` · style A (headshot uses style B)

| File | Prompt |
| --- | --- |
| `stills/reel-tara.jpg` | Film frame: the same woman as `people/tara.jpg` (late 20s, wavy hair) in a close-up, crying silently in a dim Mumbai chawl room, window light on her face. |
| `stills/tara-stage.jpg` | A theatre performance: an actress (late 20s, wavy hair) alone on a small black-box stage in a single spotlight, mid-monologue, audience in darkness. |
| `stills/tara-faultlines.jpg` | Film frame: a woman police inspector in khaki (late 20s, wavy hair tied back) walking through a crowded Mumbai market at dusk. |

### Network and posts · `stills/` · style A

| File | Prompt |
| --- | --- |
| `stills/nandini-kaaval.jpg` | Costume department workroom: rows of hand-dyed Rajasthani garments on racks, a costume designer pinning fabric on a mannequin, warm light. |
| `stills/vikram-reel.jpg` | Film frame: a Kolkata tram at night in the rain, reflections of shop lights on the tracks. |
| `stills/sameer-charminar.jpg` | Night exterior near Charminar in Hyderabad's old city, lit film set with large tungsten lights on stands, crowd of extras, haze. |
| `stills/devika-rushikonda.jpg` | Behind the scenes at sunset on Rushikonda beach: a small crew with a camera on sticks and a bounce board, the director watching a monitor. |
| `stills/ishaan-set-1.jpg` | A half-built film set of an old Mumbai police station interior: painted walls, ceiling fans, wooden desks, a carpenter at work, work lights. |
| `stills/ishaan-set-2.jpg` | Close detail of the same set: a dressed wooden desk with old files, a rotary phone, a steel tiffin, dust in the light. |
| `stills/zoya-edit.jpg` | A night edit suite: a film editor's desk with two monitors showing a timeline, a mug of tea, the city through a window. |
| `stills/chai-rain.jpg` | Film frame from a music video: a tea stall on a rainy Hyderabad street at night, steam rising, a couple sharing an umbrella. |
| `stills/salt-2-bts.jpg` | Behind the scenes on a small indie shoot at night in an old-city lane: three crew members around a handheld camera, one holding a small LED light. |

---

## What I will not use images for

To keep the app honest and consistent, these stay as designed UI, not pictures:
- **Production house logos**: monogram marks set in the app (generated logos read as fake brands).
- **Craft and category browse**: icons, not photos.
- **Maps, posters' titles, badges and numbers**: rendered by the app.
