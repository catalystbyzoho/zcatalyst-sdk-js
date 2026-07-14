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
			quickml.predict('1234abcd', {
				sepal_length: '6.4',
				sepal_width: '3.2',
				petal_length: '4.5',
				petal_width: '1.5'
			})
		).resolves.toStrictEqual({ data: responses['/endpoints/predict'].POST.data.data });
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
	it('document search', async () => {
		await expect(quickml.documentSearch('1234abcd', 'What is QuickML?')).resolves.toStrictEqual(
			{
				data: responses['/genai/endpoints/rag/search'].POST.data.data
			}
		);

		await expect(quickml.documentSearch('', 'What is QuickML?')).rejects.toThrowError();

		await expect(quickml.documentSearch('1234abcd', '')).rejects.toThrowError();
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
		await expect(quickml.chatWithRagAgent('1234abcd', 'Hello')).resolves.toStrictEqual({
			data: responses['/genai/endpoints/rag/agent'].POST.data.data
		});

		await expect(quickml.chatWithRagAgent('', 'Hello')).rejects.toThrowError();

		await expect(quickml.chatWithRagAgent('1234abcd', '')).rejects.toThrowError();
	});
	it('chat with rag agent with history', async () => {
		await expect(
			quickml.chatWithRagAgentWithHistory('1234abcd', 'Hello', 'conv123')
		).resolves.toStrictEqual({
			data: responses['/genai/endpoints/rag/agent/chat'].POST.data.data
		});

		await expect(
			quickml.chatWithRagAgentWithHistory('', 'Hello', 'conv123')
		).rejects.toThrowError();

		await expect(
			quickml.chatWithRagAgentWithHistory('1234abcd', '', 'conv123')
		).rejects.toThrowError();

		await expect(
			quickml.chatWithRagAgentWithHistory('1234abcd', 'Hello', '')
		).resolves.toStrictEqual({
			data: responses['/genai/endpoints/rag/agent/chat'].POST.data.data
		});
	});
	it('chat with rag agent without conversation id', async () => {
		await expect(
			quickml.chatWithRagAgentWithHistory('1234abcd', 'Hello')
		).resolves.toStrictEqual({
			data: responses['/genai/endpoints/rag/agent/chat'].POST.data.data
		});
	});
	it('predict llm', async () => {
		await expect(quickml.predictLlm('1234abcd', 'Explain AI')).resolves.toStrictEqual({
			data: responses['/genai/endpoints/glm-flash-47/generate'].POST.data.data
		});

		await expect(quickml.predictLlm('', 'Explain AI')).rejects.toThrowError();

		await expect(quickml.predictLlm('1234abcd', '')).rejects.toThrowError();
	});
	it('predict vlm', async () => {
		await expect(
			quickml.predictVlm(
				'1234abcd',
				createReadStream('./tests/img1.jpeg'),
				'Describe this image'
			)
		).resolves.toStrictEqual({
			data: responses['/genai/endpoints/vlm/generate'].POST.data.data
		});

		await expect(
			quickml.predictVlm('', createReadStream('./tests/img1.jpeg'), 'Describe this image')
		).rejects.toThrowError();

		await expect(
			quickml.predictVlm('1234abcd', createReadStream('./tests/img1.jpeg'), '')
		).rejects.toThrowError();

		await expect(
			quickml.predictVlm('1234abcd', undefined as any, 'Describe this image')
		).rejects.toThrowError();
	});
});
