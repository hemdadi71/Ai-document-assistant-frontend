'use client';
import { BookOpen, Layers3, MessageSquareText } from 'lucide-react';
import type { AssistantMode } from '@/lib/types';

const modes: { id: AssistantMode; label: string; icon: typeof BookOpen }[] = [
  { id: 'rag', label: 'rag', icon: BookOpen },
  { id: 'hybrid', label: 'hybrid', icon: Layers3 },
  { id: 'chat', label: 'chat', icon: MessageSquareText },
];
export function ModeSelector({ value, onChange, enabled, labels }: { value: AssistantMode; onChange: (mode: AssistantMode) => void; enabled: { rag: boolean; hybrid: boolean; chat: boolean }; labels: Record<AssistantMode, string> }) {
  return <div className="flex rounded-xl border border-white/[.08] bg-[#090e19]/60 p-1">{modes.filter(mode => enabled[mode.id]).map(({ id, icon: Icon }) => <button key={id} onClick={() => onChange(id)} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] transition sm:px-3 sm:text-[11px] ${value === id ? 'bg-[#8174ed]/20 text-[#c5bdff] shadow-[inset_0_0_0_1px_rgba(151,136,255,.18)]' : 'text-[#79869e] hover:text-[#cbd2e3]'}`}><Icon size={13}/><span>{labels[id]}</span></button>)}</div>;
}
