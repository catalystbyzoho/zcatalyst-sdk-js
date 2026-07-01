/**
 * Helpers that keep the browser-side `stratus_jwt` cookie aligned with the
 * currently active Catalyst project session.
 *
 * The Catalyst SDK mints a `stratus_jwt` cookie on demand and caches it in
 * memory inside the Stratus client. When the surrounding application logs the
 * user into a different project, the project session cookies are rotated by
 * the auth service but the stale `stratus_jwt` (and its in-memory copy) keep
 * being used until the next full sign-out. These helpers detect that switch
 * and invalidate both copies.
 *
 * @packageDocumentation
 */

import type { CatalystConfig } from './interfaces';

const PROJECT_CONTEXT_KEY = '__catalyst_last_project_ctx';

/**
 * `sessionStorage` key holding a monotonically increasing version number.
 * Other modules (notably the Stratus JWT handler) read it before returning a
 * cached access token so they can flush their in-memory state when a project
 * switch occurs in the same page lifetime.
 */
export const STRATUS_SESSION_VERSION_KEY = '__catalyst_stratus_session_version';

/**
 * `sessionStorage` key storing the absolute epoch-ms at which the active
 * `stratus_jwt` cookie will expire. Mirrors the cookie's `Max-Age` so callers
 * can detect imminent expiry — JavaScript cannot read a cookie's expiry
 * directly.
 */
export const STRATUS_JWT_EXPIRY_KEY = '__catalyst_stratus_jwt_expires_at';

/**
 * Safety margin (ms) subtracted from the stored expiry when deciding whether
 * the cookie is still usable. Prevents handing out a token that will expire
 * mid-flight.
 */
export const STRATUS_JWT_EXPIRY_SKEW_MS = 30_000;

/** Cookie name minted by the Stratus client for browser-side requests. */
export const STRATUS_JWT_COOKIE = 'stratus_jwt';

/**
 * Removes the `stratus_jwt` cookie reliably.
 *
 * Uses both `Max-Age=0` and a 1970 `Expires` date so every spec-compliant
 * browser treats the cookie as expired regardless of clock skew. Also wipes
 * the persisted expiry marker so subsequent freshness checks don't rely on
 * stale metadata.
 *
 * @example
 * ```ts
 * import { clearStratusJwt } from '@zcatalyst/auth-client';
 * await clearStratusJwt();
 * ```
 */
export function clearStratusJwt(): void {
	if (typeof document === 'undefined') {
		return;
	}
	document.cookie = `${STRATUS_JWT_COOKIE}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
	if (typeof window !== 'undefined') {
		try {
			window.sessionStorage?.removeItem(STRATUS_JWT_EXPIRY_KEY);
		} catch {
			/* ignore */
		}
	}
}

/**
 * Records when the current `stratus_jwt` cookie will expire.
 *
 * @param expiresAtMs - Absolute epoch-ms expiry timestamp.
 *
 * @example
 * ```ts
 * import { setStratusJwtExpiry } from '@zcatalyst/auth-client';
 * await setStratusJwtExpiry();
 * ```
 */
export function setStratusJwtExpiry(expiresAtMs: number): void {
	if (typeof window === 'undefined' || !Number.isFinite(expiresAtMs)) {
		return;
	}
	safeWrite(window.sessionStorage ?? null, STRATUS_JWT_EXPIRY_KEY, String(expiresAtMs));
}

/**
 * Returns the persisted `stratus_jwt` expiry timestamp, or `0` when none has
 * been recorded.
 * @returns The getStratusJwtExpiry result.
 *
 * @example
 * ```ts
 * import { getStratusJwtExpiry } from '@zcatalyst/auth-client';
 * await getStratusJwtExpiry();
 * ```
 */
export function getStratusJwtExpiry(): number {
	if (typeof window === 'undefined') {
		return 0;
	}
	const raw = safeRead(window.sessionStorage ?? null, STRATUS_JWT_EXPIRY_KEY);
	const parsed = raw ? Number(raw) : 0;
	return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Reports whether the current `stratus_jwt` cookie should still be trusted.
 *
 * Returns `true` only when both:
 * - the persisted expiry is known and lies further than the safety skew in
 *   the future; **and**
 * - the cookie itself is still present in `document.cookie`.
 *
 * If no expiry has been recorded (e.g. the cookie was set by an older SDK
 * version), the function falls back to "cookie present" so existing sessions
 * are not invalidated unnecessarily.
 * @returns The isStratusJwtFresh result.
 *
 * @example
 * ```ts
 * import { isStratusJwtFresh } from '@zcatalyst/auth-client';
 * await isStratusJwtFresh();
 * ```
 */
export function isStratusJwtFresh(): boolean {
	if (!hasStratusJwtCookie()) {
		return false;
	}
	const expiry = getStratusJwtExpiry();
	if (expiry === 0) {
		return true;
	}
	return expiry - STRATUS_JWT_EXPIRY_SKEW_MS > Date.now();
}

/** Returns whether a `stratus_jwt` cookie is currently present. */
function hasStratusJwtCookie(): boolean {
	if (typeof document === 'undefined') {
		return false;
	}
	return document.cookie.split(';').some((c) => c.trim().startsWith(`${STRATUS_JWT_COOKIE}=`));
}

/**
 * Builds a stable composite key describing the active project session. Any
 * change to project id, ZAID, project domain or environment is treated as a
 * project switch.
 */
function buildContextKey(creds: Partial<CatalystConfig> | undefined): string {
	if (!creds) {
		return '';
	}
	return [
		(creds as Record<string, unknown>).project_id ?? '',
		(creds as Record<string, unknown>).zaid ?? '',
		(creds as Record<string, unknown>).project_domain ?? '',
		(creds as Record<string, unknown>).environment ?? ''
	].join('|');
}

function safeRead(storage: Storage | null, key: string): string | null {
	try {
		return storage ? storage.getItem(key) : null;
	} catch {
		return null;
	}
}

function safeWrite(storage: Storage | null, key: string, value: string): void {
	try {
		storage && storage.setItem(key, value);
	} catch {
		/* private mode / disabled storage — best effort */
	}
}

function bumpStratusSessionVersion(): void {
	if (typeof window === 'undefined') {
		return;
	}
	const next = Date.now().toString();
	safeWrite(window.sessionStorage ?? null, STRATUS_SESSION_VERSION_KEY, next);
}

/**
 * Detects whether the active project session has changed since the SDK last
 * persisted it. When a switch is detected (or when persistence is unavailable
 * and we cannot prove otherwise), the stale `stratus_jwt` cookie is cleared
 * and the in-memory session version is bumped so cached tokens elsewhere are
 * invalidated.
 *
 * @param credentials - The credential payload returned by `/sdk/init`.
 * @returns `true` when a project switch was detected and state was reset.
 *
 * @example
 * ```ts
 * import { syncProjectSession } from '@zcatalyst/auth-client';
 * await syncProjectSession();
 * ```
 */
export function syncProjectSession(credentials: Partial<CatalystConfig> | undefined): boolean {
	if (typeof window === 'undefined') {
		return false;
	}
	const next = buildContextKey(credentials);
	if (!next) {
		return false;
	}

	const ls = window.localStorage ?? null;
	const previous = safeRead(ls, PROJECT_CONTEXT_KEY);

	let switched = false;
	if (previous === null) {
		// First run on this origin (or storage unavailable). Defensively clear
		// any stale cookie carried over from a previous SDK version.
		if (hasStratusJwtCookie()) {
			clearStratusJwt();
			switched = true;
		}
	} else if (previous !== next) {
		clearStratusJwt();
		switched = true;
	}

	safeWrite(ls, PROJECT_CONTEXT_KEY, next);
	if (switched) {
		bumpStratusSessionVersion();
	}
	return switched;
}

/**
 * Reads the current Stratus session version. Stratus token caches use this
 * value to decide whether their in-memory access token is still valid.
 * @returns The getStratusSessionVersion result.
 *
 * @example
 * ```ts
 * import { getStratusSessionVersion } from '@zcatalyst/auth-client';
 * await getStratusSessionVersion();
 * ```
 */
export function getStratusSessionVersion(): string {
	if (typeof window === 'undefined') {
		return '';
	}
	return safeRead(window.sessionStorage ?? null, STRATUS_SESSION_VERSION_KEY) ?? '';
}
