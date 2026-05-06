import { PortraitNiche } from "@/components/portrait-niche";
import { ScrollProse } from "@/components/scroll-prose";
import { Emphasis } from "@/components/emphasis";

/**
 * Vita section — first-person self-portrait. Each paragraph is a
 * <ScrollProse/> block: words brighten one at a time against the fixed
 * canvas as the reader scrolls through. Three pull-quote underlines mark
 * the load-bearing sentences. Photos as plates between paragraph blocks.
 *
 * The Berlin photo + opening sentence ("My name is Syed Aayan Ahmed.")
 * have moved into <MuseumTransition/> — Vita prose now picks up from
 * the second sentence onward.
 */
export function VitaSection() {
  return (
    <section
      id="vita"
      className="relative w-full pt-12 pb-16"
      data-cursor="Read"
    >
      {/* Prose column — word-by-word scroll-linked brightening */}
      <div className="mx-auto max-w-[60ch] px-8 md:px-0 font-serif text-[19px] md:text-[21px] leading-[1.65] text-ink space-y-9">
        <ScrollProse>
          I was born in India and moved to Germany at twenty-one for an
          undergrad I had no business expecting to finish. Three and a half
          years later I&apos;m still here, in a flat on Gerbergasse with a
          fake lemon, two windows, and a habit of eating pizza brötchen at
          two in the morning.
        </ScrollProse>

        <ScrollProse>
          I&apos;m the youngest son. My family put me on a plane and
          trusted I&apos;d make it work &mdash;{" "}
          <Emphasis>that&apos;s not a footnote.</Emphasis>
        </ScrollProse>

        <ScrollProse>
          I write code for a living. Python, TypeScript, SQL, an automation
          tool called n8n, the occasional bit of C++ when I&apos;m bored.
          I taught myself most of it and I&apos;m still not sure I do any
          of it properly, but the systems run and nobody has complained
          loudly enough to fire me. I work at{" "}
          <a
            href="https://tmwrks-ai.de"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-sepia/50 underline-offset-4 hover:decoration-sepia transition"
          >
            Teamworks AI
          </a>
          , a small AI-forward consultancy near Augsburg that&apos;s quietly
          trying to drag the German construction industry &mdash; a sector
          that has been doing things mostly the same way since the
          Wirtschaftswunder &mdash; into the actual present.
        </ScrollProse>
      </div>

      <div className="mx-auto mt-20 max-w-md px-8 md:px-0">
        <PortraitNiche
          src="/portrait-valencia.jpg"
          alt="Portrait of Syed Aayan Ahmed, València"
          width={900}
          height={1200}
          caption="València · MMXXV"
          figureLabel="fig. i"
          variant="plate"
        />
      </div>

      <div className="mx-auto mt-20 max-w-[60ch] px-8 md:px-0 font-serif text-[19px] md:text-[21px] leading-[1.65] text-ink space-y-9">
        <ScrollProse>
          Before this I was a data annotator at a company in Munich. Ten
          thousand labels on invoices and receipts. It is the loneliest,
          lowest-paid job in machine learning, and I&apos;m grateful I did
          it &mdash; I know what bad data looks like because I made some,
          and I know what good data looks like because I had to fix it.
        </ScrollProse>

        <ScrollProse>
          <Emphasis>
            I think in Hindi, write in English, and order Döner in German.
          </Emphasis>{" "}
          I will probably always speak the slowest version of any German
          conversation I&apos;m in, and I have made peace with this.
        </ScrollProse>
      </div>

      <div className="mx-auto mt-20 max-w-md px-8 md:px-0">
        <PortraitNiche
          src="/portrait-mug.jpg"
          alt="Portrait of Syed Aayan Ahmed, at home"
          width={1932}
          height={2576}
          caption="Gerbergasse · late"
          figureLabel="fig. ii"
          variant="plate"
        />
      </div>

      <div className="mx-auto mt-20 max-w-[60ch] px-8 md:px-0 font-serif text-[19px] md:text-[21px] leading-[1.65] text-ink space-y-9">
        <ScrollProse>
          When I&apos;m not working I&apos;m walking &mdash; through the
          Altstadt, along the Donau, or whichever city I happen to be in
          that weekend. I call my mother in Hindi, fast and warm; I usually
          don&apos;t tell her about the deploy. I let people who love me
          cook for me most nights, or persuade them to. I read papers I
          don&apos;t always understand. I listen to techno when I want to
          focus and flamenco when I want to feel something, which makes
          very little sense to anyone except me.
        </ScrollProse>

        <ScrollProse>
          I have one belief about the work and it&apos;s this: the best AI
          system is the one nobody talks about because it just works.{" "}
          <Emphasis>
            <em className="italic text-sepia/95">Boring is a feature.</em>
          </Emphasis>{" "}
          It means it shipped. It means somebody, somewhere, used it
          without noticing. The thing I&apos;m proudest of is work no one
          will ever ask me about at a party.
        </ScrollProse>

        <ScrollProse>
          I&apos;m a kid with a German residence permit and a stubborn
          belief that integration is worth more than invention. I plan to
          stay. I plan to keep building things that don&apos;t make
          headlines and that people use anyway &mdash; and, eventually, a
          few that do.
        </ScrollProse>
      </div>
    </section>
  );
}
