import { QuickML } from '../src';

const { responses } = require('../../../tests/api-responses.js');
import { createReadStream } from 'fs';
describe('testing quick ml', () => {
	const quickml: QuickML = new QuickML();

	it('getComponentName returns correct name', () => {
		expect(quickml.getComponentName()).toBe('quickml');
	});

	it('getComponentVersion returns package version', () => {
		expect(quickml.getComponentVersion()).toBe(require('../package.json').version);
	});

	it('quick ml endpoint predict', async () => {
		await expect(
			quickml.runInference('1234abcd', {
				sepal_length: '6.4',
				sepal_width: '3.2',
				petal_length: '4.5',
				petal_width: '1.5'
			})
		).resolves.toStrictEqual({ data: responses['/endpoints/predict'].POST.data.data });
		await expect(
			quickml.runInference('', {
				sepal_length: '6.4',
				sepal_width: '3.2',
				petal_length: '4.5',
				petal_width: '1.5'
			})
		).rejects.toThrowError();
		await expect(quickml.runInference('1234abcd', {})).rejects.toThrowError();
	});
	it('document search', async () => {
		await expect(
			quickml.searchDocuments('1234abcd', 'What is QuickML?')
		).resolves.toStrictEqual({
			data: responses['/genai/endpoints/rag/search'].POST.data.data
		});

		await expect(quickml.searchDocuments('', 'What is QuickML?')).rejects.toThrowError();

		await expect(quickml.searchDocuments('1234abcd', '')).rejects.toThrowError();
	});
	it('generate rag response', async () => {
		await expect(
			quickml.generateRagResponse('1234abcd', 'What is QuickML?')
		).resolves.toStrictEqual({
			data: responses['/genai/endpoints/rag/generate'].POST.data.data
		});

		await expect(quickml.generateRagResponse('', 'What is QuickML?')).rejects.toThrowError();

		await expect(quickml.generateRagResponse('1234abcd', '')).rejects.toThrowError();
	});
	it('chat with rag agent', async () => {
		await expect(quickml.askRagAgent('1234abcd', 'Hello')).resolves.toStrictEqual({
			data: responses['/genai/endpoints/rag/agent'].POST.data.data
		});

		await expect(quickml.askRagAgent('', 'Hello')).rejects.toThrowError();

		await expect(quickml.askRagAgent('1234abcd', '')).rejects.toThrowError();
	});
	it('deprecated predict method', async () => {
		await expect(
			quickml.predict('1234abcd', {
				sepal_length: '6.4',
				sepal_width: '3.2',
				petal_length: '4.5',
				petal_width: '1.5'
			})
		).resolves.toStrictEqual({
			data: responses['/endpoints/predict'].POST.data.data
		});

		await expect(
			quickml.predict('', {
				sepal_length: '6.4',
				sepal_width: '3.2',
				petal_length: '4.5',
				petal_width: '1.5'
			})
		).rejects.toThrowError();

		await expect(quickml.predict('1234abcd', {})).rejects.toThrowError();
	});
	it('chat with rag agent with history', async () => {
		await expect(
			quickml.converseWithRagAgent('1234abcd', 'Hello', 'conv123')
		).resolves.toStrictEqual({
			data: responses['/genai/endpoints/rag/agent/chat'].POST.data.data
		});

		await expect(quickml.converseWithRagAgent('', 'Hello', 'conv123')).rejects.toThrowError();

		await expect(
			quickml.converseWithRagAgent('1234abcd', '', 'conv123')
		).rejects.toThrowError();

		await expect(quickml.converseWithRagAgent('1234abcd', 'Hello', '')).resolves.toStrictEqual({
			data: responses['/genai/endpoints/rag/agent/chat'].POST.data.data
		});
	});
	it('chat with rag agent without conversation id', async () => {
		await expect(quickml.converseWithRagAgent('1234abcd', 'Hello')).resolves.toStrictEqual({
			data: responses['/genai/endpoints/rag/agent/chat'].POST.data.data
		});
	});
	it('predict llm', async () => {
		await expect(quickml.askLlm('1234abcd', 'Explain AI')).resolves.toStrictEqual({
			data: responses['/genai/endpoints/glm-flash-47/generate'].POST.data.data
		});

		await expect(quickml.askLlm('', 'Explain AI')).rejects.toThrowError();

		await expect(quickml.askLlm('1234abcd', '')).rejects.toThrowError();
	});
	it('chat with llm with history', async () => {
		await expect(
			quickml.converseWithLlm('1234abcd', 'Explain AI', 'conv123')
		).resolves.toStrictEqual({
			data: responses['/genai/endpoints/glm-flash-47/chat'].POST.data.data
		});

		await expect(quickml.converseWithLlm('', 'Explain AI', 'conv123')).rejects.toThrowError();

		await expect(quickml.converseWithLlm('1234abcd', '', 'conv123')).rejects.toThrowError();

		await expect(quickml.converseWithLlm('1234abcd', 'Explain AI', '')).resolves.toStrictEqual({
			data: responses['/genai/endpoints/glm-flash-47/chat'].POST.data.data
		});
	});
	it('chat with llm without conversation id', async () => {
		await expect(quickml.converseWithLlm('1234abcd', 'Explain AI')).resolves.toStrictEqual({
			data: responses['/genai/endpoints/glm-flash-47/chat'].POST.data.data
		});
	});

	it('analyze image', async () => {
		await expect(
			quickml.analyzeImage(
				'1234abcd',
				createReadStream('./tests/img1.jpeg'),
				'Describe this image'
			)
		).resolves.toStrictEqual({
			data: responses['/genai/endpoints/vlm/generate'].POST.data.data
		});

		await expect(
			quickml.analyzeImage('', createReadStream('./tests/img1.jpeg'), 'Describe this image')
		).rejects.toThrowError();

		await expect(
			quickml.analyzeImage('1234abcd', createReadStream('./tests/img1.jpeg'), '')
		).rejects.toThrowError();

		await expect(
			quickml.analyzeImage('1234abcd', undefined as any, 'Describe this image')
		).rejects.toThrowError();
	});
});
