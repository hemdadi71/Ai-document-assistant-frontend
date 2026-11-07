import { Sparkles } from 'lucide-react';

export function Brand() {
  return <div className="flex items-center gap-3">
    <div className="relative grid size-10 place-items-center rounded-[14px] bg-gradient-to-br from-[#9a8cff] via-[#7566e8] to-[#4dbed1] shadow-[0_0_28px_rgba(128,111,255,.3)]">
      <Sparkles size={21} className="text-white" />
      <span className="absolute -bottom-1 -right-1 size-2.5 rounded-full border-2 border-[#0b1020] bg-[#65e0c0]" />
    </div>
    <div><div className="text-[19px] font-bold tracking-tight">Nexa<span className="text-[#a79bff]">.ai</span></div><div className="text-[10px] tracking-[.19em] text-[#7f8aa3]">DOCUMENT INTELLIGENCE</div></div>
  </div>;
}
