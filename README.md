# Nexa AI — Frontend

A bilingual, responsive Next.js workspace for the FastAPI document assistant. The codebase is split by feature and responsibility rather than keeping the entire application inside one dashboard component.

## Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS v4
- TanStack Query v5
- next-intl (`/fa` and `/en` locale routing)
- Lucide icons

## Architecture

```text
src/
├── app/[locale]/
│   ├── dashboard/       # RAG / chat workspace
│   ├── library/         # PDF upload and document management
│   └── settings/        # API connection and health status
├── components/
│   ├── assistant/       # Chat workspace, messages, composer, modes
│   ├── documents/       # Upload dropzone and document list
│   ├── layout/          # Header, sidebar, brand, application shell
│   ├── settings/        # API settings form and connection status
│   └── ui/              # Reusable page heading and confirmation dialog
├── hooks/               # Shared TanStack Query hooks
├── i18n/                # Locale routing and request configuration
└── lib/                 # API client, types, query keys
```

## Real backend endpoints used

| Method | Route | Frontend feature |
|---|---|---|
| GET | `/health` | Connection status and feature flags |
| GET | `/documents` | Document library and dashboard metrics |
| POST | `/upload` | PDF upload and indexing |
| DELETE | `/documents/{filename}` | Document deletion |
| POST | `/chat` | Chat and hybrid modes |
| POST | `/chat-stream` | Streaming RAG mode |

All requests use the backend's `X-API-Key` authentication. The backend resolves the project from that key; the frontend does not send an arbitrary project ID.

## Run locally

1. Use Node.js 22.12+.
2. In the frontend directory, copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` if the API is not running at `http://localhost:8000`.
3. Install dependencies and run:

```bash
npm install
npm run dev
```

4. Open `http://localhost:3000/fa/dashboard` or `http://localhost:3000/en/dashboard`.
5. Open **Connection settings**, enter the FastAPI base URL and the API key configured for your project in the backend `.env` file. The key must be at least 32 characters.

## Backend CORS configuration

The supplied backend did not originally enable CORS. The companion backend patch in this delivery adds a configurable allowlist. Add this to the backend `.env`:

```env
FRONTEND_ORIGINS=http://localhost:3000
```

For production, set the exact deployed frontend origin(s), comma-separated. Do not use `*` with a credentialed browser architecture.

## Security note

This direct-to-API development setup stores the project API key in browser `localStorage`. It is suitable for local integration and a controlled demo, not a public multi-user deployment. Before production, introduce a server-side BFF/session layer, user authentication and authorization, rate limiting, audit logging, and server-side secret storage. Do not distribute a shared project API key to untrusted users.

## Backend contract boundaries

- Project identity is inferred from the API key. No project switcher is shown because the backend has no project-list endpoint.
- The backend has no conversation-history endpoint. Messages live in the current page session; the `conversation_id` returned by `/chat` is reused for subsequent non-streaming chat/hybrid requests.
- `/chat-stream` currently supports RAG only and returns plain text. Its current response does not include structured source metadata or a conversation ID.
- Document deletion is filename-based because the backend does not expose stable document IDs.

## Quality commands

```bash
npm run typecheck
npm run lint
npm run build
```


## LLM 403 handling

The API client preserves HTTP status codes through `ApiError`. If a chat or
RAG-stream request returns HTTP 403, the chat workspace displays a localized
Sonner toast recommending that the user enable a VPN and retry. Other HTTP
errors continue through the existing error UI.


## Account authentication and conversation history

The browser app uses the backend's JWT authentication endpoints:

- `POST /auth/register` creates the user account.
- After registration, the UI signs in through `POST /auth/login` because registration does not create a session.
- `GET /auth/me` restores the signed-in user after a reload.
- `POST /auth/refresh` rotates the refresh token when an API request receives `401`.
- `POST /auth/logout` revokes the current session.
- Access tokens are sent in the `Authorization: Bearer <token>` header.
- The optional project ID on the auth form selects the backend project; leaving it blank uses the backend default.

Conversation history is connected to the authenticated endpoints:

- `GET /conversations?limit=50` populates the sidebar.
- `GET /conversations/{conversation_id}` loads a selected conversation.
- `DELETE /conversations/{conversation_id}` removes a conversation.
- Standard chat requests and RAG streaming requests include the active `conversation_id`.
- The streaming client reads `X-Conversation-ID` from the response header. The backend CORS configuration must expose this header (the supplied backend already does).

Routes:
- `/fa/login`, `/en/login`
- `/fa/register`, `/en/register`
- `/fa/dashboard?conversation=<uuid>` opens a saved conversation.

The legacy project API key remains optional for backward compatibility. JWT user authentication takes precedence when both are present. Tokens are stored in browser localStorage in this implementation; for public production deployment, move them behind a server-side BFF and Secure, HttpOnly, SameSite cookies.
