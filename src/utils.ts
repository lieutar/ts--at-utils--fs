import { openFile, stat, type IStats } from './boundary';

export async function getStats(path: string) : Promise<IStats|null> {
  try {
    const stats = await stat(path);
    return stats;
  } catch (error: any) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export async function isDirectory(path: string): Promise<boolean> {
  const stats = await getStats(path);
  if( stats === null ) return false;
  return stats.isDirectory();
}

export async function isFile(path: string): Promise<boolean> {
  const stats = await getStats(path);
  if( stats === null ) return false;
  return stats.isFile();
}

interface writeFileOptions {
    encoding?: string | null;
    mode?: number;
    flag?: string;
    flush?: boolean;
}
export async function writeFile(path: string, data: string|Buffer, opt: writeFileOptions = {}):Promise<void>{
  const buf = (()=>{
    const encoding = opt.encoding || 'utf-8';
    if('string' === typeof data) return Buffer.from(data, encoding as any);
    return data;
  })();
  const fh = await openFile(path, opt.flag || 'w');
  await fh.write(buf);
  await fh.close();
}
