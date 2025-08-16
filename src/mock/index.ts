import type { IDirent, IFileHandle, IStats } from '@src/index';
import * as fsu from '@src/index';
import { mock } from 'bun:test';
//import {vi} from 'vitest';;
export * from './PseudoFs';
import { PseudoFs } from './PseudoFs';
import { prepareContents } from './util';

let initialized = false;
let mockFs : PseudoFs | null = null;

async function stat(path: string) : Promise<IStats|null> {
  if( mockFs === null ) return fsu.getStats(path);
  return await mockFs.mockStat( path );
}

async function mkdir( path: string, opt: {recursive: boolean} = {recursive: true}){
  if( mockFs === null ) return fsu.mkdir(path, opt);
  return mockFs.mockMkdir(path, opt);
}

async function copyFile( src:string, dst:string ){
  if( mockFs === null ) return fsu.copyFile(src, dst);
  return mockFs.mockCopyFile(src, dst);
}

async function readFile( path: string): Promise<Buffer>{
  if( mockFs === null ) return fsu.readFile( path );
  return mockFs.mockReadFile(path);
}

async function openFile( path: string, opt: string ): Promise<IFileHandle>{
  if( mockFs === null ) return fsu.openFile( path, opt );
  return mockFs.mockOpen( path, opt );
}

async function readDir(path: string) : Promise<IDirent[]>{
  if( mockFs === null ) return fsu.readDir(path);
  return mockFs.mockReaddir(path);
}

//==============================================================================
export function getCurrentMockFs() : PseudoFs | null{ return mockFs; }

export async function setupMockFs( structure = {} ){
  if(!initialized){
    await mock.module(
    //vi.mock(
      "@src/boundary",
      () => {return { stat, mkdir, copyFile, readFile, openFile, readDir }}
    );
    initialized = true;
  }
  mockFs = await PseudoFs.fromSpec( prepareContents( structure ) );
}

export function restoreOriginalFs(){ mockFs = null; }
