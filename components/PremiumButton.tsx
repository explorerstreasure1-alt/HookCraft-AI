export default function PremiumButton({ children, href = "#dashboard" }: { children: string; href?: string }) {
  return (
    <a
      href={href}
      className="gold-shimmer inline-flex items-center justify-center text-[#0a0a0f] font-bold px-8 py-4 rounded-full text-sm uppercase tracking-wider hover:scale-105 transition-transform shadow-[0_0_40px_rgba(212,175,55,0.25)]"
    >
      {children}
    </a>
  );
}
