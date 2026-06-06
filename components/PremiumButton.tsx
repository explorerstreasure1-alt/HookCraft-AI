export default function PremiumButton({
  children,
  href = "#dashboard",
}: {
  children: string;
  href?: string;
}) {
  return (
    <a
      href={href}
      className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-[#d4af37] px-6 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#121214] transition duration-300 hover:-translate-y-0.5 hover:bg-[#f0d36b] focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2 focus:ring-offset-[#121214]"
    >
      <span className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-18deg] bg-white/30 transition duration-700 group-hover:left-[120%]" />
      <span className="relative">{children}</span>
    </a>
  );
}
