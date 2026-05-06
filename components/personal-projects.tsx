import { Sentence } from "@/components/sentence";

/**
 * "Things I made on my own" — three short paragraphs in the Berwyn voice.
 * Same sentence-by-sentence reveal as Vita; no diagrams, no metrics, just
 * the work and the reason for it.
 */
export function PersonalProjects() {
  return (
    <section
      id="personal"
      className="relative w-full pt-24 pb-24"
      data-cursor="Read"
    >
      <header className="mx-auto max-w-[60ch] px-8 md:px-0 mb-14">
        <div className="flex items-baseline gap-3 border-b border-hairline pb-4">
          <span className="font-serif italic text-sepia/70 text-lg">iii.</span>
          <h2 className="font-serif text-2xl md:text-3xl tracking-[-0.02em] text-ink">
            Things I made on my own
          </h2>
        </div>
        <p className="mt-4 font-serif italic text-mute text-base">
          Most of these ran for an audience of about three. I&apos;m proud of
          them anyway.
        </p>
      </header>

      <article className="mx-auto max-w-[60ch] px-8 md:px-0 font-serif text-[18px] md:text-[20px] leading-[1.65] text-ink/90 space-y-12">
        <div>
          <h3 className="font-serif text-xl tracking-[-0.01em] text-sepia/95 mb-3">
            Travel Mitar
          </h3>
          <p>
            <Sentence>
              A Hindi voice form for Indian truck drivers who can&apos;t read
              English forms.
            </Sentence>
            <Sentence>
              You speak, the form fills itself, the form speaks back in
              Hindi to confirm.
            </Sentence>
            <Sentence>No screen. No reading. Just talking.</Sentence>
            <Sentence>
              It hasn&apos;t shipped &mdash; I&apos;m building it for an
              audience of about three of my uncles, and that is enough
              motivation.
            </Sentence>
          </p>
        </div>

        <div>
          <h3 className="font-serif text-xl tracking-[-0.01em] text-sepia/95 mb-3">
            LIME &amp; saliency on MNIST
          </h3>
          <p>
            <Sentence>
              An interpretability project: LIME and occlusion-sensitivity
              saliency maps over a CNN that reads handwritten digits.
            </Sentence>
            <Sentence>The point wasn&apos;t the model.</Sentence>
            <Sentence>
              The point was being able to ask the model <em className="italic">why</em> it
              thought a 3 was a 3.
            </Sentence>
            <Sentence>
              I am increasingly convinced this is the part of machine
              learning that actually matters.
            </Sentence>
          </p>
        </div>

        <div>
          <h3 className="font-serif text-xl tracking-[-0.01em] text-sepia/95 mb-3">
            Amnesty International
          </h3>
          <p>
            <Sentence>
              I fundraised for Amnesty International on the street, in
              college.
            </Sentence>
            <Sentence>
              I learned that asking strangers for money is a very specific
              kind of skill.
            </Sentence>
            <Sentence>
              I also met some of the most patient, articulate, stubborn
              human beings I have ever talked to, and some of the rudest.
            </Sentence>
            <Sentence>Both groups were necessary.</Sentence>
          </p>
        </div>
      </article>
    </section>
  );
}
