import { tableDetails, tableId, tableName } from './test-constants';

export const getTable = {
	[`/nosqltable/${tableId}`]: {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: tableDetails
			}
		}
	},
	[`/nosqltable/${tableName}`]: {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: tableDetails
			}
		}
	},
	[`/nosqltable/notable`]: {
		GET: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: {
					message: 'No such table with the given id exists',
					error_code: 'INVALID_ID'
				}
			}
		}
	}
};

export const getAllTables = {
	['/nosqltable']: {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: [tableDetails]
			}
		}
	}
};

const postItemRes = {
	statusCode: 200,
	data: {
		status: 'success',
		data: {
			size: 20,
			create: [
				{
					status: 'Success'
				}
			]
		}
	}
};

const updateItemsRes = {
	statusCode: 200,
	data: {
		status: 'success',
		data: {
			size: 20,
			update: [
				{
					status: 'Success'
				}
			]
		}
	}
};

const deleteItemRes = {
	statusCode: 200,
	data: {
		status: 'success',
		data: {
			size: 20,
			delete: [
				{
					status: 'Success'
				}
			]
		}
	}
};

export const item = {
	[`/nosqltable/${tableId}/item`]: {
		POST: postItemRes,
		PUT: updateItemsRes,
		DELETE: deleteItemRes
	},
	[`/nosqltable/${tableName}/item`]: {
		POST: postItemRes,
		PUT: updateItemsRes,
		DELETE: deleteItemRes
	},
	[`/nosqltable/failure/item`]: {
		POST: {
			statusCode: 400,
			data: {
				status: 'failure',
				data: {
					message: 'Invalid input value for item',
					error_code: 'INVALID_INPUT'
				}
			}
		},
		PUT: {
			statusCode: 400,
			data: {
				status: 'failure',
				data: {
					message: 'Mandatory Key main_part is missing in the item',
					error_code: 'INVALID_KEY'
				}
			}
		},
		DELETE: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					size: 0,
					delete: [
						{
							status: 'ConditionMismatch'
						}
					]
				}
			}
		}
	}
};

const fetchItemRes = {
	statusCode: 200,
	data: {
		status: 'success',
		data: {
			size: 20,
			get: [
				{
					item: {
						main_sort: {
							S: 'a'
						},
						main_part: {
							S: 'a'
						}
					}
				}
			]
		}
	}
};

export const fetchItems = {
	[`/nosqltable/${tableName}/item/fetch`]: {
		POST: fetchItemRes
	},
	[`/nosqltable/${tableId}/item/fetch`]: {
		POST: fetchItemRes
	},
	[`/nosqltable/failure/item/fetch`]: {
		POST: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					size: 0
				}
			}
		}
	}
};

export const queryTable = {
	[`/nosqltable/${tableName}/item/query`]: {
		POST: fetchItemRes
	},
	[`/nosqltable/${tableId}/item/query`]: {
		POST: fetchItemRes
	},
	[`/nosqltable/failure/item/query`]: {
		POST: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					size: 0
				}
			}
		}
	}
};
