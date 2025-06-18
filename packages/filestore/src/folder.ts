'use strict';

import { Handler, IRequestConfig, RequestType, ResponseType } from '@zcatalyst/transport';
import {
	CatalystService,
	CONSTANTS,
	ICatalystGResponse,
	isNonEmptyString,
	isNonNullObject,
	isValidInputString,
	ParsableComponent,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';
import { IncomingMessage } from 'http';

import { Filestore } from './filestore';
import { CatalystFileStoreError } from './utils/error';
import { ICatalystFile, ICatalystFolder } from './utils/interface';

export type ICatalystFolderDetails = ICatalystFolder &
	Omit<ICatalystGResponse, 'modified_time' | 'modified_by'>;
type ICatalystFileDetails = ICatalystFile & ICatalystGResponse;

const { CREDENTIAL_USER, REQ_METHOD, COMPONENT } = CONSTANTS;

export class Folder implements ParsableComponent<ICatalystFolderDetails> {
	_folderDetails: ICatalystFolderDetails;
	requester: Handler;
	constructor(fileInstance: Filestore, folderDetails: ICatalystFolderDetails) {
		this._folderDetails = folderDetails;
		this.requester = fileInstance.requester;
	}

	/**
	 * Retrieves the name of the file store component.
	 *
	 * @returns {string} The name of the component.
	 */
	getComponentName(): string {
		return COMPONENT.filestore;
	}

	/**
	 * Fetches details of a specific file.
	 *
	 * @param {string} id - The ID of the file.
	 * @returns {ICatalystFileDetails} The details of the requested file.
	 * @throws {CatalystFileStoreError} If the file ID is invalid or the request fails.
	 *
	 * @example
	 * const fileDetails = await fileStoreInstance.getFileDetails('12345');
	 * console.log(fileDetails.name);
	 */
	async getFileDetails(id: string): Promise<ICatalystFileDetails> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(id, 'file_id', true);
		}, CatalystFileStoreError);

		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/folder/${this._folderDetails.id}/file/${id}`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystFileDetails;
	}

	/**
	 * Deletes a file by its ID.
	 *
	 * @param {string} id - The ID of the file to delete.
	 * @returns {boolean} `true` if the file was successfully deleted, otherwise `false`.
	 * @throws {CatalystFileStoreError} If the file ID is invalid or the request fails.
	 *
	 * @example
	 * const isDeleted = await fileStoreInstance.deleteFile('12345');
	 * console.log(isDeleted); // true
	 */
	async deleteFile(id: string): Promise<boolean> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(id, 'file_id', true);
		}, CatalystFileStoreError);

		const request: IRequestConfig = {
			method: REQ_METHOD.delete,
			path: `/folder/${this._folderDetails.id}/file/${id}`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		return !!resp.data.data;
	}

	/**
	 * Uploads a file to the file store.
	 *
	 * @param {Object} fileDetails - The file details object.
	 * @param {string | Blob} fileDetails.code - The file content as a string or Blob.
	 * @param {string} fileDetails.name - The name of the file.
	 * @param {AbortSignal} [fileDetails.signal] - Optional abort signal for cancellation.
	 * @returns {Omit<ICatalystFileDetails, 'modified_time' | 'modified_by'>} The uploaded file details.
	 * @throws {CatalystFileStoreError} If the file details are invalid.
	 *
	 * @example
	 * const file = new Blob(["Hello, World!"], { type: "text/plain" });
	 * const response = await fileStoreInstance.uploadFile({ code: file, name: "hello.txt" });
	 * console.log(response.file_id);
	 */
	async uploadFile(fileDetails: {
		code: File;
		name: string;
		signal?: AbortSignal;
	}): Promise<Omit<ICatalystFileDetails, 'modified_time' | 'modified_by'>> {
		await wrapValidatorsWithPromise(() => {
			isNonNullObject(fileDetails, 'file_object', true);
			isNonEmptyString(fileDetails.name, 'name in file_object', true);
		}, CatalystFileStoreError);
		const fileData = {
			code: fileDetails.code,
			file_name: fileDetails.name
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/folder/${this._folderDetails.id}/file`,
			data: fileData,
			type: RequestType.FILE,
			service: CatalystService.BAAS,
			track: true,
			abortSignal: fileDetails.signal,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		return resp.data.data as Omit<ICatalystFileDetails, 'modified_time' | 'modified_by'>;
	}

	/**
	 * Generates a request configuration for downloading a file.
	 *
	 * @param {string} id - The ID of the file to download.
	 * @returns {IRequestConfig} The request configuration object.
	 * @throws {CatalystFileStoreError} If the file ID is invalid.
	 */
	private async getDownloadRequest(id: string): Promise<IRequestConfig> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(id, 'file_id', true);
		}, CatalystFileStoreError);
		return {
			method: REQ_METHOD.get,
			path: `/folder/${this._folderDetails.id}/file/${id}/download`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
	}

	/**
	 * Downloads a file as a buffer.
	 *
	 * @param {string} id - The ID of the file to download.
	 * @returns {unknown} The file buffer data.
	 * @throws {CatalystFileStoreError} If the file ID is invalid or the request fails.
	 *
	 * @example
	 * const fileBuffer = await fileStoreInstance.downloadFile('12345');
	 * console.log(fileBuffer);
	 */
	async downloadFile(id: string): Promise<unknown> {
		const request = await this.getDownloadRequest(id);
		request.expecting = ResponseType.BUFFER;
		const resp = await this.requester.send(request);
		return resp.data;
	}

	/**
	 * Retrieves a readable stream for the file.
	 *
	 * @param {string} id - The ID of the file.
	 * @returns {IncomingMessage} The file stream.
	 * @throws {CatalystFileStoreError} If the file ID is invalid.
	 *
	 * @example
	 * const fileStream = await fileStoreInstance.getFileStream('12345');
	 * fileStream.pipe(fs.createWriteStream("downloaded_file.txt"));
	 */
	async getFileStream(id: string): Promise<IncomingMessage> {
		const request = await this.getDownloadRequest(id);
		request.expecting = ResponseType.RAW;
		const resp = await this.requester.send(request);
		return resp.data as IncomingMessage;
	}

	/**
	 * Converts the folder details to a JSON string.
	 *
	 * @returns {string} A JSON string representation of the folder details.
	 */
	toString(): string {
		return JSON.stringify(this._folderDetails);
	}

	/**
	 * Retrieves the folder details in JSON format.
	 *
	 * @returns {ICatalystFolderDetails} The folder details.
	 */
	toJSON(): ICatalystFolderDetails {
		return this._folderDetails;
	}
}

export class FolderAdmin extends Folder {
	constructor(fileInstance: Filestore, folderDetails: ICatalystFolderDetails) {
		super(fileInstance, folderDetails);
	}

	/**
	 * Updates the folder details.
	 *
	 * @param {Omit<ICatalystFolder, 'id'>} folderDetails - The updated folder details.
	 * @returns {ICatalystFolderDetails} The updated folder information.
	 * @throws {CatalystFileStoreError} If the folder details are invalid.
	 *
	 * @example
	 * const updatedFolder = await folderInstance.update({ folder_name: "New Folder Name" });
	 * console.log(updatedFolder);
	 */
	async update(folderDetails: Omit<ICatalystFolder, 'id'>): Promise<ICatalystFolderDetails> {
		await wrapValidatorsWithPromise(() => {
			isNonNullObject(folderDetails, 'folder_object', true);
			isNonEmptyString(folderDetails.folder_name, 'folder_name in folder_object', true);
		}, CatalystFileStoreError);

		const postData = { folder_name: folderDetails.folder_name };
		const request: IRequestConfig = {
			method: REQ_METHOD.put,
			path: `/folder/${this._folderDetails.id}`,
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
	 * Deletes the folder.
	 *
	 * @returns {boolean} `true` if the folder was successfully deleted, otherwise `false`.
	 * @throws {CatalystFileStoreError} If the request fails.
	 *
	 * @example
	 * const isDeleted = await folderInstance.delete();
	 * console.log(isDeleted);
	 */
	async delete(): Promise<boolean> {
		const request: IRequestConfig = {
			method: REQ_METHOD.delete,
			path: `/folder/${this._folderDetails.id}`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return !!resp.data.data;
	}
}
