import type{ PseudoFileSpecType,  PseudoDirContentType } from './types';

export function splitPath(pathStr: string) : string[] {
  return pathStr.replace(/^\//, '').split('/').filter(p => p !== '');
}

export function prepareContents(src: PseudoDirContentType): PseudoDirContentType {
  const result: PseudoDirContentType = {};

  const loop = ( parts: string[], finalContents: PseudoFileSpecType ):PseudoFileSpecType => {
    if (parts.length > 0) {
      const currentPart:string = parts[0]!;
      const remainingParts = parts.slice(1);
      const currentLevelContent: PseudoDirContentType = {};
      currentLevelContent[currentPart] = loop(remainingParts, finalContents);
      return currentLevelContent;
    } else {
      return finalContents;
    }
  };

  for (const [pathStr, contents] of Object.entries(src)) {
    const separated = splitPath(pathStr);

    if (separated.length > 0) {
      const topLevelPart = separated[0]!;
      const nestedContent = loop(separated.slice(1), contents);

      if (result[topLevelPart] && typeof result[topLevelPart] === 'object' &&
        result[topLevelPart] !== null && !Buffer.isBuffer(result[topLevelPart]) &&
        typeof result[topLevelPart] !== 'string') {
        result[topLevelPart] = {
          ...(result[topLevelPart] as PseudoDirContentType),
          ...(nestedContent as PseudoDirContentType)
        };
      } else {
        result[topLevelPart] = nestedContent;
      }
    }
  }
  return result;
}
