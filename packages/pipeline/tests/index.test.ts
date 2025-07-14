import { ZCAuth } from '../../auth/src';
import { Pipeline } from '../src';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('test :: pipeline', () => {
	const app = new mockedApp().init();
	const pipeline: Pipeline = new Pipeline(app);
	const pipelineId = '1234';

	const pipelineReqCollections = {
		[`/pipeline/1234`]: {
			GET: {
				statusCode: 200,
				data: {
					data: {
						pipeline_id: '1234',
						name: 'pipeline',
						description: 'pipeline description',
						project_details: {
							id: '1234',
							name: 'project_name'
						},
						created_by: {
							first_name: 'first_name',
							last_name: 'last_name',
							user_id: '213456786',
							email: 'hello@zohotest.com',
							is_confirmed: true,
							zuid: '2134564'
						},
						created_time: '2021-09-01T00:00:00.000Z',
						modified_by: {
							first_name: 'first_name',
							last_name: 'last_name',
							user_id: '213456786',
							email: 'hello@zohotest.com',
							is_confirmed: true,
							zuid: '2134564'
						},
						modified_time: '2021-09-01T00:00:00.000Z',
						repo_id: '1234',
						git_service: 'github',
						git_account_id: '1234',
						mask_regex: ['mask'],
						env_variables: { key: 'value' },
						pipeline_status: 'active',
						extra_details: { key: 'value' },
						config_id: 1234,
						integ_id: 1234,
						trigger_build: true
					}
				}
			}
		},
		[`/pipeline/1234/run`]: {
			POST: {
				statusCode: 200,
				data: {
					data: {
						history_id: '1234',
						pipeline_id: '1234',
						event_time: '2021-09-01T00:00:00.000Z',
						event_details: { key: 'value' },
						history_status: 'success'
					}
				}
			}
		}
	};

	app.setRequestResponseMap(pipelineReqCollections);
	it('get pipeline details', async () => {
		await expect(pipeline.getPipelineDetails(pipelineId)).resolves.toStrictEqual(
			pipelineReqCollections['/pipeline/1234'].GET.data.data
		);
		await expect(pipeline.getPipelineDetails('')).rejects.toThrowError();
	});

	it('run pipeline', async () => {
		await expect(pipeline.runPipeline(pipelineId)).resolves.toStrictEqual(
			pipelineReqCollections['/pipeline/1234/run'].POST.data.data
		);
		await expect(pipeline.runPipeline('')).rejects.toThrowError();
	});
});
