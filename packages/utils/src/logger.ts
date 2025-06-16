interface ICatalystLoggerOptions {
	enable_info: boolean;
	enable_warn: boolean;
	enable_error: boolean;
	enable_debug: boolean;
}

export enum LEVEL {
	INFO = 'info',
	WARN = 'warn',
	ERROR = 'error',
	DEBUG = 'debug',
	ALL = 'all',
	NONE = 'none'
}

class Logger {
	logOptions: ICatalystLoggerOptions;

	constructor(options?: ICatalystLoggerOptions) {
		this.logOptions = {
			enable_debug: options?.enable_debug || false,
			enable_error: options?.enable_error || false,
			enable_info: options?.enable_info || false,
			enable_warn: options?.enable_warn || false
		};
	}

	#getTimestamp(): string {
		return new Date().toISOString();
	}

	info(message: string): void {
		if (this.logOptions.enable_info) {
			this.#logToConsole(`[INFO] [${this.#getTimestamp()}] : ${message}`);
		}
	}

	warn(message: string): void {
		if (this.logOptions.enable_warn) {
			this.#logToConsole(`[WARN] [${this.#getTimestamp()}] : ${message}`);
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

	#logToConsole(message: string): void {
		// eslint-disable-next-line no-console
		console.log(message);
	}

	#resetLogLevels(): void {
		this.logOptions = {
			enable_debug: false,
			enable_error: false,
			enable_info: false,
			enable_warn: false
		};
	}

	setLogLevel(level: LEVEL = LEVEL.ALL): void {
		// reset log levels
		this.#resetLogLevels();
		switch (level) {
			case LEVEL.INFO:
				this.logOptions.enable_info = true;
				break;
			case LEVEL.WARN:
				this.logOptions.enable_warn = true;
				break;
			case LEVEL.ERROR:
				this.logOptions.enable_error = true;
				break;
			case LEVEL.DEBUG:
				this.logOptions.enable_debug = true;
				break;
			case LEVEL.ALL:
				this.logOptions = {
					enable_debug: true,
					enable_error: true,
					enable_info: true,
					enable_warn: true
				};
				break;
			case LEVEL.NONE:
				this.logOptions = {
					enable_debug: false,
					enable_error: false,
					enable_info: false,
					enable_warn: false
				};
				break;
		}
	}
}
const logger = new Logger();

export { logger };
