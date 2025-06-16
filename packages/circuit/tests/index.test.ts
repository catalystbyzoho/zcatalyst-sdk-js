import moment from 'moment';

import { ZCAuth } from '../../auth/src';
import { Circuit } from '../src';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

const resd = {
	[`/circuit/123/execute`]: {
		POST: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					id: 'b3c91799-5c18-4626-9983-a2d6af237e20',
					name: 'Case 1',
					start_time: moment(moment.now()).format('MMM DD, YYYY hh:mm A'),
					end_time: moment(moment.now()).format('MMM DD, YYYY hh:mm A'),
					status: 'success',
					circuit_name: 'SendMail',
					status_code: 6,
					instance_id: '115359ee-4e5f-4568-810f-5c90bad88490',
					execution_meta: {},
					input: {
						key1: 'value1',
						key2: 'value2',
						key3: 'value3'
					},
					output: {
						key1: 'value1',
						key2: 'value2',
						key3: 'value3'
					}
				}
			}
		}
	},
	'/circuit/xyz/execution/xyz': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					id: 'b3c91799-5c18-4626-9983-a2d6af237e20',
					name: 'Case 1',
					start_time: moment(moment.now()).format('MMM DD, YYYY hh:mm A'),
					end_time: moment(moment.now()).format('MMM DD, YYYY hh:mm A'),
					status: 'success',
					circuit_name: 'SendMail',
					status_code: 6,
					instance_id: '115359ee-4e5f-4568-810f-5c90bad88490',
					execution_meta: {},
					input: {
						key1: 'value1',
						key2: 'value2',
						key3: 'value3'
					},
					output: {
						key1: 'value1',
						key2: 'value2',
						key3: 'value3'
					}
				}
			}
		},
		DELETE: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					id: 'b3c91799-5c18-4626-9983-a2d6af237e20',
					name: 'Case 1',
					start_time: moment(moment.now()).format('MMM DD, YYYY hh:mm A'),
					end_time: moment(moment.now()).format('MMM DD, YYYY hh:mm A'),
					status: 'success',
					circuit_name: 'SendMail',
					status_code: 6,
					instance_id: '115359ee-4e5f-4568-810f-5c90bad88490',
					execution_meta: {},
					input: {
						key1: 'value1',
						key2: 'value2',
						key3: 'value3'
					},
					output: {
						key1: 'value1',
						key2: 'value2',
						key3: 'value3'
					}
				}
			}
		}
	}
};

describe('testing circuit', () => {
	const app = new mockedApp().init();
	const circuit: Circuit = new Circuit(app);
	app.setRequestResponseMap(resd);
	it('Circuit execute', async () => {
		await expect(
			circuit.execute('123', 'sampleName', {
				name: 'Aaron Jones'
			})
		).resolves.toStrictEqual(resd[`/circuit/123/execute`].POST.data.data);
		await expect(
			circuit.execute('1234', 'sampleName', {
				name: 'Aaron Jones'
			})
		).resolves.toStrictEqual(undefined);
		await expect(
			circuit.execute('', 'sampleName', {
				name: 'Aaron Jones'
			})
		).rejects.toThrowError();
		await expect(
			circuit.execute('123', '', {
				name: 'Aaron Jones'
			})
		).rejects.toThrowError();
	});
	it('circuit status', async () => {
		await expect(circuit.status('xyz', 'xyz')).resolves.toStrictEqual(
			resd['/circuit/xyz/execution/xyz'].GET.data.data
		);
		await expect(circuit.status('xyzz', 'xyzz')).resolves.toStrictEqual(undefined);
		await expect(circuit.status('', 'xyz')).rejects.toThrowError();
		await expect(circuit.status('xyz', '')).rejects.toThrowError();
		await expect(circuit.status('', '')).rejects.toThrowError();
	});
	it('circuit abort', async () => {
		await expect(circuit.abort('xyz', 'xyz')).resolves.toStrictEqual(
			resd['/circuit/xyz/execution/xyz'].DELETE.data.data
		);
		await expect(circuit.abort('xyzz', 'xyzz')).resolves.toStrictEqual(undefined);
		await expect(circuit.abort('', 'xyz')).rejects.toThrowError();
		await expect(circuit.abort('xyz', '')).rejects.toThrowError();
		await expect(circuit.abort('', '')).rejects.toThrowError();
	});
});
