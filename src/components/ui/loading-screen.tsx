export function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center text-[#aab4c8]">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.03] px-5 py-4 text-sm">
        <span className="size-2 animate-pulse rounded-full bg-[#9c8eff]" />
        Nexa AI
      </div>
    </div>
  );
}
