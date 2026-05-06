import { ScrollProse } from "@/components/scroll-prose";

/**
 * "Things I made on my own" — three short paragraphs in the Berwyn voice.
 * Word-by-word scroll-linked brightening; no diagrams, no metrics.
 */
export function PersonalProjects() {
  return (
    <section
      id="personal"
      className="relative w-full pt-24 pb-24"
      data-cursor="Read"
    >
      <article className="mx-auto max-w-[60ch] px-8 md:px-0 font-serif text-[18px] md:text-[20px] leading-[1.65] text-ink space-y-12">
        <div>
          <h3 className="font-serif text-xl tracking-[-0.01em] text-sepia/95 mb-3">
            Travel Mitar
          </h3>
          <ScrollProse>
            A Hindi voice form for Indian truck drivers who can&apos;t read
            English forms. You speak, the form fills itself, the form
            speaks back in Hindi to confirm. No screen. No reading. Just
            talking. It hasn&apos;t shipped &mdash; I&apos;m building it
            for an audience of about three of my uncles, and that is
            enough motivation.
          </ScrollProse>
        </div>

        <div>
          <h3 className="font-serif text-xl tracking-[-0.01em] text-sepia/95 mb-3">
            LIME &amp; saliency on MNIST
          </h3>
          <ScrollProse>
            An interpretability project: LIME and occlusion-sensitivity
            saliency maps over a CNN that reads handwritten digits. The
            point wasn&apos;t the model. The point was being able to ask
            the model{" "}
            <em className="italic text-sepia/95">why</em> it thought a 3
            was a 3. I am increasingly convinced this is the part of
            machine learning that actually matters.
          </ScrollProse>
        </div>

        <div>
          <h3 className="font-serif text-xl tracking-[-0.01em] text-sepia/95 mb-3">
            Amnesty International
          </h3>
          <ScrollProse>
            I fundraised for Amnesty International on the street, in
            college. I learned that asking strangers for money is a very
            specific kind of skill. I also met some of the most patient,
            articulate, stubborn human beings I have ever talked to, and
            some of the rudest. Both groups were necessary.
          </ScrollProse>
        </div>
      </article>
    </section>
  );
}
