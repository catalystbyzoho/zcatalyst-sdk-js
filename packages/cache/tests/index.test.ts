import moment from 'moment';

import { ZCAuth } from '../../auth/src';
import { Cache } from '../src';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('cache', () => {
	const app = new mockedApp().init();
	const cache: Cache = new Cache(app);
	const resdata = {
		['/query']: {
			POST: {
				statusCode: 200,
				data: {
					status: 'success',
					data: {
						EmpContactInfo: {
							CREATORID: 56000000002003,
							EmpID: '102790',
							EmpName: 'Allison Powell',
							MobileNo: '6188991007',
							Address: '13, Winter Avenue, Philadelphia, PY',
							MODIFIEDTIME: moment(moment.now()).format('YYYY-MM-DD hh:mm:ss'),
							CREATEDTIME: moment(moment.now()).format('YYYY-MM-DD hh:mm:ss'),
							ROWID: 56000000248031
						}
					}
				}
			}
		}
	};
	app.setRequestResponseMap(resdata); // It is defined in catalyst-app(__mocks__) it perform copy the request and response to instance variables of the catalyst-app

	it('execute ZCQL Query', async () => {
		await expect(cache.getAllSegment()).resolves.toStrictEqual(resdata['/query'].POST.data);
		await expect(cache.getAllSegment()).rejects.toThrow();
	});
});
