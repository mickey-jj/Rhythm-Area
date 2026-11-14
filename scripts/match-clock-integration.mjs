import assert from 'node:assert/strict';
import {client} from './test-client.mjs';
const team=process.argv[2]==='team',A=client(),owner=await A.setup(),t=(await A.get('/templates',owner)).data.find(t=>t.id==='custom');
const rules={...t.rules,capacity:2,entryMode:team?'team':'solo',timing:{draftSeconds:2,chartSeconds:240},team:team?{min:2,max:2,perChart:1,maxAppearances:3,aggregation:'sum'}:t.rules.team,stages:[{id:'main',name:'计时正赛',kind:'single',advance:1}]};
let e=(await A.post('/instance/event',{...t,name:'计时专项测试',rules},owner)).data;e=(await A.post(`/events/${e.id}/publish`,{expectedVersion:e.version},owner)).data;
const players=[];
for(let i=0;i<2;i++){const session=await A.register('clock-player-'+i);if(team){await A.post(`/events/${e.id}/teams`,{name:'队伍'+i,code:null},session);const squad=(await A.get(`/events/${e.id}/teams`,session)).data.find(t=>t.captainId===session.user.id);const member=await A.register('clock-member-'+i);await A.post(`/events/${e.id}/teams/join`,{name:'',code:squad.code},member);}const entry=(await A.post(`/events/${e.id}/entries`,{displayName:'选手'+i},session)).data;await A.post(`/entries/${entry.id}/review`,{decision:'accepted',reason:'通过'},owner);players.push({session,entry});}
await A.post(`/events/${e.id}/generate`,{expectedVersion:e.version},owner);
const id=(await A.get(`/events/${e.id}/schedule`,owner)).data.find(m=>m.status==='drafting').id;
const detail=async()=>(await A.get(`/matches/${id}`,owner)).data;
const clock=async()=>(await A.get(`/matches/${id}/clock`,owner)).data;
const control=async(action,b=undefined,expected=200,session=owner)=>A.post(`/matches/${id}/clock`,{action,expectedVersion:(b??await clock()).clock.version},session,expected);
let m=await detail(),b=await clock();assert.equal(b.clock.status,'ready');assert(b.enabled);
const bp=async(expected=200)=>{m=await detail();return A.post(`/matches/${id}/draft-actions`,{expectedVersion:m.version,chartKey:m.candidates[0]?.chart_key??null,idempotencyKey:crypto.randomUUID()},owner,expected);};
await bp(409);await control('start',b,403,players[0].session);await control('start',b);await control('start',b,409);
b=await clock();await control('pause',b);await bp(409);b=await clock();assert.equal(b.clock.status,'paused');assert(b.clock.remainingMs>0);await control('resume',b);
b=await clock();await new Promise(r=>setTimeout(r,Math.max(0,b.clock.endsAt-Date.now())+30));await bp(409);assert.equal((await clock()).clock.status,'expired');await control('restart');
for(let i=0;i<10;i++){m=await detail();if(!m.currentStep)break;await bp();await clock();}
m=await detail();assert.equal(m.status,'playing');b=await clock();assert.equal(b.clock.status,'ready');assert.equal(b.clock.remainingMs,240000);
if(team)for(const p of players){await A.post(`/matches/${id}/lineups`,{entryId:p.entry.id,expectedVersion:(await detail()).version,items:m.slots.map(s=>({slotId:s.id,userIds:[p.session.user.id]}))},p.session);}
async function submit(i,count,value='99',expected=200){const p=players[i],items=m.slots.slice(0,count).map((s,j)=>({slotId:s.id,value:j===count-1?value:'99'}));return A.post(`/events/${e.id}/attempts`,{entryId:p.entry.id,matchId:id,items:team?[]:items,memberScores:team?items.map(s=>({...s,userId:p.session.user.id})):null,evidenceNote:'逐曲计时测试'},p.session,expected);}
await submit(0,1,'99',409);await control('start');
async function review(){for(const a of (await A.get(`/events/${e.id}/attempts`,owner)).data.filter(a=>a.status==='pending'))await A.post(`/attempts/${a.id}/review`,{decision:'approved',reason:'已核对'},owner);}
for(let count=1;count<=3;count++){
 await submit(0,count,'99');await submit(1,count,count===3?'98':'99');
 if(count<3)await control('next',undefined,409);
 await review();
 if(count<3){await control('next');assert.equal((await clock()).clock.chartIndex,count);}
}
assert.equal((await clock()).clock.status,'finished');
m=await detail();await A.post(`/matches/${id}/finalize`,{expectedVersion:m.version},owner);assert.equal((await detail()).status,'finalized');
console.log(`PASS clock ${team?'team':'solo'}: explicit start, permissions, stale versions, pause/resume, exact timeout, restart, per-chart submission/review/advance and champion confirmation`);
