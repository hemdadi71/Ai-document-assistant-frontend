import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

const PROTECTED_ROUTES = ['/dashboard', '/library', '/settings'] as const;
const AUTH_ROUTES = ['/login', '/register'] as const;

function isRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

/**
 * The backend owns these HttpOnly cookies.
 * Proxy checks presence only; it must not read or decode token values.
 */
function hasSessionCookie(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get('ai_access_token')?.value ||
    request.cookies.get('ai_refresh_token')?.value,
  );
}

function redirectToLocalePath(
  request: NextRequest,
  locale: string,
  path: string,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${path === '/' ? '' : path}`;
  url.search = '';
  return NextResponse.redirect(url);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const locale = routing.locales.find(
    candidate =>
      pathname === `/${candidate}` ||
      pathname.startsWith(`/${candidate}/`),
  );

  // Let next-intl handle locale negotiation and unprefixed URLs.
  if (!locale) {
    return handleI18nRouting(request);
  }

  const localizedPath = pathname.slice(locale.length + 1) || '/';
  const hasSession = hasSessionCookie(request);

  // Locale home is the application entry point.
  if (localizedPath === '/') {
    return redirectToLocalePath(
      request,
      locale,
      hasSession ? '/dashboard' : '/login',
    );
  }

  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    isRoute(localizedPath, route),
  );

  if (isProtectedRoute && !hasSession) {
    return redirectToLocalePath(request, locale, '/login');
  }

  // Auth pages are skipped for users with cookies, unless forceLogin=1 is used
  // by the invalid-session fallback so users can recover from stale cookies.
  if (
    hasSession &&
    AUTH_ROUTES.some(route => isRoute(localizedPath, route)) &&
    request.nextUrl.searchParams.get('forceLogin') !== '1'
  ) {
    return redirectToLocalePath(request, locale, '/dashboard');
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)'],
};
