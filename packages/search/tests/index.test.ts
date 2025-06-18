import { ZCAuth } from '../../auth/src';
import { Search } from '../src';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('search', () => {
	const app = new mockedApp().init();
	const search: Search = new Search(app);
	const searchRes = {
		['/search']: {
			POST: {
				statusCode: 200,
				data: {
					data: {
						testData: [
							{
								testData: 'test'
							}
						]
					}
				}
			}
		}
	};
	app.setRequestResponseMap(searchRes);
	it('execute search query', async () => {
		await expect(
			search.executeSearchQuery({
				search: 'test',
				search_table_columns: {
					test_table: ['test_column']
				},
				select_table_columns: {
					test_table: ['test_column']
				},
				order_by: {
					test_column: 'test_column'
				},
				start: 0,
				end: 10
			})
		).resolves.toStrictEqual({
			testData: [
				{
					testData: 'test'
				}
			]
		});
		await expect(
			search.executeSearchQuery({
				search: 'test',
				search_table_columns: {
					test_table: ['test_column']
				}
			})
		).resolves.toStrictEqual({
			testData: [
				{
					testData: 'test'
				}
			]
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await expect((search as any).executeSearchQuery({})).rejects.toThrowError();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await expect((search as any).executeSearchQuery({ xx: 'xx' })).rejects.toThrowError();
	});
});
