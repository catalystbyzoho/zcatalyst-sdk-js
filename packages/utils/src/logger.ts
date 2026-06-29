interface ICatalystLoggerOptions {
	enable_info: boolean;
	enable_warn: boolean;
	enable_error: boolean;
	enable_debug: boolean;
	enable_fine: boolean;
}

/**
 * The `ZCLogger` supports the following log levels based on the precedence, as the level with the highest values will have the most precedence.
 * i.e. the log level acts as a minimum threshold and allows the logs with levels equal to or higher to be logged.
 *
 * For Example, if we set the log level to WARN(4) the levels WARN(4) and ERROR(5) will be logged as they are equal to or higher than the
 * threshold set by log level which is WARN(4). Whereas the logs INFO(3), DEBUG(2) and FINE(1) won't be logged as their level is lesser than the
 * set threshold
 *
 * ```text
 * | Level | Precedence |
 * |-------|------------|
 * | NONE  | INF        |
 * | ALL   | 0          |
 * | FINE  | 1          |
 * | DEBUG | 2          |
 * | INFO  | 3          |
 * | WARN  | 4          |
 * | ERROR | 5          |
 * ```
 */
export enum LEVEL {
	NONE = 'none',
	ALL = 'all',
	FINE = 'fine',
	DEBUG = 'debug',
	INFO = 'info',
	WARN = 'warn',
	ERROR = 'error'
}

export class Logger {
	logOptions: ICatalystLoggerOptions;

	/**
	 * Creates a Logger instance.
	 */
	constructor(options?: ICatalystLoggerOptions) {
		this.logOptions = {
			enable_debug: options?.enable_debug || false,
			enable_error: options?.enable_error || false,
			enable_info: options?.enable_info || false,
			enable_warn: options?.enable_warn || false,
			enable_fine: options?.enable_fine || false
		};
	}

	#getTimestamp(): string {
		return new Date().toISOString();
	}

	/**
	 * Performs info for Logger.
	 *
	 * @param message - The message value.
	 *
	 * @example
	 * ```ts
	 * import { Logger } from '@zcatalyst/utils';
	 * const result = new Logger();
	 * ```
	 */
	info(message: string): void {
		if (this.logOptions.enable_info) {
			this.#logToConsole(`[INFO ] [${this.#getTimestamp()}] : ${message}`);
		}
	}

	/**
	 * Performs warn for Logger.
	 *
	 * @param message - The message value.
	 *
	 * @example
	 * ```ts
	 * import { Logger } from '@zcatalyst/utils';
	 * const result = new Logger();
	 * ```
	 */
	warn(message: string): void {
		if (this.logOptions.enable_warn) {
			this.#logToConsole(`[WARN ] [${this.#getTimestamp()}] : ${message}`);
		}
	}

	/**
	 * Performs error for Logger.
	 *
	 * @param message - The message value.
	 *
	 * @example
	 * ```ts
	 * import { Logger } from '@zcatalyst/utils';
	 * const result = new Logger();
	 * ```
	 */
	error(message: string): void {
		if (this.logOptions.enable_error) {
			this.#logToConsole(`[ERROR] [${this.#getTimestamp()}] : ${message}`);
		}
	}

	/**
	 * Performs debug for Logger.
	 *
	 * @param message - The message value.
	 *
	 * @example
	 * ```ts
	 * import { Logger } from '@zcatalyst/utils';
	 * const result = new Logger();
	 * ```
	 */
	debug(message: string): void {
		if (this.logOptions.enable_debug) {
			this.#logToConsole(`[DEBUG] [${this.#getTimestamp()}] : ${message}`);
		}
	}

	/**
	 * Performs fine for Logger.
	 *
	 * @param message - The message value.
	 *
	 * @example
	 * ```ts
	 * import { Logger } from '@zcatalyst/utils';
	 * const result = new Logger();
	 * ```
	 */
	fine(message: string): void {
		if (this.logOptions.enable_fine) {
			this.#logToConsole(`[FINE ] [${this.#getTimestamp()}] : ${message}`);
		}
	}

	#logToConsole(message: string): void {
		// eslint-disable-next-line no-console
		console.log(message);
	}

	#resetLogLevels(): void {
		this.logOptions = {
			enable_debug: false,
			enable_error: false,
			enable_info: false,
			enable_warn: false,
			enable_fine: false
		};
	}

	/**
	 * Set the log level for the logger.
	 * @param level - the log level to set. Defaults to {@link LEVEL.NONE}
	 * @returns Logger instance
	 *
	 * @example
	 * ```ts
	 * import { Logger } from '@zcatalyst/utils';
	 * const result = new Logger();
	 * ```
	 */
	setLogLevel(level: LEVEL = LEVEL.NONE): Logger {
		// reset log levels
		this.#resetLogLevels();
		switch (level) {
			case LEVEL.ALL:
				this.logOptions.enable_fine = true;
				this.logOptions.enable_debug = true;
				this.logOptions.enable_info = true;
				this.logOptions.enable_warn = true;
				this.logOptions.enable_error = true;
				break;
			case LEVEL.FINE:
				this.logOptions.enable_fine = true;
				this.logOptions.enable_debug = true;
				this.logOptions.enable_info = true;
				this.logOptions.enable_warn = true;
				this.logOptions.enable_error = true;
				break;
			case LEVEL.DEBUG:
				this.logOptions.enable_debug = true;
				this.logOptions.enable_info = true;
				this.logOptions.enable_warn = true;
				this.logOptions.enable_error = true;
				break;
			case LEVEL.INFO:
				this.logOptions.enable_info = true;
				this.logOptions.enable_warn = true;
				this.logOptions.enable_error = true;
				break;
			case LEVEL.WARN:
				this.logOptions.enable_warn = true;
				this.logOptions.enable_error = true;
				break;
			case LEVEL.ERROR:
				this.logOptions.enable_error = true;
				break;
			case LEVEL.NONE: {
				this.logOptions = {
					enable_debug: false,
					enable_error: false,
					enable_info: false,
					enable_warn: false,
					enable_fine: false
				};
				break;
			}
		}
		return this;
	}
}

/**
 * Creates a new Logger instance with the given log level.
 * Prefer this over the global LOGGER singleton when per-component or testable logging is needed.
 *
 * @param level - The log level to set. Defaults to {@link LEVEL.NONE}
 * @returns A new Logger instance
 *
 * @example
 * ```ts
 * import { createLogger } from '@zcatalyst/utils';
 * const result = createLogger();
 * ```
 */
export function createLogger(level: LEVEL = LEVEL.NONE): Logger {
	return new Logger().setLogLevel(level);
}

function getLogLevelFromEnv(): LEVEL {
	if (typeof process !== 'undefined' && process && process.env && process.env.ZC_LOG_LVL) {
		const lvl = process.env.ZC_LOG_LVL.toUpperCase();
		return LEVEL[lvl as keyof typeof LEVEL] || LEVEL.NONE;
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	if (typeof window !== 'undefined' && (window as any).ZC_LOG_LVL) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const lvl = ((window as any).ZC_LOG_LVL as string).toUpperCase();
		return LEVEL[lvl as keyof typeof LEVEL] || LEVEL.NONE;
	}
	return LEVEL.NONE;
}

const processLogLvl = getLogLevelFromEnv();
export const LOGGER = new Logger().setLogLevel(processLogLvl);
