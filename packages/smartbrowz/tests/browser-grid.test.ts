import { Smartbrowz } from '../src';

const { responses } = require('../../../tests/api-responses.js');

describe('testing smartbrowz browser grid', () => {
	const smartbrowz: Smartbrowz = new Smartbrowz();

	it('browser grid get all grids', async () => {
		await expect(smartbrowz.browserGrid().getGrid()).resolves.toStrictEqual(
			responses['/browser-grid'].GET.data.data
		);
	});

	it('browser grid get grid by id', async () => {
		await expect(smartbrowz.browserGrid().getGrid('testGrid')).resolves.toStrictEqual(
			responses['/browser-grid/testGrid'].GET.data.data
		);
		await expect(smartbrowz.browserGrid().getGrid('')).rejects.toThrowError();
	});

	it('browser grid get grid nodes', async () => {
		await expect(smartbrowz.browserGrid().getGridNodes('testGrid')).resolves.toStrictEqual(
			responses['/browser-grid/testGrid/stats?data_to_fetch=live_stats'].GET.data.data
		);
		await expect(smartbrowz.browserGrid().getGridNodes('')).rejects.toThrowError();
	});

	it('browser grid stop grid', async () => {
		await expect(smartbrowz.browserGrid().stopGrid('testGrid')).resolves.toBeUndefined();
		await expect(smartbrowz.browserGrid().stopGrid('')).rejects.toThrowError();
	});
});
