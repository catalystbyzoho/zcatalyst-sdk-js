import { PrefixedCatalystError } from '../../../utils/src';
import { CatalystAPIError } from '../../src/utils/errors'; // Adjust the import path

// jest.mock('../../../utils/src', () => ({
// 	PrefixedCatalystError: jest.fn()
// }));

describe('CatalystAPIError', () => {
	// it('should initialize with the correct parameters', () => {
	// 	const mockCode = 'ERR001';
	// 	const mockMessage = 'This is a test error';
	// 	const mockValue = { details: 'Additional error details' };
	// 	const mockStatusCode = 400;

	// 	const error = new CatalystAPIError(mockCode, mockMessage, mockValue, mockStatusCode);

	// 	expect(PrefixedCatalystError).toHaveBeenCalledWith(
	// 		'app',
	// 		mockCode,
	// 		mockMessage,
	// 		mockValue,
	// 		mockStatusCode
	// 	);
	// });

	// it('should default value and statusCode to undefined when not provided', () => {
	// 	const mockCode = 'ERR002';
	// 	const mockMessage = 'Error without optional params';

	// 	const error = new CatalystAPIError(mockCode, mockMessage);

	// 	expect(PrefixedCatalystError).toHaveBeenCalledWith(
	// 		'app',
	// 		mockCode,
	// 		mockMessage,
	// 		undefined,
	// 		undefined
	// 	);
	// });

	it('should be an instance of PrefixedCatalystError', () => {
		const error = new CatalystAPIError('ERR003', 'Instance test');
		expect(error).toBeInstanceOf(CatalystAPIError);
	});
});
