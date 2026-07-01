import { LEVEL, LOGGER } from '../src/logger';

describe('Logger', () => {
	let consoleLogSpy: jest.SpyInstance;

	beforeEach(() => {
		consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
	});

	describe('log levels', () => {
		it('should log info when info is enabled', () => {
			LOGGER.setLogLevel(LEVEL.INFO);
			LOGGER.info('test info message');
			expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO ]'));
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining('test info message')
			);
		});

		it('should log warn when warn is enabled', () => {
			LOGGER.setLogLevel(LEVEL.WARN);
			LOGGER.warn('test warn message');
			expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[WARN ]'));
		});

		it('should log error when error is enabled', () => {
			LOGGER.setLogLevel(LEVEL.ERROR);
			LOGGER.error('test error message');
			expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
		});

		it('should log debug when debug is enabled', () => {
			LOGGER.setLogLevel(LEVEL.DEBUG);
			LOGGER.debug('test debug message');
			expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));
		});

		it('should log fine when fine is enabled', () => {
			LOGGER.setLogLevel(LEVEL.FINE);
			LOGGER.fine('test fine message');
			expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[FINE ]'));
		});
	});

	describe('log level hierarchy', () => {
		it('should log all levels when ALL is set', () => {
			LOGGER.setLogLevel(LEVEL.ALL);
			LOGGER.fine('fine');
			LOGGER.debug('debug');
			LOGGER.info('info');
			LOGGER.warn('warn');
			LOGGER.error('error');
			expect(consoleLogSpy).toHaveBeenCalledTimes(5);
		});

		it('should not log anything when NONE is set', () => {
			LOGGER.setLogLevel(LEVEL.NONE);
			LOGGER.fine('fine');
			LOGGER.debug('debug');
			LOGGER.info('info');
			LOGGER.warn('warn');
			LOGGER.error('error');
			expect(consoleLogSpy).not.toHaveBeenCalled();
		});

		it('should only log ERROR when ERROR level is set', () => {
			LOGGER.setLogLevel(LEVEL.ERROR);
			LOGGER.fine('fine');
			LOGGER.debug('debug');
			LOGGER.info('info');
			LOGGER.warn('warn');
			LOGGER.error('error');
			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
		});

		it('should log WARN and ERROR when WARN level is set', () => {
			LOGGER.setLogLevel(LEVEL.WARN);
			LOGGER.fine('fine');
			LOGGER.debug('debug');
			LOGGER.info('info');
			LOGGER.warn('warn');
			LOGGER.error('error');
			expect(consoleLogSpy).toHaveBeenCalledTimes(2);
		});
	});

	describe('timestamp format', () => {
		it('should include ISO timestamp in log messages', () => {
			LOGGER.setLogLevel(LEVEL.INFO);
			LOGGER.info('test');
			const logCall = consoleLogSpy.mock.calls[0][0];
			expect(logCall).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
		});
	});
});
