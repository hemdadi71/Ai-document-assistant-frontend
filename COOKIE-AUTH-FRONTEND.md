# Nexa AI frontend: cookie authentication and Axios

## Authentication contract used by this frontend

This implementation follows the backend in `COOKIE_AUTH_UPDATE.md`.

- `POST /auth/login` and `POST /auth/register` set `ai_access_token`, `ai_refresh_token`, and `ai_csrf_token` with `Set-Cookie`.
- Register creates the session itself; the frontend does not call login again after registration.
- Access and refresh tokens are HttpOnly. The frontend never reads or stores them.
- `GET /auth/csrf` restores the CSRF value after a reload. The value is kept in JavaScript memory only.
- Axios sends cookies with `withCredentials: true`.
- The Axios request interceptor attaches `X-CSRF-Token` to POST, PUT, PATCH and DELETE requests.
- The Axios response interceptor refreshes a session once after a 401, shares concurrent refresh requests, updates the in-memory CSRF value, and retries the original request.
- `POST /auth/logout` is sent with the CSRF header. The backend revokes the session and expires cookies; the frontend then clears its in-memory CSRF value and redirects to login.

## Streaming

The `/chat-stream` endpoint uses Axios `responseType: 'text'` with `onDownloadProgress` so progressive text can be consumed while still using the same Axios request/response interceptors. All other API calls also use Axios.

## Refactoring

- `FormField` centralizes auth field labels, hints and validation messages.
- `LoadingScreen` is shared by protected-route loading states.
- `ConversationHistory` is separated from the sidebar and uses the reusable `ConfirmDialog` instead of `window.confirm`.
- Login and registration share one React Hook Form-based `AuthForm`.

## Environment

Frontend `.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Backend local development:

```dotenv
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAMESITE=lax
FRONTEND_ORIGINS=http://localhost:3000
```

For production, use HTTPS, set `AUTH_COOKIE_SECURE=true`, and set `FRONTEND_ORIGINS` to the exact frontend origin. Configure cookie domain/SameSite according to the actual frontend/API domains.

## Install

Run `npm install` after receiving these changes. It installs Axios and React Hook Form and updates `package-lock.json`. Do not run `npm ci` against the old lockfile before running `npm install`.

## Important

The browser must be able to accept backend cookies. Frontend and backend origins must be configured correctly for credentialed CORS. Do not add `Authorization: Bearer` headers or read cookies from JavaScript.
