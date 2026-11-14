import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { countdownParts, rankingPolicy } from '../frontend/src/domain/ranking.ts';
import { independentRules } from '../frontend/src/pages/EventEditorPage/functions/editorRules.ts';
import { visibleEditorSteps, moveEditorStep, editorStepPosition } from '../frontend/src/pages/EventEditorPage/functions/editorNavigation.ts';
import { configuredPools, defaultRoles, updateChartAccess, poolPurpose } from '../frontend/src/pages/PoolSelectionPage/functions/poolRules.ts';
import { qualificationRows } from '../frontend/src/domain/qualification.ts';
const template=JSON.parse(readFileSync(new URL('../examples/midterm-review/template.json',import.meta.url),'utf8'));
test('final ranking retains incomplete entrants outside the sealed placements',()=>{
 const rankings=[{entry:{id:'a'},rank:1,total:'99',complete:true},{entry:{id:'b'},rank:null,total:null,complete:false}];
 const rows=qualificationRows(rankings,{status:'completed',placements:[{entryId:'a',rank:1}]},undefined,1,true);
 assert.deepEqual(rows.map(r=>r.entry.id),['a','b']);assert.equal(rows[1].qualification,'成绩未完成');
});
test('countdown rounds remaining seconds up, carries days and clamps expired values',()=>{
 assert.deepEqual(countdownParts(1),{days:0,clock:'00:00:01'});
 assert.deepEqual(countdownParts(90061000),{days:1,clock:'01:01:01'});
 assert.deepEqual(countdownParts(-1),{days:0,clock:'00:00:00'});
});
test('legacy deadlines move into the ranking stage while each match stage retains its effective rules',()=>{
 const original={...structuredClone(template.rules),draftMode:'sealed',tieBreak:['best-chart'],windows:{registrationOpen:null,registrationClose:null,qualifierClose:'2026-12-01T12:00:00Z'}};
 const before=structuredClone(original),next=independentRules(original);
 assert.equal(next.windows.qualifierClose,null);
 assert.equal(next.stages[0].ranking.deadline,original.windows.qualifierClose);
 assert.equal(rankingPolicy(next,next.stages[0]).endMode,'fixed');
 assert.equal(next.stages[1].plan.draftMode,'sealed');assert.deepEqual(next.stages[1].plan.tieBreak,['best-chart']);
 assert.deepEqual(original,before);assert.deepEqual(independentRules(next),next);
});
test('editor navigation skips removed global metric step with continuous displayed numbering',()=>{
 assert.equal(visibleEditorSteps('solo').length,6);assert.equal(visibleEditorSteps('team').length,7);
 assert.equal(moveEditorStep(1,1,'solo'),3);assert.equal(moveEditorStep(3,-1,'team'),1);
 assert.equal(moveEditorStep(4,1,'solo'),6);assert.deepEqual(editorStepPosition(7,'team'),{current:7,total:7});
});
test('workbench targets follow stage references and ignore unused legacy global pools',()=>{
 const rules=independentRules(template.rules);
 rules.draft=[{id:'unused',pool:'unused',action:'pick',actor:'A',count:1,banApplies:true}];
 const targets=configuredPools(rules,[],['custom']);
 assert(targets.includes('qualifier'));assert(targets.includes('custom'));assert(!targets.includes('unused'));
 assert.deepEqual(defaultRoles('qualifier',rules),['qualifier']);assert.deepEqual(defaultRoles('extra',rules),['extra']);
 assert.equal(poolPurpose('qualifier',rules),'ranking');
});
test('access edits preserve other charts and pool membership while hidden charts cannot be picked or fixed',()=>{
 const assignments=[{chartKey:'a',pools:['main','extra'],roles:['ban','pick','fixed','qualifier','extra']},{chartKey:'b',pools:['main'],roles:['pick']}];
 const before=structuredClone(assignments),hidden=updateChartAccess(assignments,['a'],'hidden','keep');
 assert.deepEqual(hidden[0].pools,['main','extra']);assert.deepEqual(new Set(hidden[0].roles),new Set(['extra','random','assign','mystery']));
 assert.equal(hidden[1],assignments[1]);assert.deepEqual(assignments,before);
 const publicCharts=updateChartAccess(hidden,['a'],'public','all');
 assert.deepEqual(new Set(publicCharts[0].roles),new Set(['extra','ban','pick','random','assign']));
});
