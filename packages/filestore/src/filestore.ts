'use strict';

import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import {
	CatalystService,
	CONSTANTS,
	isNonEmptyString,
	isValidInputString,
	wrapValidators,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import { Folder, FolderAdmin, ICatalystFolderDetails } from './folder';
import { CatalystFileStoreError } from './utils/error';
import { ICatalystFolder } from './utils/interface';

const { REQ_METHOD, CREDENTIAL_USER, COMPONENT } = CONSTANTS;

export class Filestore {
	requester: Handler;
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	/**
	 * Retrieves the name of the component.
	 * @returns The name of the component.
	 */
	getComponentName(): string {
		return COMPONENT.filestore;
	}

	/**
	 * Retrieves all folders in the file store.
	 * @returns An array of Folder instances representing the folders.
	 * @example
	 * ```ts
	 * const folders = await fileStore.getAllFolders();
	 * console.log(folders);
	 * ```
	 */
	async getAllFolders(): Promise<Array<Folder>> {
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/folder`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		const jsonArr = resp.data.data as Array<ICatalystFolder>;
		return jsonArr.map((folder) => new Folder(this, folder as ICatalystFolderDetails));
	}

	/**
	 * Retrieves details of a specific folder.
	 * @param id - The ID of the folder to retrieve.
	 * @returns The details of the specified folder.
	 * @throws {CatalystFileStoreError} If the folder ID is invalid.
	 * @example
	 * ```ts
	 * const folderDetails = await fileStore.getFolderDetails(12345);
	 * console.log(folderDetails);
	 * ```
	 */
	async getFolderDetails(id: string): Promise<ICatalystFolderDetails> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(id, 'folder_id', true);
		}, CatalystFileStoreError);
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/folder/${id}`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystFolderDetails;
	}

	/**
	 * Returns an instance of the Folder class representing the specified folder.
	 * @param id - The ID of the folder.
	 * @returns A Folder instance representing the specified folder.
	 * @throws {CatalystFileStoreError} If the folder ID is invalid.
	 * @example
	 * ```ts
	 * const folder = fileStore.folder(12345);
	 * console.log(folder);
	 * ```
	 */
	folder(id: string): Folder {
		wrapValidators(() => {
			isValidInputString(id, 'folder_id', true);
		}, CatalystFileStoreError);
		return new Folder(this, { id: String(id) });
	}
}

export class FilestoreAdmin extends Filestore {
	constructor(app?: unknown) {
		super(app);
	}

	/**
	 * Creates a new folder in the file store.
	 * @param name - The name of the folder to create.
	 * @returns The details of the newly created folder.
	 * @throws {CatalystFileStoreError} If the folder name is invalid.
	 * @example
	 * ```ts
	 * const newFolder = await fileStore.createFolder('MyNewFolder');
	 * console.log(newFolder);
	 * ```
	 */
	async createFolder(name: string): Promise<ICatalystFolderDetails> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(name, 'folder_name', true);
		}, CatalystFileStoreError);
		const postData = {
			folder_name: name
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/folder',
			data: postData,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystFolderDetails;
	}

	/**
	 * Returns an instance of the Folder class representing the specified folder.
	 * @param id - The ID of the folder.
	 * @returns A Folder instance representing the specified folder.
	 * @throws {CatalystFileStoreError} If the folder ID is invalid.
	 * @example
	 * ```ts
	 * const folder = fileStore.folder(12345);
	 * console.log(folder);
	 * ```
	 */
	folder(id: string): FolderAdmin {
		wrapValidators(() => {
			isValidInputString(id, 'folder_id', true);
		}, CatalystFileStoreError);
		return new FolderAdmin(this, { id: String(id) });
	}
}
