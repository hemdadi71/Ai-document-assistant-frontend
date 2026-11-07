# LLM HTTP 403 toast

- `src/lib/api.ts`: introduces `ApiError` and preserves HTTP response status for JSON and streaming calls.
- `src/components/providers.tsx`: mounts the Sonner toast host.
- `src/components/assistant/chat-workspace.tsx`: detects direct HTTP 403 and the supplied backend's wrapped upstream error text (`LLM provider returned HTTP 403`), then displays a localized VPN suggestion.
- `messages/fa.json` and `messages/en.json`: provide localized title and description.
- `package.json`: adds `sonner`.

Install the new dependency with `npm install` before running the app.
