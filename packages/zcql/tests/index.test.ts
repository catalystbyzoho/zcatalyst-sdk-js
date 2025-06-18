import moment from 'moment';

import { ZCAuth } from '../../auth/src';
import { ZCQL } from '../src';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('zcql', () => {
	const app = new mockedApp().init();
	const zcql: ZCQL = new ZCQL(app);
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

	app.setRequestResponseMap(resdata);

	it('execute ZCQL Query', async () => {
		await expect(zcql.executeZCQLQuery('execute query')).resolves.toStrictEqual(
			resdata['/query'].POST.data.data
		);
		await expect(zcql.executeZCQLQuery('')).rejects.toThrow();
	});
});
