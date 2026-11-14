import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchArtworkFiles, normalizeArtworkUrl, validArtworkUrl } from '../frontend/src/domain/artwork.ts';
import { difficultyAppearance } from '../frontend/src/domain/difficultyAppearance.ts';
import { previewLibraryImport } from '../frontend/src/domain/library.ts';
test('cover imports preserve encoded URLs and reject active content without applying a partial library',()=>{
  const imported=previewLibraryImport('[{"title":"Art","difficulty":"IN","coverUrl":"https://example.test/a b.png"}]','phigros');
  assert.deepEqual(imported.issues,[]);assert.equal(imported.charts[0].cover_url,'https://example.test/a%20b.png');
  assert(previewLibraryImport('[{"title":"Art","difficulty":"IN","cover_url":"javascript:alert(1)"}]','phigros').issues.length);
  assert.equal(normalizeArtworkUrl(' https://example.test/曲绘.png '),'https://example.test/%E6%9B%B2%E7%BB%98.png');
  assert(!validArtworkUrl('data:image/svg+xml,<svg/>'));assert(!validArtworkUrl('https://user:pass@example.test/a.png'));
  assert(validArtworkUrl('/api/artwork/'+'a'.repeat(64)+'.webp'));assert(!validArtworkUrl('/api/artwork/../secret'));
});
test('difficulty frames follow the game and label instead of a hash or one shared MASTER color',()=>{
  assert.equal(difficultyAppearance('paradigm-reboot','MASSIVE').color,'#a855f7');
  assert.equal(difficultyAppearance('rotaeno','Ⅳ-α').color,'#b38cdb');
  assert.equal(difficultyAppearance('phigros','IN').color,'#cf1313');
  assert.equal(difficultyAppearance('maimai','Re:MASTER').color,'#ba67f8');
  assert.notEqual(difficultyAppearance('chunithm','MASTER').color,difficultyAppearance('maimai-dx','MASTER').color);
  assert.notEqual(difficultyAppearance('arcaea','Past').color,difficultyAppearance('arcaea','Future').color);
  assert.equal(difficultyAppearance('unknown','MASTER').color,'#76838f');
});
test('image filenames match stable song IDs, retain song difficulty groups, and expose ambiguous names',()=>{
  const rows=previewLibraryImport(JSON.stringify([{title:'Same',song_key:'song-a',chart_key:'a-hd',difficulty:'HD'},{title:'Same',song_key:'song-a',chart_key:'a-in',difficulty:'IN'},{title:'Same',song_key:'song-b',chart_key:'b-in',difficulty:'IN'}]),'phigros').charts;
  const snapshot=JSON.stringify(rows);
  const matches=matchArtworkFiles(['song-a.png','Same.jpg','a-in.webp','missing.png'].map(name=>new File(['test'],name)),rows);
  assert.deepEqual(matches.map(m=>m.songs.map(c=>c.song_key)),[['song-a'],['song-a','song-b'],['song-a'],[]]);
  assert.equal(JSON.stringify(rows),snapshot);
});
