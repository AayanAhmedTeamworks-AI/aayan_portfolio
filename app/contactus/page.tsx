import { ChapterProgress } from "@/components/chapter-progress";
import Colophon from "@/components/colophon";
import { PageTurn } from "@/components/page-turn";
import { ContactusBillboard } from "@/components/contactus-billboard";

export default function Contactus() {
  return (
    <>
      <ChapterProgress />

      <ContactusBillboard />

      <div className="max-w-[90rem] mx-auto px-8 md:px-16 pb-16">
        <Colophon numeral="V" />
      </div>

      <PageTurn
        numeral="V"
        chapter="Contactus"
        nextNumeral="VI"
        nextChapter="Experimenta"
        nextHref="/experimenta"
      />
    </>
  );
}
