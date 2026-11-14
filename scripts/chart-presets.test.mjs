import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { previewLibraryImport } from '../frontend/src/domain/library.ts';

const read=name=>JSON.parse(fs.readFileSync(new URL(`../data/chart-presets/${name}`,import.meta.url),'utf8').replace(/^\uFEFF/,''));

test('Rotaeno special catalog columns keep real song titles, artists and four genuine charts',()=>{
  const rows=read('rotaeno.json');
  for(const [title,artist,version] of [['Full Circle','VITICZ','2.23.0'],['今天不是明天','PIKASONIC feat.兰音Reine','1.14.1']]){
    const song=rows.filter(c=>c.title===title);
    assert.deepEqual(song.map(c=>c.difficulty_label),['I','II','III','IV']);
    assert(song.every(c=>c.artist===artist && c.game_version===version && c.level_value===null));
  }
  assert(rows.every(c=>c.title.trim() && !['-','1'].includes(c.title.trim())));
  assert(rows.some(c=>c.title==='9876734123' && c.artist==='Silentroom'));
  const changes=read('rotaeno-corrections.json');
  const keys=new Set(rows.map(c=>c.chart_key));
  const removed=new Set(changes.removals.map(c=>c.removedChartKey));
  assert.equal(removed.size,13);
  assert(changes.mappings.every(c=>keys.has(c.newChartKey) || removed.has(c.newChartKey)));
  assert(changes.removals.every(c=>!keys.has(c.removedChartKey)));
});

test('same-title Arcaea songs remain distinct by their source artists',()=>{
  const rows=read('arcaea.json');
  for(const [title,artists] of [['Genesis',['Iris','Morrigan feat.Lily']],['Quon',['Feryquitous','DJ Noriken']]]){
    const songs=artists.map(artist=>rows.filter(c=>c.title===title && c.artist===artist));
    assert(songs.every(charts=>charts.length>=3));
    assert.notEqual(songs[0][0].song_key,songs[1][0].song_key);
    assert(songs.every(charts=>new Set(charts.map(c=>c.song_key)).size===1));
  }
});

test('all six presets are importable metadata within the 10,000 chart limit',()=>{
  const manifest=read('manifest.json');
  assert.equal(manifest.presets.length,6);
  for(const preset of manifest.presets){
    const rows=read(preset.file);
    const parsed=previewLibraryImport(JSON.stringify(rows),preset.gameKey);
    assert.deepEqual(parsed.issues,[],preset.gameKey);
    assert.equal(parsed.charts.length,preset.chartCount,preset.gameKey);
    assert(rows.length<=10000);
    assert.equal(new Set(rows.map(c=>c.chart_key)).size,rows.length);
    assert.equal(new Set(rows.map(c=>c.song_key)).size,preset.songCount);
    assert(rows.every(c=>c.title.trim() && typeof c.artist==='string'));
    assert(rows.some(c=>c.cover_url));
  }
});
