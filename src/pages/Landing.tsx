import { HeroSection } from "@/components/landing/HeroSection";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { AnalyticsSection } from "@/components/landing/AnalyticsSection";
import { FooterCTA } from "@/components/landing/FooterCTA";

const Landing = () => {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <HeroSection />
      <FeatureShowcase />
      <AnalyticsSection />
      <FooterCTA />
    </main>
  );
};

export default Landing;
