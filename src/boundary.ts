import * as nodeFs from 'node:fs/promises';

export interface IStats {
  isDirectory(): boolean;
  isFile(): boolean; }

export async function stat(path: string) : Promise<IStats|null> { return nodeFs.stat(path); }

export async function mkdir( path: string, opt : {recursive:boolean}  = {recursive: true} ){
  return nodeFs.mkdir(path, opt); }

export async function copyFile(src:string, dst:string){ return nodeFs.copyFile(src, dst); }

export async function readFile(path:string) : Promise<Buffer> { return nodeFs.readFile(path); }

export interface IFileHandle {
  write(buf: string | Buffer) : Promise<{bytesWritten: number, buffer: string | Buffer}>;
  close(): Promise<void>; }

export async function openFile(path:string, opt:string): Promise<IFileHandle>{ return nodeFs.open( path, opt ); }

export interface IDirent {
  name: string;
  isDirectory(): boolean; }

export async function readDir(path:string): Promise<IDirent[]>{
  return nodeFs.readdir( path, { withFileTypes: true } ); }

export async function rm(path:string, options? : object):Promise<void>{
  return nodeFs.rm(path, options);
}

export async function rmdir(path:string, options? : object):Promise<void>{
  return nodeFs.rmdir(path, options);
}
