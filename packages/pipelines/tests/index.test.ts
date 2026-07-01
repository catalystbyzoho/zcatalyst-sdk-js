import { Pipelines } from '../src';

const { responses } = require('../../../tests/api-responses.js');

describe('test :: pipelines', () => {
	const pipelines: Pipelines = new Pipelines();
	const pipelineId = '1234';

	it('getComponentName returns correct name', () => {
		expect(pipelines.getComponentName()).toBe('Pipeline');
	});

	it('getComponentVersion returns package version', () => {
		expect(pipelines.getComponentVersion()).toBe(require('../package.json').version);
	});

	it('get pipeline details', async () => {
		await expect(pipelines.getPipelineDetails(pipelineId)).resolves.toStrictEqual(
			responses['/pipeline/1234'].GET.data.data
		);
		await expect(pipelines.getPipelineDetails('')).rejects.toThrowError();
	});

	it('run pipeline', async () => {
		await expect(pipelines.runPipeline(pipelineId)).resolves.toStrictEqual(
			responses['/pipeline/1234/run'].POST.data.data
		);
		await expect(pipelines.runPipeline('')).rejects.toThrowError();
	});
});
