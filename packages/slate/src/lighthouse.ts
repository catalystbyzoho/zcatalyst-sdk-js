'use strict';

import { Handler, IRequestConfig, RequestType, ResponseType } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isValidInputString,
	wrapValidators,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import { CatalystSlateError } from './utils/error';
import {
	LighthouseAuditResponse,
	LighthouseDetails,
	LighthouseReportStatus
} from './utils/interface';

const { REQ_METHOD, COMPONENT, CREDENTIAL_USER } = CONSTANTS;

export class Lighthouse implements Component {
	readonly requester: Handler;
	private readonly appId: string;
	private readonly deploymentId: string;
	private readonly basePath: string;

	/**
	 * Initialize Lighthouse instance.
	 * @param app - The CatalystApp instance
	 * @param appId - The application ID
	 * @param deploymentId - The deployment ID
	 */
	constructor(app: unknown, appId: string, deploymentId: string) {
		wrapValidators(() => {
			isValidInputString(appId, 'app_id', true);
			isValidInputString(deploymentId, 'deployment_id', true);
		}, CatalystSlateError);

		this.requester = new Handler(app, this);
		this.appId = appId;
		this.deploymentId = deploymentId;
		this.basePath = `/app/${appId}/deployment/${deploymentId}`;
	}

	/**
	 * Returns the name of the component.
	 * @returns Component name
	 */
	getComponentName(): string {
		return COMPONENT.slate;
	}

	/**
	 * Start a lighthouse audit.
	 * @param commitId - The commit ID for the audit
	 * @param domain - The domain URL to audit
	 * @param auditType - Type of audit (defaults to "one time")
	 * @returns The audit response containing id, status, etc.
	 * @throws {CatalystSlateError} If the provided parameters are invalid
	 *
	 * @example
	 * ```typescript
	 * const audit = await lighthouse.startAudit(
	 *   'abc123',
	 *   'https://myapp.com',
	 *   'onetime'
	 * );
	 * console.log(`Audit ID: ${audit.id}, Status: ${audit.status}`);
	 * ```
	 */
	async startAudit(
		commitId: string,
		domain: string,
		auditType: string = 'one time'
	): Promise<LighthouseAuditResponse> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(commitId, 'commit_id', true);
			isValidInputString(domain, 'domain', true);
		}, CatalystSlateError);

		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `${this.basePath}/startlhaudit`,
			data: {
				commit_id: commitId,
				domain: domain,
				type: auditType
			},
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};

		const resp = await this.requester.send(request);
		return resp.data as LighthouseAuditResponse;
	}

	/**
	 * Download a lighthouse report.
	 * @param reportId - The report ID to download
	 * @param name - The URL name parameter (optional)
	 * @returns The report content as buffer
	 * @throws {CatalystSlateError} If the provided report ID is invalid
	 *
	 * @example
	 * ```typescript
	 * const reportData = await lighthouse.downloadReport('4000000003037');
	 * // Save to file or process the buffer
	 * ```
	 */
	async downloadReport(reportId: string, name?: string): Promise<Buffer> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(reportId, 'report_id', true);
		}, CatalystSlateError);

		const params: Record<string, string> = { reportId };
		if (name) {
			params.name = name;
		}

		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `${this.basePath}/lhreport`,
			qs: params,
			expecting: ResponseType.BUFFER,
			service: CatalystService.SLATE,
			track: true,
			user: CREDENTIAL_USER.admin
		};

		const resp = await this.requester.send(request);
		return resp.data as Buffer;
	}

	/**
	 * Get the status of a lighthouse report.
	 * @param reportId - The report ID to check status for
	 * @param name - The URL name parameter (optional)
	 * @returns The status response containing status and report_id
	 * @throws {CatalystSlateError} If the provided report ID is invalid
	 *
	 * @example
	 * ```typescript
	 * const status = await lighthouse.getReportStatus('4000000003037');
	 * if (status.status === 'Success') {
	 *   const report = await lighthouse.downloadReport(status.report_id);
	 * }
	 * ```
	 */
	async getReportStatus(reportId: string, name?: string): Promise<LighthouseReportStatus> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(reportId, 'report_id', true);
		}, CatalystSlateError);

		const params: Record<string, string> = { reportId };
		if (name) {
			params.name = name;
		}

		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `${this.basePath}/lhreport-status`,
			qs: params,
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.SLATE,
			track: true,
			user: CREDENTIAL_USER.admin
		};

		const resp = await this.requester.send(request);
		return resp.data as LighthouseReportStatus;
	}

	/**
	 * Get lighthouse details for the current deployment.
	 * @returns The lighthouse details containing app_id and deployment_id
	 *
	 * @example
	 * ```typescript
	 * const details = await lighthouse.getLighthouseDetails();
	 * console.log(`App ID: ${details.app_id}`);
	 * ```
	 */
	async getLighthouseDetails(): Promise<LighthouseDetails> {
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `${this.basePath}/lhdetailes`,
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.SLATE,
			track: true,
			user: CREDENTIAL_USER.admin
		};

		const resp = await this.requester.send(request);
		return resp.data as LighthouseDetails;
	}
}
