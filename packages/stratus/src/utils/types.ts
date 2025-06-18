import { Stream } from 'stream';

export type StratusObjectRequest = Stream | Buffer | ReadableStream | Uint8Array | Blob | File;
