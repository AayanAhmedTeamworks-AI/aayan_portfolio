import { Frontispiece } from "@/components/frontispiece";
import { MuseumTransition } from "@/components/museum-transition";
import { SectionIntro } from "@/components/section-intro";
import { VitaSection } from "@/components/vita-section";
import { WorkBillboard } from "@/components/work-billboard";
import { PersonalProjects } from "@/components/personal-projects";
import { ContactSection } from "@/components/contact-section";
import { ClosingPortrait } from "@/components/closing-portrait";
import { LabSection } from "@/components/lab-section";

export default function Home() {
  return (
    <>
      <Frontispiece />

      {/* Cinematic bridge: bust grows → curtain opens → Berlin photo
          revealed → first sentence emerges. Replaces a static chapter
          intro for Vita with a scroll-driven film cut. */}
      <MuseumTransition />
      <VitaSection />

      <SectionIntro
        numeral="ii"
        title="The work"
        tagline="Five things I built — most of them in production. Two diagrams that show what they actually do."
      />
      <WorkBillboard />

      <SectionIntro
        numeral="iii"
        title="Made on my own"
        tagline="Things I made for an audience of about three. I'm proud of them anyway."
      />
      <PersonalProjects />

      <SectionIntro
        numeral="iv"
        title="How to reach me"
      />
      <ContactSection />

      <ClosingPortrait
        src="/bust.png"
        alt="Sculpted marble portrait of Syed Aayan Ahmed"
        caption="MMXXVI"
        figureLabel="fig. iii"
      />

      <SectionIntro
        numeral="v"
        title="The lab"
        tagline="Things you can play with. No API keys, no telemetry — the demos run in your browser."
      />
      <LabSection />
    </>
  );
}
