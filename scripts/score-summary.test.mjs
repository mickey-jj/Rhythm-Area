import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chartWins} from '../frontend/src/pages/MatchRoomPage/functions/scoreSummary.ts';
test('chart wins ignore pending values and equivalent decimal strings',()=>{const rows=[{aValue:'99',bValue:'99.0000'},{aValue:null,bValue:'100'},{aValue:'99.5',bValue:'99.4'}];assert.equal(chartWins(rows,true,0),1);assert.equal(chartWins(rows,true,1),0);});
test('lower scores and an initial winners-side advantage are reflected in first-to counters',()=>{const rows=[{aValue:'5',bValue:'6'},{aValue:'7',bValue:'6'}];assert.equal(chartWins(rows,false,0,1),2);assert.equal(chartWins(rows,false,1,1),1);});

test('first-to counters stop at the deciding prefix while total-course counters keep all tracks',()=>{
 const rows=[['9','8'],['9','8'],['1','9'],['1','9'],['1','9']].map(([aValue,bValue])=>({aValue,bValue}));
 assert.equal(chartWins(rows,true,0,0,2),2);assert.equal(chartWins(rows,true,1,0,2),0);
 assert.equal(chartWins(rows,true,1),3);
 assert.equal(chartWins(rows,true,0,1,2),2);
 assert.equal(chartWins([{aValue:null,bValue:'100'},...rows],true,0,0,2),0);
});
