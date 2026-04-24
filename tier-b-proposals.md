# Tier B — Proposal Document

**Problem statement:** Tier A's atmosphere (HDRI, N8AO, vignette, noise, Lenis choreography, dot-and-label cursor) stops at the hero. The chapters read as a normal portfolio with fades. The raw ivory canvas also looks too light next to the darkened hero, so every chapter transition reads as a brightness seam.

**Scope of this document:** propose. Not build. I stop when this file is written.

---

## Section 1 — Palette shift

Current tokens: `--color-canvas #f5efe3`, `--color-ink #1a1613`, `--color-sepia #8b6b3f`, `--color-marble #ebe4d7`, `--color-mute #78736c`, `--color-hairline #e4dccd`.

### A. Deeper parchment (Recommended)

```
--color-canvas:    #ede3d0   (from #f5efe3 — down ~6% lightness)
--color-ink:       #1a1613   (unchanged)
--color-sepia:     #8b6b3f   (unchanged — accent stays vivid on a dimmer ground)
--color-marble:    #e0d5bc   (card surfaces — kept one stop brighter than canvas)
--color-mute:      #6d6860   (darker muted for readability on darker canvas)
--color-hairline:  #d4c9b0   (one notch darker to stay visible)
```

One-sentence mood: the reading room of a small archive in late afternoon.
Why it works against Tier A: the vignette averages the hero to roughly this lightness. Matching it eliminates the seam. Warm temperature still rhymes with the tungsten-warm HDRI (adams_place_bridge).
Tradeoff: `#8b6b3f` sepia starts getting close in luminance to the new canvas — some accent elements (the "Open to" eyebrow, arrow glyphs) may need to move one step warmer/darker (`#7a5a2f`) to keep contrast.

### B. Cool stone gray — museum wall

```
--color-canvas:    #dad6ce
--color-ink:       #141414
--color-sepia:     #7a6a3f   (shifted slightly cooler to belong on this ground)
--color-marble:    #cfc8bc
--color-mute:      #6a6660
--color-hairline:  #c6bdb0
```

Mood: gallery annex, overcast light through a skylight.
Why: the Meshy bust's specular highlights are cool-neutral; a cool canvas lets them sit plausibly in one space rather than a warm one floating on a warm paper.
Tradeoff: loses the "codex as warm old book" metaphor. The meander and Cormorant start reading as a neutral editorial site rather than a specifically classical one.

### C. Night gallery — near-black with cream ink

```
--color-canvas:    #1c1a17   (near-black, warm undertone)
--color-ink:       #ebe4d7   (cream — was `--color-marble`)
--color-sepia:     #c9a372   (warm gold, saturated for dark grounds)
--color-marble:    #2a2621   (dark card surface)
--color-mute:      #8a8074
--color-hairline:  #3a352e
```

Mood: the museum an hour after close; one spotlight on the work.
Why: the hero's vignette and noise already drive the corners toward black. A dark canvas makes the hero continuous with the chapters instead of sitting in a bright frame. The cursor's italic "Look" / "Read" / "Open" in cream on near-black is a strong typographic signature.
Tradeoff: the largest aesthetic shift of the three. The Valencia portrait and any future photographs will need curation against the darker ground. The manuscript / paper reading of the codex is given up in exchange for a gallery-after-hours reading.

---

## Section 2 — Atmosphere extensions

Eight moves. Each is defensible in a plain declarative sentence; each acknowledges what could go wrong.

### 1. The Second Bust — [CHAPTER]

The user's personal sculpted portrait (`/public/bust.png`, a classical marble bust generated to resemble him with toga drapery) appears on `/contactus` as `fig. ii`, next to the existing Valencia portrait which becomes `fig. i`. The image is presented in a dark vitrine niche — a rounded rectangle with a soft radial fade so the pure black background of the PNG dissolves into the canvas. A warm halo behind, identical to the Tier A hero halo. A plain caption reads `bust · after a living model · MMXXVI · fig. ii` with a hairline rule.

The two figures then rhyme: entry is Thucydides & Herodotus (the historians looking forward at his work); exit is his own sculpted portrait (being looked at, in turn). No 3D — static image, rendered with the same warm gradient + mask treatment used for the 2D bust in the interim before the .glb landed.

Lives in: `app/contactus/page.tsx`. New helper: `components/portrait-niche.tsx`.
Technique: `next/image` + radial `mask-image` + a warm `radial-gradient` behind.
Cost: S. Risk: low. Impact: 5.

### 2. Peripheral Shadow — [HERO]

A soft directional penumbra drapes across the left edge of the hero text column, as if the museum spotlight hitting the bust casts a bias toward the text block. The shadow is a single fixed-position `<div>` with a radial gradient, `mix-blend-mode: multiply` against the canvas, opacity `0.22 × (1 − scrollProgress × 0.6)` — so as the bust recedes on scroll, the shadow softens but does not vanish.

Lives in: `app/page.tsx`, new `<BustShadow />` client component reading `scrollProgressRef`.
Technique: one absolutely-positioned `div`, CSS radial gradient, `requestAnimationFrame` loop that writes `opacity` to the element imperatively (no React re-renders).
Cost: S. Risk: medium — tuning needs to be exact or it reads as a gradient shape rather than a shadow. Tune against the actual light direction in `adams_place_bridge`.
Impact: 4.

### 3. The Vitrine — [CHAPTER — Praxis only]

The Praxis project cards become museum vitrines. Each card gains a hairline inner border (1 px, `--color-hairline`), four tiny `3 × 3 px` brass-colored corner markers rendered via `::before` and `::after`, an ultra-diffuse inner shadow (`inset 0 0 40px rgba(0,0,0,0.04)`) to suggest glass depth, and a faint 1px top highlight (`inset 0 1px 0 rgba(255,255,255,0.3)`) so the top edge catches light. Nothing else changes — the contents remain as-is.

Lives in: `components/project-card.tsx` (extracted from `app/praxis/page.tsx`).
Technique: pure CSS, no libraries.
Cost: M (the corner markers need to sit precisely or they look stuck-on).
Risk: medium — can read as skeuomorphic-museum if the corner fixtures are even slightly too ornate. Keep them at 3px and 30% opacity max.
Impact: 3.

### 4. Fly-by Dust — [CHAPTER / site-wide]

A very sparse particle field drifts across the entire viewport on every page, implemented as 20–24 absolute-positioned `span` elements with soft radial backgrounds, animated by GSAP along slow meandering paths. Each has a lifetime of 40–60s. Opacity caps at 4%. Not tied to the R3F scene — pure 2D so it extends the hero atmosphere into the chapters without putting WebGL on every page. Pauses on `prefers-reduced-motion`.

Lives in: new `components/dust-layer.tsx`, mounted once in `layout.tsx` inside `<LenisRoot>`.
Technique: GSAP random-path tweens, `position: fixed`, `pointer-events: none`, `z-index` below the cursor (70).
Cost: S. Risk: medium — if particles are visible enough to notice, they are probably too many. 24 is the ceiling; 16 is probably right.
Impact: 4.

### 5. Architectural Transitions — [BETWEEN]

Clicking a chapter link (`I · Praxis`, `II · Studia`, etc.) does not fade the page out. The Roman numeral in the index card animates — physically moves — to where it will sit on the chapter page's `<h1>`, matching size and letter-spacing along the way. The meander rule stays on screen. Body text cross-fades under it. Reversal on back-navigation runs the animation backwards.

Lives in: `next.config.ts` (enable `experimental.viewTransition`), `app/layout.tsx` (root `<ViewTransition>`), plus `view-transition-name` declarations on each numeral and the shared meander. CSS customizes `::view-transition-group` with `cubic-bezier(0.16, 1, 0.3, 1)` and 600 ms duration.
Cost: M. Risk: medium — Firefox support is partial; needs a graceful fall-through to a plain fade. Chrome/Safari get the full effect.
Impact: 5.

### 6. The Catalogue Reference — [GLOBAL — cursor extension]

When the cursor stops moving for more than 900 ms over an element that carries a `data-cursor` context, a second line fades in below the existing italic word: a small-caps catalogue reference, e.g. `CODEX · I · VII` over the bust, `FOL. XII` over a case study paragraph, `MS. B — ADDENDUM` over a side project. Set in `Geist Mono`, 9px, letter-spacing 0.28em, same ink color at 55% opacity. Disappears on any motion.

Rewards dwelling. The site becomes a thing you can sit still inside without it immediately moving on.

Lives in: `components/cursor.tsx` (extended).
Technique: add a `dwellTimer` ref; on `pointermove` reset; after 900ms, read `data-cursor-ref` from the hovered element, fade in second label.
Cost: M. Risk: low — can be quietly removed from any surface by omitting the attribute.
Impact: 3.

### 7. Sound — The Hall — [GLOBAL — audio, opt-in only]

A single looped ambient recording: the interior of a modest European archaeological museum on a weekday afternoon. Occasional distant footsteps on stone, faint HVAC, the scrape of a bench. No music. No voices close-mic'd.

Default off. Toggle lives in the footer, to the right of "Handmade in Bavaria": a single 12px speaker glyph, label `sound: on / off`. State persists in `localStorage`. Volume fixed at -24 dBFS. Respects `prefers-reduced-motion` by not auto-resuming between sessions older than 30 days.

Identity brief: "the corridor of a modest archaeological museum on a weekday afternoon — one pair of footsteps in the far room, the low hum of climate control, a chair scraping once in ten minutes." Not a library. Not a cathedral. Sourced from Freesound (CC0) or commissioned as a single 90s loop.

Lives in: new `components/ambient-audio.tsx` + a toggle in `components/footer.tsx`.
Cost: M. Risk: high — sound on portfolios is a minefield. Mitigations: opt-in only, quiet baseline, no auto-play surprise, single clear toggle.
Impact: 3.

### 8. Fonio Scrollytelling — [CHAPTER — `/praxis/baumann` only]

In the Baumann case study's "Fonio voice agent" section, a minimal four-step SVG diagram draws itself in the right-hand gutter as the reader descends: `dial` → `structured conversation` → `JSON extraction` → `draft saved`. Single continuous stroke in `--color-sepia` at 45% opacity. Tied to scroll progress for that section via GSAP ScrollTrigger with `scrub: 0.8` so the reader's scroll IS the diagram's draw speed. `prefers-reduced-motion` jumps straight to the final state.

Lives in: `app/praxis/baumann/page.mdx`, new `<FonioFlow />` client component.
Technique: a single SVG path with `pathLength="1"`, animated `strokeDashoffset` via GSAP ScrollTrigger.
Cost: L — the diagram authoring (making it look deliberately hand-drawn, not Figma-default) is the real work.
Risk: medium — must not look infographic. Keep to one ink, one weight, no shading.
Impact: 4.

---

## Section 3 — The 3-move shortlist

If I had to pick three, plus the palette:

**1. Palette A — Deeper parchment.**
The seam between hero and chapters is a real visible defect. Solving it is cheap. Keeping the palette warm protects every decision already shipped in Tier A (HDRI temperature, sepia sheen on the marble, meander color). The other two palette directions are interesting but require more to-do work across the whole site. A is the humblest move that gets 80% of the gain.

**2. Move 5 — Architectural Transitions.**
This is the most direct answer to the stated problem. The reason chapters feel like "separate pages" is that they navigate like separate pages. A Roman numeral that physically travels from index to chapter-head is the single strongest gesture for "one continuous museum." It also doubles the perceived craft of the site — visitors will stop the first time they see it and navigate back-and-forth on purpose. Nothing else on this list produces that reaction.

**3. Move 1 — The Second Bust.**
The user's own marble portrait (`bust.png`) has been sitting unused in `/public/`. Placing it on Contactus as `fig. ii`, alongside the existing Valencia photograph as `fig. i`, creates the site's strongest narrative arc: *entry* is the two Greek historians (the lineage one writes into), *exit* is the author's own sculpted portrait. Two busts, one codex, the reader between them. This move is cheap (a single image in a niche), personal, and unmistakably tied to a specific person rather than a template.

**4. (Only if a fourth fits) Move 4 — Fly-by Dust.**
Twenty slow particles across the viewport is the cheapest way to extend the hero's atmosphere into every chapter. It is also the riskiest of the three in execution — if the particles are visible enough to notice, they are too many. But done right (four, not forty), it is the single change that most directly addresses the problem as stated: *atmosphere stops at the hero.*

I would skip, for now: Peripheral Shadow (nice, but ornament on a problem that isn't there), The Vitrine (adds Praxis-only weight before the cross-site palette/transition work), Catalogue Reference (good but hides behind dwell — low discoverability), Sound (high risk, opt-in buries it), Fonio Scrollytelling (only lives on one page; valuable later once the case study list grows).

---

**End of proposal. Awaiting your selection — palette letter (A/B/C), the 3–5 moves in build order, and any modifications.**
