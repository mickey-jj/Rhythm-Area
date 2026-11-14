import assert from 'node:assert/strict';
import {client} from './test-client.mjs';
const mode=process.argv[2]??'solo',team=mode==='team',fixed=mode==='fixed';
assert(['solo','team','fixed'].includes(mode));
const A=client(),owner=await A.setup(),preset=(await A.get('/templates',owner)).data.find(t=>t.id==='custom');
const rules={...preset.rules,capacity:4,entryMode:team?'team':'solo',timing:{draftSeconds:60,chartSeconds:240},team:{...preset.rules.team,min:2,max:2,perChart:2,maxAppearances:3,aggregation:'sum'},stages:[{id:'main',name:'重置专项',kind:'single',advance:1}],...(fixed?{draft:[],playOrder:preset.rules.playOrder.map((p,i)=>({...p,source:'fixed:'+preset.charts[i].chart_key}))}:{})};
let e=(await A.post('/instance/event',{...preset,name:'单场重置专项',rules},owner)).data;
e=(await A.post(`/events/${e.id}/publish`,{expectedVersion:e.version},owner)).data;
const players=[];
for(let i=0;i<4;i++){
 const session=await A.register(`reset-player-${i}`);let member=null;
 if(team){await A.post(`/events/${e.id}/teams`,{name:`重置队伍${i}`,code:null},session);const t=(await A.get(`/events/${e.id}/teams`,session)).data.find(t=>t.captainId===session.user.id);member=await A.register(`reset-member-${i}`);await A.post(`/events/${e.id}/teams/join`,{name:'',code:t.code},member);}
 const entry=(await A.post(`/events/${e.id}/entries`,{displayName:`参赛方${i}`},session)).data;
 await A.post(`/entries/${entry.id}/review`,{decision:'accepted',reason:'资格通过'},owner);players.push({session,member,entry});
}
const judge=await A.register('reset-judge');await A.post(`/events/${e.id}/judges`,{username:judge.user.username,matchId:null,remove:false},owner);
await A.post(`/events/${e.id}/generate`,{expectedVersion:e.version},owner);
const schedule=async()=>(await A.get(`/events/${e.id}/schedule`,owner)).data;
const detail=async id=>(await A.get(`/matches/${id}`,owner)).data;
const clock=async id=>(await A.get(`/matches/${id}/clock`,owner)).data;
const control=async(id,action)=>A.post(`/matches/${id}/clock`,{action,expectedVersion:(await clock(id)).clock.version},owner);
const reset=async(id,session=owner,expected=200,version=undefined,reason='隔离测试重新开始')=>A.post(`/matches/${id}/reset`,{expectedVersion:version??(await detail(id)).version,reason},session,expected);
const attempts=async()=>(await A.get(`/events/${e.id}/attempts`,owner)).data;
const opening=(await schedule()).filter(m=>m.round===1),id=opening[0].id,other=opening[1].id;
const initial=await detail(id);
await reset(id,players[0].session,403);await reset(id,judge,403);await reset(id,owner,400,undefined,'');
await control(id,'start');await control(id,'pause');
const before=await detail(id);await reset(id,owner,409,before.version-1);assert.deepEqual(await detail(id),before);
await reset(id);assert.equal((await clock(id)).clock.status,'ready');assert.equal((await clock(id)).clock.remainingMs,fixed?240000:60000);assert.equal((await detail(id)).generation,initial.generation+1);
async function prepare(mid){
 let m=await detail(mid);
 if(m.currentStep){await control(mid,'start');while(m.currentStep){m=(await A.post(`/matches/${mid}/draft-actions`,{expectedVersion:m.version,chartKey:m.candidates[0]?.chart_key??null,idempotencyKey:crypto.randomUUID()},owner)).data;}}
 m=await detail(mid);assert.equal(m.status,'playing');
 if(team)for(const en of [m.a,m.b]){const p=players.find(p=>p.entry.id===en.id);await A.post(`/matches/${mid}/lineups`,{entryId:en.id,expectedVersion:(await detail(mid)).version,items:m.slots.map(s=>({slotId:s.id,userIds:[p.session.user.id,p.member.user.id]}))},p.session);}
 await control(mid,'start');return await detail(mid);
}
async function submit(mid,count){
 const m=await detail(mid),publicBefore=(await A.get(`/matches/${mid}/scores`)).data;
 for(const [i,en] of [m.a,m.b].entries()){
  const p=players.find(p=>p.entry.id===en.id),slots=m.slots.slice(0,count),value=String(99-i);
  await A.post(`/events/${e.id}/attempts`,{entryId:en.id,matchId:mid,items:team?[]:slots.map(s=>({slotId:s.id,value})),memberScores:team?slots.flatMap(s=>[p.session,p.member].map(member=>({slotId:s.id,userId:member.user.id,value}))):null,evidenceNote:'重置前后核验'},p.session);
 }
 assert.deepEqual((await A.get(`/matches/${mid}/scores`)).data,publicBefore,'pending team and member scores stay private');
 for(const a of (await attempts()).filter(a=>a.matchId===mid&&a.status==='pending'))await A.post(`/attempts/${a.id}/review`,{decision:'approved',reason:'核对通过'},owner);
 const published=(await A.get(`/matches/${mid}/scores`)).data;
 for(const row of published.slice(0,count)){assert.equal(row.aMembers.length,team?2:0);assert.equal(row.bMembers.length,team?2:0);if(team){assert(row.aMembers.every(u=>u.value==='99'));assert(row.bMembers.every(u=>u.value==='98'));assert(row.aMembers.every(u=>u.displayName));assert.equal(Number(row.aValue),198);}}
}
await prepare(id);await submit(id,1);
if(team){
 const played=await detail(id),p=players.find(p=>p.entry.id===played.a.id),before=(await A.get(`/matches/${id}/scores`)).data;
 const replacement=()=>A.post(`/events/${e.id}/attempts`,{entryId:p.entry.id,matchId:id,items:[],memberScores:[p.session,p.member].map((u,i)=>({slotId:played.slots[0].id,userId:u.user.id,value:String(96+i)})),evidenceNote:'成员成绩替换核验'},p.session);
 await replacement();assert.deepEqual((await A.get(`/matches/${id}/scores`)).data,before);
 let pending=(await attempts()).find(a=>a.matchId===id&&a.status==='pending');await A.post(`/attempts/${pending.id}/review`,{decision:'rejected',reason:'核验拒绝不公开'},owner);assert.deepEqual((await A.get(`/matches/${id}/scores`)).data,before);
 await replacement();pending=(await attempts()).find(a=>a.matchId===id&&a.status==='pending');await A.post(`/attempts/${pending.id}/review`,{decision:'approved',reason:'核验最新快照'},owner);
 const live=(await A.get(`/matches/${id}/scores`)).data[0];assert.equal(Number(live.aValue),193);assert.deepEqual(live.aMembers.map(m=>m.value).sort(),['96','97']);assert.equal(live.bMembers.length,2);
}
const old=(await attempts()).filter(a=>a.matchId===id),unrelated=await detail(other);
await reset(id);const after=await detail(id);assert.equal(after.actions.length,0);assert.equal(after.extraRound,0);assert.equal(after.winnerId,null);assert.equal(after.status,fixed?'playing':'drafting');
assert.deepEqual(await detail(other),unrelated);assert.equal((await clock(id)).clock.status,'ready');assert((await A.get(`/matches/${id}/scores`)).data.every(r=>r.aMembers.length===0&&r.bMembers.length===0));
for(const a of old){const kept=(await attempts()).find(r=>r.id===a.id);assert.equal(kept.status,'superseded');assert.deepEqual(kept.items,a.items);if(team)assert.deepEqual(kept.memberScores,a.memberScores);}
if(team)assert.equal((await A.get(`/matches/${id}/lineups`,owner)).data.length,0);
async function finish(mid){
 const m=await prepare(mid);
 for(let count=1;count<=m.slots.length;count++){await submit(mid,count);if(count<m.slots.length)await control(mid,'next');}
 await A.post(`/matches/${mid}/finalize`,{expectedVersion:(await detail(mid)).version},owner);
}
await finish(id);await reset(id);assert.equal((await detail(id)).status,fixed?'playing':'drafting');
await finish(id);await finish(other);
const final=(await schedule()).find(m=>m.round===2);assert(final.a&&final.b);
await control(final.id,'start');const frozen=await detail(id);await reset(id,owner,409);assert.deepEqual(await detail(id),frozen);
await reset(final.id);await reset(id);assert.equal((await detail(final.id)).status,'waiting');assert.equal((await detail(final.id)).a,null);
await finish(id);await finish(final.id);assert.equal((await A.get(`/events/${e.id}`,owner)).data.status,'completed');
await reset(final.id);assert.equal((await A.get(`/events/${e.id}`,owner)).data.status,'running');assert.equal((await detail(id)).status,'finalized');assert.equal((await clock(final.id)).clock.status,'ready');
assert((await A.get(`/events/${e.id}/audit`,owner)).data.some(row=>JSON.stringify(row).includes('match.reset')));
console.log(`PASS reset ${mode}: owner-only, version/rollback, BP/lineup/score preservation, explicit restart, idle descendants, active descendant protection, completed match/event and fixed-course reset`);
