import { FormulaGenerator } from "@/components/FormulaGenerator";
import { InfoSection } from "@/components/InfoSection";
import { PricingSection } from "@/components/PricingSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-excel-gray">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <FormulaGenerator />
        <PricingSection />
        <InfoSection />
      </div>
    </main>
  );
}

