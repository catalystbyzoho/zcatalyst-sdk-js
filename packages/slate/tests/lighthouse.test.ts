import { Lighthouse } from '../src/lighthouse';
import { Handler } from '@zcatalyst/transport';

jest.mock('@zcatalyst/transport');

const mockApp = {};
const mockRequester = {
	send: jest.fn()
};

describe('Lighthouse', () => {
	let lighthouse: Lighthouse;

	beforeEach(() => {
		jest.clearAllMocks();
		(Handler as jest.Mock).mockImplementation(() => mockRequester);
		lighthouse = new Lighthouse(mockApp, 'test-app-id', 'test-deployment-id');
	});

	describe('constructor', () => {
		it('should throw error for invalid app_id', () => {
			expect(() => new Lighthouse(mockApp, '', 'test-deployment-id')).toThrow();
		});

		it('should throw error for invalid deployment_id', () => {
			expect(() => new Lighthouse(mockApp, 'test-app-id', '')).toThrow();
		});
	});

	describe('startAudit', () => {
		it('should start audit successfully', async () => {
			const mockResponse = {
				data: { id: 'audit-123', status: 'started' }
			};
			mockRequester.send.mockResolvedValue(mockResponse);

			const result = await lighthouse.startAudit('commit-123', 'https://example.com');
			
			expect(result).toEqual(mockResponse.data);
			expect(mockRequester.send).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					path: '/app/test-app-id/deployment/test-deployment-id/startlhaudit'
				})
			);
		});

		it('should throw error for invalid commit_id', async () => {
			await expect(lighthouse.startAudit('', 'https://example.com')).rejects.toThrow();
		});
	});

	describe('getReportStatus', () => {
		it('should get report status successfully', async () => {
			const mockResponse = {
				data: { status: 'completed', report_id: 'report-123' }
			};
			mockRequester.send.mockResolvedValue(mockResponse);

			const result = await lighthouse.getReportStatus('report-123');
			
			expect(result).toEqual(mockResponse.data);
		});
	});
});
