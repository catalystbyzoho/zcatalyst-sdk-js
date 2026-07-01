/**
 * Centralized API mock responses for tests.
 * Expand this object per component needs.
 */
const { Readable } = require('stream');
const moment = require('moment');

// Centralized test constants for cross-package usage
exports.constants = {
	// Job Scheduling
	cronId: 'cron_id',
	cronName: 'cron_name',
	jobpoolId: 'pool_1',
	jobId: 'job_123',

	// Functions
	functionId: '123',
	functionName: 'testFunction',

	// Pipeline
	pipelineId: '1234',

	// Filestore
	folderId: '123',
	fileId: '123',

	// Datastore
	tableName: 'testTable',
	tableId: '123',

	// Smartbrowz
	projectId: '12345',

	// Cache
	segmentId: '123'
};

/**
 * Centralized API mock responses for tests.
 * Expand this object per component needs.
 */
exports.responses = {
	'/ml/detect-object': {
		POST: {
			statusCode: 200,
			data: {
				data: {
					objects: [
						{
							co_ordinates: [37, 94, 704, 434],
							object_type: 'dog',
							confidence: '98.92'
						}
					]
				}
			}
		}
	},
	'/ml/ocr': {
		POST: {
			statusCode: 200,
			data: {
				data: {
					confidence: 79.71514892578125,
					text: 'test'
				}
			}
		}
	},
	'/ml/barcode': {
		POST: {
			statusCode: 200,
			data: {
				data: {
					content: '40156'
				}
			}
		}
	},
	'/ml/imagemoderation': {
		POST: {
			statusCode: 200,
			data: {
				data: {
					probability: {
						racy: '0.0',
						weapon: '1.0',
						nudity: '0.0',
						gore: '0.0',
						drug: '0.0'
					},
					confidence: 1,
					prediction: 'unsafe_to_use'
				}
			}
		}
	},
	'/ml/faceanalytics': {
		POST: {
			statusCode: 200,
			data: {
				data: {
					faces: [
						{
							confidence: 1.0,
							id: 0,
							co_ordinates: [267, 39, 153, 227],
							emotion: {
								prediction: 'not_smiling',
								confidence: {
									smiling: '0.0',
									not_smiling: '1.0'
								}
							},
							age: {
								prediction: '3-9',
								confidence: {
									'0-2': '0.005',
									'10-19': '0.33',
									'20-29': '0.12',
									'3-9': '0.509',
									'30-39': '0.032',
									'40-49': '0.003',
									'50-59': '0.0',
									'60-69': '0.0',
									'>70': '0.0'
								}
							},
							gender: {
								prediction: 'female',
								confidence: {
									female: '0.92',
									male: '0.08'
								}
							}
						}
					]
				}
			}
		}
	},
	'/ml/facecomparison': {
		POST: {
			statusCode: 200,
			data: {
				data: {
					match: true,
					confidence: 0.567
				}
			}
		}
	},
	'/ml/automl/model/123': {
		POST: {
			statusCode: 200,
			data: {
				data: {
					regression_result: 3.41
				}
			}
		}
	},
	'/ml/automl/model/1234': {
		POST: {
			statusCode: 200,
			data: {
				data: undefined
			}
		}
	},
	'/ml/text-analytics/sentiment-analysis': {
		POST: {
			statusCode: 200,
			data: {
				data: [
					{
						response: [
							{
								feature: 'SentimentPrediction',
								response: {
									sentiment: 'Positive',
									sentence_analytics: [
										{
											sentence: 'I love the design of the new model.',
											sentiment: 'Positive',
											confidence_scores: {
												negative: 0.02,
												neutral: 0.1,
												positive: 0.88
											}
										}
									],
									overall_score: 0.88
								},
								status: 200
							}
						],
						id: 1,
						status: 200
					}
				]
			}
		}
	},
	'/ml/text-analytics/ner': {
		POST: {
			statusCode: 200,
			data: {
				data: [
					{
						resposnse: [
							{
								feature: 'NER',
								response: {
									general_entities: [
										{
											NERTag: 'ORG',
											start_index: 0,
											confidence_score: 99.88,
											end_index: 16,
											Token: 'Zoho Corporation'
										}
									]
								},
								status: 200,
								statusCode: 200
							}
						],
						id: 1,
						statusCode: 200,
						status: 200
					}
				]
			}
		}
	},
	'/ml/text-analytics/keyword-extraction': {
		POST: {
			statusCode: 200,
			data: {
				data: [
					{
						resposnse: [
							{
								feature: 'KeywordExtractor',
								response: {
									keywords: ['Catalyst', 'microservices'],
									keyphrases: [
										'cloud - based serverless development tool',
										'backend functionalities',
										'various platforms'
									]
								},
								status: 200
							}
						],
						id: 1,
						status: 200
					}
				]
			}
		}
	},
	'/ml/text-analytics': {
		POST: {
			statusCode: 200,
			data: {
				data: [
					{
						resposnse: [
							{
								feature: 'SentimentPrediction',
								response: {
									sentiment: 'Positive',
									sentence_analytics: [
										{
											sentence: 'I love the design of the new model.',
											sentiment: 'Positive',
											confidence_scores: {
												negative: 0.02,
												neutral: 0.1,
												positive: 0.88
											}
										}
									],
									overall_score: 0.88
								},
								status: 200
							},
							{
								feature: 'NER',
								response: {
									general_entities: [
										{
											NERTag: 'ORG',
											start_index: 0,
											confidence_score: 99.88,
											end_index: 16,
											Token: 'Zoho Corporation'
										}
									]
								},
								status: 200,
								statusCode: 200
							},
							{
								feature: 'KeywordExtractor',
								response: {
									keywords: ['Catalyst', 'microservices'],
									keyphrases: [
										'cloud - based serverless development tool',
										'backend functionalities',
										'various platforms'
									]
								},
								status: 200
							}
						],
						id: 1,
						status: 200
					}
				]
			}
		}
	},

	// -------------------------------------------------------------------------
	// Cache (Segment) component
	// -------------------------------------------------------------------------
	'/segment': {
		GET: {
			statusCode: 200,
			data: {
				data: [
					{
						project_id: { project_name: 'testProject', id: 12345 },
						segment_name: 'CustomerInfo',
						modified_by: { last_name: 'test' },
						modified_time: 'Jan 01, 2025 10:00 AM',
						segment_id: 123
					}
				]
			}
		}
	},
	'/segment/123': {
		GET: {
			statusCode: 200,
			data: {
				data: {
					project_id: { project_name: 'testProject', id: 12345 },
					segment_name: 'CustomerInfo',
					modified_by: { last_name: 'test' },
					modified_time: 'Jan 01, 2025 10:00 AM',
					segment_id: 123
				}
			}
		}
	},

	// Cache (Segment) component - default segment cache
	'/cache': {
		GET: {
			statusCode: 200,
			data: {
				data: {
					cache_name: 'testCache',
					cache_value: 'value',
					expires_in: '3289382048023',
					expiry_in_hours: '1',
					segment_details: { segment_name: 'testSegment', id: '123' }
				}
			}
		},
		POST: {
			statusCode: 200,
			data: {
				data: {
					cache_name: 'testCache',
					cache_value: 'value',
					expires_in: '3289382048023',
					expiry_in_hours: '1',
					segment_details: { segment_name: 'testSegment', id: '123' }
				}
			}
		},
		PUT: {
			statusCode: 200,
			data: {
				data: {
					cache_name: 'testCache',
					cache_value: 'value',
					expires_in: '3289382048023',
					expiry_in_hours: '1',
					segment_details: { segment_name: 'testSegment', id: '123' }
				}
			}
		},
		DELETE: {
			statusCode: 200,
			data: {
				data: true
			}
		}
	},

	// Cache (Segment) component - default segment cache
	'/cache?cacheKey=key': {
		GET: {
			statusCode: 200,
			data: {
				data: {
					cache_name: 'testCache',
					cache_value: 'value',
					expires_in: '3289382048023',
					expiry_in_hours: '1',
					segment_details: { segment_name: 'testSegment', id: '123' }
				}
			}
		},
		POST: {
			statusCode: 200,
			data: {
				data: {
					cache_name: 'testCache',
					cache_value: 'value',
					expires_in: '3289382048023',
					expiry_in_hours: '1',
					segment_details: { segment_name: 'testSegment', id: '123' }
				}
			}
		},
		PUT: {
			statusCode: 200,
			data: {
				data: {
					cache_name: 'testCache',
					cache_value: 'value',
					expires_in: '3289382048023',
					expiry_in_hours: '1',
					segment_details: { segment_name: 'testSegment', id: '123' }
				}
			}
		},
		DELETE: {
			statusCode: 200,
			data: {
				data: true
			}
		}
	},

	// Cache (Segment) component - specific segment cache
	'/segment/123/cache': {
		GET: {
			statusCode: 200,
			data: {
				data: {
					cache_name: 'testCache',
					cache_value: 'value',
					expires_in: '3289382048023',
					expiry_in_hours: '1',
					segment_details: { segment_name: 'testSegment', id: '123' }
				}
			}
		},
		POST: {
			statusCode: 200,
			data: {
				data: {
					cache_name: 'testCache',
					cache_value: 'value',
					expires_in: '3289382048023',
					expiry_in_hours: '1',
					segment_details: { segment_name: 'testSegment', id: '123' }
				}
			}
		},
		PUT: {
			statusCode: 200,
			data: {
				data: {
					cache_name: 'testCache',
					cache_value: 'value',
					expires_in: '3289382048023',
					expiry_in_hours: '1',
					segment_details: { segment_name: 'testSegment', id: '123' }
				}
			}
		},
		DELETE: {
			statusCode: 200,
			data: {
				data: true
			}
		}
	},

	// Cache (Segment) component - specific segment cache
	'/segment/123/cache?cacheKey=key': {
		GET: {
			statusCode: 200,
			data: {
				data: {
					cache_name: 'testCache',
					cache_value: 'value',
					expires_in: '3289382048023',
					expiry_in_hours: '1',
					segment_details: { segment_name: 'testSegment', id: '123' }
				}
			}
		},
		POST: {
			statusCode: 200,
			data: {
				data: {
					cache_name: 'testCache',
					cache_value: 'value',
					expires_in: '3289382048023',
					expiry_in_hours: '1',
					segment_details: { segment_name: 'testSegment', id: '123' }
				}
			}
		},
		PUT: {
			statusCode: 200,
			data: {
				data: {
					cache_name: 'testCache',
					cache_value: 'value',
					expires_in: '3289382048023',
					expiry_in_hours: '1',
					segment_details: { segment_name: 'testSegment', id: '123' }
				}
			}
		},
		DELETE: {
			statusCode: 200,
			data: {
				data: true
			}
		}
	},


	// -------------------------------------------------------------------------
	// User-Management component
	// -------------------------------------------------------------------------
	'/project-user/current': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					user_id: '123',
					email_id: 'email',
					first_name: 'firstname',
					last_name: 'lastname',
					zuid: '12345',
					zaaid: '1234',
					org_id: '1234',
					status: 'ACTIVE',
					role_details: { role_id: '12', role_name: 'test_role' },
					created_time: 'created_time',
					modified_time: 'modeified_time',
					invited_time: 'invited_time',
					is_confirmed: true
				}
			}
		}
	},
	'/user': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: [
					{
						user_id: '123',
						email_id: 'email',
						first_name: 'firstname',
						last_name: 'lastname',
						zuid: '12345',
						zaaid: '1234',
						org_id: '1234',
						status: 'ACTIVE',
						role_details: { role_id: '12', role_name: 'test_role' },
						created_time: 'created_time',
						modified_time: 'modeified_time',
						invited_time: 'invited_time',
						is_confirmed: true
					}
				]
			}
		}
	},
	'/user/123': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					user_id: '123',
					email_id: 'email',
					first_name: 'firstname',
					last_name: 'lastname',
					zuid: '12345',
					zaaid: '1234',
					org_id: '1234',
					status: 'ACTIVE',
					role_details: { role_id: '12', role_name: 'test_role' },
					created_time: 'created_time',
					modified_time: 'modeified_time',
					invited_time: 'invited_time',
					is_confirmed: true
				}
			}
		}
	},
	'/user/status': {
		PUT: {
			statusCode: 200,
			data: {
				status: 'success',
				data: { updated: true }
			}
		}
	},

	// ZCQL
	'/query': {
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
						MODIFIEDTIME: '2025-01-01 10:00:00',
						CREATEDTIME: '2025-01-01 09:00:00',
						ROWID: 56000000248031
					}
				}
			}
		}
	},

	// Functions
	'/function/123/execute': {
		GET: {
			statusCode: 200,
			data: { data: 'Function executed successfully' }
		}
	},
	'/function/testFunction/execute': {
		GET: {
			statusCode: 200,
			data: { data: 'Function executed successfully' }
		},
		POST: {
			statusCode: 200,
			data: { data: 'Function executed successfully' }
		}
	},
	'/function/testFunction/execute?test=test': {
		GET: {
			statusCode: 200,
			data: { data: 'Function executed successfully' }
		},
		POST: {
			statusCode: 200,
			data: { data: 'Function executed successfully' }
		}
	},
	'/function/1234/execute': {
		GET: {
			statusCode: 200,
			data: { data: undefined }
		}
	},

	// Mail
	'/email/send': {
		POST: {
			statusCode: 200,
			data: {
				data: {
					isAsync: false,
					project_details: { id: 123456789, project_name: 'testProject' },
					from_email: 'testFrom',
					to_email: 'testTo',
					html_mode: false,
					subject: 'testSubject'
				}
			}
		}
	},

	// Pipeline
	'/pipeline/1234': {
		GET: {
			statusCode: 200,
			data: {
				data: {
					pipeline_id: '1234',
					name: 'pipeline',
					description: 'pipeline description',
					project_details: { id: '1234', name: 'project_name' },
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
	'/pipeline/1234/run': {
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
	},

	// Datastore tables
	'/table/testTable/column': {
		GET: {
			statusCode: 200,
			data: { data: [{ column_name: 'testColumn' }] }
		}
	},
	'/table/testTable/row': {
		GET: { statusCode: 200, data: { data: [{ row_name: 'testRow' }] } },
		POST: { statusCode: 200, data: { data: [{ row_name: 'testRow' }] } },
		PATCH: { statusCode: 200, data: { data: [{ row_name: 'testRow' }] } }
	},
	'/table/testTable/row?max_rows=undefined&next_token=undefined': {
		GET: { statusCode: 200, data: { data: [{ row_name: 'testRow' }] } },
		POST: { statusCode: 200, data: { data: [{ row_name: 'testRow' }] } },
		PATCH: { statusCode: 200, data: { data: [{ row_name: 'testRow' }] } }
	},
	'/table/testTable/column/testColumn': {
		GET: {
			statusCode: 200,
			data: { data: [{ column_name: 'testColumn' }] }
		}
	},
	'/table/testTable/column/123': {
		GET: {
			statusCode: 200,
			data: { data: [{ column_name: 'testColumn' }] }
		}
	},
	'/table/testTable/row/123': {
		GET: {
			statusCode: 200,
			data: { data: [{ column_name: 'testColumn' }] }
		},
		DELETE: {
			statusCode: 200,
			data: { data: [{ column_name: 'testColumn' }] }
		}
	},
	'/table/testTable/row/1234': {
		GET: {
			statusCode: 200,
			data: { data: undefined }
		},
		DELETE: {
			statusCode: 200,
			data: { data: undefined }
		}
	},

	// Datastore metadata
	'/table/123': {
		GET: {
			statusCode: 200,
			data: {
				data: {
					project_id: { project_name: 'testProject', id: 12345 },
					table_name: 'CustomerInfo',
					modified_by: { last_name: 'test' },
					modified_time: 'Jan 01, 2025 10:00 AM',
					table_id: 123
				}
			}
		}
	},
	'/table/testTable': {
		GET: {
			statusCode: 200,
			data: {
				data: {
					project_id: { project_name: 'testProject', id: 12345 },
					table_name: 'CustomerInfo',
					modified_by: { last_name: 'test' },
					modified_time: 'Jan 01, 2025 10:00 AM',
					table_id: 123
				}
			}
		}
	},
	'/table': {
		GET: {
			statusCode: 200,
			data: {
				data: [
					{
						project_id: { project_name: 'testProject', id: 12345 },
						table_name: 'CustomerInfo',
						modified_by: { last_name: 'test' },
						modified_time: 'Jan 01, 2025 10:00 AM',
						table_id: 123
					}
				]
			}
		}
	},

	// Datastore bulkjob
	'/bulk/write': {
		POST: { statusCode: 200, data: { data: { job_id: 123, status: 'Completed' } } }
	},
	'/bulk/read': {
		POST: { statusCode: 200, data: { data: { job_id: 123, status: 'Completed' } } }
	},
	'/bulk/write/123': {
		GET: { statusCode: 200, data: { data: { job_id: 123, status: 'Completed' } } }
	},
	'/bulk/read/123': {
		GET: { statusCode: 200, data: { data: { job_id: 123, status: 'Completed' } } }
	},
	'/bulk/write/123/download': {
		GET: { statusCode: 200, data: { data: new Readable() } }
	},
	'/bulk/read/123/download': {
		GET: { statusCode: 200, data: { data: new Readable() } }
	},

	// Search
	'/search': {
		POST: {
			statusCode: 200,
			data: {
				data: {
					testData: [{ testData: 'test' }]
				}
			}
		}
	},

	// Quick-ML
	'/endpoints/predict': {
		POST: {
			statusCode: 200,
			data: {
				data: { status: 'success', result: '[" prediction results "]' }
			}
		}
	},

	// Push Notification
	'/push-notification/12345/project-user/notify': {
		POST: {
			statusCode: 200,
			data: {
				data: {
					recipient: 'recipient',
					push_details: { message: `this is a test ios notification` }
				}
			}
		}
	},
	'/push-notification/12345/project-user/notify?isAndroid=true': {
		POST: {
			statusCode: 200,
			data: {
				data: {
					recipient: 'recipient',
					push_details: { message: `this is a test android notification` }
				}
			}
		}
	},
	'/push-notification/123456/project-user/notify': {
		POST: {
			statusCode: 200,
			data: {
				data: undefined
			}
		}
	},
	'/project-user/notify': {
		POST: {
			statusCode: 200,
			data: {
				data: true
			}
		}
	},
	// Circuit
	'/circuit/123/execute': {
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
	},

	'/circuit/1234/execute': {
		POST: {
			statusCode: 200,
			data: {
				status: 'success',
				data: undefined
			}
		}
	},

	// Add non-existent circuit entries to resolve with undefined
	'/circuit/xyzz/execution/xyzz': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: undefined
			}
		},
		DELETE: {
			statusCode: 200,
			data: {
				status: 'success',
				data: undefined
			}
		}
	},

	// Smartbrowz - Browser360
	'/convert': {
		POST: {
			// Return a readable stream for PDF conversion
			statusCode: 200,
			data: { data: new Readable() }
		}
	},

	// Smartbrowz - Dataverse
	'/dataverse/lead-enrichment': {
		POST: {
			statusCode: 200,
			data: {
				data: [{
					employee_count: '12000',
					website: 'https://www.zoho.com',
					address: [
						{
							country: 'India',
							pincode: '603202',
							city: 'Chengalpattu District',
							street: 'Estancia It Park, Plot No. 140 151, Gst Road Vallancheri',
							state: 'Tamil Nadu',
							id: 'Estancia IT Park, Plot no. 140, 151, GST Road, Vallancheri, Chengalpattu District, Tamil Nadu 603202, India'
						}
					],
					social: { twitter: ['twitter.com/zoho'], linkedin: ['linkedin.com/company/zohocorp'] },
					source_language: 'en',
					description:
						"Zoho Corporation offers web-based business apps, network and IT infrastructure management applications.",
					organization_name: 'ZOHO',
					ceo: 'Sridhar Vembu',
					headquarters: [{ country: 'India', city: 'chennai', state: 'tamilnadu', id: 'chennai, tamilnadu, India' }],
					revenue: '$1B',
					years_in_industry: '27',
					about_us: 'https://www.zoho.com/aboutus.html?ireft=nhome&src=home1',
					founding_year: '1996',
					contact: ['844-316-5544'],
					industries: { 'computer programming services': 'Includes information and data processing services.' },
					logo: 'https://www.zohowebstatic.com/sites/zweb/images/ogimage/zoho-logo.png',
					organization_type: ['Private Limited Company'],
					business_model: ['B2B'],
					email: ['sales@zohocorp.com'],
					organization_status: 'LARGE_ENTERPRISE',
					territory: ['India'],
					sign_up_link: 'https://www.zoho.com/signup.html?all_prod_page=true'
				}]
			},
		}
	},
	'/dataverse/tech-stack-finder': {
		POST: {
			statusCode: 200,
			data: {
				data: [
					{
						website: 'https://www.zoho.com',
						technographic_data: {
							'audio-video media': 'Vimeo,YouTube',
							ssl_certificate: 'Sectigo Limited',
							'email hosting providers': 'Zoho Mail,SPF',
							'analytics and tracking': 'Site24x7,Zoho CRM',
							widgets: 'Sitelinks Search Box,Zoho PageSense'
						},
						organization_name: 'ZOHO'
					}
				],
				status: 'success'
			}
		}
	},
	'/dataverse/similar-companies': {
		POST: {
			statusCode: 200,
			data: {
				data: [
					'Cybage Software Pvt. Ltd.',
					'Google LLC',
					'Chargebee, Inc.',
					'Infosys Ltd.',
					'FreshBooks',
					'Cognizant Technology Solutions U.S. Corp.',
					'Amazon web services',
					'TATA Consultancy Services Ltd.',
					'Microsoft',
					'Freshworks Inc.'
				],
				status: 'success'
			}
		}
	},

	// '/dataverse/lead-enrichment': {
	// 	POST: (req) => {
	// 		const data = req.data;
	// 		if (['email', 'lead_name', 'website_url'].some((key) => key in data)) {
	// 			return {
	// 				statusCode: 200,
	// 				data: {
	// 					data: [{
	// 						employee_count: '12000',
	// 						website: 'https://www.zoho.com',
	// 						address: [
	// 							{
	// 								country: 'India',
	// 								pincode: '603202',
	// 								city: 'Chengalpattu District',
	// 								street: 'Estancia It Park, Plot No. 140 151, Gst Road Vallancheri',
	// 								state: 'Tamil Nadu',
	// 								id: 'Estancia IT Park, Plot no. 140, 151, GST Road, Vallancheri, Chengalpattu District, Tamil Nadu 603202, India'
	// 							}
	// 						],
	// 						social: { twitter: ['twitter.com/zoho'], linkedin: ['linkedin.com/company/zohocorp'] },
	// 						source_language: 'en',
	// 						description:
	// 							"Zoho Corporation offers web-based business apps, network and IT infrastructure management applications.",
	// 						organization_name: 'ZOHO',
	// 						ceo: 'Sridhar Vembu',
	// 						headquarters: [{ country: 'India', city: 'chennai', state: 'tamilnadu', id: 'chennai, tamilnadu, India' }],
	// 						revenue: '$1B',
	// 						years_in_industry: '27',
	// 						about_us: 'https://www.zoho.com/aboutus.html?ireft=nhome&src=home1',
	// 						founding_year: '1996',
	// 						contact: ['844-316-5544'],
	// 						industries: { 'computer programming services': 'Includes information and data processing services.' },
	// 						logo: 'https://www.zohowebstatic.com/sites/zweb/images/ogimage/zoho-logo.png',
	// 						organization_type: ['Private Limited Company'],
	// 						business_model: ['B2B'],
	// 						email: ['sales@zohocorp.com'],
	// 						organization_status: 'LARGE_ENTERPRISE',
	// 						territory: ['India'],
	// 						sign_up_link: 'https://www.zoho.com/signup.html?all_prod_page=true'
	// 					}]
	// 				},
	// 				status: 'success'
	// 			}
	// 		}
	// 	}
	// },
	// '/dataverse/tech-stack-finder': {
	// 	POST: (req) => {
	// 		const data = req.data;
	// 		if (!data.website_url) {
	// 			return invalidRequest;
	// 		}
	// 		return {
	// 			statusCode: 200,
	// 			data: {
	// 				data: [
	// 					{
	// 						website: 'https://www.zoho.com',
	// 						technographic_data: {
	// 							'audio-video media': 'Vimeo,YouTube',
	// 							ssl_certificate: 'Sectigo Limited',
	// 							'email hosting providers': 'Zoho Mail,SPF',
	// 							'analytics and tracking': 'Site24x7,Zoho CRM',
	// 							widgets: 'Sitelinks Search Box,Zoho PageSense'
	// 						},
	// 						organization_name: 'ZOHO'
	// 					}],
	// 				status: 'success'
	// 			}
	// 		};
	// 	}
	// },
	// '/dataverse/similar-companies': {
	// 	POST: (req) => {
	// 		const data = req.data;
	// 		if (['lead_name', 'website_url'].some((key) => key in data)) {
	// 			return {
	// 				statusCode: 200,
	// 				data: {
	// 					data: [
	// 						'Cybage Software Pvt. Ltd.',
	// 						'Google LLC',
	// 						'Chargebee, Inc.',
	// 						'Infosys Ltd.',
	// 						'FreshBooks',
	// 						'Cognizant Technology Solutions U.S. Corp.',
	// 						'Amazon web services',
	// 						'TATA Consultancy Services Ltd.',
	// 						'Microsoft',
	// 						'Freshworks Inc.'
	// 					],
	// 					status: 'success'
	// 				}
	// 			};
	// 		}
	// 		return invalidRequest;
	// 	}
	// },

	// Stratus - Bucket and Object endpoints
	'/bucket': {
		GET: {
			statusCode: 200,
			data: {
				data: [
					{
						bucket_name: 'zcstratus122',
						project_details: { project_name: 'Learn', id: '6759000000014001', project_type: 'Live' },
						created_by: { zuid: '74660608', is_confirmed: false, email_id: 'emmy@zylker.com', first_name: 'Amelia Burrows', last_name: 'C', user_id: '6759000000009004' },
						created_time: 'Mar 26, 2024 12:44 PM',
						modified_by: { zuid: '74660608', is_confirmed: false, email_id: 'emmy@zylker.com', first_name: 'Amelia Burrows', last_name: 'C', user_id: '6759000000009004' },
						modified_time: 'Mar 30, 2024 11:38 AM',
						bucket_meta: { versioning: false, caching: { status: 'Enabled' }, encryption: false, audit_consent: false },
						bucket_url: 'https://zcstratus122-development.zohostratus.com'
					}
				]
			}
		},
		HEAD: {
			statusCode: 200,
			data: {}
		}
	},
	'/bucket/objects': {
		GET: {
			statusCode: 200,
			data: {
				data: {
					prefix: 'sam',
					key_count: '5',
					max_keys: '5',
					truncated: 'True',
					next_continuation_token: 'next_token',
					contents: [
						{
							key_type: 'file',
							key: 'sam1s2ww.mp4',
							size: 427160684,
							content_type: 'video/mp4',
							last_modified: 'May 21, 2024 01:00 PM'
						}
					]
				}
			}
		}
	},
	'/bucket/truncate': {
		DELETE: {
			statusCode: 200,
			data: { data: { message: 'Truncated successfully' } }
		}
	},
	'/bucket/object/copy': {
		POST: {
			data: {
				statusCode: 200,
				data: { copy_to: 'csv/sam1.csv', key: 'sdf.csv', message: 'Object copied successfully.' }
			}
		}
	},
	'/bucket/object': {
		PATCH: {
			data: {
				statusCode: 200,
				data: { current_key: 'sdf.csv', message: 'Rename successful', rename_to: 'sam.csv' }
			}
		},
		PUT: {
			data: {
				statusCode: 200,
				data: { message: 'Object Deletion successful.' }
			}
		}
	},
	'/bucket/object/signed-url': {
		PUT: {
			data: {
				statusCode: 200,
				data: {
					signature: 'https://zcstratus123-development.zohostratus.com/_signed/code.zip?...',
					expiry_in_seconds: '100',
					active_from: '1726492859577'
				}
			}
		},
		GET: {
			data: {
				statusCode: 200,
				data: {
					signature: 'https://zcstratus123-development.zohostratus.com/_signed/code.zip?...',
					expiry_in_seconds: '100',
					active_from: '1726492859577'
				}
			}
		}
	},
	'/bucket/object/prefix': {
		DELETE: {
			data: {
				statusCode: 200,
				data: { path: 'sam/', message: 'Path deletion scheduled' }
			}
		}
	},
	'/bucket/object/zip-extract': {
		POST: {
			data: {
				statusCode: 200,
				data: { key: 'sample.zip', destination: 'output/', taskId: '6963000000272049', message: 'Zip extract scheduled' }
			}
		}
	},
	'/bucket/object/zip-extract/status': {
		GET: {
			data: {
				statusCode: 200,
				data: { task_id: '6963000000272049', status: 'SUCCESS' }
			}
		}
	},
	'/bucket/cors': {
		GET: {
			data: {
				statusCode: 200,
				data: [{ url: 'https://google.com', allowec_methods: ['PUT'] }]
			}
		}
	},
	'/bucket/purge-cache': {
		PUT: {
			data: {
				statusCode: 200,
				data: { message: 'Bucket cache purged successfully' }
			}
		}
	},
	'/bucket/object': {
		GET: {
			statusCode: 200,
			data: {
				data: {
					key: 'Automl_LZ (1).csv',
					size: 257,
					content_type: 'text/csv',
					last_modified: 'Dec 10, 2023 03:10 PM',
					meta_data: { automl_metakey: 'metavalue' },
					object_url: 'https://gcpimport2-development.csezstratus.com/Automl_LZ%20(1).csv'
				}
			}
		}
	},
	'/bucket/objects/versions': {
		GET: {
			statusCode: 200,
			data: {
				data: {
					truncated: true,
					key: 'Automl_LZ (1).csv',
					versions_count: 2,
					max_versions: 2,
					is_truncated: true,
					next_continuation_token: '97tn3xP3te...',
					version: [
						{
							latest: true,
							version_id: '01hh9hkfdf07y8pnpbwtkt8cf7',
							is_latest: true,
							last_modified: 'Dec 10, 2023 03:10 PM',
							size: 257,
							etag: '223a363af39a49d4b32f6cdf0c569755'
						},
						{
							latest: false,
							version_id: '01hh9hjtge85k1fx2yp1kg8r2q',
							is_latest: false,
							last_modified: 'Dec 10, 2023 03:10 PM',
							size: 257,
							etag: '223a363af39a49d4b32f6cdf0c569755'
						}
					]
				}
			}
		}
	},
	'/auth/signed-url': {
		GET: {
			data: {
				statusCode: 200,
				data: {
					signed_url: 'https://zcstratus123-development.zohostratus.com/_signed/code.zip?...',
					expiry_in_seconds: '100'
				}
			}
		}
	},
	'/bucket/object/metadata': {
		PUT: {
			data: {
				statusCode: 200,
				data: { message: 'Meta added successfully' }
			}
		}
	},

	// Filestore - Folder and File endpoints
	'/folder/123': {
		GET: {
			statusCode: 200,
			data: {
				data: {
					id: 105000000121078,
					folder_name: 'CustInfo',
					created_time: '2019-03-14T10:18:14+05:30',
					created_by: {
						userId: 54635102,
						email_id: 'emma@zylker.com',
						first_name: 'Amelia',
						last_name: 'Burrows'
					},
					modified_time: '2019-03-14T10:18:14+05:30',
					modified_by: {
						userId: 54690876,
						email_id: 'p.boyle@zylker.com',
						first_name: 'Patricia',
						last_name: 'Boyle'
					},
					project_details: { id: 3376000000123022, project_name: 'ShipmentTracking' },
					file_details: []
				}
			}
		},
		PUT: {
			statusCode: 200,
			data: { data: { id: 105000000121078, folder_name: 'testFolder', message: 'Updated' } }
		},
		DELETE: {
			statusCode: 200,
			data: { data: true }
		}
	},
	'/folder/1234': {
		DELETE: {
			statusCode: 200,
			data: {
				data: {
					id: 105000000121078,
					folder_name: 'CustInfo',
					created_time: '2019-03-14T10:18:14+05:30',
					created_by: {
						userId: 54635102,
						email_id: 'emma@zylker.com',
						first_name: 'Amelia',
						last_name: 'Burrows'
					},
					modified_time: '2019-03-14T10:18:14+05:30',
					modified_by: {
						userId: 54690876,
						email_id: 'p.boyle@zylker.com',
						first_name: 'Patricia',
						last_name: 'Boyle'
					},
					project_details: { id: 3376000000123022, project_name: 'ShipmentTracking' },
					file_details: []
				}
			}
		}
	},
	'/folder/123/file/123': {
		GET: {
			statusCode: 200,
			data: { data: { file_id: '123', file_name: 'sample.txt', size: 100 } }
		},
		DELETE: {
			statusCode: 200,
			data: { data: true }
		}
	},
	'/folder/123/file/123/download': {
		GET: {
			statusCode: 200,
			data: { data: new Readable() }
		}
	},
	'/folder/123/file/1234': {
		DELETE: {
			statusCode: 200,
			data: { data: false }
		}
	},

	// Filestore create folder convenience GET response used in tests
	'/folder/123': {
		GET: {
			statusCode: 200,
			data: {
				data: {
					id: 105000000121078,
					folder_name: 'CustInfo',
					created_time: '2019-03-14T10:18:14+05:30',
					project_details: { id: 3376000000123022, project_name: 'ShipmentTracking' },
					file_details: []
				}
			}
		}
	},

	// -------------------------------------------------------------------------
	// Job Scheduling - shared test fixtures
	// -------------------------------------------------------------------------
	'/job_scheduling/cron': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: [
					{
						cron_name: 'cron_name',
						cron_type: 'Calendar',
						cron_execution_type: 'pre-defined',
						job_meta: {
							id: 'job_meta_id',
							url: '',
							job_name: 'test_job',
							job_config: { number_of_retries: 0 },
							target_type: 'Function',
							target_details: { id: 't_1', target_name: 'target_fn' },
							source_type: 'Cron',
							source_details: {
								id: 'cron_id',
								source_name: 'cron_name',
								details: { cron_execution_type: 'pre-defined' }
							},
							jobpool_id: 'pool_1',
							jobpool_details: {
								jobpool_id: 'pool_1',
								jobpool_name: 'test_pool',
								project_details: { id: '123', project_name: 'proj' },
								created_time: '2024-07-11T17:30:00Z',
								created_by: { email_id: 'user@zylker.com', user_id: 'u_1' },
								modified_time: '2024-07-11T17:40:00Z',
								modified_by: { email_id: 'user@zylker.com', user_id: 'u_1' }
							},
							headers: {},
							params: {}
						},
						cron_status: true,
						created_time: 'Jul 11, 2024 05:30 PM',
						created_by: { email_id: 'user@zylker.com', user_id: 'u_1' },
						modified_time: 'Jul 11, 2024 07:15 PM',
						modified_by: { email_id: 'user@zylker.com', user_id: 'u_1' },
						project_details: { id: '123', project_name: 'proj' },
						end_time: 1723281306,
						cron_detail: {
							hour: 0,
							minute: 0,
							second: 0,
							repetition_type: 'daily',
							timezone: 'Australia/Sydney'
						},
						success_count: 0,
						failure_count: 0,
						id: 'cron_id'
					},
					{
						cron_name: 'cron_name',
						cron_type: 'Calendar',
						cron_execution_type: 'pre-defined',
						job_meta: {
							id: 'job_meta_id',
							url: '',
							job_name: 'test_job',
							job_config: { number_of_retries: 0 },
							target_type: 'Function',
							target_details: { id: 't_1', target_name: 'target_fn' },
							source_type: 'Cron',
							source_details: {
								id: 'cron_id',
								source_name: 'cron_name',
								details: { cron_execution_type: 'pre-defined' }
							},
							jobpool_id: 'pool_1',
							jobpool_details: {
								jobpool_id: 'pool_1',
								jobpool_name: 'test_pool',
								project_details: { id: '123', project_name: 'proj' },
								created_time: '2024-07-11T17:30:00Z',
								created_by: { email_id: 'user@zylker.com', user_id: 'u_1' },
								modified_time: '2024-07-11T17:40:00Z',
								modified_by: { email_id: 'user@zylker.com', user_id: 'u_1' }
							},
							headers: {},
							params: {}
						},
						cron_status: true,
						created_time: 'Jul 11, 2024 05:30 PM',
						created_by: { email_id: 'user@zylker.com', user_id: 'u_1' },
						modified_time: 'Jul 11, 2024 07:15 PM',
						modified_by: { email_id: 'user@zylker.com', user_id: 'u_1' },
						project_details: { id: '123', project_name: 'proj' },
						end_time: 1723281306,
						cron_detail: {
							hour: 0,
							minute: 0,
							second: 0,
							repetition_type: 'daily',
							timezone: 'Australia/Sydney'
						},
						success_count: 0,
						failure_count: 0,
						id: 'cron_id'
					}
				]
			}
		}
	},
	'/job_scheduling/cron/test_cron': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					cron_name: 'cron_name',
					cron_type: 'Calendar',
					cron_execution_type: 'pre-defined',
					job_meta: {
						id: 'job_meta_id',
						url: '',
						job_name: 'test_job',
						job_config: { number_of_retries: 0 },
						target_type: 'Function',
						target_details: { id: 't_1', target_name: 'target_fn' },
						source_type: 'Cron',
						source_details: {
							id: 'cron_id',
							source_name: 'cron_name',
							details: { cron_execution_type: 'pre-defined' }
						},
						jobpool_id: 'pool_1',
						jobpool_details: {
							jobpool_id: 'pool_1',
							jobpool_name: 'test_pool',
							project_details: { id: '123', project_name: 'proj' },
							created_time: '2024-07-11T17:30:00Z',
							created_by: { email_id: 'user@zylker.com', user_id: 'u_1' },
							modified_time: '2024-07-11T17:40:00Z',
							modified_by: { email_id: 'user@zylker.com', user_id: 'u_1' }
						},
						headers: {},
						params: {}
					},
					cron_status: true,
					created_time: 'Jul 11, 2024 05:30 PM',
					created_by: { email_id: 'user@zylker.com', user_id: 'u_1' },
					modified_time: 'Jul 11, 2024 07:15 PM',
					modified_by: { email_id: 'user@zylker.com', user_id: 'u_1' },
					project_details: { id: '123', project_name: 'proj' },
					end_time: 1723281306,
					cron_detail: {
						hour: 0,
						minute: 0,
						second: 0,
						repetition_type: 'daily',
						timezone: 'Australia/Sydney'
					},
					success_count: 0,
					failure_count: 0,
					id: 'cron_id'
				}
			}
		},
		PATCH: {
			statusCode: 200,
			data: {
				status: 'success',
				data: { cron_status: false }
			}
		},
		PUT: {
			statusCode: 200,
			data: {
				status: 'success',
				data: { cron_name: 'new_cron_name' }
			}
		},
		DELETE: {
			statusCode: 200,
			data: {
				status: 'success',
				data: { cron_name: 'cron_name' }
			}
		}
	},
	'/job_scheduling/cron/cron_name': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					cron_name: 'cron_name',
					cron_type: 'Calendar',
					cron_execution_type: 'pre-defined',
					job_meta: {
						id: 'job_meta_id',
						url: '',
						job_name: 'test_job',
						job_config: { number_of_retries: 0 },
						target_type: 'Function',
						target_details: { id: 't_1', target_name: 'target_fn' },
						source_type: 'Cron',
						source_details: {
							id: 'cron_id',
							source_name: 'cron_name',
							details: { cron_execution_type: 'pre-defined' }
						},
						jobpool_id: 'pool_1',
						jobpool_details: {
							jobpool_id: 'pool_1',
							jobpool_name: 'test_pool',
							project_details: { id: '123', project_name: 'proj' },
							created_time: '2024-07-11T17:30:00Z',
							created_by: { email_id: 'user@zylker.com', user_id: 'u_1' },
							modified_time: '2024-07-11T17:40:00Z',
							modified_by: { email_id: 'user@zylker.com', user_id: 'u_1' }
						},
						headers: {},
						params: {}
					},
					cron_status: true,
					created_time: 'Jul 11, 2024 05:30 PM',
					created_by: { email_id: 'user@zylker.com', user_id: 'u_1' },
					modified_time: 'Jul 11, 2024 07:15 PM',
					modified_by: { email_id: 'user@zylker.com', user_id: 'u_1' },
					project_details: { id: '123', project_name: 'proj' },
					end_time: 1723281306,
					cron_detail: {
						hour: 0,
						minute: 0,
						second: 0,
						repetition_type: 'daily',
						timezone: 'Australia/Sydney'
					},
					success_count: 0,
					failure_count: 0,
					id: 'cron_id'
				}
			}
		},
		PUT: {
			statusCode: 200,
			data: {
				status: 'success',
				data: { cron_name: 'new_cron_name' }
			}
		},
		PATCH: {
			statusCode: 200,
			data: {
				status: 'success',
				data: { cron_status: false }
			}
		},
		DELETE: {
			statusCode: 200,
			data: {
				status: 'success',
				data: { cron_name: 'cron_name' }
			}
		}
	},

	// Job Scheduling - Cron by numeric ID (cronId = '1234567890')
	'/job_scheduling/cron/1234567890': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					cron_name: 'cron_name',
					cron_type: 'Calendar',
					cron_execution_type: 'pre-defined',
					job_meta: {
						id: 'job_meta_id',
						url: '',
						job_name: 'test_job',
						job_config: { number_of_retries: 0 },
						target_type: 'Function',
						target_details: { id: 't_1', target_name: 'target_fn' },
						source_type: 'Cron',
						source_details: {
							id: 'cron_id',
							source_name: 'cron_name',
							details: { cron_execution_type: 'pre-defined' }
						},
						jobpool_id: 'pool_1',
						jobpool_details: {
							jobpool_id: 'pool_1',
							jobpool_name: 'test_pool',
							project_details: { id: '123', project_name: 'proj' },
							created_time: '2024-07-11T17:30:00Z',
							created_by: { email_id: 'user@zylker.com', user_id: 'u_1' },
							modified_time: '2024-07-11T17:40:00Z',
							modified_by: { email_id: 'user@zylker.com', user_id: 'u_1' }
						},
						headers: {},
						params: {}
					},
					cron_status: true,
					created_time: 'Jul 11, 2024 05:30 PM',
					created_by: { email_id: 'user@zylker.com', user_id: 'u_1' },
					modified_time: 'Jul 11, 2024 07:15 PM',
					modified_by: { email_id: 'user@zylker.com', user_id: 'u_1' },
					project_details: { id: '123', project_name: 'proj' },
					end_time: 1723281306,
					cron_detail: {
						hour: 0,
						minute: 0,
						second: 0,
						repetition_type: 'daily',
						timezone: 'Australia/Sydney'
					},
					success_count: 0,
					failure_count: 0,
					id: 'cron_id'
				}
			}
		},
		PATCH: {
			statusCode: 200,
			data: {
				status: 'success',
				data: { cron_status: false }
			}
		},
		DELETE: {
			statusCode: 200,
			data: {
				status: 'success',
				data: { cron_name: 'cron_id' }
			}
		}
	},

	// Job Scheduling - Cron by name 'cron_id' (deleteCron(cronId) reference key)
	'/job_scheduling/cron/cron_id': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: { cron_name: 'cron_id', cron_status: true, id: 'cron_id' }
			}
		},
		DELETE: {
			statusCode: 200,
			data: {
				status: 'success',
				data: { cron_name: 'cron_id' }
			}
		}
	},

	// Job Scheduling - Cron 404 paths (error test cases)
	'/job_scheduling/cron/no_cron': {
		GET: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: { message: 'No such Cron with the given name exists.', error_code: 'INVALID_NAME' }
			}
		},
		PATCH: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: { message: 'No such Cron with the given name exists.', error_code: 'INVALID_NAME' }
			}
		},
		DELETE: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: { message: 'No such Cron with the given name exists.', error_code: 'INVALID_NAME' }
			}
		}
	},
	'/job_scheduling/cron/1234': {
		GET: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: { message: 'No such Cron with the given id exists', error_code: 'INVALID_ID' }
			}
		},
		PUT: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: { message: 'No such Cron with the given id exists', error_code: 'INVALID_ID' }
			}
		},
		PATCH: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: { message: 'No such Cron with the given id exists', error_code: 'INVALID_ID' }
			}
		},
		DELETE: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: { message: 'No such Cron with the given id exists', error_code: 'INVALID_ID' }
			}
		}
	},

	// Job Scheduling - Submit Job from Cron (numeric ID)
	'/job_scheduling/cron/1234567890/submit_job': {
		POST: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					job_id: 'job_123',
					job_name: 'test_job',
					target_type: 'Function',
					target_name: 'target_fn',
					jobpool_name: 'pool_1',
					status: 'success',
					created_time: '2024-07-11T17:30:00Z'
				}
			}
		}
	},

	'/job_scheduling/cron/test_cron/submit_job': {
		POST: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					job_id: 'job_123',
					job_name: 'test_job',
					target_type: 'Function',
					target_name: 'target_fn',
					jobpool_name: 'pool_1',
					status: 'success',
					created_time: '2024-07-11T17:30:00Z'
				}
			}
		}
	},

	// Job Scheduling - Submit Job from Cron
	'/job_scheduling/cron/cron_id/submit_job': {
		POST: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					job_id: 'job_123',
					job_name: 'test_job',
					target_type: 'Function',
					target_name: 'target_fn',
					jobpool_name: 'pool_1',
					status: 'success',
					created_time: '2024-07-11T17:30:00Z'
				}
			}
		}
	},
	'/job_scheduling/cron/cron_name/submit_job': {
		POST: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					job_id: 'job_123',
					job_name: 'test_job',
					target_type: 'Function',
					target_name: 'target_fn',
					jobpool_name: 'pool_1',
					status: 'success',
					created_time: '2024-07-11T17:30:00Z'
				}
			}
		}
	},
	'/job_scheduling/cron/1234/submit_job': {
		POST: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: { message: 'No such Cron with the given id exists', error_code: 'INVALID_ID' }
			}
		}
	},
	'/job_scheduling/cron/no_cron/submit_job': {
		POST: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: { message: 'No such Cron with the given name exists.', error_code: 'INVALID_NAME' }
			}
		}
	},

	// Job Scheduling - Job
	'/job_scheduling/job/123456789': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					job_id: 'job_123',
					job_name: 'test_job',
					target_type: 'Function',
					target_name: 'target_fn',
					jobpool_name: 'pool_1',
					status: 'success',
					created_time: '2024-07-11T17:30:00Z'
				}
			}
		},
		DELETE: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					job_id: 'job_123',
					job_name: 'test_job',
					target_type: 'Function',
					target_name: 'target_fn',
					jobpool_name: 'pool_1',
					status: 'success',
					created_time: '2024-07-11T17:30:00Z'
				}
			}
		}
	},
	'/job_scheduling/job/1234': {
		GET: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: { message: 'No such job with the given id exists', error_code: 'INVALID_ID' }
			}
		},
		DELETE: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: { message: 'No such job with the given id exists', error_code: 'INVALID_ID' }
			}
		}
	},
	'/job_scheduling/job': {
		POST: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					job_id: 'job_123',
					job_name: 'test_job',
					target_type: 'Function',
					target_name: 'target_fn',
					jobpool_name: 'pool_1',
					status: 'success',
					created_time: '2024-07-11T17:30:00Z'
				}
			}
		}
	},

	// Job Scheduling - Jobpool
	'/job_scheduling/jobpool/123456789': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					jobpool_id: 'pool_1',
					jobpool_name: 'test_pool',
					project_details: { id: '123', project_name: 'proj' },
					created_time: '2024-07-11T17:30:00Z',
					created_by: { email_id: 'user@zylker.com', user_id: 'u_1' },
					modified_time: '2024-07-11T17:40:00Z',
					modified_by: { email_id: 'user@zylker.com', user_id: 'u_1' }
				}
			}
		}
	},
	'/job_scheduling/jobpool/test_job_pool': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					jobpool_id: 'pool_1',
					jobpool_name: 'test_pool',
					project_details: { id: '123', project_name: 'proj' },
					created_time: '2024-07-11T17:30:00Z',
					created_by: { email_id: 'user@zylker.com', user_id: 'u_1' },
					modified_time: '2024-07-11T17:40:00Z',
					modified_by: { email_id: 'user@zylker.com', user_id: 'u_1' }
				}
			}
		}
	},
	'/job_scheduling/jobpool/1234': {
		GET: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: { message: 'No such JobPool with the given id exists.', error_code: 'INVALID_ID' }
			}
		}
	},
	'/job_scheduling/jobpool/no_jobpool': {
		GET: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: { message: 'No such JobPool with the given name exists.', error_code: 'INVALID_NAME' }
			}
		}
	},
	'/job_scheduling/jobpool/cron_name': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					jobpool_id: 'pool_1',
					jobpool_name: 'test_pool',
					project_details: { id: '123', project_name: 'proj' },
					created_time: '2024-07-11T17:30:00Z',
					created_by: { email_id: 'user@zylker.com', user_id: 'u_1' },
					modified_time: '2024-07-11T17:40:00Z',
					modified_by: { email_id: 'user@zylker.com', user_id: 'u_1' }
				}
			}
		}
	},
	'/job_scheduling/jobpool': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: [
					{
						jobpool_id: 'pool_1',
						jobpool_name: 'test_pool',
						project_details: { id: '123', project_name: 'proj' },
						created_time: '2024-07-11T17:30:00Z',
						created_by: { email_id: 'user@zylker.com', user_id: 'u_1' },
						modified_time: '2024-07-11T17:40:00Z',
						modified_by: { email_id: 'user@zylker.com', user_id: 'u_1' }
					},
					{
						jobpool_id: 'pool_1',
						jobpool_name: 'test_pool',
						project_details: { id: '123', project_name: 'proj' },
						created_time: '2024-07-11T17:30:00Z',
						created_by: { email_id: 'user@zylker.com', user_id: 'u_1' },
						modified_time: '2024-07-11T17:40:00Z',
						modified_by: { email_id: 'user@zylker.com', user_id: 'u_1' }
					}
				]
			}
		}
	},

	// Auth - UserManagement routes
	'/project-user': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: [
					{
						user_id: '123',
						email_id: 'email',
						first_name: 'firstname',
						last_name: 'lastname',
						zuid: '12345',
						zaaid: '1234',
						org_id: '1234',
						status: 'ACTIVE',
						role_details: { role_id: '12', role_name: 'test_role' },
						created_time: 'created_time',
						modified_time: 'modeified_time',
						invited_time: 'invited_time',
						is_confirmed: true
					}
				]
			}
		},
		POST: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					platform_type: 'web',
					user_details: {
						first_name: 'firstname',
						last_name: 'lastname',
						email_id: 'email',
						org_id: '1234'
					}
				}
			}
		}
	},
	'/project-user?org_id=ord_Id': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: [
					{
						user_id: '123',
						email_id: 'email',
						first_name: 'firstname',
						last_name: 'lastname',
						zuid: '12345',
						zaaid: '1234',
						org_id: '1234',
						status: 'ACTIVE',
						role_details: { role_id: '12', role_name: 'test_role' },
						created_time: 'created_time',
						modified_time: 'modeified_time',
						invited_time: 'invited_time',
						is_confirmed: true
					}
				]
			}
		}
	},
	'/project-user/orgs': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: ['org_1234', 'org_5678']
			}
		}
	},
	'/project-user/123': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					user_id: '123',
					email_id: 'email',
					first_name: 'firstname',
					last_name: 'lastname',
					status: 'ACTIVE'
				}
			}
		},
		PUT: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					user_id: '123',
					email_id: 'samplemail@sample.com',
					last_name: 'last_name',
					first_name: 'first_name',
					status: 'ACTIVE'
				}
			}
		},
		DELETE: {
			statusCode: 200,
			data: {
				status: 'success',
				data: true
			}
		}
	},
	'/project-user/1234': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: undefined
			}
		},
		DELETE: {
			statusCode: 200,
			data: {
				status: 'success',
				data: null
			}
		}
	},
	'/project-user/forgotpassword': {
		POST: {
			statusCode: 200,
			data: {
				status: 'success',
				data: 'Reset link sent to your email address. Please check your email :)'
			}
		}
	},
	'/project-user/123/enable': {
		POST: {
			statusCode: 200,
			data: {
				status: 'success',
				data: { user_id: '123', status: 'ACTIVE' }
			}
		}
	},
	'/project-user/123/disable': {
		POST: {
			statusCode: 200,
			data: {
				status: 'success',
				data: { user_id: '123', status: 'INACTIVE' }
			}
		}
	},

	// Auth - Browser routes
	'/__catalyst/auth/public-signup': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: { public_signup: true }
			}
		}
	},
	'/project-user/change-password': {
		PUT: {
			statusCode: 200,
			data: {
				status: 'success',
				data: 'Password changed successfully'
			}
		}
	},
	'/project-user/change-password?new_password=newPass456&old_password=oldPass123': {
		PUT: {
			statusCode: 200,
			data: {
				status: 'success',
				data: 'Password changed successfully'
			}
		}
	},

	// NoSQL table mocks
	'/nosqltable/12345': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					type: 'TABLE',
					project_details: { project_name: 'testProject', id: '12345', project_type: 'Live' },
					partition_key: { column_name: 'main_part', data_type: 'S' },
					sort_key: { column_name: 'main_sort', data_type: 'S' },
					status: 'ONLINE',
					modified_by: { is_confirmed: false, email_id: 'testuser@test.com', first_name: 'Test', last_name: 'User', user_type: 'Admin', user_id: '1234567890' },
					modified_time: 'Mar 27, 2024 02:50 PM',
					created_by: { is_confirmed: false, email_id: 'testuser@test.com', first_name: 'Test', last_name: 'User', user_type: 'Admin', user_id: '1234567890' },
					created_time: 'Mar 27, 2024 02:50 PM',
					metrics: { size: 57413, row_count: 8 },
					id: '12345',
					name: 'testTable',
					ttl_enabled: false,
					api_access: false,
					additional_sort_keys: [],
					global_index: [{
						type: 'GLOBAL_INDEX',
						project_details: { project_name: 'testProject', id: '12345', project_type: 'Live' },
						partition_key: { column_name: 'idx1', data_type: 'S' },
						sort_key: { column_name: 'str1', data_type: 'S' },
						status: 'ONLINE',
						modified_by: { is_confirmed: false, email_id: 'testuser@test.com', first_name: 'Test', last_name: 'User', user_type: 'Admin', user_id: '1234567890' },
						modified_time: 'Apr 01, 2024 12:23 PM',
						created_by: { is_confirmed: false, email_id: 'testuser@test.com', first_name: 'Test', last_name: 'User', user_type: 'Admin', user_id: '1234567890' },
						created_time: 'Apr 01, 2024 12:23 PM',
						metrics: { size: null, row_count: 0 },
						id: '123456',
						name: 'testIdx',
						projected_attributes: { type: 'all' }
					}]
				}
			}
		}
	},
	'/nosqltable/testTable': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: {
					type: 'TABLE',
					project_details: { project_name: 'testProject', id: '12345', project_type: 'Live' },
					partition_key: { column_name: 'main_part', data_type: 'S' },
					sort_key: { column_name: 'main_sort', data_type: 'S' },
					status: 'ONLINE',
					modified_by: { is_confirmed: false, email_id: 'testuser@test.com', first_name: 'Test', last_name: 'User', user_type: 'Admin', user_id: '1234567890' },
					modified_time: 'Mar 27, 2024 02:50 PM',
					created_by: { is_confirmed: false, email_id: 'testuser@test.com', first_name: 'Test', last_name: 'User', user_type: 'Admin', user_id: '1234567890' },
					created_time: 'Mar 27, 2024 02:50 PM',
					metrics: { size: 57413, row_count: 8 },
					id: '12345',
					name: 'testTable',
					ttl_enabled: false,
					api_access: false,
					additional_sort_keys: [],
					global_index: [{
						type: 'GLOBAL_INDEX',
						project_details: { project_name: 'testProject', id: '12345', project_type: 'Live' },
						partition_key: { column_name: 'idx1', data_type: 'S' },
						sort_key: { column_name: 'str1', data_type: 'S' },
						status: 'ONLINE',
						modified_by: { is_confirmed: false, email_id: 'testuser@test.com', first_name: 'Test', last_name: 'User', user_type: 'Admin', user_id: '1234567890' },
						modified_time: 'Apr 01, 2024 12:23 PM',
						created_by: { is_confirmed: false, email_id: 'testuser@test.com', first_name: 'Test', last_name: 'User', user_type: 'Admin', user_id: '1234567890' },
						created_time: 'Apr 01, 2024 12:23 PM',
						metrics: { size: null, row_count: 0 },
						id: '123456',
						name: 'testIdx',
						projected_attributes: { type: 'all' }
					}]
				}
			}
		}
	},
	'/nosqltable/notable': {
		GET: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: { message: 'No such table with the given id exists', error_code: 'INVALID_ID' }
			}
		}
	},
	'/nosqltable': {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: [{
					type: 'TABLE',
					project_details: { project_name: 'testProject', id: '12345', project_type: 'Live' },
					partition_key: { column_name: 'main_part', data_type: 'S' },
					sort_key: { column_name: 'main_sort', data_type: 'S' },
					status: 'ONLINE',
					modified_by: { Zuid: '1234567890', is_confirmed: false, email_id: 'testuser@test.com', first_name: 'Test', last_name: 'User', user_type: 'Admin', user_id: '1234567890' },
					modified_time: 'Mar 27, 2024 02:50 PM',
					created_by: { Zuid: '1234567890', is_confirmed: false, email_id: 'testuser@test.com', first_name: 'Test', last_name: 'User', user_type: 'Admin', user_id: '1234567890' },
					created_time: 'Mar 27, 2024 02:50 PM',
					metrics: { size: 57413, row_count: 8 },
					id: '12345',
					name: 'testTable',
					ttl_enabled: false,
					api_access: false,
					additional_sort_keys: [],
					global_index: []
				}]
			}
		}
	},

	// NoSQL item operation mocks
	'/nosqltable/12345/item': {
		POST: {
			statusCode: 200,
			data: { status: 'success', data: { size: 20, create: [{ status: 'Success' }] } }
		},
		PUT: {
			statusCode: 200,
			data: { status: 'success', data: { size: 20, update: [{ status: 'Success' }] } }
		},
		DELETE: {
			statusCode: 200,
			data: { status: 'success', data: { size: 20, delete: [{ status: 'Success' }] } }
		}
	},
	'/nosqltable/testTable/item': {
		POST: {
			statusCode: 200,
			data: { status: 'success', data: { size: 20, create: [{ status: 'Success' }] } }
		},
		PUT: {
			statusCode: 200,
			data: { status: 'success', data: { size: 20, update: [{ status: 'Success' }] } }
		},
		DELETE: {
			statusCode: 200,
			data: { status: 'success', data: { size: 20, delete: [{ status: 'Success' }] } }
		}
	},
	'/nosqltable/failure/item': {
		POST: {
			statusCode: 400,
			data: { status: 'failure', data: { message: 'Invalid input value for item', error_code: 'INVALID_INPUT' } }
		},
		PUT: {
			statusCode: 400,
			data: { status: 'failure', data: { message: 'Mandatory Key main_part is missing in the item', error_code: 'INVALID_KEY' } }
		},
		DELETE: {
			statusCode: 200,
			data: { status: 'success', data: { size: 0, delete: [{ status: 'ConditionMismatch' }] } }
		}
	},
	'/nosqltable/12345/item/fetch': {
		POST: {
			statusCode: 200,
			data: { status: 'success', data: { size: 20, get: [{ item: { main_sort: { S: 'a' }, main_part: { S: 'a' } } }] } }
		}
	},
	'/nosqltable/testTable/item/fetch': {
		POST: {
			statusCode: 200,
			data: { status: 'success', data: { size: 20, get: [{ item: { main_sort: { S: 'a' }, main_part: { S: 'a' } } }] } }
		}
	},
	'/nosqltable/failure/item/fetch': {
		POST: {
			statusCode: 200,
			data: { status: 'success', data: { size: 0 } }
		}
	},
	'/nosqltable/12345/item/query': {
		POST: {
			statusCode: 200,
			data: { status: 'success', data: { size: 20, get: [{ item: { main_sort: { S: 'a' }, main_part: { S: 'a' } } }] } }
		}
	},
	'/nosqltable/testTable/item/query': {
		POST: {
			statusCode: 200,
			data: { status: 'success', data: { size: 20, get: [{ item: { main_sort: { S: 'a' }, main_part: { S: 'a' } } }] } }
		}
	},
	'/nosqltable/failure/item/query': {
		POST: {
			statusCode: 200,
			data: { status: 'success', data: { size: 0 } }
		}
	}

};
