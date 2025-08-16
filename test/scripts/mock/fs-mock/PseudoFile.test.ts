import { test, expect, describe } from 'bun:test';
import { PseudoFile } from '@test/fs-mock/PseudoFile';

// https://jestjs.io/docs/expect
describe('PseudoFile', ()=>{

  test('file', async ()=>{
    const file = await PseudoFile.build({ parent: null, name: 'hoge', contents: 'foo' });
    expect(file.isFile()).toBe(true);
    expect(file.isDirectory()).toBe(false);
    expect(String(file.readFile())).toBe('foo');
    expect(file.open('w') instanceof PseudoFile ).toBe(true);
    expect(file.path).toBe("hoge");
  });

  test('empty dir', async () => {
    const dir = await PseudoFile.build({parent: null, name: 'fuga', contents: {}});
    expect(dir.isFile()).toBe(false);
    expect(dir.isDirectory()).toBe(true);
    expect((dir.readDir()).length).toBe(0);
    dir.newFile(await PseudoFile.build({parent: dir, name: "hoge", contents: 'contents-of-hoge'}));
    const ents = dir.readDir();
    expect(ents.length).toBe(1);
    expect(ents[0]!.name).toBe('hoge');
    const hoge = dir.queryFile(['hoge']).node;
    expect(hoge instanceof PseudoFile).toBe(true);
    expect(hoge.path).toBe('fuga/hoge');
  });

  test('complex' ,async  () => {
    const root = await PseudoFile.build({
      parent: null, name: '', contents: {
        foo: "/foo content",
        bar: {
          foo: "/bar/foo content",
          bar: {
            foo: "/bar/bar/foo content",
            bar: {
              foo: "/bar/bar/bar/foo content"
            }
          }
        },
        bazz: {
          foo: "/bazz/foo content"
        }
      }
    });
    expect(root.queryFile(['foo']).node.isFile()).toBe(true);
    expect(String(root.queryFile(['foo']).node.readFile())).toBe('/foo content');
    expect(String(root.queryFile(['bar','bar','bar','foo']).node.readFile()))
      .toBe('/bar/bar/bar/foo content');
  });
});
