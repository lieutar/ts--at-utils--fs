import { type IStats, type IFileHandle, type IDirent, type FileTypeType, type PseudoFileSpecType } from './types';

import { PseudoFsError } from './PseudoFsError';
import pathMod from 'node:path';
import nodeFs from 'node:fs/promises';
export class PseudoFile implements IDirent, IStats, IFileHandle{

  #parent: PseudoFile;
  #type: FileTypeType;
  #name: string;

  get parent(){ return this.#parent; }
  get isRoot(){ return this.parent === this; }
  get name(){ return this.#name; }
  get stats(): IStats { return this; }
  get path(): string {
    if(this.isRoot) return this.name;
    return this.parent.path + '/' + this.name;
  }

  #proxyStats: IStats | null = null;

  isDirectory(): boolean {
    if(this.#type === 'directory') return true;
    if(this.#type !== 'proxy' ) return false;
    if(this.#proxyStats === null) throw new Error("PseudoFile's programmer was wrong");
    return this.#proxyStats.isDirectory();
  }

  isFile(): boolean {
    if(this.#type === 'file' ) return true;
    if(this.#type !== 'proxy') return false;
    if(this.#proxyStats === null) throw new Error("PseudoFile's programmer was bad");
    return this.#proxyStats.isFile();
  }

  isProxy(): boolean { return this.#type === 'proxy'; }

  #content: Buffer = Buffer.alloc(0);
  #children: {[name: string]: PseudoFile} = {};

  get children(): {[name: string]: PseudoFile} { return {... this.#children}; };

  constructor (params: {
    type: FileTypeType,
    parent: PseudoFile | null,
    name: string,
    content: Buffer,
    children:  {[name: string]: PseudoFile},
    proxyStats: IStats | null
  }){
    this.#type       = params.type;
    this.#parent     = params.parent?? this;
    this.#name       = params.name;
    this.#content    = params.content;
    this.#children   = params.children;
    this.#proxyStats = params.proxyStats;
  }

  static async build <T extends typeof PseudoFile>(
    this: T,
    params: {
      parent: PseudoFile | null,
      name: string,
      proxyStats?: IStats | null,
      contents: PseudoFileSpecType
    }
  ) : Promise<PseudoFile>{
    const defaultParams = {
      ... params, content: Buffer.alloc(0), children: {}, proxyStats: null };

    if(params.contents === true){
      const parent = params.parent;
      if(!parent) throw new Error(`proxy can't be a root.`);
      const proxyStats = await nodeFs.stat(pathMod.join());
      return new this({ ... defaultParams, type: 'proxy', proxyStats  });
    }else if('string' === typeof params.contents || params.contents instanceof Buffer){
      const content = Buffer.from(params.contents);
      return new this({ ... defaultParams, type: 'file', content  });
    }else if(params.contents instanceof Object){
      const result = new this( { ... defaultParams,  type: 'directory'});
      for(const [name, contents] of Object.entries(params.contents)){
        result.newFile( await this.build({ parent: result, name, contents}) );
      }
      return result;
    }
    throw new Error();
  }

  copy(params: {parent?: PseudoFile, name?: string, recursively?: boolean} = {}) : PseudoFile{
    const result = new (this.constructor as typeof PseudoFile)({
      parent:     null,
      type:       this.#type,
      name:       this.name,
      content:    Buffer.from(this.#content),
      children:   {},
      proxyStats: this.#proxyStats,
      ... params
    });
    if(this.isDirectory() && params.recursively){
      for(const child of Object.values(this.#children)){
        result.newFile(child.copy({recursively: true}));
      }
    }
    return result;
  }

  queryFile(path: string[]) : {node: PseudoFile, reached: boolean} {
    if( path.length < 1 ) return {node: this, reached: true};
    if( ! this.isDirectory() )
      throw new PseudoFsError(`${this.path} isn't a directory.`, 'ENODIR', 'queryFile');
    if( this.isProxy() ) return {node: this, reached: false};
    const head = path[0]!;
    if(!(head in this.#children)){
      throw new PseudoFsError(
        `${this.path} doesn't have entry "${head}".`, 'ENOENT', 'queryFile');
    }
    return this.#children[head]!.queryFile(path.slice(1));
  }

  child(name: string): PseudoFile  {
    if(this.isProxy()) throw new Error(`child() is unsupported on proxy fs`);
    return this.queryFile([name]).node;
  }

  newFile(newFile: PseudoFile) {
    if( this.isProxy() ) throw new Error('Proxy fs is read only');
    if( ! this.isDirectory() ) throw new PseudoFsError(
      `${this.path} isn't a directory`, 'ENODIR', 'newFile');
    this.#children[newFile.name] = newFile;
  }

  readFile() : Buffer{
    if( this.isProxy() ) throw new Error('readFile() is unsupported on proxy fs');
    if(!this.isFile()) throw new PseudoFsError(`${this.path} is a directory.`,'EISDIR', 'readFile');
    return this.#content;
  }

  readDir() : IDirent[]{
    if( this.isProxy() ) throw new Error('readDir() is unsupported on proxy fs');
    if(!this.isDirectory()) throw new PseudoFsError(
      `${this.path} isn't a directory`, 'ENODIR', 'readDir');
    return Object.values(this.#children);
  }

  open(flags:string) : IFileHandle {
    if( this.isProxy() ) throw new Error('open() is unsupported on proxy fs');
    if(!this.isFile()) throw new PseudoFsError(
      `${this.path} isn't a file`, 'EISDIR', 'open');
    if(flags === 'w') this.#content = Buffer.from('');
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async write(buf: string | Buffer): Promise<{ bytesWritten: number, buffer: string | Buffer }> {
    if( this.isProxy() ) throw new Error('write(...) is unsupported on proxy fs');
    if (!this.isFile())
      throw new PseudoFsError(`${this.path} is a directory`, 'EISDIR', 'write');
    const newContent = Buffer.from(buf);
    this.#content = Buffer.concat([ this.#content, newContent ]);
    return { bytesWritten: newContent.length, buffer: newContent };
  }

  async close(){ /* ignore */ }
}
