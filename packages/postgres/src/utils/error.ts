import { PrefixedCatalystError } from '@zcatalyst/utils';

/** Represents validation, configuration and query errors raised by the Postgres component. */
export class CatalystPostgresError extends PrefixedCatalystError {
	/** Creates a Postgres error with a Catalyst application error prefix. */
	constructor(code: string, message: string, value?: unknown, statusCode?: number) {
		super('app', code, message, value, statusCode);
	}
}

const QUOTES = /^(['"`])([\s\S]*)\1$/;

/**
 * Converts a transport failure into a CatalystPostgresError. The PostgREST body (code, message,
 * details, hint) is parsed and exposed as `value`; the HTTP status is kept as `statusCode`.
 * Errors without an HTTP status (network failures, existing Catalyst errors) are returned as is.
 */
export function toPostgresError(e: unknown): unknown {
	if (e instanceof CatalystPostgresError || typeof e !== 'object' || e === null) {
		return e;
	}
	const { statusCode, message, code } = e as {
		statusCode?: number;
		message?: unknown;
		code?: unknown;
	};
	if (typeof statusCode !== 'number') {
		return e;
	}
	let body: Record<string, unknown> | undefined;
	if (typeof message === 'string') {
		const raw = message.trim().replace(QUOTES, '$2');
		try {
			const parsed = JSON.parse(raw);
			if (parsed && typeof parsed === 'object') {
				body = parsed;
			}
		} catch {
			// not a JSON body; keep the message as is
		}
	}
	const text =
		typeof body?.message === 'string'
			? body.message
			: typeof message === 'string'
				? message
				: `Request failed with status ${statusCode}`;
	const errCode = typeof code === 'string' ? code.replace(/^app\//, '') : undefined;
	return new CatalystPostgresError(
		`HTTP_ERROR_${statusCode}`,
		text,
		body ?? (errCode ? { code: errCode } : undefined),
		statusCode
	);
}
