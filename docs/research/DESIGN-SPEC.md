# Design spec: reference site (lottie-portfolio.framer.website)

Measured on 14 Nov 2026. Values come from computed styles in the live browser and from the site's own Framer bundle, which contains each code component's settings. Pixel values are for the **desktop breakpoint (≥1440px)** unless marked *tablet* (810–1439) or *phone* (≤809).

Raw evidence (not for the build, kept out of git):
- `raw/site.html`: server-rendered page
- `raw/all.css`: every CSS rule, including breakpoints
- `js/`: Framer bundles
- `components-src/*.src.js`: source of each custom component
- `components-src/PAGE-PROPS.txt`: exact settings the page passes to each component

---

## 1. Overall feel

Y2K / beauty-editorial maximalism: a deep **chocolate-plum** page, saturated **bubblegum pink**, **butter cream** and **periwinkle**, chunky sticker shapes (bursts, stars, sparks, flowers, scalloped badges), a groovy 70s display logo, and very condensed grotesque type for everything else. Every section has one signature motion moment. Content sits in rounded "cards" inset 6px from the viewport edge, giving a framed, scrapbook look.

## 2. Colour tokens

| Role | Hex | Where |
|---|---|---|
| `--bg` page / plum-brown | `#2b1619` | body, every section background, dark buttons, dark text on cream |
| `--pink` primary accent | `#ff9ee4` | about card, form card, headings on dark, wave-fill final colour, tags |
| `--pink-soft` | `#ffb5f0` | "view project" label, input placeholders, burst-stamp border |
| `--pink-bar` | `#ffbad8` | hero autoplay progress fill |
| `--magenta` | `#bd4f9e` | hero gallery fallback bg, text on pink stamps |
| `--cream` | `#f2edc7` | logo, project card frame, pricing card, nav button, cursor, borders |
| `--butter` | `#fff2a8` | spark stamp ("selected work") |
| `--periwinkle` | `#a8bfff` | star stamp, 3D clay object, alternate tags |
| `--lime` (rare) | `#d1de92` | brand pill |
| `--paper` | `#fefae7` | — |
| `--grey-label` | `#dedeDA` | nav menu link text |

Shadows: thumbnails `0 20px 50px rgba(0,0,0,.5)`. Buttons use a **hard offset shadow** `4px 4px 0 <contrast colour>`; on hover it collapses to `0 0 0` (a "press-in" effect).

## 3. Typography

| Use | Font (reference) | Size / LH / tracking | Colour |
|---|---|---|---|
| Hero wordmark | **Starboy Regular** (commercial, groovy 70s, sparkle letterforms) | 288px / 1.3 (desktop); 215px tablet | cream |
| Nav wordmark | Starboy | 38px / 38px / .2px, lowercase | cream |
| About paragraph | **Franie XCondensed SBold 600** | 68px / 72px (desktop); 44/47 tablet; centred | pink |
| Script name | **Momo Signature** (Google Fonts) | 90px / 90px (phone 76/82) | pink |
| Giant section words ("services", "archive") | Franie XCondensed 500, lowercase, letter-spacing −2px, fit to width | ~viewport width | wave fill: cream→pink |
| Project title | Franie XCondensed SBold | 40 / 52 / .2px | `#2b1619` |
| Service card title | Franie XCondensed SBold | 44 / 54 / .2px | pink |
| Service card body | Franie XCondensed 500 | 36 / 36 | `#2b1619` |
| Tag pills | Franie XCondensed 500 | 25 / 1.2em / .02em, padding 10×20, radius 13 | cream on pink or periwinkle |
| Contact headings | Franie XCondensed SBold | 72 / 74 | dark on cream; cream on pink |
| Pricing line | Franie XCondensed 500 | 27 / 29 | dark |
| Buttons / labels | Franie XCondensed 500 | 20 / 22 / .02px | — |
| Form labels | Franie XCondensed SBold | 18 / 20 / .36px | cream |
| Footer email | Franie XCondensed 500 | 120 / 120 | cream (hover pink) |
| Footer small | Franie XCondensed 500 | 24 / 26 | cream / pink |
| Stamp ring text | Franie XCondensed 500 | 27px around the ring | magenta |
| Archive overlay | **Anton** (Google Fonts) | 20/32 and 32/32 uppercase +4px tracking | cream / white |

> **Font licensing:** the site loads Starboy, Franie XCondensed and Newborn as uploads from the template author. These are commercial fonts and we should not copy them from the site. Options:
> 1. Buy licences (Starboy and Franie are both sold by their foundries).
> 2. Free near-matches. Wordmark: a custom SVG "mrunal" lettering, or Google's *Bagel Fat One* / *Shrikhand*. Condensed grotesk: *Antonio*, *Big Shoulders Text* or *Oswald* tuned narrow.
>
> Momo Signature and Anton are free (Google Fonts).

## 4. Global chrome

- **Frame:** each section is a full-width block on `#2b1619`; the coloured card inside is inset **6px** (hero/about/contact) with **radius 16px** (hero) or **32px** (cards).
- **Nav (fixed, z 10):** top bar padded 30px. Left: "lottie" wordmark, 38px, cream. Right: **40×40 cream rounded square** (radius 8) with a 24px pink dot.
  - Click: expands into a **287×240 pink panel** (radius 8) anchored top-right.
  - Panel holds lowercase links at 24px Franie, colour `#dededa`: home / about / projects / services / contact.
- **Custom cursor:** native cursor hidden.
  - A fixed full-viewport layer (z 99999, pointer-events none) draws a **40px four-point sparkle SVG** in cream with `drop-shadow(0 1px 2px rgba(0,0,0,.08))`. Path: `M50 0 C57 34 66 43 100 50 C66 57 57 66 50 100 C43 66 34 57 0 50 C34 43 43 34 50 0Z`.
  - Moving spawns **trail sparkles**: keyframes `sparkleFade` run 0% `scale(.3) rotate(0) opacity 0` → 20% opacity 1 → 100% `scale(0) rotate(70deg) opacity 0`.
  - The layer fades out (opacity .2s) over native interactive elements.
- **Breakpoints:** desktop ≥1440, tablet 810–1439, phone ≤809.
- **Reduced motion:** every looping and entrance animation is disabled under `prefers-reduced-motion`.

## 5. Sections, top to bottom

### 5.1 Hero (100vh)
Layers, back to front:
1. **WebGL gallery**, the full-bleed card.
   - Nine 16:9 photos. The **active one is drawn on a canvas**; behind it sits a blurred copy (`blur(28px) scale(1.1)`) used during the intro.
   - **Transition:** a vertical wipe moving **bottom to top**, with a simplex-noise wavy edge.
     - Settings: `fluidIntensity .15`, `noiseScale 5.5`, `wipeDuration 4s`.
     - A thin edge band ("edge distress") offsets UVs by 0.03.
     - The shader is in `components-src/hero-webgl.src.js`.
   - **Autoplay** every **2.5s**, starting after the opening wipe.
2. **Wordmark** "lottie", 288px, cream, centred.
   - **Letter reveal:** each glyph sits in an overflow-hidden box and moves `y 115% → 0`, `rotate 4° → 0`.
   - Duration **1.4s**, ease `cubic-bezier(.16,1,.3,1)`.
   - Stagger runs **from the centre letter outward**: `delay = |mid − i| × 0.06 + i × 0.005`.
   - Replays each time it scrolls back into view.
   - **Parallax:** the wordmark moves at speed 110, i.e. `translateY = −0.1 × scrollY`.
3. **Thumbnail strip** at the bottom, centred, 60px from the bottom edge.
   - **Size:** inactive 100px, active 120px (tablet 60/80).
   - **Look:** radius 16, `grayscale(70%)` when inactive and 0 when active. The active one gets a `2px rgba(255,255,255,.75)` outline at offset 2.
   - **Behaviour:** **hovering a thumbnail selects it** and stops autoplay. Width, height and margin animate on a spring (stiffness 300, damping 30); layout springs at 280/28.
   - **Intro:** thumbnails rise from `y 18, scale .93, opacity 0`, staggered **0.065s each**.
   - **Progress bar:** inside the active thumb, 18px from its bottom. 80% wide, 2px tall, cream track with `backdrop-blur 13px`, pink fill animating 0→100% linearly over the autoplay interval.
4. **Stamp field**: four big sticker shapes floating over the hero.
   - **Pink burst** (420px, top-left at 4%/13%), rotation −146°. Ring text "independent creative ." runs around the edge in magenta. It **spins** (29s/rev, counter-clockwise) and **wobbles** (14s).
   - **Periwinkle star** (420px, at 95%/27%) with a 7px cream border and "based in tokyo" in the centre. Wobbles (9s).
   - **Butter spark** (284px, at 9%/82%) labelled "selected work" in pink. **Links** to the projects section. Moves on all axes.
   - **Pink flower** (221px, at 94%/84%) with a 5px cream border, labelled "hire" in magenta. **Links** to contact. Spins clockwise (12s) and floats.
   - **Click anywhere on the hero to "stamp" a new sticker.** Random shape, scale 1.2, ±25° jitter, maximum 8 added.
   - **Cursor push:** stickers lean or slide away from the pointer (reaction radius ~180px, strength 12–31).
   - **Entrance:** `mokaPop` scale 1.35 → .94 → 1 over 420ms, `cubic-bezier(.2,.9,.2,1)`.
   - Keyframes (spin, wobble, float, pop) are copied verbatim in `components-src/stamp-field.src.js`.

### 5.2 About (~1836px tall on desktop)
- A pink card (`#ff9ee4`) inset 6px. Over it sits a huge **plum starburst** (`Shape Mask`, an SVG mask, scaled 1.38/1.4) that cuts a "spiky sun" out of the pink, so the text sits on plum surrounded by pink spikes.
- **Paragraph** (68px condensed, pink, centred, ~1018px max width).
  - **Line-by-line pop:** each line goes from `scale 0, rotateY 10°` to 1.
  - Spring: bounce **.6**, duration **1.5s**, **0.13s stagger** per line. Triggers in view, once.
- **Signature:** "Lottie" / avatar / "Bennett" in Momo Signature, 90px, pink, stacked and centred. The avatar is **138px, circular**, inside a **cream scalloped badge**.
- **Brand logo ticker** along a **wavy SVG path** (preset "wave") at the bottom of the card.
  - Pills are 158×100, radius 40, pink, cream or periwinkle, each with a logo glyph.
  - Speed 5, slows to 0.8× on hover. **Draggable**, with fade at both ends. Rotation stays fixed.
  - The container enters with `y 170 → 0` (spring stiffness 362, damping 100).

### 5.3 Projects (desktop: horizontal ticker; tablet/phone: vertical stack)
- **Desktop:** an infinite **horizontal ticker** at **100px/s**, 120px gap, card width ≈ 1/3 of the viewport. It pauses off-screen.
- **Card:**
  - **Frame:** cream (`#f2edc7`), **radius 32**, padding 20.
  - **Image:** 392px tall, radius 32, cover-fit.
  - **Bottom row:** title (40px SBold, dark) and a **"view project" button**. The button is plum with radius 8, a `4px 4px 0` pink shadow and a pink-soft label. On hover the shadow collapses to 0.
- **Category sticker:** a plum wavy-edged badge with a pink outline and two-line italic label (e.g. "Marketing / Campaign").
  - About 264px, overlapping the card's top-left corner by about −90px.
  - Rotates continuously (`mokaStickerCW` keyframe).
- **Tablet/phone:** cards stack vertically with about 120px between them.

### 5.4 Services (sticky, ~2600px)
- **Sticky top layer (100vh):**
  - **"services"** in giant condensed type, fit to width.
  - **Wave fill:** a hard-edged colour wipe from **bottom to top**, cream → pink. It's tied to scroll from when the block's top hits **90%** of the viewport to **30%**, using `progress×1.5 − .25`.
  - In the middle floats a **3D clay star** (three.js GLB).
    - Material: periwinkle `#a8bfff`, roughness 1, clearcoat .6, sheen .35 in pink.
    - Base tilt (−30°, 145°, 70°), scale 3.1.
    - **Rotates with scroll velocity**: sensitivity .3, friction .79.
- **Cards scroll over it**, alternating left and right in a staggered grid. Six cards: Product Visualization, Art Direction, Creative Campaigns, Motion Design, UI/UX Design, Brand Identity.
  - **Card:** 600×422, cream, **radius 40**, padding 30. Title 44px pink, body 36px dark.
  - **Entrance:** from **`rotate ±30°, scale .7`** (alternating sign) to 0 / 1 on a spring (stiffness 500, damping 60) as each card enters view.
  - **Physics tags inside each card:** pills **rain down** with gravity 1, bounce .45, friction .4, stagger .05s, max tilt 25°.
    - They're **draggable and throwable**, and the cursor pushes them.
    - Colours alternate periwinkle and pink; text is cream.

### 5.5 Archive (sticky, ~2300px)
- **Sticky "archive"** giant word: the same wave-fill effect.
- **Scroll-scrubbed photo explosion:** nine portrait cards (500×500, the front one 500×600, **radius 32, cream border**) start **stacked dead-centre**.
- As you scroll through a 1000px trigger zone, each card flies to its own offset and shrinks:

  | Card | x, y (px) | Scale |
  |---|---|---|
  | 2 | 511, 246 | .6 |
  | 3 | 314, 306 | .5 |
  | 4 | 502, −211 | .5 |
  | 5 | 297, −291 | .55 |
  | 6 | −346, 257 | .6 |
  | 7 | −515, 328 | .6 |
  | 8 | −498, −211 | .6 |
  | 1 | −266, −179 | .6 |

  Tablet uses smaller offsets (in the source).
- The stack fades in first (`opacity 0, scale .9` → 1).
- The front card stays put and carries a **"@lottie" pill** plus "Follow us on / INSTAGRAM" in Anton.

### 5.6 Contact
- **Pricing card:** cream, radius 32, padding 30.
  - Headline 72px dark ("Brand Identity, Campaigns & …"), then "Projects Start at $2500" at 27px.
  - **"Available to Hire"** button: pink with a `4px 4px 0` plum shadow.
  - The block enters from `y 50, opacity 0`: tween .8s `cubic-bezier(.22,.85,.56,1)`, delay .25s.
- **Form card:** pink, radius 32, 6px below.
  - Heading "Say Hello and Tell Me What You're Working On." at 72px cream, sub-line at 27px dark.
  - Six fields in a **2-column grid**: label 18px cream, input row 50px tall, radius 10, cream outline, placeholder pink-soft.
  - Full-width **plum submit** button (radius 8, 40px tall, cream label).

### 5.7 Footer (100vh, plum)
- Huge email link at 120px cream (pink on hover).
- Row of 4 social icons (cream squares) and nav links at 20px cream.
- Bottom bar: "©2026 …", "Terms | Privacy" with a 2px pink divider, and "Designed by …".
- **Matter.js physics pile:** pink scalloped flower badges ("Community", "Viral", "Growth") drop and pile up along the bottom edge. They're **draggable and throwable**.

## 6. Motion vocabulary

| Name | Spec |
|---|---|
| Letter rise | y 115%→0, rotate 4→0, 1.4s, `(.16,1,.3,1)`, centre-out stagger .06 |
| Line pop | scale 0→1, rotateY 10→0, spring bounce .6 / 1.5s, stagger .13 |
| Card swing-in | rotate ±30→0, scale .7→1, spring k500 c60 |
| Section rise | y 170→0, spring k362 c100 |
| Fade-up | y 50→0, opacity 0→1, .8s `(.22,.85,.56,1)` +.25s |
| Sticker pop | scale 1.35→.94→1, 420ms `(.2,.9,.2,1)` |
| Spin / wobble / float | linear 360° (7–29s); ±4° ease-in-out; ±8px ease-in-out |
| Button press | shadow 4px→0 on hover |
| Wave fill | hard-edge vertical colour wipe, tied to scroll |
| Liquid wipe | WebGL noise-edged vertical wipe |
| Scroll scrub explode | stacked cards → scattered positions over 1000px |

## 7. How we'll rebuild it (proposed stack)

- **Vite + vanilla JS modules.** No framework is needed; the site is one long page.
- **GSAP + ScrollTrigger** for scroll-scrubbed and sticky effects, and **Lenis** for smooth scroll.
- **Raw WebGL** for the hero wipe (the shader is about 40 lines).
- **three.js** (GLTFLoader) for the 3D object. We'll need our own GLB, for example a clay star or flower.
- **Matter.js** for the physics tags and footer pile.
- Wave-fill text in **CSS**: `background-clip:text` with two stacked colours and `clip-path` driven by scroll. No WebGL needed.
- SVG sticker shapes (burst, star, spark, flower, scallop) drawn by us.

## 8. Mapping to Mrunal's content (to confirm)

| Lottie section | Mrunal version |
|---|---|
| Hero gallery (9 beauty portraits) | 9 edited photos of Mrunal and her work, graded to the pink palette |
| Stamps "independent creative", "based in tokyo", "selected work", "hire" | Her tagline, city, "selected work", "hire" |
| About + script name + avatar | Her bio, "Mrunal / Desale" in script, cut-out avatar |
| Brand ticker | Brands she's worked with (Epic Burger, Your Deli, Cafe Uukii, Aurela…) |
| Project cards | Case studies from `assets/work/` |
| Services + tags | Her actual services |
| Archive explosion | Grid of social posts |
| Contact / footer | Her email, Instagram, WhatsApp |
