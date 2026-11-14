import assert from 'node:assert/strict';
import {client} from './test-client.mjs';
const [captainSelection='appointed',formation='draft']=process.argv.slice(2);
const A=client(8083),owner=await A.setup();
const preset=(await A.get('/templates',owner)).data.find(t=>t.id==='custom');
const rules={...preset.rules,entryMode:'team',capacity:4,team:{...preset.rules.team,min:3,max:5,perChart:1,maxAppearances:20,captainSelection,formation,captainCount:2,draftOrder:'snake'},stages:[{id:'main',name:'团队决赛',kind:'single',advance:1}]};
let e=(await A.post('/instance/event',{...preset,name:`团队组队 ${captainSelection}/${formation}`,rules},owner)).data;
e=(await A.post(`/events/${e.id}/publish`,{expectedVersion:e.version},owner)).data;
const users=[];
for(let i=0;i<9;i++)users.push(await A.register(`formation-player-${i}`));
const board=async s=>(await A.get(`/events/${e.id}/team-formation`,s)).data;
const post=(path,body,s=owner,status=200)=>A.post(`/events/${e.id}/${path}`,body,s,status);
await post('team-candidates',{note:'x'.repeat(301)},users[0],400);
if(captainSelection==='random')await post('captains/draw',{},owner,409);
for(const [i,s] of users.entries())await post('team-candidates',{note:`公开简介 ${i}`},s);
await post('team-candidates',{note:'已更新简介'},users[0]);
assert.equal((await board()).candidates.length,9);
assert.equal((await board()).candidates[0].note,'已更新简介');
await post('captains/decision',{userId:users[0].user.id,decision:'approved'},users[1],403);
if(captainSelection==='free'){
 await post('teams',{name:'夜航',code:null},users[0]);await post('teams',{name:'回声',code:null},users[1]);
}else{
 await post('teams',{name:'绕过认定',code:null},users[0],409);
 if(captainSelection==='appointed')for(const s of users.slice(0,2))await post('captains/decision',{userId:s.user.id,decision:'approved'});
 if(captainSelection==='application'){
  await post('captains/decision',{userId:users[0].user.id,decision:'approved'},owner,409);
  await post('captains/apply',{note:'申请介绍'},users[0]);
  await post('captains/decision',{userId:users[0].user.id,decision:'rejected'});
  assert.equal((await board(users[0])).candidates[0].captainStatus,'rejected');
  await post('captains/apply',{note:'重新申请'},users[0]);
  await post('captains/apply',{note:'重复申请'},users[0],409);
  await post('captains/apply',{note:'队长申请'},users[1]);
  for(const s of users.slice(0,2))await post('captains/decision',{userId:s.user.id,decision:'approved'});
 }
 if(captainSelection==='random'){
  await post('captains/draw',{},users[0],403);await post('captains/draw',{});await post('captains/draw',{},owner,409);
 }
}
let b=await board();assert.equal(b.teams.length,2);assert(b.teams.every(t=>t.members.length===1&&t.code===null));
const captains=b.teams.map(t=>users.find(u=>u.user.id===t.captainId));
await post('entries',{displayName:'过早报名'},captains[0],formation==='free'?400:409);
if(formation==='free'){
 const unassigned=users.filter(u=>!b.teams.some(t=>t.captainId===u.user.id));
 await post(`teams/${b.teams[0].id}/join`,{},unassigned[0]);
 await post(`teams/${b.teams[1].id}/join`,{},unassigned[0],409);
 await post('teams/leave',{},unassigned[0]);
 await post('teams/leave',{},captains[0],409);
 for(const [i,s] of unassigned.entries())await post(`teams/${b.teams[i%2].id}/join`,{},s);
 await post(`teams/${b.teams[0].id}/join`,{},await A.register('formation-extra'),409);
}else{
 await post(`teams/${b.teams[0].id}/join`,{},users.find(u=>!b.teams.some(t=>t.captainId===u.user.id)),409);
 if(formation==='random'){
  await post('teams/random',{},captains[0],403);await post('teams/random',{});await post('teams/random',{},owner,409);
 }else{
  await post('team-draft/start',{},captains[0],403);await post('team-draft/start',{});await post('team-draft/start',{},owner,409);
  b=await board();const active=b.teams.find(t=>t.id===b.draft.activeTeamId);
  const wrong=captains.find(s=>s.user.id!==active.captainId),candidate=b.candidates.find(c=>!c.teamId);
  await post('team-draft/pick',{userId:candidate.user.id,expectedVersion:b.draft.version},wrong,403);
  await post('team-candidates',{note:'临时插队'},await A.register('late-formation'),409);
  const version=b.draft.version;
  await post('team-draft/pick',{userId:candidate.user.id,expectedVersion:version},captains.find(s=>s.user.id===active.captainId));
  await post('team-draft/pick',{userId:candidate.user.id,expectedVersion:version},owner,409);
  b=await board();
  const candidates=b.candidates.filter(c=>!c.teamId).slice(0,2);
  const race=await Promise.all(candidates.map(c=>fetch(A.base+`/events/${e.id}/team-draft/pick`,{method:'POST',headers:{'Content-Type':'application/json',Origin:A.origin,Cookie:owner.cookie,'X-Area-CSRF':owner.csrf},body:JSON.stringify({userId:c.user.id,expectedVersion:b.draft.version})}).then(async r=>({status:r.status,data:await r.json()}))));
  assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);assert.equal(race.find(r=>r.status===409).data.code,'VERSION_CONFLICT');
  while((b=await board()).draft.status==='drafting'){
   const t=b.teams.find(t=>t.id===b.draft.activeTeamId),s=captains.find(s=>s.user.id===t.captainId);
   await post('team-draft/pick',{userId:b.candidates.find(c=>!c.teamId).user.id,expectedVersion:b.draft.version},s);
  }
  assert.equal(b.draft.picks.length,7);
  assert.deepEqual(b.draft.picks.slice(0,4).map(p=>p.teamId),[b.draft.teamOrder[0],b.draft.teamOrder[1],b.draft.teamOrder[1],b.draft.teamOrder[0]]);
 }
}
b=await board();assert.equal(b.teams.flatMap(t=>t.members).length,9);assert.equal(new Set(b.teams.flatMap(t=>t.members.map(m=>m.id))).size,9);
assert.deepEqual(b.teams.map(t=>t.members.length).sort(),[4,5]);assert(b.candidates.every(c=>c.teamId));
for(const t of b.teams){
 const s=captains.find(s=>s.user.id===t.captainId);
 const entry=(await post('entries',{displayName:t.name},s)).data;
 await A.post(`/entries/${entry.id}/review`,{decision:'accepted',reason:'阵容符合规则'},owner);
 const member=users.find(u=>t.members.some(m=>m.id===u.user.id)&&u.user.id!==t.captainId);
 await post('teams/leave',{},member,409);
}
e=(await A.get(`/events/${e.id}`,owner)).data;
await post('generate',{expectedVersion:e.version});
assert((await A.get(`/events/${e.id}/schedule`,owner)).data.some(m=>m.a&&m.b));
await post('team-candidates',{note:''},users[0],409);
console.log(`PASS team formation ${captainSelection}/${formation}: captain policy, public lobby, balanced rosters, registration and ${formation==='draft'?'snake turns + concurrent pick isolation':'membership boundaries'}`);
