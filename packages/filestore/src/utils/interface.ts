'use strict';
export interface ICatalystFolder {
	id: string;
	folder_name?: string;
}

export interface ICatalystFile {
	id: string;
	file_location?: string;
	file_name: string;
	file_size: number;
	folder_details: string;
}
