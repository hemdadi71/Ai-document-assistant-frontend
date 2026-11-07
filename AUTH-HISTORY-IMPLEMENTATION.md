# Authentication and conversation history implementation

This frontend follows the cookie-authentication contract in the supplied FastAPI backend.

## Authentication

- `POST /auth/register` creates the account, creates a session, and sets the cookies. The frontend does not call login again after registration.
- `POST /auth/login` validates credentials and sets cookies.
- Access and refresh tokens are HttpOnly cookies managed by FastAPI. The frontend never reads or stores these tokens.
- `GET /auth/csrf` restores the CSRF token into JavaScript memory after a reload.
- Axios sends cookies with `withCredentials: true`.
- The Axios request interceptor adds `X-CSRF-Token` to unsafe requests.
- The Axios response interceptor performs one shared refresh operation after a 401, updates the CSRF token and retries the original request.
- `GET /auth/me` restores the current user on reload.
- `POST /auth/logout` asks the backend to revoke the session and expire all auth cookies. The frontend then clears its in-memory CSRF token and redirects to login.

## Conversation history

- `GET /conversations?limit=50` loads the authenticated user's conversation list.
- `GET /conversations/{conversation_id}` loads a selected conversation.
- `DELETE /conversations/{conversation_id}` deletes a conversation after confirmation in a reusable modal.
- `/chat` and `/chat-stream` receive `conversation_id`.
- The streaming endpoint uses Axios XHR download-progress events so text can be displayed progressively while retaining the Axios interceptors.
- After each completed assistant turn, the conversation list is invalidated so titles and timestamps update.

## UI routes

- `/fa/login`, `/en/login`
- `/fa/register`, `/en/register`
- `/fa/dashboard?conversation=<uuid>` to reopen a saved conversation.

## Compatibility and security

The optional legacy project API key remains supported for integrations that still use it. Browser user authentication uses cookies and takes precedence in the backend. The frontend API URL is configured only through `NEXT_PUBLIC_API_URL`; API URL and Project ID are not shown in the authentication or settings forms.

The backend must use credentialed CORS with the exact frontend origin. For local development, configure `FRONTEND_ORIGINS=http://localhost:3000`, `AUTH_COOKIE_SECURE=false`, and `AUTH_COOKIE_SAMESITE=lax`. In production, use HTTPS and set `AUTH_COOKIE_SECURE=true`.

## Validation

TypeScript/TSX syntax, JSON files, and project-local imports were checked. A full typecheck and production build were not run because the package registry was unreachable in the build environment. Run `npm install` first to install Axios and React Hook Form and regenerate the lockfile, then run `npm run typecheck`, `npm run lint`, and `npm run build`.
