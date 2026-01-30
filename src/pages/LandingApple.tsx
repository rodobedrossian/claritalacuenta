import { AppleNav } from "@/components/landing-apple/AppleNav";
import { AppleHero } from "@/components/landing-apple/AppleHero";
import { AppleFeatureGrid } from "@/components/landing-apple/AppleFeatureGrid";
import { AppleVoiceSection } from "@/components/landing-apple/AppleVoiceSection";
import { AppleAnalyticsSection } from "@/components/landing-apple/AppleAnalyticsSection";
import { AppleFooter } from "@/components/landing-apple/AppleFooter";

const LandingApple = () => {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <AppleNav />
      <AppleHero />
      <AppleFeatureGrid />
      <AppleVoiceSection />
      <AppleAnalyticsSection />
      <AppleFooter />
    </main>
  );
};

export default LandingApple;
