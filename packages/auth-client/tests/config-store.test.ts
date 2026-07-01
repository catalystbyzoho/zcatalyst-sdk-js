import { ConfigStore } from '../src/config-store';
import { PROJECT_ID, ZAID } from '../src/utils/constants';

describe('ConfigStore', () => {
	beforeEach(() => {
		ConfigStore.clear();
	});

	describe('set and get', () => {
		it('should store and retrieve values', () => {
			ConfigStore.set(PROJECT_ID, 'test-project-123');
			expect(ConfigStore.get(PROJECT_ID)).toBe('test-project-123');
		});

		it('should store and retrieve multiple values', () => {
			ConfigStore.set(PROJECT_ID, 'project-123');
			ConfigStore.set(ZAID, 'zaid-456');

			expect(ConfigStore.get(PROJECT_ID)).toBe('project-123');
			expect(ConfigStore.get(ZAID)).toBe('zaid-456');
		});

		it('should return undefined for non-existent keys', () => {
			expect(ConfigStore.get('NON_EXISTENT_KEY')).toBeUndefined();
		});

		it('should convert numbers to strings when storing', () => {
			ConfigStore.set('TEST_NUMBER', 12345);
			expect(ConfigStore.get('TEST_NUMBER')).toBe('12345');
		});

		it('should convert objects to strings when storing', () => {
			const obj = { test: 'value' };
			ConfigStore.set('TEST_OBJECT', obj);
			expect(ConfigStore.get('TEST_OBJECT')).toBe('[object Object]');
		});
	});

	describe('clear', () => {
		it('should clear all stored values', () => {
			ConfigStore.set(PROJECT_ID, 'test');
			ConfigStore.set(ZAID, 'test');

			ConfigStore.clear();

			expect(ConfigStore.get(PROJECT_ID)).toBeUndefined();
			expect(ConfigStore.get(ZAID)).toBeUndefined();
		});

		it('should clear all values even after multiple sets', () => {
			ConfigStore.set(PROJECT_ID, 'test1');
			ConfigStore.set(ZAID, 'test2');
			ConfigStore.set('CUSTOM_KEY', 'test3');

			ConfigStore.clear();

			expect(ConfigStore.get(PROJECT_ID)).toBeUndefined();
			expect(ConfigStore.get(ZAID)).toBeUndefined();
			expect(ConfigStore.get('CUSTOM_KEY')).toBeUndefined();
		});
	});

	describe('has', () => {
		it('should return true for existing keys', () => {
			ConfigStore.set(PROJECT_ID, 'test');
			expect(ConfigStore.has(PROJECT_ID)).toBe(true);
		});

		it('should return false for non-existent keys', () => {
			expect(ConfigStore.has('NON_EXISTENT')).toBe(false);
		});

		it('should return false after clearing', () => {
			ConfigStore.set(PROJECT_ID, 'test');
			expect(ConfigStore.has(PROJECT_ID)).toBe(true);

			ConfigStore.clear();

			expect(ConfigStore.has(PROJECT_ID)).toBe(false);
		});
	});
});
