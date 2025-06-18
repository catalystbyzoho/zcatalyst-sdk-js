import { ZCAuth } from '../../auth/src';
import { QuickML } from '../src';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('testing quick ml', () => {
	const app = new mockedApp().init();
	const quickml: QuickML = new QuickML(app);

	const quickMLRequest = {
		['/endpoints/predict']: {
			POST: {
				statusCode: 200,
				data: {
					data: {
						status: 'success',
						result: '[" prediction results "]'
					}
				}
			}
		}
	};
	app.setRequestResponseMap(quickMLRequest);

	it('quick ml endpoint predict', async () => {
		await expect(
			quickml.predict('1234abcd', {
				sepal_length: '6.4',
				sepal_width: '3.2',
				petal_length: '4.5',
				petal_width: '1.5'
			})
		).resolves.toStrictEqual({
			data: quickMLRequest['/endpoints/predict'].POST.data.data
		});
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
