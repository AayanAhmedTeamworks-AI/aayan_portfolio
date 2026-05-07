import { Frontispiece } from "@/components/frontispiece";
import { MuseumTransition } from "@/components/museum-transition";
import { SectionIntro } from "@/components/section-intro";
import { VitaSection } from "@/components/vita-section";
import { WorkBillboard } from "@/components/work-billboard";
import { PersonalProjects } from "@/components/personal-projects";
import { ContactSection } from "@/components/contact-section";
import { SpotlightIgnite } from "@/components/spotlight-ignite";
import { LabSection } from "@/components/lab-section";

export default function Home() {
  return (
    <>
      <Frontispiece />

      {/* Iris opens onto the Berlin photo. Continues from Frontispiece's
          black hand-off (after the bust has fully dissolved into ink). */}
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

      {/* Spotlight ignites — the museum dims, the curator turns on the
          lab lamp. Replaces the SectionIntro for Lab; same chapter
          framing, carried by the gesture instead. */}
      <SpotlightIgnite />
      <LabSection />
    </>
  );
}
