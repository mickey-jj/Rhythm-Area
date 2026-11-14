import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stageDescription, effectiveRules, roundLabel } from '../frontend/src/domain/stagePresentation.ts';
import { qualificationRows } from '../frontend/src/domain/qualification.ts';
const rules=JSON.parse(readFileSync(new URL('../examples/custom/template.json',import.meta.url),'utf8')).rules;
const stage=(kind,plan=null)=>({id:kind,name:kind,kind,advance:2,plan});
test('terminal qualification ranks award multiple places without naming a champion',()=>{
 const rows=[1,2,3].map(n=>({entry:{id:String(n)},rank:n,total:String(100-n),complete:true}));
 const run={status:'completed',placements:rows.map(r=>({entryId:r.entry.id,rank:r.rank}))};
 assert.deepEqual(qualificationRows(rows,run,undefined,2,true).map(r=>r.qualification),['获得资格','获得资格','未获资格']);
 assert.match(stageDescription(stage('ranking'),rules,true),/前 2 方获得资格/);
});
test('all four stage kinds describe their own format rather than sharing double-final wording',()=>{
  assert.match(stageDescription(stage('ranking'),rules,false),/不生成对战胜负/);
  assert.doesNotMatch(stageDescription(stage('ranking'),rules,false),/总决赛/);
  assert.match(stageDescription(stage('single'),rules,false),/一场失利即淘汰/);
  assert.doesNotMatch(stageDescription(stage('single'),rules,false),/败者组|总决赛/);
  assert.match(stageDescription(stage('double'),rules,false),/败者组/);
  assert.match(stageDescription(stage('round-robin'),rules,false),/每两方交手一次/);
  assert.doesNotMatch(stageDescription(stage('round-robin'),rules,false),/重置/);
});
test('per-stage metric and double-final overrides are shown; qualifier scoring stays event-level',()=>{
  const plan={metric:{...rules.metric,name:'阶段专用分数'},matchMode:'total',winsRequired:2,draft:[],playOrder:[],resolution:{...rules.resolution,finalPolicy:'reset'}};
  assert.equal(effectiveRules(rules,stage('double',plan)).metric.name,'阶段专用分数');
  assert.match(stageDescription(stage('double',plan),rules,true),/双方各一败/);
  assert.equal(effectiveRules(rules,stage('ranking',plan)).metric.name,rules.metric.name);
  assert.match(stageDescription(stage('double',{...plan,resolution:{...plan.resolution,finalPolicy:'advantage'}}),rules,true),/带 1 个曲胜/);
  assert.match(stageDescription(stage('double',{...plan,resolution:{...plan.resolution,finalPolicy:'normal'}}),rules,true),/单场变体/);
});
test('grand finals and reset finals hide internal graph round numbers',()=>{
  assert.equal(roundLabel('reset',999),'重置决赛');
  assert.equal(roundLabel('final',7),'总决赛');
  assert.equal(roundLabel('losers',3),'败者组 · 第 3 轮');
});
const rows=[{entry:{id:'a'},total:'100',rank:1,complete:true},{entry:{id:'b'},total:'100',rank:1,complete:true}];
test('qualifier display uses adjudicated placements and actual next-stage entrants, not a guessed score cutoff',()=>{
  const run={status:'completed',placements:[{entryId:'b',rank:1},{entryId:'a',rank:2}]};
  const display=qualificationRows(rows,run,{participants:['b']},1);
  assert.deepEqual(display.map(r=>[r.entry.id,r.rank,r.total,r.qualification]),[['b',1,'100','已晋级'],['a',2,'100','未晋级']]);
});
test('unsealed, tied and standalone ranking states do not claim confirmed qualification',()=>{
  assert.equal(qualificationRows(rows,undefined,undefined,1)[0].qualification,'暂列晋级线内');
  assert.equal(qualificationRows(rows,{status:'qualification-tie',placements:[]},undefined,1)[0].qualification,'等待附加赛判定');
  assert.equal(qualificationRows(rows,{status:'completed',placements:[]},undefined,1,true)[0].qualification,'冠军');
  assert.equal(qualificationRows(rows,undefined,undefined,1,true)[0].qualification,'暂列名次');
});
