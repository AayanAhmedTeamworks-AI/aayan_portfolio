import { ChapterProgress } from "@/components/chapter-progress";
import { ChapterCover } from "@/components/chapter-cover";
import Colophon from "@/components/colophon";
import { PageTurn } from "@/components/page-turn";
import { PortraitNiche } from "@/components/portrait-niche";
import { Sentence } from "@/components/sentence";
import { ClosingPortrait } from "@/components/closing-portrait";
import Image from "next/image";

export default function Vita() {
  return (
    <>
      <ChapterProgress />

      <div className="max-w-[90rem] mx-auto px-8 md:px-16 pt-32">
        <ChapterCover
          numeral="IV"
          chapter="Vita"
          label="The author"
          tagline="A self-portrait. In his own words."
        />
      </div>

      {/* Hero — Berlin U-Bahn, full-width cinematic plate. */}
      <figure className="relative mx-auto mt-20 max-w-5xl px-4 md:px-8">
        <div className="relative aspect-[3/4] md:aspect-[4/3] w-full overflow-hidden rounded-lg ring-1 ring-hairline bg-marble/40">
          <Image
            src="/portrait-berlin.jpg"
            alt="Syed Aayan Ahmed on a Berlin U-Bahn platform"
            fill
            sizes="(max-width: 768px) 100vw, 1024px"
            quality={92}
            priority
            className="object-cover grayscale-[6%] contrast-[1.02]"
          />
        </div>
        <figcaption className="mt-4 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
          <span>Berlin · MMXXVI</span>
          <span className="text-sepia/80">fig. i</span>
        </figcaption>
      </figure>

      {/* Prose column — sentence-by-sentence reveal. */}
      <article className="mx-auto mt-24 max-w-[60ch] px-8 md:px-0 font-serif text-[19px] md:text-[21px] leading-[1.65] text-ink/90 space-y-9">
        <p>
          <Sentence>My name is Syed Aayan Ahmed.</Sentence>
          <Sentence>
            I was born in India and moved to Germany at twenty-one for an
            undergrad I had no business expecting to finish.
          </Sentence>
          <Sentence>
            Three and a half years later I&apos;m still here, in a flat on
            Gerbergasse with a fake lemon, two windows, and a habit of eating
            pizza brötchen at two in the morning.
          </Sentence>
        </p>

        <p>
          <Sentence>I&apos;m the youngest son.</Sentence>
          <Sentence>
            My family put me on a plane and trusted I&apos;d make it work
            &mdash;
          </Sentence>
          <Sentence emphasis>that&apos;s not a footnote.</Sentence>
        </p>

        <p>
          <Sentence>I write code for a living.</Sentence>
          <Sentence>
            Python, TypeScript, SQL, an automation tool called n8n, the
            occasional bit of C++ when I&apos;m bored.
          </Sentence>
          <Sentence>
            I taught myself most of it and I&apos;m still not sure I do any of
            it properly, but the systems run and nobody has complained loudly
            enough to fire me.
          </Sentence>
          <Sentence>
            I work at <a
              href="https://tmwrks-ai.de"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-sepia/50 underline-offset-4 hover:decoration-sepia transition"
            >Teamworks AI</a>, a small AI-forward consultancy in Friedberg
            that&apos;s quietly trying to drag the German construction
            industry &mdash; a sector that has been doing things mostly the
            same way since the Wirtschaftswunder &mdash; into the actual
            present.
          </Sentence>
        </p>
      </article>

      {/* Mid-prose plate — València, the sunlit version of him. */}
      <div className="mx-auto mt-20 max-w-md px-8 md:px-0">
        <PortraitNiche
          src="/portrait-valencia.jpg"
          alt="Portrait of Syed Aayan Ahmed, València"
          width={900}
          height={1200}
          caption="València · MMXXV"
          figureLabel="fig. ii"
          variant="plate"
        />
      </div>

      <article className="mx-auto mt-20 max-w-[60ch] px-8 md:px-0 font-serif text-[19px] md:text-[21px] leading-[1.65] text-ink/90 space-y-9">
        <p>
          <Sentence>
            Before this I was a data annotator at a company in Munich.
          </Sentence>
          <Sentence>Ten thousand labels on invoices and receipts.</Sentence>
          <Sentence>
            It is the loneliest, lowest-paid job in machine learning, and
            I&apos;m grateful I did it &mdash; I know what bad data looks
            like because I made some, and I know what good data looks like
            because I had to fix it.
          </Sentence>
        </p>

        <p>
          <Sentence emphasis>
            I think in Hindi, write in English, and order Döner in German.
          </Sentence>
          <Sentence>
            I will probably always speak the slowest version of any German
            conversation I&apos;m in, and I have made peace with this.
          </Sentence>
        </p>
      </article>

      {/* Intimate plate — the mug, the late hour. */}
      <div className="mx-auto mt-20 max-w-md px-8 md:px-0">
        <PortraitNiche
          src="/portrait-mug.jpg"
          alt="Portrait of Syed Aayan Ahmed, at home"
          width={1932}
          height={2576}
          caption="Gerbergasse · late"
          figureLabel="fig. iii"
          variant="plate"
        />
      </div>

      <article className="mx-auto mt-20 max-w-[60ch] px-8 md:px-0 font-serif text-[19px] md:text-[21px] leading-[1.65] text-ink/90 space-y-9">
        <p>
          <Sentence>
            When I&apos;m not working I&apos;m walking &mdash; through the
            Altstadt, along the Donau, or whichever city I happen to be in
            that weekend.
          </Sentence>
          <Sentence>
            I call my mother in Hindi, fast and warm; I usually don&apos;t
            tell her about the deploy.
          </Sentence>
          <Sentence>
            I let people who love me cook for me most nights, or persuade
            them to.
          </Sentence>
          <Sentence>I read papers I don&apos;t always understand.</Sentence>
          <Sentence>
            I listen to techno when I want to focus and flamenco when I want
            to feel something, which makes very little sense to anyone except
            me.
          </Sentence>
        </p>

        <p>
          <Sentence>
            I have one belief about the work and it&apos;s this: the best AI
            system is the one nobody talks about because it just works.
          </Sentence>
          <Sentence emphasis>
            <em className="italic text-sepia/95">
              Boring is a feature.
            </em>
          </Sentence>
          <Sentence>It means it shipped.</Sentence>
          <Sentence>
            It means somebody, somewhere, used it without noticing.
          </Sentence>
          <Sentence>
            The thing I&apos;m proudest of is work no one will ever ask me
            about at a party.
          </Sentence>
        </p>

        <p>
          <Sentence>
            I&apos;m a kid with a German residence permit and a stubborn
            belief that integration is worth more than invention.
          </Sentence>
          <Sentence>I plan to stay.</Sentence>
          <Sentence>
            I plan to keep building things that don&apos;t make headlines and
            that people use anyway &mdash; and, eventually, a few that do.
          </Sentence>
        </p>

        {/* Contact — quiet hyperlinks, gallery-catalogue style. */}
        <div className="border-t border-hairline pt-10 mt-16 space-y-3 font-mono text-[11px] uppercase tracking-[0.24em] text-mute">
          <p>
            <a
              href="/aayan-ahmed-cv.pdf"
              className="text-sepia/90 hover:text-sepia transition underline decoration-sepia/40 hover:decoration-sepia underline-offset-4"
            >
              Curriculum Vitæ ↗
            </a>
          </p>
          <p>
            <a
              href="https://www.linkedin.com/in/syedaayanahmed"
              target="_blank"
              rel="noreferrer"
              className="text-sepia/90 hover:text-sepia transition underline decoration-sepia/40 hover:decoration-sepia underline-offset-4"
            >
              LinkedIn ↗
            </a>
          </p>
          <p>
            <a
              href="mailto:syedaayan2001@gmail.com"
              className="text-sepia/90 hover:text-sepia transition underline decoration-sepia/40 hover:decoration-sepia underline-offset-4"
            >
              syedaayan2001@gmail.com
            </a>
          </p>
        </div>
      </article>

      <div className="max-w-[90rem] mx-auto px-8 md:px-16 mt-24">
        <Colophon numeral="IV" />
      </div>

      {/* Closing crescendo — the bust takes the full viewport, the global
          spotlight blooms briefly as the page enters its closing beat. */}
      <ClosingPortrait
        src="/bust.png"
        alt="Sculpted marble portrait of Syed Aayan Ahmed"
        caption="MMXXVI"
        figureLabel="fig. iv"
      />

      <PageTurn
        numeral="IV"
        chapter="Vita"
        nextNumeral="V"
        nextChapter="Contactus"
        nextHref="/contactus"
      />
    </>
  );
}
