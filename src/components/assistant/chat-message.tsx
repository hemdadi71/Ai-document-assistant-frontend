import { BookOpen, LoaderCircle, Sparkles } from 'lucide-react';
import type { SourceItem } from '@/lib/types';

export type ChatMessageData = { id: string; role: 'user' | 'assistant'; content: string; sources?: SourceItem[]; pending?: boolean };
export function ChatMessage({ message, youLabel, thinkingLabel, sourcesLabel, scoreLabel, emptyLabel }: { message: ChatMessageData; youLabel: string; thinkingLabel: string; sourcesLabel: string; scoreLabel: string; emptyLabel: string }) {
  return <div className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
    <div className={`grid size-8 shrink-0 place-items-center rounded-xl ${message.role === 'assistant' ? 'bg-gradient-to-br from-[#8879f2]/25 to-[#55c4d5]/15 text-[#b9b0ff]' : 'bg-white/[.07] text-[#aeb8cb]'}`}>{message.role === 'assistant' ? <Sparkles size={15}/> : <span className="text-[10px] font-bold">{youLabel.slice(0, 1)}</span>}</div>
    <div className={`min-w-0 max-w-[88%] rounded-2xl px-4 py-3.5 ${message.role === 'assistant' ? 'border border-white/[.07] bg-[#0b1220]/75' : 'bg-gradient-to-br from-[#7669dc]/20 to-[#4d9da9]/10 ring-1 ring-[#8c7df0]/15'}`}>
      <div className="mb-2 text-[10px] font-semibold text-[#7e8ba4]">{message.role === 'assistant' ? 'Nexa AI' : youLabel}</div>
      {message.pending && !message.content ? <div className="flex items-center gap-2 py-1 text-xs text-[#8995aa]"><LoaderCircle size={14} className="animate-spin"/>{thinkingLabel}</div> : <p className="whitespace-pre-wrap text-[13px] leading-7 text-[#d6dced]">{message.content || emptyLabel}</p>}
      {!!message.sources?.length && <div className="mt-4 border-t border-white/[.07] pt-3"><div className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-[#a99fff]"><BookOpen size={13}/>{sourcesLabel}</div><div className="flex flex-wrap gap-2">{message.sources.map((source, index) => <div key={`${source.source}-${source.chunk_id}-${index}`} className="rounded-lg border border-[#8e80f4]/15 bg-[#8e80f4]/[.06] px-2.5 py-1.5 text-[10px] text-[#b9c2d7]"><span>{source.source}</span><span className="mx-1.5 text-[#68748c]">·</span><span>#{source.chunk_id ?? '—'}</span>{typeof source.score === 'number' && <span className="ms-2 text-[#7ed5cb]">{scoreLabel}: {(source.score * 100).toFixed(1)}%</span>}</div>)}</div></div>}
    </div>
  </div>;
}
