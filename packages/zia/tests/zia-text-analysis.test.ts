import { createReadStream } from 'fs';

import { ZCAuth } from '../../auth/src';
import { Zia } from '../src';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('zia text analytics', () => {
	const app = new mockedApp().init();
	const zia: Zia = new Zia(app);
	const ziaReqRes = {
		['/ml/text-analytics/sentiment-analysis']: {
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
		['/ml/text-analytics/ner']: {
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
		['/ml/text-analytics/keyword-extraction']: {
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
		['/ml/text-analytics']: {
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
		}
	};
	app.setRequestResponseMap(ziaReqRes);
	it('sentiment alanlysis', async () => {
		expect.assertions(4);
		await expect(
			zia.getSentimentAnalysis(['I love the design of the new model.'])
		).resolves.toStrictEqual(ziaReqRes['/ml/text-analytics/sentiment-analysis'].POST.data.data);
		await expect(zia.getSentimentAnalysis([])).rejects.toThrowError();
		await expect(
			zia.getSentimentAnalysis(['I love the design of the new model.'], ['love'])
		).resolves.toStrictEqual(ziaReqRes['/ml/text-analytics/sentiment-analysis'].POST.data.data);
		await expect(
			zia.getSentimentAnalysis(['I love the design of the new model.'], [])
		).rejects.toThrowError();
	});

	it('NERPrediction', async () => {
		expect.assertions(2);
		await expect(zia.getNERPrediction(['Zoho Corporation'])).resolves.toStrictEqual(
			ziaReqRes['/ml/text-analytics/ner'].POST.data.data
		);
		await expect(zia.getNERPrediction([])).rejects.toThrowError();
	});

	it('Extract keywords', async () => {
		expect.assertions(2);
		await expect(
			zia.getKeywordExtraction([
				'Catalyst is a full-stack cloud-based serverless development tool,' +
					' that provides backend functionalities to build applications and microservices on various platforms.'
			])
		).resolves.toStrictEqual(ziaReqRes['/ml/text-analytics/keyword-extraction'].POST.data.data);
		await expect(zia.getKeywordExtraction([])).rejects.toThrowError();
	});

	it('Complete Text analysis', async () => {
		expect.assertions(4);
		await expect(
			zia.getTextAnalytics([
				'Zoho Corporation is an Indian software development company.' +
					' The focus of Zoho Corporation lies in web-based business tools and information technology.'
			])
		).resolves.toStrictEqual(ziaReqRes['/ml/text-analytics'].POST.data.data);
		await expect(zia.getTextAnalytics([])).rejects.toThrowError();
		await expect(
			zia.getTextAnalytics(
				[
					'Zoho Corporation is an Indian software development company.' +
						' The focus of Zoho Corporation lies in web-based business tools and information technology.'
				],
				['zoho']
			)
		).resolves.toStrictEqual(ziaReqRes['/ml/text-analytics'].POST.data.data);
		await expect(
			zia.getTextAnalytics(
				[
					'Zoho Corporation is an Indian software development company.' +
						' The focus of Zoho Corporation lies in web-based business tools and information technology.'
				],
				[]
			)
		).rejects.toThrowError();
	});
});
