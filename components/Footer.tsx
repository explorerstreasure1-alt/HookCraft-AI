export default function Footer() {
  return (
    <footer className="border-t border-zinc-800/50 bg-[#0a0a0f] px-6 py-10 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-[#d4af37] to-[#c49b29] flex items-center justify-center text-[#0a0a0f] font-black text-[10px]">H</div>
          <span className="text-sm font-bold text-white">HookCraft <span className="text-[#d4af37]">AI</span></span>
        </div>
        <p className="text-xs text-zinc-600">AI-powered video hooks for creators worldwide.</p>
      </div>
    </footer>
  );
}
