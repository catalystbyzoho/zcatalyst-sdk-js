import { CatalystZCQLError } from '../../src/utils/errors';

describe('CatalystZCQLError', () => {
	it('should create an error with the correct properties', () => {
		const error = new CatalystZCQLError('ERROR_CODE', 'This is an error message', {
			key: 'value'
		});

		expect(error).toBeInstanceOf(CatalystZCQLError);
		expect(error.code).toBe('app/ERROR_CODE');
		expect(error.message).toBe('This is an error message');
		expect(error.value).toEqual({ key: 'value' });
	});

	it('should allow creating an error without a value', () => {
		const error = new CatalystZCQLError('ERROR_CODE', 'Error without value');
		expect(error.value).toBeUndefined();
	});
});
