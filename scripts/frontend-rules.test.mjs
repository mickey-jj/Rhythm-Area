import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { previewImport, decodeEventTemplate } from '../frontend/src/domain/rules.ts'
const head='game_key,game_version,song_key,title,artist,chart_key,chart_type,difficulty_label,level_value,pool_tag,role,display_order'
test('researched starters import their real game pools and separate KOP stage plans',()=>{
 const preset=id=>JSON.parse(readFileSync(new URL(`../examples/${id}/template.json`,import.meta.url),'utf8'))
 for(const [id,count] of [['cop-2025',4],['kop-7th',54],['pmt-2026',0],['wec-2026',3]]){
  const t=preset(id)
  const decoded=decodeEventTemplate(JSON.stringify(t),preset('custom').rules)
  assert.equal(decoded.charts.length,count)
  assert(t.description.length<150)
 }
 const kop=preset('kop-7th')
 assert.deepEqual(kop.rules.stages.map(s=>s.plan.playOrder.length),[2,2,3])
 assert.equal(kop.charts.filter(c=>c.pool_tag.split('|').includes('main')).length,52)
 assert.equal(kop.charts.filter(c=>c.pool_tag.split('|').includes('final')).length,53)
 assert.equal(kop.rules.stages.at(-1).plan.playOrder.at(-1).source,'fixed:maimai-dx:7 Wonders:dx:MASTER')
 assert.deepEqual(preset('cop-2025').charts.map(c=>c.title),['Zephyrs','И00.','Re: End of a Dream','Emancipator'])
 assert.deepEqual(preset('wec-2026').charts.map(c=>c.title),['Climax','黎明に殉ず','The Devil Incarnate'])
})
test('UTF-8 BOM, CRLF, escaped quotes, embedded comma and newline survive CSV import',()=>{
  const csv='\uFEFF'+head+'\r\ncustom,1.0,song-1,"Song, ""Test""\nPart 2",Demo,chart-1,standard,EXPERT,13.4,main,,1\r\n'
  const r=previewImport(csv,'custom')
  assert.equal(r.issues.length,0);assert.equal(r.charts[0].title,'Song, "Test"\nPart 2');assert.equal(r.charts[0].level_value,13.4);assert.equal(r.charts[0].role,'')
})
test('unclosed CSV quoting and malformed JSON fail without a partial import',()=>{
  assert.equal(previewImport(head+'\n"broken','custom').charts.length,0)
  assert.equal(previewImport('[{','custom').charts.length,0)
})
const row={game_key:'custom',game_version:'1',song_key:'song',title:'Same title',artist:'Demo',chart_key:'a',chart_type:'standard',difficulty_label:'EXPERT',level_value:null,pool_tag:'main',role:'',display_order:1}
test('same song in different chart difficulties is retained, duplicate chart keys rejected',()=>{
  assert.equal(previewImport(JSON.stringify([row,{...row,chart_key:'b',difficulty_label:'MASTER'}]),'custom').issues.length,0)
  assert(previewImport(JSON.stringify([row,row]),'custom').issues.some(i=>i.message.includes('重复')))
})
test('cross-game imports, missing keys, nonfinite difficulty values are rejected',()=>{
  const r=previewImport(JSON.stringify([{...row,game_key:'other',song_key:'',level_value:'NaN'}]),'custom')
  assert.equal(r.issues.length,3)
})
test('empty difficulty values remain null and arrays above capacity fail atomically',()=>{
  assert.equal(previewImport(JSON.stringify([row]),'custom').charts[0].level_value,null)
  assert.equal(previewImport(JSON.stringify(Array(10001).fill(row)),'custom').charts.length,0)
})
test('portable templates contain only config; unknown versions and malformed nested rules are rejected',()=>{
  const schema={gameKey:'custom',metric:{name:'score',decimals:0},stages:[{id:'main',kind:'single'}]}
  const file={format:'rhythm-area-template',schemaVersion:1,name:'Reusable',tagline:'',description:'',rules:schema,charts:[row],ownerId:'must-not-carry-over'}
  const result=decodeEventTemplate(JSON.stringify(file),schema)
  assert.equal(result.name,'Reusable');assert.equal('ownerId' in result,false)
  assert.throws(()=>decodeEventTemplate(JSON.stringify({...file,schemaVersion:99}),schema))
  assert.throws(()=>decodeEventTemplate(JSON.stringify({...file,rules:{...schema,metric:null}}),schema))
})
test('portable appearance survives import; invalid CSS color and private instance records do not',()=>{
  const schema={gameKey:'custom',metric:{name:'score',decimals:0},stages:[{id:'main',kind:'single'}]}
  const config={format:'rhythm-area-template',schemaVersion:1,name:'One event',tagline:'',description:'',rules:schema,charts:[row],appearance:{brandName:'我的比赛',accentColor:'#9ab3ef',contact:'Public contact'},sessions:[{token:'do-not-carry'}],entries:[{name:'Private'}]}
  const result=decodeEventTemplate(JSON.stringify(config),schema)
  assert.deepEqual(result.appearance,config.appearance);assert.equal('sessions' in result,false);assert.equal('entries' in result,false)
  assert.throws(()=>decodeEventTemplate(JSON.stringify({...config,appearance:{...config.appearance,accentColor:'url(secret)'}}),schema))
})

import {patchRules,resizeStages,reconcilePlayOrder,importSamples,poolTags} from '../frontend/src/domain/configuration.ts'
test('stage quotas follow capacity for every 2–256 participant configuration',()=>{
 const stages=[{id:'q',name:'Q',kind:'ranking',advance:8},{id:'r',name:'R',kind:'round-robin',advance:4},{id:'f',name:'F',kind:'single',advance:1}]
 for(let n=2;n<=256;n++){const result=resizeStages(stages,n);assert(result.every((s,i)=>s.advance<=(i===0?n:result[i-1].advance)));assert.equal(result.at(-1).advance,1)}
})
test('BP edits remove stale sources, append new slots and preserve reordered and fixed songs',()=>{
 const r={playOrder:[{id:'fixed',source:'fixed:c1'},{id:'b',source:'b:1'},{id:'old',source:'old:1'}]}
 const order=reconcilePlayOrder(r,[{id:'a',action:'pick',count:2},{id:'b',action:'random',count:1}])
 assert.deepEqual(order.map(s=>s.source),['fixed:c1','b:1','a:1','a:2']);assert.equal(new Set(order.map(s=>s.source)).size,order.length)
})
test('import presets match the active game and contain qualifier, main and extra roles',()=>{
 const sample=importSamples('another-game').find(s=>s.id==='complete');const preview=previewImport(JSON.stringify(sample.charts),'another-game');assert.equal(preview.issues.length,0);assert.deepEqual([...new Set(preview.charts.map(c=>c.pool_tag))],['main','qualifier','extra'])
})
test('a full exported template may supply charts to pool import without being read as CSV',()=>{
 assert.equal(previewImport(JSON.stringify({format:'rhythm-area-template',charts:[row]}),'custom').issues.length,0)
})

test('pool memberships overlap without duplicate chart rows; assignment keeps generated slots',()=>{
 assert.deepEqual(poolTags({...row,pool_tag:' qualifier |stage1|stage2,stage1'}),['qualifier','stage1','stage2']);
 const imported=previewImport(JSON.stringify([{...row,pool_tag:'qualifier|stage1|stage2',role:'assign|mystery'}]),'custom');
 assert.equal(imported.issues.length,0);assert.equal(imported.charts.length,1);
 assert.deepEqual(reconcilePlayOrder({playOrder:[]},[{id:'judge',action:'assign',count:1}]),[{id:'song-judge:1',source:'judge:1'}]);
});

import {initialEditorStep,moveEditorStep} from '../frontend/src/pages/EventEditorPage/functions/editorNavigation.ts'
test('solo editor navigation skips team settings; team mode makes them reachable in both directions',()=>{
 assert.equal(moveEditorStep(4,1,'solo'),6)
 assert.equal(moveEditorStep(6,-1,'solo'),4)
 assert.equal(moveEditorStep(4,1,'team'),5)
 assert.equal(moveEditorStep(6,-1,'team'),5)
 assert.equal(initialEditorStep('11'),7)
 assert.equal(initialEditorStep('invalid'),0)
 assert.equal(initialEditorStep('-1'),0)
})
