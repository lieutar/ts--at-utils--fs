export type { IStats, IFileHandle, IDirent } from '@src/index';

export type FileTypeType = 'file' | 'directory' | 'proxy';
export type PseudoDirContentType = { [name: string] : PseudoFileSpecType };
export type PseudoFileSpecType = string | Buffer | true | PseudoDirContentType;
