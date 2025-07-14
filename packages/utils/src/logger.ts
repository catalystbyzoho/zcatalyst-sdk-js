import { log } from 'console';

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
 * ```md
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

class Logger {
	logOptions: ICatalystLoggerOptions;

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

	info(message: string): void {
		if (this.logOptions.enable_info) {
			this.#logToConsole(`[INFO ] [${this.#getTimestamp()}] : ${message}`);
		}
	}

	warn(message: string): void {
		if (this.logOptions.enable_warn) {
			this.#logToConsole(`[WARN ] [${this.#getTimestamp()}] : ${message}`);
		}
	}

	error(message: string): void {
		if (this.logOptions.enable_error) {
			this.#logToConsole(`[ERROR] [${this.#getTimestamp()}] : ${message}`);
		}
	}

	debug(message: string): void {
		if (this.logOptions.enable_debug) {
			this.#logToConsole(`[DEBUG] [${this.#getTimestamp()}] : ${message}`);
		}
	}

	fine(message: string): void {
		if (this.logOptions.enable_fine) {
			this.#logToConsole(`[FINE ] [${this.#getTimestamp()}] : ${message}`);
		}
	}

	#logToConsole(message: string): void {
		log(message);
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
	 * @param level the log level to set. Defaults to {@link LEVEL.NONE}
	 * @returns Logger instance
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

const _logLvl = process.env.ZC_LOG_LVL || 'NONE';
const processLogLvl = LEVEL[_logLvl as keyof typeof LEVEL];
export const LOGGER = new Logger().setLogLevel(processLogLvl);
