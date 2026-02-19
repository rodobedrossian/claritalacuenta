import { GenZNav } from "@/components/landing-genz/GenZNav";
import { GenZHero } from "@/components/landing-genz/GenZHero";
import { GirlMathCards } from "@/components/landing-genz/GirlMathCards";
import { RuculinExplains } from "@/components/landing-genz/RuculinExplains";
import { GenZFeatures } from "@/components/landing-genz/GenZFeatures";
import { VibeCheck } from "@/components/landing-genz/VibeCheck";
import { GenZFooter } from "@/components/landing-genz/GenZFooter";

const LandingGenZ = () => {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <GenZNav />
      <GenZHero />
      <GirlMathCards />
      <RuculinExplains />
      <GenZFeatures />
      <VibeCheck />
      <GenZFooter />
    </main>
  );
};

export default LandingGenZ;
