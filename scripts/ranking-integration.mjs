import assert from 'node:assert/strict';
import {client} from './test-client.mjs';
const mode=process.argv[2] ?? 'threshold';
assert(['fixed','duration','threshold','threshold-low','team-threshold','scheduled','legacy','stages'].includes(mode));
const A=client(8083),owner=await A.setup(),template=(await A.get('/templates',owner)).data.find(t=>t.id==='custom');
const policy={startMode:'publish',endMode:'manual',startAt:null,deadline:null,durationSeconds:null,targetCount:null,targetScore:null};
if(mode==='fixed')Object.assign(policy,{endMode:'fixed',deadline:new Date(Date.now()+600000).toISOString()});
if(mode==='duration')Object.assign(policy,{startMode:'manual',endMode:'duration',durationSeconds:2});
if(mode.includes('threshold'))Object.assign(policy,{endMode:'threshold',targetCount:2,targetScore:mode==='threshold-low'?'15':mode==='team-threshold'?'590':'290'});
if(mode==='scheduled')Object.assign(policy,{startMode:'scheduled',startAt:new Date(Date.now()+3600000).toISOString(),endMode:'duration',durationSeconds:3600});
const team=mode==='team-threshold';
let rules={...template.rules,capacity:4,entryMode:team?'team':'solo',metric:{...template.rules.metric,higherWins:mode!=='threshold-low'},stages:[{id:'ranking',name:'刷分挑战',kind:'ranking',advance:2,...(mode==='legacy'?{}:{ranking:policy})}],windows:{registrationOpen:null,registrationClose:null,qualifierClose:mode==='legacy'?new Date(Date.now()+600000).toISOString():null},team:team?{min:2,max:2,perChart:2,maxAppearances:3,aggregation:'sum'}:template.rules.team};
if(mode==='stages'){
 const base={metric:rules.metric,matchMode:template.rules.matchMode,winsRequired:template.rules.winsRequired,draft:template.rules.draft,playOrder:template.rules.playOrder,resolution:template.rules.resolution,draftMode:'sealed',tieBreak:['best-chart']};
 rules={...rules,draft:[],playOrder:[],matchMode:'first-to',winsRequired:99,stages:[{id:'cut',name:'第一阶段',kind:'single',advance:2,plan:base},{id:'final',name:'决赛',kind:'single',advance:1,plan:{...base,draftMode:'open',tieBreak:[]}}]};
}
let e=(await A.post('/instance/event',{...template,name:'排名赛专项验收',rules},owner)).data;
assert((await A.post(`/events/${e.id}/validate`,{},owner)).data.valid);
const simulation=(await A.post(`/events/${e.id}/simulate`,{},owner)).data;
if(mode==='stages')assert.equal(simulation.playOrder.length,3);
e=(await A.post(`/events/${e.id}/publish`,{expectedVersion:e.version},owner)).data;
const players=[];
for(let i=0;i<4;i++){
 const session=await A.register(`rank-player-${i}`);let members=[];
 if(team){await A.post(`/events/${e.id}/teams`,{name:`队伍${i}`,code:null},session);const t=(await A.get(`/events/${e.id}/teams`,session)).data.find(t=>t.captainId===session.user.id);const member=await A.register(`rank-member-${i}`);await A.post(`/events/${e.id}/teams/join`,{name:'',code:t.code},member);members=(await A.get(`/events/${e.id}/teams`,session)).data.find(t=>t.captainId===session.user.id).members;}
 const entry=(await A.post(`/events/${e.id}/entries`,{displayName:team?`队伍${i}`:`选手${i}`},session)).data;
 await A.post(`/entries/${entry.id}/review`,{decision:'accepted',reason:'资格符合'},owner);players.push({session,entry,members});
}
const getBoard=async()=> (await A.get(`/events/${e.id}/ranking-board`,owner)).data;
const getAttempts=async()=> (await A.get(`/events/${e.id}/attempts`,owner)).data;
const postControl=async(action,b,status=200,session=owner)=>A.post(`/events/${e.id}/ranking-control`,{action,expectedVersion:b.session.version},session,status);
const slots=template.charts.filter(c=>c.pool_tag.split('|').includes('qualifier'));
assert.equal(slots.length,3);
async function submit(index,value,status=200){
 const p=players[index];
 return A.post(`/events/${e.id}/attempts`,{entryId:p.entry.id,matchId:null,items:team?[]:slots.map(c=>({slotId:c.chart_key,value})),memberScores:team?slots.flatMap(c=>p.members.map(m=>({slotId:c.chart_key,userId:m.id,value}))):null,evidenceNote:'本地排名赛测试完整成绩'},p.session,status);
}
async function approve(index){
 const a=(await getAttempts()).find(a=>a.entryId===players[index].entry.id&&a.status==='pending');assert(a);
 await A.post(`/attempts/${a.id}/review`,{decision:'approved',reason:'已核对完整成绩'},owner);
}
async function save(next){
 e=(await A.get(`/events/${e.id}`,owner)).data;
 e=(await A.req(`/events/${e.id}`,{method:'PUT',session:owner,body:{name:e.name,tagline:e.tagline,description:e.description,rules:next,charts:template.charts,expectedVersion:e.version}})).data;rules=next;
}
if(mode==='stages'){
 await A.get(`/events/${e.id}/ranking-board`,owner,404);
 await A.post(`/events/${e.id}/generate`,{expectedVersion:e.version},owner);
 const schedule=(await A.get(`/events/${e.id}/schedule`,owner)).data;
 assert.equal(schedule.filter(m=>m.status==='drafting').length,2);
 const m=(await A.get(`/matches/${schedule.find(m=>m.status==='drafting').id}`,owner)).data;
 assert.equal(m.rules.matchMode,'total');assert.equal(m.rules.draftMode,'sealed');assert.deepEqual(m.rules.tieBreak,['best-chart']);
 console.log('PASS independent stage rules: unused legacy fields do not validate or simulate; disclosure and tie-break settings belong to the stage');process.exit(0);
}
let b=await getBoard();const outsider=players[3].session;
await postControl('close',b,403,outsider);
if(mode==='legacy'){
 assert.equal(b.session.policy.endMode,'fixed');const before=b.session;
 await save({...rules,windows:{...rules.windows,qualifierClose:null},stages:[{...rules.stages[0],ranking:{...policy,endMode:'fixed',deadline:rules.windows.qualifierClose}}]});
 b=await getBoard();assert.equal(b.session.endsAt,before.endsAt);assert.equal(b.session.startedAt,before.startedAt);
 console.log('PASS legacy ranking deadline migrates into its stage without resetting its clock or changing existing scores');process.exit(0);
}
if(mode==='scheduled'){
 assert.equal(b.session.status,'waiting');await submit(0,'99',409);
 await postControl('start',b);b=await getBoard();assert.equal(b.session.status,'open');assert.equal(b.session.endsAt-b.session.startedAt,3600000);
 await postControl('close',b);b=await getBoard();assert.equal(b.session.stopReason,'manual');
 await postControl('reopen',b);assert.equal((await getBoard()).session.status,'open');
 console.log('PASS scheduled ranking waits, can be started by the organizer, and supports manual close/reopen with version checks');process.exit(0);
}
if(mode==='duration'){
 assert.equal(b.session.status,'waiting');await submit(0,'99',409);
 await postControl('start',b);await postControl('start',b,409);b=await getBoard();assert.equal(b.session.endsAt-b.session.startedAt,2000);
}
if(mode==='fixed'){
 const next={...policy,deadline:new Date(Date.now()+2500).toISOString()};
 await save({...rules,stages:[{...rules.stages[0],ranking:next}]});b=await getBoard();assert.equal(b.session.status,'open');
}
await submit(0,mode==='threshold-low'?'5':'99');
await submit(1,mode==='threshold-low'?'4':team?'100':'98');
if(mode.includes('threshold')){
 assert.equal((await getBoard()).qualifiedCount,0);
 await approve(0);b=await getBoard();assert.equal(b.qualifiedCount,1);assert.equal(b.session.status,'open');
 await approve(1);b=await getBoard();assert.equal(b.qualifiedCount,2);assert.equal(b.session.status,'closed');assert.equal(b.session.stopReason,'threshold');
 await submit(2,'99',409);
 const count=b.rankings.filter(r=>r.complete).length;assert.equal(count,2);
 if(team)assert(b.rankings.some(r=>r.total==='594'));
 await postControl('reopen',b,409);
 const next={...policy,targetCount:3};await save({...rules,stages:[{...rules.stages[0],ranking:next}]});
 b=await getBoard();await postControl('reopen',b);assert.equal((await getBoard()).session.status,'open');
 await postControl('close',await getBoard());
}else{
 await new Promise(resolve=>setTimeout(resolve,Math.max(0,b.session.endsAt-Date.now())+60));
 await submit(2,'99',409);b=await getBoard();assert.equal(b.session.status,'closed');assert.equal(b.session.stopReason,'deadline');
 await A.post(`/events/${e.id}/generate`,{expectedVersion:e.version},owner,409);
 await approve(0);await approve(1);
}
e=(await A.get(`/events/${e.id}`,owner)).data;
await A.post(`/events/${e.id}/generate`,{expectedVersion:e.version},owner);
b=await getBoard();assert.equal(b.session.status,'closed');assert.equal(b.rankings.filter(r=>r.complete).length,2);
assert.equal((await A.get(`/events/${e.id}`,owner)).data.status,'completed');
assert.equal((await A.get(`/events/${e.id}/stages`,owner)).data[0].participants.length,2);
console.log(`PASS ranking ${mode}: server-enforced cutoff, private pending scores, complete standings, permissions and sealing with incomplete entrants excluded`);
