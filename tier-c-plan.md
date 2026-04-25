# Tier C — Phenomenal (stored, awaiting your read)

> "I built this, which means I'm confident with AI tooling, web stack, system design, and have real taste."

The Codex aesthetic is already doing 80% of the work. To finish the job, the depth needs to be **real evidence**, not more visual polish. Adding more effects to the surface is the trap — what marks a portfolio as serious to other engineers is what survives a click past the homepage.

The plan adds depth without adding visible noise. The Codex's surface stays restrained; the proof lives one inspection deeper.

---

## Five pillars

### I. The Codex actually knows things — live RAG over your work

A single italic prompt at the bottom of `/`, styled like a marginal note: *"Ask the codex."* Visitor types a question. Behind it: an embedding index over your case studies, internship report, and any essays. Returns a one-paragraph answer in your voice with cited sources. Latency visible — `(retrieved in 1.4s)`.

- **Why this earns respect:** every other AI portfolio bolts a generic chatbot. This one is grounded RAG over the visitor's actual context (your written work). Real prompt design, retrieval engineering, citation discipline, latency awareness — the actual skills you sell.
- **Tech:** `@vercel/ai` SDK + Groq (Llama 3.3 70B) for sub-second response, sentence-level chunked embeddings via OpenAI `text-embedding-3-small`, stored in `pg_vector` on a Supabase free instance. Your Bautagesbericht stack — proven.
- **Risk:** an LLM input on the site invites adversarial prompts. Mitigations: strict system prompt scoping the model to your work only, refusal on out-of-domain, no streaming of arbitrary completions, rate limit per IP.
- **Cost:** ~1 day to implement; ~$0.50/month inference at low traffic.
- **Effort:** M.

### II. One project moves from *described* to *usable*

Pick one of your real projects and make it live on the site. Two strong candidates:

- **GEO Tune-Up** — visitor pastes a URL, watches the LLM-citation analysis run live, gets the rewrite suggestions. You've built it; hosting it on `/studia/geo-tune-up` makes it the site's most magnetic page.
- **Bautagesbericht voice demo** — a sandbox project number visitors can call (or a recorded example with the live JSON extraction shown). Harder logistically but more memorable.

- **Why this earns respect:** the difference between "I built X" and "Try X." A live tool collapses the entire claim ladder into one click.
- **Risk:** API costs, abuse vectors. Mitigation: rate limits, per-IP quotas, an honest "demo limits" line.
- **Effort:** L (3–5 days). My recommendation: **GEO Tune-Up** — already self-contained as a Cloudflare Workers app, can be embedded as an iframe or rebuilt natively in `/studia/geo-tune-up`.

### III. One serious essay in `/studia`

A 1,500-word piece on something you've actually thought hard about. Candidates:

- **"Making LLMs boring"** — expand the line that's already your tagline into the argument. Lean Agents, schema-as-contract, idempotent retries.
- **"The Bautagesbericht as a litmus test"** — what trying to ship AI to a German construction crew teaches you about the rest of enterprise AI.
- **"Why this site looks like a museum"** — a candid design-rationale piece.

- **Why this earns respect:** writing is the credential hardest to fake. A single well-argued essay outweighs five more visual flourishes. People who can hire you read essays — that's how they decide.
- **Tech:** MDX + the existing typography primitives (DropCap, Marginalia, GutterSection). I write the chapter scaffolding; you write the prose.
- **Effort:** S (me) + 1–2 days of your writing.

### IV. Glassbox engineering — the expanded `/colophon` page

A real page that lays bare how the site is built. Live numbers where possible:

- Current bundle size per route, broken down (R3F, GSAP, Lenis)
- Latest Lighthouse + Web Vitals (FCP / LCP / CLS / INP)
- Every dependency listed with version and one-line rationale
- The build pipeline (Next 16 + Turbopack + gltf-transform pass for the bust + Draco compression)
- A code-stats pull — total LOC, by language
- Live "deployed at" timestamp from Vercel headers

Format: print colophon page from a real book — typeset, not dashboard.

- **Why this earns respect:** confidence to show your numbers is the inverse of marketing.
- **Tech:** Vercel deployment hooks for build metadata, `webpack-bundle-analyzer` JSON exported at build, optional `web-vitals` reporting.
- **Effort:** M (1 day for the page; integrations evolve).

### V. Print stylesheet — the codex actually prints

When the visitor hits ⌘P, the site lays out as a real codex: proper margins, page breaks at chapter boundaries, drop caps preserved, page numbers in a foot, no nav, no cursor, no Canvas. Title page, table of contents, chapters in roman numerals, colophon at the end.

- **Why this earns respect:** Tufte-tier signal. Almost no portfolio bothers with a print stylesheet. The visitor who tries it (and many will, especially designers) will remember the site for years.
- **Tech:** `@page` CSS, `page-break-before/after`, `position: running()`, `counter()` for page numbers and section numerals. Pure CSS — no library.
- **Effort:** M (1 day if scope is locked).

---

## Supporting moves — compound the pillars at low cost

- **Place the marginalia + § gutter sigils** built last round, across `/praxis/baumann`.
- **Custom OG images** via `next/og` (satori). When a chapter URL is shared, the preview shows the chapter's Roman numeral + Cormorant title + fleuron on a marble plate. ~3 hours.
- **`/404` and `/500` themed as a missing folio** — `fol. perdita`. ~2 hours.
- **a11y / keyboard nav pass** — verify focus rings, screen-reader labels, full keyboard navigation, axe clean. ~1 day.

---

## Build order

- **Phase A · Editorial completion** (~3 days): marginalia + § sigils placed, 404/500 folios, a11y pass, one OG template
- **Phase B · Pillars III + IV** (~2 days me, 1–2 days you): essay scaffolding + colophon page; you write
- **Phase C · Pillar I** (~1 day): ask-the-codex
- **Phase D · Pillar II** (~3–5 days): live GEO Tune-Up
- **Phase E · Pillar V** (~1 day): print stylesheet

---

## Skip list

- Generic chatbot widget — opposite of confident
- AI-generated images on the site — seen everywhere
- Persistent guest book — spam-prone
- Audio narration — risky tonally, defer
- Dark mode — would be nice, lower priority
- DE/EN i18n toggle — quiet polish, not phenomenal
- A second R3F scene per chapter — bust is the protagonist

---

## My recommendation if forced to three

1. **Pillar III · Essay** — single biggest credibility move per hour invested.
2. **Pillar IV · Glassbox colophon** — easy to build, hard to fake.
3. **Pillar I · Ask the codex** — turns "AI engineer's portfolio" into "AI engineer's portfolio you can talk to."

Pillars II and V follow.

---

## Decisions awaiting

1. Which pillars (all five / my three / different cut)
2. Essay topic
3. For Pillar II if in scope: GEO Tune-Up vs Fonio voice demo
4. API budget OK (Groq + Supabase free tiers)
