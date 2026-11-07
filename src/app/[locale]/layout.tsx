
import { NextIntlClientProvider } from 'next-intl';
import {
  getMessages,
  setRequestLocale,
} from 'next-intl/server';

import { notFound } from 'next/navigation';

import localFont from 'next/font/local';

import { routing } from '@/i18n/routing';
import { Providers } from '@/components/providers';
import { AppShell } from '@/components/layout/app-shell';

const appFont = localFont({
  src: [
    {
      path: '../../assets/fonts/Vazir.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/Vazir-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../assets/fonts/Vazir-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-app',
});

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'fa' | 'en')) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <Providers>
        <div
          lang={locale}
          dir={locale === 'fa' ? 'rtl' : 'ltr'}
          className={`${appFont.variable} min-h-screen font-sans`}
        >
          <AppShell>{children}</AppShell>
        </div>
      </Providers>
    </NextIntlClientProvider>
  );
}
