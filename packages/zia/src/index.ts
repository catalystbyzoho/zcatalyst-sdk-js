/**
 * Catalyst Zia — AI services such as OCR, object detection, sentiment analysis and more.
 *
 * @packageDocumentation
 */

import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isNonEmptyString,
	isValidInputString,
	isValidType,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';
import fs from 'fs';

import pkg from '../package.json';
const { version } = pkg;
import { CatalystZiaError } from './utils/errors';
import {
	ICatalsytZiaKeywordExtraction,
	ICatalystZiaAutoML,
	ICatalystZiaBarcode,
	ICatalystZiaFace,
	ICatalystZiaFaceComparison,
	ICatalystZiaModeration,
	ICatalystZiaNERPrediction,
	ICatalystZiaObject,
	ICatalystZiaOCR,
	ICatalystZiaSentimentAnalysis,
	ICatalystZiaTextAnalytics
} from './utils/interfaces';
import {
	_getKeywordExtraction,
	_getNERPrediction,
	_getSentimentAnalysis,
	_getTextAnalytics
} from './zia-text-analysis';

const { REQ_METHOD, COMPONENT, CREDENTIAL_USER } = CONSTANTS;

/**
 * Provides Catalyst Zia AI and ML service operations.
 */
export class Zia implements Component {
	requester: Handler;
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	/**
	 * getComponentName operation.
	 */
	getComponentName(): string {
		return COMPONENT.zia;
	}

	/**
	 * getComponentVersion operation.
	 */
	getComponentVersion(): string {
		return version;
	}

	/**
	 * Detects objects in an image using Zia object detection.
	 * @param file - The image file stream to analyze.
	 * @returns A promise that resolves to ICatalystZiaObject.
	 * @example
	 * ```ts
	 * const result = await zia.detectObject(fs.createReadStream('image.png'));
	 * ```
	 */
	async detectObject(file: fs.ReadStream): Promise<ICatalystZiaObject> {
		const fileData = { image: file };
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/ml/detect-object`,
			data: fileData,
			type: RequestType.FILE,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystZiaObject;
	}

	/**
	 * Extracts text from an image using Zia OCR.
	 * @param file - The image file stream to analyze.
	 * @param opts - Optional request settings.
	 *   - language - Optional language setting.
	 *   - modelType - Optional modelType setting.
	 *   - format - Optional format setting.
	 *   - mode - Optional mode setting.
	 *   - emotion - Optional emotion setting.
	 *   - age - Optional age setting.
	 *   - gender - Optional gender setting.
	 * @returns A promise that resolves to ICatalystZiaOCR.
	 * @example
	 * ```ts
	 * const result = await zia.extractOpticalCharacters(fs.createReadStream('image.png'), { language: 'eng' });
	 * ```
	 */
	async extractOpticalCharacters(
		file: fs.ReadStream,
		opts: { language?: string; modelType?: string } = {}
	): Promise<ICatalystZiaOCR> {
		const fileData = { image: file, ...opts };
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/ml/ocr`,
			data: fileData,
			type: RequestType.FILE,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystZiaOCR;
	}

	/**
	 * Extracts Aadhaar card details from front and back images.
	 * @param frontImg - The Aadhaar front image stream.
	 * @param backImg - The Aadhaar back image stream.
	 * @param language - The OCR language to use.
	 * @returns A promise that resolves to ICatalystZiaOCR.
	 * @throws {CatalystZiaError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await zia.extractAadhaarCharacters(front, back, 'eng');
	 * ```
	 */
	async extractAadhaarCharacters(
		frontImg: fs.ReadStream,
		backImg: fs.ReadStream,
		language: string
	): Promise<ICatalystZiaOCR> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(language, 'language', true);
		}, CatalystZiaError);
		const fileData = {
			aadhaar_front: frontImg,
			aadhaar_back: backImg,
			language,
			model_type: 'AADHAAR'
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/ml/ocr`,
			data: fileData,
			type: RequestType.FILE,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystZiaOCR;
	}

	/**
	 * Scans barcode information from an image.
	 * @param image - The image file stream to process.
	 * @param opts - Optional request settings.
	 *   - language - Optional language setting.
	 *   - modelType - Optional modelType setting.
	 *   - format - Optional format setting.
	 *   - mode - Optional mode setting.
	 *   - emotion - Optional emotion setting.
	 *   - age - Optional age setting.
	 *   - gender - Optional gender setting.
	 * @returns A promise that resolves to ICatalystZiaBarcode.
	 * @throws {CatalystZiaError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await zia.scanBarcode(fs.createReadStream('barcode.png'));
	 * ```
	 */
	async scanBarcode(
		image: fs.ReadStream,
		opts: { format?: string } = {}
	): Promise<ICatalystZiaBarcode> {
		await wrapValidatorsWithPromise(() => {
			isValidType(image, 'object', 'image', true);
		}, CatalystZiaError);
		const fileData = { image, ...opts };
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/ml/barcode`,
			data: fileData,
			type: RequestType.FILE,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystZiaBarcode;
	}

	/**
	 * Analyzes an image for unsafe or inappropriate content.
	 * @param image - The image file stream to process.
	 * @param opts - Optional request settings.
	 *   - language - Optional language setting.
	 *   - modelType - Optional modelType setting.
	 *   - format - Optional format setting.
	 *   - mode - Optional mode setting.
	 *   - emotion - Optional emotion setting.
	 *   - age - Optional age setting.
	 *   - gender - Optional gender setting.
	 * @returns A promise that resolves to ICatalystZiaModeration.
	 * @throws {CatalystZiaError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await zia.moderateImage(fs.createReadStream('image.png'));
	 * ```
	 */
	async moderateImage(
		image: fs.ReadStream,
		opts: { mode?: string } = { mode: undefined }
	): Promise<ICatalystZiaModeration> {
		await wrapValidatorsWithPromise(() => {
			isValidType(image, 'object', 'image', true);
		}, CatalystZiaError);
		const fileData = {
			image,
			...opts
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/ml/imagemoderation',
			data: fileData,
			type: RequestType.FILE,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystZiaModeration;
	}

	/**
	 * Analyzes faces in an image and returns detected attributes.
	 * @param image - The image file stream to process.
	 * @param opts - Optional request settings.
	 *   - language - Optional language setting.
	 *   - modelType - Optional modelType setting.
	 *   - format - Optional format setting.
	 *   - mode - Optional mode setting.
	 *   - emotion - Optional emotion setting.
	 *   - age - Optional age setting.
	 *   - gender - Optional gender setting.
	 * @returns A promise that resolves to ICatalystZiaFace.
	 * @throws {CatalystZiaError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await zia.analyseFace(fs.createReadStream('face.png'), { emotion: true });
	 * ```
	 */
	async analyseFace(
		image: fs.ReadStream,
		opts: { mode?: string; emotion?: boolean; age?: boolean; gender?: boolean } = {
			mode: undefined,
			emotion: undefined,
			age: undefined,
			gender: undefined
		}
	): Promise<ICatalystZiaFace> {
		await wrapValidatorsWithPromise(() => {
			isValidType(image, 'object', 'image', true);
		}, CatalystZiaError);
		const fileData = {
			image,
			...opts
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/ml/faceanalytics',
			data: fileData,
			type: RequestType.FILE,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystZiaFace;
	}

	/**
	 * Compares two face images and returns match details.
	 * @param sourceImage - The source face image stream.
	 * @param queryImage - The face image stream to compare.
	 * @returns A promise that resolves to ICatalystZiaFaceComparison.
	 * @throws {CatalystZiaError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await zia.compareFace(sourceImage, queryImage);
	 * ```
	 */
	async compareFace(
		sourceImage: fs.ReadStream,
		queryImage: fs.ReadStream
	): Promise<ICatalystZiaFaceComparison> {
		await wrapValidatorsWithPromise(() => {
			isValidType(sourceImage, 'object', 'source_image', true);
			isValidType(queryImage, 'object', 'query_image', true);
		}, CatalystZiaError);
		const fileData = { source_image: sourceImage, query_image: queryImage };
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/ml/facecomparison`,
			data: fileData,
			type: RequestType.FILE,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystZiaFaceComparison;
	}

	/**
	 * Runs inference against a deployed Zia AutoML model.
	 * @param modelId - The AutoML model identifier.
	 * @param data - The input data for the model.
	 * @returns A promise that resolves to ICatalystZiaAutoML.
	 * @throws {CatalystZiaError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await zia.automl('model-id', { field: 'value' });
	 * ```
	 */
	async automl(
		modelId: string,

		data: { [x: string]: unknown } = {}
	): Promise<ICatalystZiaAutoML> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(modelId, 'model_id', true);
			isValidType(data, 'object', 'data', true);
		}, CatalystZiaError);
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/ml/automl/model/${modelId}`,
			data,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystZiaAutoML;
	}

	/**
	 * Analyzes sentiment for a list of text documents.
	 * @param listOfDocuments - The text documents to analyze.
	 * @param keywords - Optional keywords for entity-level sentiment analysis.
	 * @returns A promise that resolves to ICatalystZiaSentimentAnalysis.
	 * @example
	 * ```ts
	 * const result = await zia.getSentimentAnalysis(['Catalyst is great']);
	 * ```
	 */
	async getSentimentAnalysis(
		listOfDocuments: Array<string>,
		keywords?: Array<string>
	): Promise<ICatalystZiaSentimentAnalysis> {
		return _getSentimentAnalysis(this.requester, listOfDocuments, keywords);
	}

	/**
	 * Extracts keywords from a list of text documents.
	 * @param listOfDocuments - The text documents to analyze.
	 * @returns A promise that resolves to ICatalsytZiaKeywordExtraction.
	 * @example
	 * ```ts
	 * const result = await zia.getKeywordExtraction(['Catalyst provides serverless tools']);
	 * ```
	 */
	async getKeywordExtraction(
		listOfDocuments: Array<string>
	): Promise<ICatalsytZiaKeywordExtraction> {
		return _getKeywordExtraction(this.requester, listOfDocuments);
	}

	/**
	 * Runs named-entity recognition on text documents.
	 * @param listOfDocuments - The text documents to analyze.
	 * @returns A promise that resolves to ICatalystZiaNERPrediction.
	 * @example
	 * ```ts
	 * const result = await zia.getNERPrediction(['Zoho Catalyst is a platform']);
	 * ```
	 */
	async getNERPrediction(listOfDocuments: Array<string>): Promise<ICatalystZiaNERPrediction> {
		return _getNERPrediction(this.requester, listOfDocuments);
	}

	/**
	 * Runs sentiment analysis, keyword extraction, and NER on text documents.
	 * @param listOfDocuments - The text documents to analyze.
	 * @param keywords - Optional keywords for entity-level sentiment analysis.
	 * @returns A promise that resolves to ICatalystZiaTextAnalytics.
	 * @example
	 * ```ts
	 * const result = await zia.getTextAnalytics(['Zoho Catalyst is great']);
	 * ```
	 */
	async getTextAnalytics(
		listOfDocuments: Array<string>,
		keywords?: Array<string>
	): Promise<ICatalystZiaTextAnalytics> {
		return _getTextAnalytics(this.requester, listOfDocuments, keywords);
	}
}
