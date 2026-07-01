import { CatalystAppError } from '../src/errors';
import { isNonEmptyString, isValidInputString, wrapValidatorsWithPromise } from '../src/validators';

describe('Validators', () => {
	describe('isNonEmptyString', () => {
		it('should validate non-empty strings', () => {
			expect(() => isNonEmptyString('test', 'field')).not.toThrow();
			expect(() => isNonEmptyString('  test  ', 'field')).not.toThrow();
		});

		it('should throw for empty strings', () => {
			expect(() => isNonEmptyString('', 'field', true)).toThrow();
		});

		it('should throw for non-strings when required', () => {
			expect(() => isNonEmptyString(null as unknown, 'field', true)).toThrow();
			expect(() => isNonEmptyString(undefined as unknown, 'field', true)).toThrow();
			expect(() => isNonEmptyString(123 as unknown, 'field', true)).toThrow();
		});

		it('should not throw for null/undefined when not required', () => {
			expect(() => isNonEmptyString(null as unknown, 'field', false)).not.toThrow();
			expect(() => isNonEmptyString(undefined as unknown, 'field', false)).not.toThrow();
		});
	});

	describe('isValidInputString', () => {
		it('should validate valid input strings', () => {
			expect(() => isValidInputString('validString', 'field')).not.toThrow();
			expect(() => isValidInputString('valid_string_123', 'field')).not.toThrow();
		});

		it('should throw for invalid input strings', () => {
			expect(() => isValidInputString('', 'field', true)).toThrow();
			expect(() => isValidInputString('   ', 'field', true)).toThrow();
		});
	});

	describe('wrapValidatorsWithPromise', () => {
		it('should resolve when validators pass', async () => {
			const validator = () => {
				isNonEmptyString('test', 'field');
			};
			await expect(
				wrapValidatorsWithPromise(validator, CatalystAppError)
			).resolves.toBeUndefined();
		});

		it('should reject when validators fail', async () => {
			const validator = () => {
				isNonEmptyString('', 'field', true);
			};
			await expect(wrapValidatorsWithPromise(validator, CatalystAppError)).rejects.toThrow();
		});
	});
});
