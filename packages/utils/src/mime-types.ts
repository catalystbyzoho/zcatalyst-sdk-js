const mimeTypes: Record<string, string> = {
	'.txt': 'text/plain',
	'.html': 'text/html',
	'.css': 'text/css',
	'.csv': 'text/csv',
	'.xml': 'application/xml',
	'.js': 'application/javascript',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.bmp': 'image/bmp',
	'.ico': 'image/vnd.microsoft.icon',
	'.mp3': 'audio/mpeg',
	'.wav': 'audio/wav',
	'.ogg': 'audio/ogg',
	'.m4a': 'audio/mp4',
	'.mp4': 'video/mp4',
	'.avi': 'video/x-msvideo',
	'.mov': 'video/quicktime',
	'.mkv': 'video/x-matroska',
	'.webm': 'video/webm',
	'.json': 'application/json',
	'.pdf': 'application/pdf',
	'.zip': 'application/zip',
	'.gzip': 'application/gzip',
	'.tar': 'application/x-tar',
	'.exe': 'application/vnd.microsoft.portable-executable',
	'.doc': 'application/msword',
	'.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'.xls': 'application/vnd.ms-excel',
	'.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'.ppt': 'application/vnd.ms-powerpoint',
	'.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};

/**
 * Returns the MIME content type for a file name.
 *
 * @param fileName - The file name whose extension is inspected.
 * @returns The matching MIME type or application/octet-stream.
 *
 * @example
 * ```ts
 * import { getContentType } from '@zcatalyst/utils';
 * const result = getContentType('file.json');
 * ```
 */
export function getContentType(fileName: string): string {
	const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
	return mimeTypes[ext] || 'application/octet-stream';
}
