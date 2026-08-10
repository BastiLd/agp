import { describe, expect, it } from 'vitest';
import { parseWikilinks } from '../formats/wikilinks';

describe('parseWikilinks', () => {
  it('parses simple, folder, extension, and alias links', () => {
    expect(parseWikilinks('[[FileName]] [[Folder/File]] [[Biology.md]] [[Target|Alias]]')).toEqual([
      { raw: '[[FileName]]', target: 'FileName', alias: undefined },
      { raw: '[[Folder/File]]', target: 'Folder/File', alias: undefined },
      { raw: '[[Biology.md]]', target: 'Biology.md', alias: undefined },
      { raw: '[[Target|Alias]]', target: 'Target', alias: 'Alias' },
    ]);
  });
});
