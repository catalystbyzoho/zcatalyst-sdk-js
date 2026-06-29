import { QuickML } from '../src';

const { responses } = require('../../../tests/api-responses.js');

describe('testing quick ml', () => {
	const quickml: QuickML = new QuickML();

	it('getComponentName returns correct name', () => {
		expect(quickml.getComponentName()).toBe('quickml');
	});

	it('getComponentVersion returns package version', () => {
		expect(quickml.getComponentVersion()).toBe(require('../package.json').version);
	});

	it('quick ml endpoint predict', async () => {
		await expect(
			quickml.predict('1234abcd', {
				sepal_length: '6.4',
				sepal_width: '3.2',
				petal_length: '4.5',
				petal_width: '1.5'
			})
		).resolves.toStrictEqual({ data: responses['/endpoints/predict'].POST.data.data });
		await expect(
			quickml.predict('', {
				sepal_length: '6.4',
				sepal_width: '3.2',
				petal_length: '4.5',
				petal_width: '1.5'
			})
		).rejects.toThrowError();
		await expect(quickml.predict('1234abcd', {})).rejects.toThrowError();
	});
});
