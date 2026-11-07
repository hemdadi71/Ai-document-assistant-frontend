# Route protection (Next.js 16 Proxy)

- The legacy `src/middleware.ts` has been removed.
- `src/proxy.ts` is the single owner of route redirects.
- `next-intl` locale routing remains integrated through `createMiddleware(routing)`.
- Protected routes: `/dashboard`, `/library`, `/settings` and nested paths.
- Unauthenticated users (no backend-owned `ai_access_token` or `ai_refresh_token`
  cookie) are redirected to the login page for the same locale.
- Users with an auth cookie who visit `/login` or `/register` are redirected
  to the localized dashboard. The `?forceLogin=1` query is a recovery escape hatch
  used only when AuthProvider detects that a stale cookie cannot authenticate.
- Locale roots (`/fa`, `/en`) route to dashboard when a session cookie exists,
  otherwise to login.
- Proxy checks cookie presence only. Cookies are HttpOnly and owned by the
  backend; Proxy does not decode or validate token contents.
- `AuthProvider` still calls `/auth/csrf` and `/auth/me` to restore CSRF state
  and obtain the current user. It does not perform navigation redirects.
- `AppShell` is presentation/layout only. It waits for AuthProvider before
  rendering private workspace content, but it does not redirect routes.
- The backend remains the security boundary and must authorize every private API.

## Logout

The frontend calls `POST /auth/logout`. Only after the backend confirms success
and expires its HttpOnly cookies does the client navigate to `/login` and refresh
the route so Proxy evaluates the request without the old cookies.
