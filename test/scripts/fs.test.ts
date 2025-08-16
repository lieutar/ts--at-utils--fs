//import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import { expect, test, describe, beforeEach, afterEach } from 'bun:test';
import { setupMockFs, restoreOriginalFs } from '@src/mock';
import { isDirectory } from '@src/index';

describe( 'isDirectory', ()=>{
  beforeEach(async ()=>{ await setupMockFs({'/tmp/foo/bar/bazz':{}});});
  afterEach(()=>{ restoreOriginalFs(); });
  test("normal", async ()=>{
    expect( await isDirectory("/") ).toBe(true);
    expect( await isDirectory("/tmp") ).toBe(true);
    expect( await isDirectory("/tmp/foo") ).toBe(true);
    expect( await isDirectory("/tmp/foo/bar") ).toBe(true);
    expect( await isDirectory("/tmp/foo/bar/bazz") ).toBe(true);
    expect( await isDirectory("/etc/profile")).toBe(false);
  });
});
