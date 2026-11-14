import assert from 'node:assert/strict';
import {client} from './test-client.mjs';
const mode=process.argv[2] ?? 'normal',teamMode=['team','clock-team','reset-team'].includes(mode);
assert(['normal','team','playing-replan','completed-replan','clock','clock-team','reset','reset-team'].includes(mode));
const A=client(8083),owner=await A.setup(),preset=(await A.get('/templates',owner)).data.find(t=>t.id==='custom');
let rules={...preset.rules,capacity:7,entryMode:teamMode?'team':'solo',stages:[{id:'main',name:'七方双败',kind:'double',advance:1}],resolution:{...preset.rules.resolution,finalPolicy:'reset'},team:teamMode?{min:2,max:2,perChart:2,maxAppearances:3,aggregation:'sum'}:preset.rules.team};
let charts=preset.charts.map(c=>({...c,cover_url:`https://example.test/${c.chart_key}.jpg`}));
let e=(await A.post('/instance/event',{...preset,name:'七方双败专项验收',rules,charts},owner)).data;
e=(await A.post(`/events/${e.id}/publish`,{expectedVersion:e.version},owner)).data;
const players=[];
for(let i=0;i<7;i++){
 const session=await A.register(`fair-player-${i}`);let member=null;
 if(teamMode){await A.post(`/events/${e.id}/teams`,{name:`队伍${i}`,code:null},session);const t=(await A.get(`/events/${e.id}/teams`,session)).data.find(t=>t.captainId===session.user.id);member=await A.register(`fair-member-${i}`);await A.post(`/events/${e.id}/teams/join`,{name:'',code:t.code},member);}
 const entry=(await A.post(`/events/${e.id}/entries`,{displayName:`参赛方${i}`},session)).data;
 await A.post(`/entries/${entry.id}/review`,{decision:'accepted',reason:'资格通过'},owner);players.push({session,member,entry});
}
const outsider=await A.register('fair-outsider');
await A.post(`/events/${e.id}/generate`,{expectedVersion:e.version},owner);
const groups=async()=> (await A.get(`/events/${e.id}/elimination-groups`,owner)).data;
const schedule=async()=> (await A.get(`/events/${e.id}/schedule`,owner)).data;
const detail=async id=>(await A.get(`/matches/${id}`,owner)).data;
const room=async id=>(await A.get(`/elimination-groups/${id}`,owner)).data;
const attempts=async()=> (await A.get(`/events/${e.id}/attempts`,owner)).data;
const player=id=>players.find(p=>p.entry.id===id);
async function submitGroup(group,entry,value,session=player(entry.id).session,status=200){
 const members=teamMode?(await A.get(`/events/${e.id}/teams`,owner)).data.find(t=>t.entryId===entry.id).members:[];
 return A.post(`/events/${e.id}/attempts`,{entryId:entry.id,matchId:null,groupId:group.id,items:teamMode?[]:group.charts.map(c=>({slotId:c.chart_key,value})),memberScores:teamMode?group.charts.flatMap(c=>members.map(m=>({slotId:c.chart_key,userId:m.id,value}))):null,evidenceNote:'同曲晋级轮专项核验'},session,status);
}
async function finish(id){
 let m=await detail(id);
 while(m.currentStep)m=(await A.post(`/matches/${id}/draft-actions`,{expectedVersion:m.version,chartKey:m.candidates[0]?.chart_key??null,idempotencyKey:crypto.randomUUID()},owner)).data;
 if(m.status==='awaiting-reveal'){await A.post(`/matches/${id}/reveal`,{expectedVersion:m.version},owner);m=await detail(id);}
 const sides=[m.a,m.b];
 for(const [i,en] of sides.entries()){
  const p=player(en.id),value=m.bracket==='final'?(i?'99':'98'):(i?'98':'99');
  const slots=m.slots.filter(s=>s.extraRound===m.extraRound),members=teamMode?(await A.get(`/events/${e.id}/teams`,p.session)).data.find(t=>t.entryId===en.id).members:[];
  if(teamMode){await A.post(`/matches/${id}/lineups`,{entryId:en.id,expectedVersion:m.version,items:slots.map(s=>({slotId:s.id,userIds:members.map(m=>m.id)}))},p.session);m=await detail(id);}
  await A.post(`/events/${e.id}/attempts`,{entryId:en.id,matchId:id,items:teamMode?[]:slots.map(s=>({slotId:s.id,value})),memberScores:teamMode?slots.flatMap(s=>members.map(m=>({slotId:s.id,userId:m.id,value}))):null,evidenceNote:'双败对局核验'},p.session);
 }
 for(const a of (await attempts()).filter(a=>a.matchId===id&&a.status==='pending'))await A.post(`/attempts/${a.id}/review`,{decision:'approved',reason:'已核对'},owner);
 await A.post(`/matches/${id}/finalize`,{expectedVersion:m.version},owner);
}
let group=(await groups())[0];assert.equal(group.expectedParticipants,3);assert.equal(group.advance,2);assert.equal(group.status,'waiting');assert.deepEqual(group.charts,[]);assert.deepEqual(group.rules.playOrder,[]);
await A.post(`/elimination-groups/${group.id}/finalize`,{expectedVersion:group.version,order:[],reason:''},owner,409);
for(const m of (await schedule()).filter(m=>m.bracket==='winners'&&m.round===1&&m.a&&m.b))await finish(m.id);
group=(await groups())[0];assert.equal(group.status,'playing');assert.equal(group.participants.length,3);assert.equal(group.charts.length,rules.playOrder.length);
const participants=(await room(group.id)).entries;
await submitGroup(group,participants[0],'99',outsider,403);
await A.post(`/events/${e.id}/attempts`,{entryId:participants[0].id,matchId:null,groupId:group.id,items:[],evidenceNote:'不完整'},player(participants[0].id).session,400);
if(mode.startsWith('clock')||mode.startsWith('reset')){
 const board=async()=>(await A.get(`/elimination-groups/${group.id}/clock`,owner)).data;
 const ctl=async(action,status=200,session=owner)=>A.post(`/elimination-groups/${group.id}/clock`,{action,expectedVersion:(await board()).clock.version},session,status);
 assert.equal((await board()).clock.status,'ready');await ctl('start',403,outsider);await ctl('start');await ctl('pause');assert.equal((await board()).clock.status,'paused');await ctl('resume');
 for(let count=1;count<=group.charts.length;count++){
  for(const [i,en] of participants.entries()){
   const members=teamMode?(await A.get(`/events/${e.id}/teams`,owner)).data.find(t=>t.entryId===en.id).members:[];
   const slots=group.charts.slice(0,count);
   await A.post(`/events/${e.id}/attempts`,{entryId:en.id,matchId:null,groupId:group.id,items:teamMode?[]:slots.map(c=>({slotId:c.chart_key,value:String(99-i)})),memberScores:teamMode?slots.flatMap(c=>members.map(m=>({slotId:c.chart_key,userId:m.id,value:String(99-i)}))):null,evidenceNote:'共同演奏逐曲计时测试'},player(en.id).session);
  }
  if(count<group.charts.length)await ctl('next',409);
  for(const a of (await attempts()).filter(a=>a.groupId===group.id&&a.status==='pending'))await A.post(`/attempts/${a.id}/review`,{decision:'approved',reason:'逐曲审核通过'},owner);
  if(count<group.charts.length){await ctl('next');assert.equal((await board()).clock.chartIndex,count);}
 }
 assert.equal((await board()).clock.status,'finished');const final=await room(group.id);
 await A.post(`/elimination-groups/${group.id}/finalize`,{expectedVersion:final.group.version,order:final.standings.map(s=>s.entryId),reason:''},owner);
 assert.equal((await room(group.id)).group.status,'completed');
 if(mode.startsWith('reset')){
  const completed=(await room(group.id)).group,records=(await attempts()).filter(a=>a.groupId===group.id);
  const reset=(session=owner,expected=200,version=completed.version)=>A.post(`/elimination-groups/${group.id}/reset`,{expectedVersion:version,reason:'重新进行同曲晋级轮'},session,expected);
  await reset(outsider,403);await reset(owner,409,completed.version-1);await reset();
  const fresh=(await room(group.id)).group;assert.equal(fresh.status,'playing');assert.deepEqual(fresh.placements,[]);assert.deepEqual(fresh.charts,completed.charts);
  assert.equal((await board()).clock.status,'ready');assert.equal((await board()).clock.chartIndex,0);assert.equal((await board()).clock.remainingMs,240000);
  assert((await room(group.id)).standings.every(s=>s.total===null));
  for(const a of records){const kept=(await attempts()).find(r=>r.id===a.id);assert.equal(kept.status,'superseded');assert.deepEqual(kept.items,a.items);}
  await ctl('start');await ctl('pause');assert.equal((await board()).clock.status,'paused');
  console.log(`PASS reset group ${teamMode?'team':'solo'}: owner-only, versions, retained charts/scores, cleared placements, reset countdown and idle descendants`);process.exit(0);
 }
 console.log(`PASS clock group ${teamMode?'team':'solo'}: start/pause/resume, all entrants reviewed before advance, per-chart cumulative scores and shared-course qualification`);process.exit(0);
}
for(const [i,en] of participants.entries())await submitGroup(group,en,i===0?'99':'98');
const pending=(await attempts()).filter(a=>a.groupId===group.id);assert.equal(pending.length,3);
assert((await room(group.id)).standings.every(s=>s.total===null));
const self=player(participants[0].id);await A.post(`/events/${e.id}/judges`,{username:self.session.user.username,matchId:null,remove:false},owner);
await A.post(`/attempts/${pending.find(a=>a.entryId===participants[0].id).id}/review`,{decision:'approved',reason:'不能自审'},self.session,403);
if(teamMode){await A.post(`/events/${e.id}/judges`,{username:self.member.user.username,matchId:null,remove:false},owner);await A.post(`/attempts/${pending.find(a=>a.entryId===participants[0].id).id}/review`,{decision:'approved',reason:'不能审核本队'},self.member,403);}
async function replan(){
 e=(await A.get(`/events/${e.id}`,owner)).data;
 const nextRules={...rules,metric:{...rules.metric,maximum:'102'}};
 e=(await A.req(`/events/${e.id}`,{method:'PUT',session:owner,body:{name:e.name,tagline:e.tagline,description:e.description,rules:nextRules,charts:charts.map(c=>({...c,title:'新曲名'})),expectedVersion:e.version}})).data;
}
if(mode==='playing-replan'){
 await replan();const old=(await room(group.id)).group;assert.equal(old.status,'cancelled');assert.equal(old.scheduleState,'historical');assert.deepEqual(old.charts,group.charts);
 assert((await attempts()).filter(a=>a.groupId===group.id).every(a=>a.status==='superseded'));
 await submitGroup(group,participants[0],'99',player(participants[0].id).session,409);
 assert.equal((await A.get(`/events/${e.id}/stages`,owner)).data[0].participants.length,7);
 console.log('PASS fair group playing replan: pending evidence and scores retained, obsolete group cancelled, all eligible entrants continue');process.exit(0);
}
let current=await room(group.id);
await A.post(`/elimination-groups/${group.id}/finalize`,{expectedVersion:current.group.version,order:participants.map(e=>e.id),reason:'尚有待审'},owner,409);
for(const a of pending)await A.post(`/attempts/${a.id}/review`,{decision:'approved',reason:'完整同曲成绩'},owner);
current=await room(group.id);const order=current.standings.map(r=>r.entryId);
assert.equal(current.standings[0].total,teamMode?'594':'297');
await A.post(`/elimination-groups/${group.id}/finalize`,{expectedVersion:current.group.version,order,reason:''},owner,400);
await A.post(`/elimination-groups/${group.id}/finalize`,{expectedVersion:current.group.version,order:[...order].reverse(),reason:'越过确定名次'},owner,400);
await A.post(`/elimination-groups/${group.id}/finalize`,{expectedVersion:current.group.version,order,reason:'同分附加赛见证结果，保留此晋级顺序'},outsider,403);
const done=(await A.post(`/elimination-groups/${group.id}/finalize`,{expectedVersion:current.group.version,order,reason:'同分附加赛见证结果，保留此晋级顺序'},owner)).data;
assert.equal(done.group.status,'completed');assert.equal(done.group.placements.length,3);
await A.post(`/elimination-groups/${group.id}/finalize`,{expectedVersion:current.group.version,order,reason:'重复'},owner,409);
const upstream=(await schedule()).find(m=>m.bracket==='winners'&&m.round===1&&m.status==='finalized');const upstreamDetail=await detail(upstream.id);
await A.post(`/matches/${upstream.id}/replay`,{expectedVersion:upstreamDetail.version,winnerId:null,reason:'不应覆盖已进行的晋级轮来源'},owner,409);
if(mode==='completed-replan'){
 await replan();const old=(await room(group.id)).group;assert.equal(old.status,'completed');assert.equal(old.scheduleState,'historical');assert.deepEqual(old.charts,group.charts);assert.deepEqual(old.placements,order);
 assert((await attempts()).filter(a=>a.groupId===group.id).every(a=>a.status==='approved'));
 const participants=(await A.get(`/events/${e.id}/stages`,owner)).data[0].participants;assert.equal(participants.length,6);assert(!participants.includes(order[2]));
 console.log('PASS fair group completed replan: original songs, approved scores and qualification order survive; eliminated entrant stays eliminated');process.exit(0);
}
for(let guard=0;guard<100;guard++){const next=(await schedule()).find(m=>['drafting','playing'].includes(m.status));if(!next)break;await finish(next.id);}
assert.equal((await A.get(`/events/${e.id}`,owner)).data.status,'completed');
const placements=(await A.get(`/events/${e.id}/stages`,owner)).data[0].placements;assert(placements.filter(p=>p.rank!==1).every(p=>p.losses===2));
assert((await schedule()).some(m=>m.bracket==='reset'&&m.status==='finalized'));
console.log(`PASS fair group ${mode}: identical course, private pending scores, team sum, forbidden self-review, explicit tie decision, downstream protection, reset final and correct losses`);
