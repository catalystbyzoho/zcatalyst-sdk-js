import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import {
	CatalystService,
	CONSTANTS,
	isNonEmptyArray,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import { CatalystZiaError } from './utils/errors';
import {
	ICatalsytZiaKeywordExtraction,
	ICatalystZiaNERPrediction,
	ICatalystZiaSentimentAnalysis,
	ICatalystZiaTextAnalytics
} from './utils/interfaces';

const { REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;
export async function _getSentimentAnalysis(
	requester: Handler,
	listOfDocuments: Array<string>,
	keywords?: Array<string>
): Promise<ICatalystZiaSentimentAnalysis> {
	await wrapValidatorsWithPromise(() => {
		isNonEmptyArray(listOfDocuments, 'documents list', true);
		if (keywords !== undefined) {
			isNonEmptyArray(isNonEmptyArray(keywords, 'keywords', true));
		}
	}, CatalystZiaError);
	const requestData = {
		document: listOfDocuments,
		keywords
	};
	const request: IRequestConfig = {
		method: REQ_METHOD.post,
		path: '/ml/text-analytics/sentiment-analysis',
		data: requestData,
		type: RequestType.JSON,
		service: CatalystService.BAAS,
		track: true,
		user: CREDENTIAL_USER.admin
	};
	const resp = await requester.send(request);
	return resp.data.data as ICatalystZiaSentimentAnalysis;
}

export async function _getKeywordExtraction(
	requester: Handler,
	listOfDocuments: Array<string>
): Promise<ICatalsytZiaKeywordExtraction> {
	await wrapValidatorsWithPromise(() => {
		isNonEmptyArray(listOfDocuments, 'documents list', true);
	}, CatalystZiaError);

	const request: IRequestConfig = {
		method: REQ_METHOD.post,
		path: '/ml/text-analytics/keyword-extraction',
		data: { document: listOfDocuments },
		type: RequestType.JSON,
		service: CatalystService.BAAS,
		track: true,
		user: CREDENTIAL_USER.admin
	};
	const resp = await requester.send(request);
	return resp.data.data as ICatalsytZiaKeywordExtraction;
}

export async function _getNERPrediction(
	requester: Handler,
	listOfDocuments: Array<string>
): Promise<ICatalystZiaNERPrediction> {
	await wrapValidatorsWithPromise(() => {
		isNonEmptyArray(listOfDocuments, 'documents list', true);
	}, CatalystZiaError);

	const request: IRequestConfig = {
		method: REQ_METHOD.post,
		path: '/ml/text-analytics/ner',
		data: { document: listOfDocuments },
		type: RequestType.JSON,
		service: CatalystService.BAAS,
		track: true,
		user: CREDENTIAL_USER.admin
	};
	const resp = await requester.send(request);
	return resp.data.data as ICatalystZiaNERPrediction;
}

export async function _getTextAnalytics(
	requester: Handler,
	listOfDocuments: Array<string>,
	keywords?: Array<string>
): Promise<ICatalystZiaTextAnalytics> {
	await wrapValidatorsWithPromise(() => {
		isNonEmptyArray(listOfDocuments, 'documents list', true);
		if (keywords !== undefined) {
			isNonEmptyArray(isNonEmptyArray(keywords, 'keywords', true));
		}
	}, CatalystZiaError);
	const requestData = {
		document: listOfDocuments,
		keywords
	};
	const request: IRequestConfig = {
		method: REQ_METHOD.post,
		path: '/ml/text-analytics',
		data: requestData,
		type: RequestType.JSON,
		service: CatalystService.BAAS,
		track: true,
		user: CREDENTIAL_USER.admin
	};
	const resp = await requester.send(request);
	return resp.data.data as ICatalystZiaTextAnalytics;
}
