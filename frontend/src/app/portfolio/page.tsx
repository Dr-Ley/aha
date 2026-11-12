import { ContactSection } from "@/components/portfolio/ContactSection";
import { HeroSection } from "@/components/portfolio/HeroSection";
import { PortfolioFooter } from "@/components/portfolio/PortfolioFooter";
import { PortfolioHeader } from "@/components/portfolio/PortfolioHeader";
import { ProblemSection } from "@/components/portfolio/ProblemSection";
import { ProjectsSection } from "@/components/portfolio/ProjectsSection";
import { ServicesSection } from "@/components/portfolio/ServicesSection";
import { nightClass } from "@/components/portfolio/styles";
import { WhyMeSection } from "@/components/portfolio/WhyMeSection";

export default function PortfolioPage() {
  return (
    <>
      <PortfolioHeader />
      <main>
        <HeroSection />
        <ProblemSection />
        <ServicesSection />
        <ProjectsSection />
      </main>
      <div className={nightClass}>
        <WhyMeSection />
        <ContactSection />
        <PortfolioFooter />
      </div>
    </>
  );
}
