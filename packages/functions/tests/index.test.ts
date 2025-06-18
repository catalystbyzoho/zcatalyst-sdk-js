import { ZCAuth } from '../../auth/src';
import { Functions } from '../src';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('Functions Module', () => {
	const app = new mockedApp().init();
	const func: Functions = new Functions(app);

	// Mock response map
	const funcRes = {
		['/function/123/execute']: {
			GET: {
				statusCode: 200,
				data: {
					data: 'Function executed successfully'
				}
			}
		},
		['/function/testFunction/execute']: {
			POST: {
				statusCode: 200,
				data: {
					data: 'Function executed successfully'
				}
			},
			GET: {
				statusCode: 200,
				data: {
					data: 'Function executed successfully'
				}
			}
		}
	};

	app.setRequestResponseMap(funcRes);

	describe('execute function', () => {
		it('should execute a function with default GET method', async () => {
			await expect(func.execute('testFunction')).resolves.toBe(
				'Function executed successfully'
			);
		});

		it('should execute a function with POST method and arguments', async () => {
			await expect(
				func.execute('testFunction', {
					args: {
						test: 'test'
					},
					method: 'POST'
				})
			).resolves.toBe('Function executed successfully');
		});

		it('should execute a function with data payload', async () => {
			await expect(
				func.execute('testFunction', {
					data: {
						test: 'test'
					}
				})
			).resolves.toBe('Function executed successfully');
		});

		it('should execute a function using numeric ID as string', async () => {
			await expect(func.execute('123')).resolves.toBe('Function executed successfully');
		});

		it('should return undefined for non-existent function ID as string', async () => {
			await expect(func.execute('1234')).resolves.toBe(undefined);
		});

		it('should throw an error for empty function name', async () => {
			await expect(func.execute('')).rejects.toThrowError();
		});
	});
});
