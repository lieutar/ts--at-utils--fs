import nodeFs from 'node:fs/promises';
import nodePath from 'node:path';
import { type IFileHandle, type IStats, type IDirent, type PseudoDirContentType } from './types';
import { PseudoFile } from './PseudoFile';
import { splitPath } from './util';
import { PseudoFsError } from './PseudoFsError';

export class PseudoFs extends PseudoFile{

  static async fromSpec(this: typeof PseudoFs, contents: PseudoDirContentType): Promise<PseudoFs>{
    return await this.build({ parent: null, name: "", contents }) as PseudoFs;
  }

  async mockStat(path: string) : Promise<IStats>{
    const result = this.queryFile( splitPath( path ) );
    if(result.reached) return result.node;
    return await nodeFs.stat( path );
  }


  async mockMkdir(path: string, opt : {recursive: boolean} | undefined) {
    const {recursive} = opt ?? {recursive: false};
    const dstDirPath = splitPath( path );
    if(dstDirPath.length < 1) throw new Error();
    const dstName = dstDirPath.pop()!;
    const proceed:string[] = [];
    let node: PseudoFile = this;
    for( const dirname of dstDirPath ){
      try{
        node = node.child(dirname);
      }catch(e){
        if((e as {code:string}).code === 'ENOENT' && recursive){
          const newDir = await PseudoFile.build({
            parent: node,
            name: dirname,
            contents: {}
          });
          node.newFile(newDir);
          node = newDir;
        }else{
          throw e
        }
      }

      if(!node.isDirectory()) throw new PseudoFsError(
        `/${proceed.join("/")} is not a directory`, 'ENODIR', 'mockMkdir');
    }
    const newDir = await PseudoFile.build({parent: node, name: dstName, contents: {}});
    node.newFile(newDir);
  }

  async mockCopyFile(src: string, dst: string){
    const srcFile = await (async (srcResult)=>{
      if(!srcResult.node.isProxy()) return srcResult.node;
      return PseudoFile.build({
        parent: null,
        name: nodePath.basename(src),
        contents: await nodeFs.readFile(src)
      });
    })(this.queryFile(splitPath(src)));
    const dstDirPath = splitPath(dst);
    const dstName = dstDirPath.pop()!;
    const dstDir =  this.queryFile(dstDirPath).node;
    if(dstDir.isProxy()) throw new Error('proxy fs is read only');
    const newFile = srcFile.copy({parent: dstDir, name: dstName});
    dstDir.newFile(newFile);
  }

  async mockOpen(path: string, flags: string) : Promise<IFileHandle>{
    const separated = splitPath(path);
    if(!(flags === 'w' || flags === 'r'))
      throw new Error(`unsupported flags: ${flags}`);
    try{
      return this.queryFile(separated).node.open(flags);
    }catch(e){
      if((e as {code: string}).code === 'ENOENT' && flags === 'w'){
        const name = separated.pop()!;
        const parent = this.queryFile( separated ).node;
        const newFile = await PseudoFile.build( { parent, name, contents: ""} );
        parent.newFile(newFile);
        return newFile.open(flags);
      }
      throw e;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async mockReadFile(path: string) : Promise<Buffer>{
    return this.queryFile(splitPath(path)).node.readFile();
  }

  async mockReaddir(path: string) : Promise<IDirent[]>{
    const dir = this.queryFile(splitPath(path)).node;
    if(!dir.isProxy()) return dir.readDir();
    return await nodeFs.readdir(path, {withFileTypes: true});
  }

}
