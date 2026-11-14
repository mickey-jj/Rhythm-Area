import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assignCharts, assignmentsFromCharts, previewLibraryImport, queryCharts, removeFromPool } from '../frontend/src/domain/library.ts';

test('basic metadata imports infer stable keys and never carry pool assignments',()=>{
  const source='\uFEFF曲名,难度,曲师,定数\r\n"Song, A",IN,Demo,15.4\r\nSong B,AT,,13+\r\n';
  const {charts,issues}=previewLibraryImport(source,'phigros');
  assert.deepEqual(issues,[]);assert.equal(charts[0].level_value,15.4);assert.equal(charts[1].level_value,null);
  assert.equal(charts[1].artist,'');assert.equal(charts[0].chart_type,'standard');assert.equal(charts[0].game_key,'phigros');
  assert.equal('pool_tag' in charts[0],false);assert.equal('role' in charts[0],false);
  assert.deepEqual(charts,previewLibraryImport(source,'phigros').charts);
});
test('JSON wrappers, old pool exports, camelCase IDs and tab-separated data remain compatible',()=>{
  const r=previewLibraryImport(JSON.stringify({charts:[{gameKey:'arcaea',songId:123,chartKey:'s-ftr',name:'A',difficulty:'FTR',constant:'10.7',pool_tag:'main',role:'pick'}]}),'arcaea');
  assert.deepEqual(r.issues,[]);assert.equal(r.charts[0].song_key,'123');assert.equal(r.charts[0].chart_key,'s-ftr');assert.equal(r.charts[0].level_value,10.7);
  assert.equal('role' in r.charts[0],false);
  assert.equal(previewLibraryImport('title\tdifficulty\nA\tMASTER','maimai').charts[0].difficulty_label,'MASTER');
});
test('10000 distinct charts import; 10001, duplicate identities, wrong games and invalid syntax fail',()=>{
  const rows=Array.from({length:10000},(_,i)=>({title:`Song ${i}`,difficulty:'IN',id:String(i)}));
  const preview=previewLibraryImport(JSON.stringify(rows),'phigros');
  assert.equal(preview.charts.length,10000);assert.deepEqual(preview.issues,[]);
  assert.equal(previewLibraryImport(JSON.stringify([...rows,rows[0]]),'phigros').charts.length,0);
  assert(previewLibraryImport(JSON.stringify([rows[0],rows[0]]),'phigros').issues.length);
  assert(previewLibraryImport('[{','phigros').issues.length);
  assert(previewLibraryImport('[{"game_key":"arcaea","title":"A","difficulty":"IN"}]','phigros').issues.length);
});
test('search and stable sorting preserve source data and place unknown constants last',()=>{
  const charts=previewLibraryImport('[{"title":"B","difficulty":"IN","level":15},{"title":"Ａ","artist":"Composer","difficulty":"AT"},{"title":"C","difficulty":"IN","level":14}]','phigros').charts;
  const snapshot=JSON.stringify(charts);
  assert.equal(queryCharts(charts,{search:'a',sort:'title'})[0].title,'Ａ');
  assert.deepEqual(queryCharts(charts,{search:'',sort:'level-desc'}).map(c=>c.title),['B','C','Ａ']);
  assert.deepEqual(queryCharts(charts,{search:'',sort:'level-asc',minimum:'14.5'}).map(c=>c.title),['B']);
  assert.equal(JSON.stringify(charts),snapshot);
});
test('overlapping pool membership edits preserve chart identity and are immutable',()=>{
  const input=[{chartKey:'a',pools:['main'],roles:['pick']}];const snap=JSON.stringify(input);
  const next=assignCharts(input,['a','b'],'extra',['extra']);
  assert.equal(next.length,2);assert.deepEqual(next[0].pools,['main','extra']);assert.deepEqual(next[0].roles,['pick','extra']);
  assert.deepEqual(removeFromPool(next,['a'],'extra')[0].pools,['main']);
  assert.equal(removeFromPool(next,['b'],'extra').length,1);assert.equal(JSON.stringify(input),snap);
  assert.deepEqual(assignmentsFromCharts([{chart_key:'a',pool_tag:' main | extra ',role:' pick, extra '}])[0],next[0]);
});
test('all six presets parse directly, match their manifest and contain metadata only',()=>{
  const {presets}=JSON.parse(readFileSync(new URL('../data/chart-presets/manifest.json',import.meta.url),'utf8'));
  assert.equal(presets.length,6);
  presets.forEach(p=>{
    const text=readFileSync(new URL(`../data/chart-presets/${p.file}`,import.meta.url),'utf8');
    const rows=JSON.parse(text);const preview=previewLibraryImport(text,p.gameKey);
    assert.deepEqual(preview.issues,[],p.gameKey);assert.equal(rows.length,p.chartCount);assert.equal(new Set(rows.map(c=>c.song_key)).size,p.songCount);
    assert(rows.every(c=>typeof c.game_version==='string' && !('pool_tag' in c) && !('role' in c)));
  });
});
