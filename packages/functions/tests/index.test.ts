import { Functions } from '../src';

const { responses } = require('../../../tests/api-responses.js');

describe('Functions Module', () => {
	const func: Functions = new Functions();

	it('getComponentName returns correct name', () => {
		expect(func.getComponentName()).toBe('Function');
	});

	it('getComponentVersion returns package version', () => {
		expect(func.getComponentVersion()).toBe(require('../package.json').version);
	});

	describe('execute function', () => {
		it('should execute a function with default GET method', async () => {
			await expect(func.execute('testFunction')).resolves.toBe(
				responses['/function/testFunction/execute'].GET.data.data
			);
		});

		it('should execute a function with POST method and arguments', async () => {
			await expect(
				func.execute('testFunction', { args: { test: 'test' }, method: 'POST' })
			).resolves.toBe(responses['/function/testFunction/execute'].POST.data.data);
		});

		it('should execute a function with data payload', async () => {
			await expect(func.execute('testFunction', { data: { test: 'test' } })).resolves.toBe(
				responses['/function/testFunction/execute'].GET.data.data
			);
		});

		it('should execute a function using numeric ID as string', async () => {
			await expect(func.execute('123')).resolves.toBe(
				responses['/function/123/execute'].GET.data.data
			);
		});

		it('should return undefined for non-existent function ID as string', async () => {
			await expect(func.execute('1234')).resolves.toBe(undefined);
		});

		it('should throw an error for empty function name', async () => {
			await expect(func.execute('')).rejects.toThrowError();
		});
	});
});
