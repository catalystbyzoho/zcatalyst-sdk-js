'use strict';

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

export class Zia implements Component {
	requester: Handler;
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	/**
	 * Get the name of the Zia component.
	 * @returns The name of the component.
	 */
	getComponentName(): string {
		return COMPONENT.zia;
	}

	/**
	 * Detect objects in an image.
	 * @param file Read stream of the image file.
	 * @returns The detected objects in the image.
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
	 * Extract text from an image using Optical Character Recognition (OCR).
	 * @param file Read stream of the image file.
	 * @param opts Optional parameters for language and model type.
	 * @returns Extracted text from the image.
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
	 * Extract Aadhaar card details using OCR.
	 * @param frontImg Read stream of the Aadhaar front image.
	 * @param backImg Read stream of the Aadhaar back image.
	 * @param language Language for text extraction.
	 * @returns Extracted Aadhaar card details.
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
	 * Scan a barcode from an image.
	 * @param image Read stream of the barcode image.
	 * @param opts Optional parameters such as format.
	 * @returns Scanned barcode details.
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
	 * Moderates an image by analyzing its content for potentially inappropriate or unsafe elements.
	 *
	 * @param image - A readable stream of the image file to be moderated.
	 * @param opts - Optional parameters for image moderation.
	 *   @param opts.mode - The moderation mode (e.g., strict, moderate, or relaxed).
	 * @returns An object containing the moderation analysis results.
	 *
	 * @throws {CatalystZiaError} If the provided image is not valid.
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
	 * Analyzes a face in an image and extracts attributes such as emotions, age, and gender.
	 *
	 * @param image - A readable stream of the image file containing the face to be analyzed.
	 * @param opts - Optional parameters for face analysis.
	 *   @param opts.mode - The mode of face analysis (e.g., basic or advanced).
	 *   @param opts.emotion - Whether to analyze emotions in the face.
	 *   @param opts.age - Whether to estimate the age of the person in the image.
	 *   @param opts.gender - Whether to determine the gender of the person in the image.
	 * @returns An object containing the analyzed face attributes.
	 *
	 * @throws {CatalystZiaError} If the provided image is not valid.
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
	 * Compare two faces to check for a match.
	 * @param sourceImage Read stream of the source image.
	 * @param queryImage Read stream of the image to be compared.
	 * @returns Object containing match status and confidence value.
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
	 * Perform an inference request on a deployed AutoML model.
	 *
	 * @param modelId - The ID of the AutoML model to be used for inference.
	 * @param data - The input data to be passed to the model for prediction.
	 * @returns The prediction result from the AutoML model.
	 *
	 * @throws {CatalystZiaError} If the model ID is invalid or the data is not an object.
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
	 * Get the sentiment analytics for the list of documents.
	 * @param listOfDocuments Array of strings whose sentiment is to be analysed.
	 * @param keywords Entity-level sentiment key
	 * @returns `ICatalystZiaSentimentAnalysis`
	 * @link https://www.zoho.com/catalyst/sdk/nodeJS-sdk/zia_compinst.html
	 */
	async getSentimentAnalysis(
		listOfDocuments: Array<string>,
		keywords?: Array<string>
	): Promise<ICatalystZiaSentimentAnalysis> {
		return _getSentimentAnalysis(this.requester, listOfDocuments, keywords);
	}

	/**
	 * Extracts the keywords from the list of documents provided.
	 * @param listOfDocuments Array of strings, which has to processed for keyword extraction
	 * @returns `ICatalsytZiaKeywordExtraction`
	 * @link https://www.zoho.com/catalyst/sdk/nodeJS-sdk/zia_compinst.html
	 */
	async getKeywordExtraction(
		listOfDocuments: Array<string>
	): Promise<ICatalsytZiaKeywordExtraction> {
		return _getKeywordExtraction(this.requester, listOfDocuments);
	}

	/**
	 * Performs NER (Named Entity Recognition) on the given list of documents.
	 * @param listOfDocuments Array of strings to be processed for NER.
	 * @returns `ICatalystZiaNERPrediction`
	 * @link https://www.zoho.com/catalyst/sdk/nodeJS-sdk/zia_compinst.html
	 */
	async getNERPrediction(listOfDocuments: Array<string>): Promise<ICatalystZiaNERPrediction> {
		return _getNERPrediction(this.requester, listOfDocuments);
	}

	/**
	 * Performs all the three available text analytics on the list of documents provided.
	 *
	 * Available text anaytics features:
	 * * `Sentiment Analysis`
	 * * `Keyword Extraction`
	 * * `NER Prediction`
	 *
	 * Note: These text analytics features are also available as seperate functions. Please check other functions under `textAnalysis`.
	 *
	 * @param listOfDocuments Array of strings to be processed for text anaytics.
	 * @param keywords Entity-level sentiment key
	 * @returns `ICatalystZiaTextAnalytics`
	 * @link https://www.zoho.com/catalyst/sdk/nodeJS-sdk/zia_compinst.html
	 */
	async getTextAnalytics(
		listOfDocuments: Array<string>,
		keywords?: Array<string>
	): Promise<ICatalystZiaTextAnalytics> {
		return _getTextAnalytics(this.requester, listOfDocuments, keywords);
	}
}
