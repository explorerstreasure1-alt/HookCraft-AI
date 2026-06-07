import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Architecture from "@/components/Architecture";
import HookGenerator from "@/components/HookGenerator";
import KeyScenes from "@/components/KeyScenes";
import Pricing from "@/components/Pricing";
import ProductionLogic from "@/components/ProductionLogic";
import Footer from "@/components/Footer";
import { ToastContainer } from "@/components/Toast";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#121214] font-sans text-[#fdfbf7]">
      <Navbar />
      <Hero />
      <Architecture />
      <HookGenerator />
      <KeyScenes />
      <Pricing />
      <ProductionLogic />
      <Footer />
      <ToastContainer />
    </main>
  );
}
