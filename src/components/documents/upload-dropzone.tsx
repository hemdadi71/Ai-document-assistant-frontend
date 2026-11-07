'use client';
import { useRef } from 'react';
import { FileUp, LoaderCircle, UploadCloud } from 'lucide-react';

export function UploadDropzone({ onFile, uploading, uploadLabel, hintLabel, sizeLabel, uploadingLabel }: { onFile: (file?: File) => void; uploading: boolean; uploadLabel: string; hintLabel: string; sizeLabel: string; uploadingLabel: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const select = (file?: File) => { onFile(file); if (inputRef.current) inputRef.current.value = ''; };
  return <>
    <button onClick={() => inputRef.current?.click()} disabled={uploading} className="mb-5 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8274ec] to-[#5b9dbd] px-4 py-3 text-xs font-semibold text-white disabled:opacity-50"><FileUp size={16}/>{uploadLabel}</button>
    <div onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); select(event.dataTransfer.files[0]); }} onClick={() => inputRef.current?.click()} className="group mb-6 cursor-pointer rounded-[22px] border border-dashed border-[#8d80f4]/30 bg-gradient-to-br from-[#8172ef]/[.07] to-[#4fbdd1]/[.035] px-5 py-10 text-center transition hover:border-[#a296ff]/60 hover:bg-[#8172ef]/[.09]">
      <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl border border-[#9588ff]/20 bg-[#8e80f4]/10 text-[#b5aaff] transition group-hover:scale-105"><UploadCloud size={25}/></div><div className="text-sm font-semibold text-[#e4e8f6]">{hintLabel}</div><div className="mt-2 text-[11px] text-[#77849b]">PDF · {sizeLabel}</div>{uploading && <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#b6adff]"><LoaderCircle size={15} className="animate-spin"/>{uploadingLabel}</div>}
    </div>
    <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={event => select(event.target.files?.[0])}/>
  </>;
}
