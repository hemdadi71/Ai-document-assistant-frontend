'use client';

import {
  Activity,
  ArrowUpLeft,
  BookOpen,
  FileText,
  MessageSquareText,
  Settings2,
  ShieldCheck,
  Zap,
} from 'lucide-react';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

import { ConversationHistory } from '@/components/history/conversation-history';

const items = [
  { href: '/dashboard' as const, key: 'assistant', icon: MessageSquareText },
  { href: '/library' as const, key: 'library', icon: BookOpen },
  { href: '/settings' as const, key: 'settings', icon: Settings2 },
];

interface AppSidebarProps {
  open: boolean;
  onNavigate: () => void;
  count?: number;
  firstDocument?: string;
  showHistory?: boolean;
}

export function AppSidebar({
  open,
  onNavigate,
  count,
  firstDocument,
  showHistory = false,
}: AppSidebarProps) {
  const t = useTranslations('app');
  const pathname = usePathname();

  return (
    <aside
      className={`${open ? 'block' : 'hidden'} fixed inset-x-0 top-[76px] z-20 max-h-[calc(100vh-76px)] overflow-y-auto border-b border-white/10 bg-[#0c1220] p-4 lg:sticky lg:top-[76px] lg:block lg:h-[calc(100vh-76px)] lg:max-h-none lg:border-0 lg:bg-transparent lg:p-0`}
    >
      <div className="flex h-full flex-col py-5">
        <div className="mb-3 px-3 text-[10px] font-semibold tracking-[.18em] text-[#65718a]">
          {t('workspace').toUpperCase()}
        </div>

        <nav className="space-y-1" aria-label={t('workspace')}>
          {items.map(({ href, key, icon: Icon }) => {
            const active = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition ${
                  active
                    ? 'border border-[#9385ff]/20 bg-gradient-to-r from-[#8172ef]/15 to-[#4fbdd1]/[.05] text-white shadow-[inset_2px_0_0_#9385ff]'
                    : 'text-[#8e9ab0] hover:bg-white/[.04] hover:text-[#e8eafa]'
                }`}
              >
                <Icon
                  size={18}
                  className={active ? 'text-[#a99eff]' : 'text-[#78859e]'}
                />
                {t(key)}
                {active && (
                  <ArrowUpLeft
                    size={14}
                    className="ms-auto text-[#a99eff]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {showHistory && (
          <ConversationHistory onNavigate={onNavigate} />
        )}

        <div className="my-5 h-px bg-white/[.07]" />

        <div className="mb-3 flex items-center justify-between px-3">
          <span className="text-[10px] font-semibold tracking-[.16em] text-[#65718a]">
            {t('documents').toUpperCase()}
          </span>
          <span className="rounded-md bg-white/[.06] px-1.5 py-0.5 text-[10px] text-[#9ba6bc]">
            {count ?? '—'}
          </span>
        </div>

        <Link
          href="/library"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-start text-sm text-[#8e9ab0] hover:bg-white/[.04]"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-[#5f9eb7]/10 text-[#72c8dc]">
            <FileText size={16} />
          </span>
          <span className="min-w-0 flex-1 truncate">
            {firstDocument || t('noDocs')}
          </span>
        </Link>

        <div className="mt-auto pt-6">
          <div className="relative overflow-hidden rounded-2xl border border-[#7d70e7]/20 bg-gradient-to-br from-[#3b3376]/25 to-[#142a3d]/25 p-4">
            <div className="absolute -right-8 -top-8 size-24 rounded-full bg-[#8375ff]/15 blur-2xl" />
            <div className="relative mb-2 flex items-center gap-2 text-[#bdb5ff]">
              <Zap size={15} />
              <span className="text-xs font-semibold">Nexa Intelligence</span>
            </div>
            <p className="relative text-[11px] leading-5 text-[#8995ad]">
              {t('footer')}
            </p>
            <div className="relative mt-3 flex items-center gap-1.5 text-[10px] text-[#6f7c94]">
              <ShieldCheck size={12} />
              <span>Cookie-secured API</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between px-2 text-[10px] text-[#58647b]">
            <span>v1.3.0</span>
            <Activity size={14} />
          </div>
        </div>
      </div>
    </aside>
  );
}
