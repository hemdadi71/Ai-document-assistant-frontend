/**
 * Browser-side authentication state.
 *
 * Access/refresh cookies are HttpOnly and are managed exclusively by the backend.
 * JavaScript only keeps the CSRF token in memory because it must be echoed in
 * X-CSRF-Token for unsafe cookie-authenticated requests.
 */

const LEGACY_AUTH_STORAGE_KEY = 'nexa-auth-tokens';

let csrfToken: string | null = null;

export function clearLegacyAuthTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
  }
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

export function clearCsrfToken(): void {
  csrfToken = null;
}
