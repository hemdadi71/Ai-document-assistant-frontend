'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useWorkspaceData } from '@/hooks/use-workspace-data';
import { useAuth } from '@/components/auth/auth-provider';

import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';
import { LoadingScreen } from '@/components/ui/loading-screen';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations('app');

  const { user, loading, signOut } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage =
    pathname === '/login' || pathname === '/register';

  const { health, documents } = useWorkspaceData(Boolean(user));

  // Proxy owns all route redirects. Auth pages should render immediately;
  // the backend session check remains in AuthProvider for user data/UI state.
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Avoid rendering private workspace content until /auth/me resolves.
  if (loading) {
    return <LoadingScreen />;
  }

  // Normally Proxy redirects requests without cookies. This fallback covers
  // stale/invalid cookies without duplicating redirect logic in AppShell.
  if (!user) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-5 text-center">
        <div className="max-w-md rounded-2xl border border-white/10 bg-white/[.03] p-7">
          <h1 className="text-lg font-semibold text-white">
            {t('sessionUnavailable')}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#9aa5ba]">
            {t('sessionUnavailableDescription')}
          </p>
          <Link
            href={{ pathname: '/login', query: { forceLogin: '1' } }}
            className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-[#8274ec] to-[#5b9dbd] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            {t('goToLogin')}
          </Link>
        </div>
      </main>
    );
  }

  const handleLogout = async () => {
    try {
      // Backend revokes the session and expires its HttpOnly cookies.
      await signOut();

      queryClient.clear();

      // Navigate only after the backend confirms logout and Set-Cookie
      // has been processed by the browser.
      router.replace('/login');
      router.refresh();
    } catch {
      toast.error(t('error'));
    }
  };

  return (
    <div className="min-h-screen text-[#edf0fa]">
      <AppHeader
        online={Boolean(health.data)}
        project={health.data?.project || user.project_id}
        userName={user.username}
        onLogout={handleLogout}
        onMenu={() => setMenuOpen(value => !value)}
      />

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-0 px-0 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-7 lg:px-7 xl:px-10">
        <AppSidebar
          open={menuOpen}
          onNavigate={() => setMenuOpen(false)}
          count={documents.data?.count}
          firstDocument={documents.data?.documents[0]?.filename}
          showHistory
        />

        <main className="min-w-0 px-4 pb-8 pt-6 sm:px-7 lg:px-0 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
