import { Handler, IRequestConfig, ResponseType } from '@zcatalyst/transport';
import {
	CatalystService,
	CONSTANTS,
	isNonEmptyString,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import { CatalystSmartbrowzError } from './utils/error.js';
import { IBrowserGridDetails, IBrowserGridNode } from './utils/interfaces.js';

const { REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;

/**
 * Provides admin-only APIs to manage SmartBrowz Browser Grids.
 */
export class BrowserGrid {
	#requester: Handler;
	constructor({ requester }: { requester: Handler }) {
		this.#requester = requester;
	}

	/**
	 * Retrieves the list of all Browser Grids present in the project.
	 * @returns A promise that resolves to Array<IBrowserGridDetails>.
	 * @example
	 * ```ts
	 * const grids = await smartbrowz.browserGrid().getGrid();
	 * ```
	 */
	async getGrid(): Promise<Array<IBrowserGridDetails>>;
	/**
	 * Retrieves the details of a specific Browser Grid.
	 * @param gridId - The id or name of the Browser Grid.
	 * @returns A promise that resolves to IBrowserGridDetails.
	 * @throws {CatalystSmartbrowzError} when `gridId` is not a valid non-empty string.
	 * @example
	 * ```ts
	 * const grid = await smartbrowz.browserGrid().getGrid('testGrid');
	 * ```
	 */
	async getGrid(gridId: string): Promise<IBrowserGridDetails>;
	async getGrid(gridId?: string): Promise<IBrowserGridDetails | Array<IBrowserGridDetails>> {
		if (gridId !== undefined) {
			await wrapValidatorsWithPromise(() => {
				isNonEmptyString(gridId, 'grid_id', true);
			}, CatalystSmartbrowzError);
		}
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/browser-grid${gridId ? '/' + gridId : ''}`,
			expecting: ResponseType.JSON,
			service: CatalystService.SMARTBROWZ,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.#requester.send(request);
		return resp.data.data as IBrowserGridDetails | Array<IBrowserGridDetails>;
	}

	/**
	 * Retrieves the live node statistics of a Browser Grid.
	 * @param gridId - The id or name of the Browser Grid.
	 * @returns A promise that resolves to IBrowserGridNode.
	 * @throws {CatalystSmartbrowzError} when `gridId` is not a valid non-empty string.
	 * @example
	 * ```ts
	 * const nodes = await smartbrowz.browserGrid().getGridNodes('testGrid');
	 * ```
	 */
	async getGridNodes(gridId: string): Promise<IBrowserGridNode> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(gridId, 'grid_id', true);
		}, CatalystSmartbrowzError);
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/browser-grid/${gridId}/stats?data_to_fetch=live_stats`,
			expecting: ResponseType.JSON,
			service: CatalystService.SMARTBROWZ,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.#requester.send(request);
		return resp.data.data as IBrowserGridNode;
	}

	/**
	 * Stops all the running nodes in a Browser Grid.
	 * @param gridId - The id or name of the Browser Grid.
	 * @returns A promise that resolves once the Browser Grid nodes are stopped.
	 * @throws {CatalystSmartbrowzError} when `gridId` is not a valid non-empty string.
	 * @example
	 * ```ts
	 * await smartbrowz.browserGrid().stopGrid('testGrid');
	 * ```
	 */
	async stopGrid(gridId: string): Promise<void> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(gridId, 'grid_id', true);
		}, CatalystSmartbrowzError);
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/browser-grid/${gridId}/stop`,
			expecting: ResponseType.JSON,
			service: CatalystService.SMARTBROWZ,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		await this.#requester.send(request);
	}
}
