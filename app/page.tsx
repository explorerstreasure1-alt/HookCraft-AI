import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Architecture from "@/components/Architecture";
import HookGenerator from "@/components/HookGenerator";
import KeyScenes from "@/components/KeyScenes";
import ContentAuditor from "@/components/ContentAuditor";
import ViralDeconstructor from "@/components/ViralDeconstructor";
import PowerLab from "@/components/PowerLab";
import CreatorDNA from "@/components/CreatorDNA";
import Pricing from "@/components/Pricing";
import ProductionLogic from "@/components/ProductionLogic";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import ScrollToTop from "@/components/ScrollToTop";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import { ToastContainer } from "@/components/Toast";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#121214] font-sans text-[#fdfbf7]">
      <Navbar />
      <Hero />
      <Architecture />
      <HookGenerator />
      <KeyScenes />
      <ContentAuditor />
      <ViralDeconstructor />
      <PowerLab />
      <CreatorDNA />
      <Pricing />
      <ProductionLogic />
      <Footer />
      <CookieConsent />
      <ScrollToTop />
      <KeyboardShortcuts />
      <ToastContainer />
    </main>
  );
}
