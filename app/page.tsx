import { Frontispiece } from "@/components/frontispiece";
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
      <VitaSection />
      <WorkBillboard />
      <PersonalProjects />
      <ContactSection />
      <ClosingPortrait
        src="/bust.png"
        alt="Sculpted marble portrait of Syed Aayan Ahmed"
        caption="MMXXVI"
        figureLabel="fig. iv"
      />
      <LabSection />
    </>
  );
}
