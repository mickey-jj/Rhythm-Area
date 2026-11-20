import {test} from 'node:test';
import assert from 'node:assert/strict';
import {qualificationReadiness} from '../frontend/src/pages/OrganizerConsolePage/functions/qualificationReadiness.ts';
const event={rules:{stages:[{kind:'ranking',advance:2}]}};
const entries=[{id:'a',status:'accepted'},{id:'b',status:'accepted'}];
test('opening matches reports the score, review and submission blockers together',()=>{
 const board={session:{status:'open',policy:{endMode:'duration'}},rankings:[{complete:true},{complete:false}]};
 const blockers=qualificationReadiness(event,entries,[{status:'pending'}],board);
 assert.equal(blockers.length,3);assert(blockers.some(b=>b.target==='scores'));assert(blockers.some(b=>b.message.includes('先停止')));assert(blockers.some(b=>b.message.includes('需 2 方')));
});
test('manual all-complete and closed full results permit server-side final qualification checks',()=>{
 const rankings=entries.map(()=>({complete:true}));
 assert.deepEqual(qualificationReadiness(event,entries,[],{session:{status:'open',policy:{endMode:'manual'}},rankings}),[]);
 assert.deepEqual(qualificationReadiness(event,entries,[],{session:{status:'closed',policy:{endMode:'duration'}},rankings}),[]);
 assert.equal(qualificationReadiness(event,[],[],undefined).length,2);
});
test('qualification requires a fresh server decision before opening matches',()=>{
 const board={session:{status:'closed',policy:{endMode:'duration'}},rankings:entries.map(()=>({complete:true}))};
 const blockers=(status)=>qualificationReadiness(event,entries,[],{...board,qualificationDecision:{status}});
 assert.deepEqual(blockers('required'),[{message:'排名赛有同分尚未判定',target:'qualification-order'}]);
 assert.deepEqual(blockers('resolved'),[]);
 assert.deepEqual(blockers('stale'),[{message:'有效成绩已变化，旧的同分判定已失效',target:'qualification-order'}]);
 assert.deepEqual(qualificationReadiness(event,entries,[],{...board,qualificationDecision:{status:'resolved'}},true),
  [{message:'暂时无法核对排名赛状态',target:'retry'}]);
});
