"use client";

import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import FeatureSection from "@/components/landing/FeatureSection";
import SocialProof from "@/components/landing/SocialProof";
import Phase2Teaser from "@/components/landing/Phase2Teaser";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />

      <Hero />
      <FeatureSection />
      <SocialProof />
      <Phase2Teaser />
      <Footer />
    </main>
  );
}
