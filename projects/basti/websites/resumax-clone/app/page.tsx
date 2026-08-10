import Hero from "@/components/Hero";
import FeatureCards from "@/components/FeatureCards";
import ATSAnalysis from "@/components/ATSAnalysis";
import ResuMaxScore from "@/components/ResuMaxScore";
import CompanyLogos from "@/components/CompanyLogos";
import Templates from "@/components/Templates";
import Pricing from "@/components/Pricing";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#14213d] via-slate-900 to-black">
      <Hero />
      <FeatureCards />
      <ATSAnalysis />
      <ResuMaxScore />
      <CompanyLogos />
      <Templates />
      <Pricing />
    </main>
  );
}

