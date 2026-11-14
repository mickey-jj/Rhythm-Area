import assert from 'node:assert/strict';
import {client} from './test-client.mjs';
const A=client(),owner=await A.setup(),preset=(await A.get('/templates',owner)).data.find(t=>t.id==='custom');
const rules={...preset.rules,capacity:4,stages:[{id:'main',name:'双败重置',kind:'double',advance:1}],resolution:{...preset.rules.resolution,finalPolicy:'reset'}};
let e=(await A.post('/instance/event',{...preset,name:'双败决赛重置专项',rules},owner)).data;e=(await A.post(`/events/${e.id}/publish`,{expectedVersion:e.version},owner)).data;
const players=[];
for(let i=0;i<4;i++){const session=await A.register(`double-reset-${i}`),entry=(await A.post(`/events/${e.id}/entries`,{displayName:`选手${i}`},session)).data;await A.post(`/entries/${entry.id}/review`,{decision:'accepted',reason:'通过'},owner);players.push({session,entry});}
await A.post(`/events/${e.id}/generate`,{expectedVersion:e.version},owner);
const schedule=async()=>(await A.get(`/events/${e.id}/schedule`,owner)).data;
const detail=async id=>(await A.get(`/matches/${id}`,owner)).data;
const reset=async(id,expected=200)=>A.post(`/matches/${id}/reset`,{expectedVersion:(await detail(id)).version,reason:'核验双败重置'},owner,expected);
async function finish(id){
 let m=await detail(id);
 while(m.currentStep)m=(await A.post(`/matches/${id}/draft-actions`,{expectedVersion:m.version,chartKey:m.candidates[0]?.chart_key??null,idempotencyKey:crypto.randomUUID()},owner)).data;
 for(const [i,en] of [m.a,m.b].entries())await A.post(`/events/${e.id}/attempts`,{entryId:en.id,matchId:id,items:m.slots.map(s=>({slotId:s.id,value:String(m.bracket==='final'?(i?99:98):(i?98:99))})),evidenceNote:'双败决赛重置核验'},players.find(p=>p.entry.id===en.id).session);
 for(const a of (await A.get(`/events/${e.id}/attempts`,owner)).data.filter(a=>a.status==='pending'))await A.post(`/attempts/${a.id}/review`,{decision:'approved',reason:'已核对'},owner);
 await A.post(`/matches/${id}/finalize`,{expectedVersion:m.version},owner);
}
for(let i=0;i<10&&!((await schedule()).some(m=>m.bracket==='reset'));i++){const next=(await schedule()).find(m=>m.scheduleState==='current'&&m.status==='drafting');assert(next);await finish(next.id);}
const first=(await schedule()).find(m=>m.bracket==='final'),oldReset=(await schedule()).find(m=>m.bracket==='reset');assert(oldReset);
await reset(first.id);assert.equal((await detail(oldReset.id)).scheduleState,'historical');assert.equal((await detail(oldReset.id)).status,'cancelled');
await finish(first.id);const second=(await schedule()).find(m=>m.bracket==='reset'&&m.scheduleState==='current');assert.notEqual(second.id,oldReset.id);
const b=(await A.get(`/matches/${second.id}/clock`,owner)).data;await A.post(`/matches/${second.id}/clock`,{action:'start',expectedVersion:b.clock.version},owner);
await reset(first.id,409);await reset(second.id);
const f=await detail(first.id);await A.post(`/matches/${first.id}/replay`,{expectedVersion:f.version,reason:'记录并核验双败决赛改判',winnerId:f.b.id},owner);
const third=(await schedule()).find(m=>m.bracket==='reset'&&m.scheduleState==='current');assert.notEqual(third.id,second.id);await finish(third.id);
assert.equal((await A.get(`/events/${e.id}`,owner)).data.status,'completed');
console.log('PASS reset double: retires idle reset-final, recreates a distinct final, protects a started final and supports recorded correction without duplicate IDs');
