import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chartWins} from '../frontend/src/pages/MatchRoomPage/functions/scoreSummary.ts';
test('chart wins ignore pending values and equivalent decimal strings',()=>{const rows=[{aValue:'99',bValue:'99.0000'},{aValue:null,bValue:'100'},{aValue:'99.5',bValue:'99.4'}];assert.equal(chartWins(rows,true,0),1);assert.equal(chartWins(rows,true,1),0);});
test('lower scores and an initial winners-side advantage are reflected in first-to counters',()=>{const rows=[{aValue:'5',bValue:'6'},{aValue:'7',bValue:'6'}];assert.equal(chartWins(rows,false,0,1),2);assert.equal(chartWins(rows,false,1,1),1);});
