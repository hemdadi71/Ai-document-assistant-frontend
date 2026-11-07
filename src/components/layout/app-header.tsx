'use client';

import { Globe2, LogIn, LogOut, Menu, Settings2, UserRound } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Brand } from './brand';

export function AppHeader({
  online,
  project,
  userName,
  onLogout,
  onLogin,
  onMenu,
}: {
  online: boolean;
  project?: string;
  userName?: string;
  onLogout?: () => void;
  onLogin?: () => void;
  onMenu: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations('app');
  const router = useRouter();
  const pathname = usePathname();
  const switchLocale = () =>
    router.replace(`${pathname}${window.location.search}`, { locale: locale === 'fa' ? 'en' : 'fa' });

  return (
    <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#090d18]/85 backdrop-blur-2xl">
      <div className="mx-auto flex h-[76px] max-w-[1600px] items-center justify-between px-4 sm:px-7 lg:px-10">
        <div className="flex items-center gap-3">
          <button onClick={onMenu} className="focus-ring rounded-xl border border-white/10 p-2 lg:hidden" aria-label="Toggle navigation">
            <Menu size={18} />
          </button>
          <Brand />
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-white/[.08] bg-white/[.025] px-3.5 py-2 md:flex">
          <span className={`size-1.5 rounded-full ${online ? 'bg-[#55d6b0] shadow-[0_0_10px_#55d6b0]' : 'bg-[#e4ad69]'}`} />
          <span className="text-xs text-[#9aa5ba]">{online ? t('online') : t('offline')}</span>
          <span className="mx-1 h-3 w-px bg-white/10" />
          <span className="text-xs text-[#77839a]">{project || '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          {userName && (
            <div className="hidden items-center gap-2 rounded-xl border border-white/10 px-3 py-2 sm:flex">
              <UserRound size={14} className="text-[#a99eff]" />
              <span className="max-w-28 truncate text-xs text-[#c4cbe0]">{userName}</span>
            </div>
          )}
          <button onClick={switchLocale} className="focus-ring flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-[#c4cbe0] transition hover:border-[#8173ef]/50 hover:bg-white/5">
            <Globe2 size={15} /><span>{locale === 'fa' ? 'EN' : 'فا'}</span>
          </button>
          <button onClick={() => router.push('/settings')} className="focus-ring grid size-9 place-items-center rounded-xl border border-white/10 text-[#9ba6bc] hover:bg-white/5" title={t('settings')}>
            <Settings2 size={17} />
          </button>
          {onLogin && (
            <button onClick={onLogin} className="focus-ring grid size-9 place-items-center rounded-xl border border-white/10 text-[#a99eff] hover:bg-white/5" title={t('login')}>
              <LogIn size={16} />
            </button>
          )}
          {onLogout && (
            <button onClick={onLogout} className="focus-ring grid size-9 place-items-center rounded-xl border border-white/10 text-[#d49a9a] hover:border-[#e49a83]/30 hover:bg-[#e49a83]/10" title={t('logout')}>
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
