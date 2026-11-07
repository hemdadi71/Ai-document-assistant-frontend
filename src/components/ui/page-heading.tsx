export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 text-[11px] font-medium tracking-[.16em] text-[#8c81e9]">{eyebrow}</div><h1 className="text-[26px] font-semibold tracking-tight sm:text-[30px]">{title}</h1><p className="mt-1.5 text-sm text-[#8490a7]">{description}</p></div>{action}</div>;
}
