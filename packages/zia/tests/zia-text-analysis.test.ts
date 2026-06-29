import { Zia } from '../src';

const { responses } = require('../../../tests/api-responses.js');

describe('zia text analytics', () => {
	const zia: Zia = new Zia();
	// app.setRequestResponseMap(ziaReqRes);
	it('sentiment alanlysis', async () => {
		expect.assertions(4);
		await expect(
			zia.getSentimentAnalysis(['I love the design of the new model.'])
		).resolves.toStrictEqual(responses['/ml/text-analytics/sentiment-analysis'].POST.data.data);
		await expect(zia.getSentimentAnalysis([])).rejects.toThrowError();
		await expect(
			zia.getSentimentAnalysis(['I love the design of the new model.'], ['love'])
		).resolves.toStrictEqual(responses['/ml/text-analytics/sentiment-analysis'].POST.data.data);
		await expect(
			zia.getSentimentAnalysis(['I love the design of the new model.'], [])
		).rejects.toThrowError();
	});

	it('NERPrediction', async () => {
		expect.assertions(2);
		await expect(zia.getNERPrediction(['Zoho Corporation'])).resolves.toStrictEqual(
			responses['/ml/text-analytics/ner'].POST.data.data
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
		).resolves.toStrictEqual(responses['/ml/text-analytics/keyword-extraction'].POST.data.data);
		await expect(zia.getKeywordExtraction([])).rejects.toThrowError();
	});

	it('Complete Text analysis', async () => {
		expect.assertions(4);
		await expect(
			zia.getTextAnalytics([
				'Zoho Corporation is an Indian software development company.' +
					' The focus of Zoho Corporation lies in web-based business tools and information technology.'
			])
		).resolves.toStrictEqual(responses['/ml/text-analytics'].POST.data.data);
		await expect(zia.getTextAnalytics([])).rejects.toThrowError();
		await expect(
			zia.getTextAnalytics(
				[
					'Zoho Corporation is an Indian software development company.' +
						' The focus of Zoho Corporation lies in web-based business tools and information technology.'
				],
				['zoho']
			)
		).resolves.toStrictEqual(responses['/ml/text-analytics'].POST.data.data);
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
