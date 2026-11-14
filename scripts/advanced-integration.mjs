import {completeEliminationGroup} from "./complete-elimination-group.mjs";
import assert from 'node:assert/strict';
import {client} from './test-client.mjs';
const qualificationOnly=process.argv[2]==='ranking-qualification';
const mode=qualificationOnly?'ranking':process.argv[2]??'double';const n=Number(process.argv[3]??5);
if(!['auth','ranking','team-qualifier','advantage','round-tie','double','round-robin','multi','first-to','sealed','remove','team','qualifier','window','fixed','mystery','assign','overlap','cut','preset'].includes(mode)||n<2||n>32)throw new Error('Use verify-single.ps1 with an isolated fresh test database');
const A=client(8083),owner=await A.setup();const isTeam=mode.startsWith('team'),isQualifier=mode==='qualifier'||mode==='team-qualifier'||mode==='ranking'||mode==='preset';
const preset=(await A.get('/templates',owner)).data.find(t=>t.id===(mode==='preset'?'paradigm-reboot':'custom'));
const rules=structuredClone(preset.rules);rules.capacity=Math.max(2,n);if(mode!=='preset')rules.stages=[{id:'main',name:'正赛',kind:mode==='double'||mode==='advantage'?'double':mode==='round-robin'||mode==='round-tie'||mode==='multi'?'round-robin':'single',advance:mode==='multi'?4:mode==='round-tie'?2:1}];
if(mode==='multi'||mode==='round-tie')rules.stages.push({id:'finals',name:'淘汰决赛',kind:'single',advance:1});
if(mode==='multi')rules.stages[1].plan={metric:{...rules.metric,name:'决赛达成率'},matchMode:'total',winsRequired:1,draft:[{id:'final-random',actor:'referee',action:'random',count:1,pool:'main',banApplies:false,target:'pool'}],playOrder:[{id:'final-song',source:'final-random:1'}],resolution:rules.resolution};
if(mode==='ranking'){rules.stages=[{id:'ranking',name:'独立排名赛',kind:'ranking',advance:qualificationOnly?2:1}];rules.draft=[];rules.playOrder=[];rules.resolution.tie='manual';}
if(mode==='double')rules.resolution.finalPolicy='reset';
if(mode==='advantage'){rules.matchMode='first-to';rules.winsRequired=2;rules.resolution.finalPolicy='advantage';}
if(mode==='first-to'){rules.matchMode='first-to';rules.winsRequired=2;}
if(mode==='sealed')rules.draftMode='sealed';
if(isTeam){rules.entryMode='team';rules.team={min:2,max:2,perChart:1,maxAppearances:3,aggregation:'sum'};}
if(isQualifier&&!['ranking','preset'].includes(mode))rules.stages.unshift({id:'qualifier',name:'海选',kind:'ranking',advance:2});
if(mode==='window')rules.windows={registrationOpen:null,registrationClose:'2020-01-01T00:00:00Z',qualifierClose:null};
if(mode==='remove'){rules.draft.splice(4,0,{id:'remove-a',actor:'A',action:'remove',count:1,pool:'main',banApplies:false,target:'picked'});}
const charts=structuredClone(preset.charts);
if(mode==='fixed'){rules.draft=[];rules.playOrder=[{id:'fixed-song',source:'fixed:'+charts[0].chart_key}];charts[0].role='fixed';}
if(mode==='mystery'||mode==='assign'){rules.draft=[{id:'random',actor:'referee',action:'random',count:1,pool:'secret',banApplies:false,target:'pool'}];rules.playOrder=[{id:'secret-song',source:'random:1'}];charts[0].pool_tag='secret';charts[0].role=(mode==='assign'?'assign':'random')+'|mystery';if(mode==='assign')rules.draft[0].action='assign';charts[1]={...charts[1],pool_tag:'unrelated-future',role:'assign|mystery'};}
if(mode==='overlap'){for(const c of charts)c.pool_tag+='|main|extra|qualifier|stage2';rules.draft[3].pool='stage2';rules.draft.splice(4,0,{id:'remove-cross-pool',actor:'A',action:'remove',count:1,pool:'stage2',banApplies:false,target:'picked'});}
if(mode==='cut'){rules.stages=[{id:'cut',name:'第一阶段',kind:'single',advance:4},{id:'final',name:'第二阶段',kind:'single',advance:1}];}
let e=(await A.post('/instance/event',{name:`${mode} ${n} 人验收`,tagline:'真实接口验收',description:'全部为虚构测试数据',rules,charts,appearance:preset.appearance},owner)).data;
e=(await A.post('/events/'+e.id+'/publish',{expectedVersion:e.version},owner)).data;
if(mode==='preset'){
 const stranger=await A.register('unrelated-viewer');
 await A.post('/events/'+e.id+'/reopen',{expectedVersion:e.version},stranger,403);
 await A.post('/events/'+e.id+'/reopen',{expectedVersion:e.version-1},owner,409);
 e=(await A.post('/events/'+e.id+'/reopen',{expectedVersion:e.version},owner)).data;
 assert.equal(e.status,'draft');await A.get('/events/'+e.id+'/pool',null,404);
 e=(await A.post('/events/'+e.id+'/publish',{expectedVersion:e.version},owner)).data;
}

if(mode==='auth'){
 const one=A.session(await A.req('/auth/register',{method:'POST',body:{username:'short-name-one',password:'test-player-2026',displayName:'一'}}));
 const two=A.session(await A.req('/auth/register',{method:'POST',body:{username:'short-name-two',password:'test-player-2026',displayName:'星野'}}));
 assert.equal(one.user.displayName,'一');assert.equal(two.user.displayName,'星野');
 for(const name of ['short-name-one','short-name-two'])assert.equal((await A.post('/auth/login',{username:name,password:'test-player-2026'},null)).data.user.username,name);
 await A.post('/auth/login',{username:'星野',password:'test-player-2026'},null,401);
 await A.post('/auth/register',{username:'ab',password:'test-player-2026',displayName:'二'},null,400);
 const {execFileSync}=await import('node:child_process');const {readFileSync}=await import('node:fs');
 assert.match(process.env.DB_NAME,/^area_verify_[a-z0-9_]+$/);assert.match(one.user.id,/^[a-f0-9-]+$/);
 execFileSync((process.env.PG_BIN??'C:/Program Files/PostgreSQL/18/bin')+'/psql.exe',['-h','127.0.0.1','-p',process.env.DB_PORT,'-U','area','-d',process.env.DB_NAME,'-X','-v','ON_ERROR_STOP=1','-c',"update users set username='ab' where id='"+one.user.id+"'"],{env:{...process.env,PGPASSWORD:readFileSync('.local/database-password','utf8').trim()},stdio:'pipe'});
 assert.equal((await A.post('/auth/login',{username:'ab',password:'test-player-2026'},null)).data.user.displayName,'一');
 await A.post('/auth/login',{username:'ab',password:'incorrect-password'},null,401);
 console.log('PASS auth: one/two-character display names, legacy two-character account login, wrong passwords and registration boundary');process.exit(0);
}
const users=[],entries=[],memberUsers=[];let scopeJudge=null;
for(let i=0;i<n;i++){
 const u=await A.register('adv-player-'+i);users.push(u);
 if(mode==='window'){await A.post('/events/'+e.id+'/entries',{displayName:'Closed'},u,409);console.log('PASS registration deadline enforced by server');process.exit(0);}
 if(isTeam){
   await A.post('/events/'+e.id+'/teams',{name:'队伍 '+i,code:null},u);
   const team=(await A.get('/events/'+e.id+'/teams',u)).data.find(t=>t.captainId===u.user.id);
   const member=await A.register('adv-member-'+i);memberUsers.push(member);
   await A.post('/events/'+e.id+'/teams/join',{name:'',code:team.code},member);
   await A.post('/events/'+e.id+'/teams/join',{name:'',code:team.code},member,409);
 }
 const en=(await A.post('/events/'+e.id+'/entries',{displayName:isTeam?'队伍 '+i:'选手 '+i},u)).data;entries.push(en);
 await A.post('/entries/'+en.id+'/review',{decision:'accepted',reason:'验收资格通过'},owner);
}
if(mode==='preset')await A.post('/events/'+e.id+'/reopen',{expectedVersion:e.version},owner,409);
if(isQualifier){
 const q=charts.filter(c=>c.pool_tag.split('|').includes('qualifier'));
 if(mode==='preset'){assert.equal(q.length,3);assert.deepEqual(q.map(c=>c.title).sort(),['Emancipator','Fractal Fission','Spell of chaoS']);assert.equal(charts.filter(c=>c.pool_tag.split('|').includes('stage1')).length,79);assert.equal(charts.filter(c=>c.pool_tag.split('|').includes('stage2')).length,117);}
 await A.post('/events/'+e.id+'/generate',{expectedVersion:e.version},owner,409);
 for(let i=0;i<n;i++){
 const members=isTeam?(await A.get('/events/'+e.id+'/teams',users[i])).data.find(t=>t.entryId===entries[i].id).members:[];
 await A.post('/events/'+e.id+'/attempts',{entryId:entries[i].id,matchId:null,items:isTeam?[]:q.map(c=>({slotId:c.chart_key,value:mode==='preset'?'990000':'99.0000'})),memberScores:isTeam?q.map(c=>({slotId:c.chart_key,userId:members[0].id,value:mode==='preset'?'990000':'99.0000'})):null,evidenceNote:'海选同分测试'},users[i]);
 }
 for(const a of (await A.get('/events/'+e.id+'/attempts',owner)).data)await A.post('/attempts/'+a.id+'/review',{decision:'approved',reason:'完整尝试通过'},owner);
 await A.post('/events/'+e.id+'/generate',{expectedVersion:e.version},owner,409);
 await A.post('/events/'+e.id+'/qualifier-order',{order:entries.map(en=>en.id),reason:'独立资格附加赛：按见证结果排序',expectedVersion:e.version},owner);
}
if(mode==='mystery'||mode==='assign'){const publicPool=(await A.get('/events/'+e.id+'/pool')).data;assert(!publicPool.some(c=>c.title===charts[0].title));assert(publicPool.some(c=>c.title==='未揭晓隐藏曲'));}
await A.post('/events/'+e.id+'/generate',{expectedVersion:e.version},owner);
let played=0,resetSeen=false,extraChecks=false;
async function detail(id,s=owner){return(await A.get('/matches/'+id,s)).data;}
async function draft(m){while(m.currentStep){m=(await A.post('/matches/'+m.id+'/draft-actions',{expectedVersion:m.version,chartKey:m.candidates[0]?.chart_key??null,idempotencyKey:crypto.randomUUID()},owner)).data;}return m;}
for(let guard=0;guard<1000;guard++){
 const group=(await A.get('/events/'+e.id+'/elimination-groups',owner)).data.find(g=>g.status==='playing'&&g.scheduleState==='current');
 if(group){await completeEliminationGroup(A,e.id,group,owner,id=>users[entries.findIndex(en=>en.id===id)]);continue;}

 const schedule=(await A.get('/events/'+e.id+'/schedule')).data;
 const next=schedule.find(m=>['drafting','playing','awaiting-reveal'].includes(m.status));if(!next){
   const tied=(await A.get('/events/'+e.id+'/stages')).data.find(s=>s.status==='qualification-tie');
   if(tied&&mode==='round-tie'){const current=(await A.get('/instance',owner)).data.event;await A.post('/events/'+e.id+'/stages/'+tied.id+'/qualification',{order:entries.map(en=>en.id),reason:'实际资格附加赛结果与现场见证排序',expectedVersion:current.version},owner);continue;}
   break;
 }
 let m=await detail(next.id);
 if((mode==='mystery'||mode==='assign')&&!extraChecks){const anonymous=JSON.stringify((await A.get('/matches/'+m.id)).data);assert(!anonymous.includes(charts[0].title));assert(!anonymous.includes('\"chartKey\":\"'+charts[0].chart_key+'\"'));}
 if(mode==='sealed'&&!extraChecks){
   const first=(await A.post('/matches/'+m.id+'/draft-actions',{expectedVersion:m.version,chartKey:m.candidates[0].chart_key,idempotencyKey:crypto.randomUUID()},owner)).data;
   const publicView=(await A.get('/matches/'+m.id)).data;assert.equal(publicView.actions[0].chartKey,'sealed');assert.equal(publicView.candidates.length,0);m=first;
 }
 if(mode==='assign'&&!extraChecks)await A.post('/matches/'+m.id+'/draft-actions',{expectedVersion:m.version,chartKey:charts[0].chart_key,idempotencyKey:crypto.randomUUID()},users[0],403);
 m=await draft(m);
 if(m.status==='awaiting-reveal'){
   const raw=JSON.stringify((await A.get('/matches/'+m.id)).data);
   const publicPool=(await A.get('/events/'+e.id+'/pool')).data;
   assert(!raw.includes(charts[0].chart_key));assert(!raw.includes(charts[0].title));
   assert(!publicPool.some(c=>c.chart_key===charts[0].chart_key||c.title===charts[0].title));
   const publicMatch=(await A.get('/matches/'+m.id)).data;
   assert.equal(publicMatch.slots[0].chartKey,publicPool.find(c=>c.title==='未揭晓隐藏曲').chart_key);
   const participant=users.find(u=>u.user.id===m.a.userId);
   await A.post('/matches/'+m.id+'/reveal',{expectedVersion:m.version},participant,403);
   await A.post('/events/'+e.id+'/attempts',{entryId:m.a.id,matchId:m.id,items:[{slotId:m.slots[0].id,value:'99'}],evidenceNote:'提前交分应被拒绝'},participant,409);
   await A.post('/matches/'+m.id+'/reveal',{expectedVersion:m.version-1},owner,409);
   const judge=await A.register('reveal-judge');
   await A.post('/events/'+e.id+'/judges',{username:judge.user.username,matchId:m.id,remove:false},owner);
   const scopedPool=(await A.get('/events/'+e.id+'/pool?matchId='+m.id,judge)).data;assert(scopedPool.some(c=>c.title===charts[0].title));assert(!scopedPool.some(c=>c.title===charts[1].title));
   assert(!(await A.get('/events/'+e.id+'/pool',judge)).data.some(c=>c.title===charts[0].title));
   m=(await A.post('/matches/'+m.id+'/reveal',{expectedVersion:m.version},judge)).data;
   await A.post('/matches/'+m.id+'/reveal',{expectedVersion:m.version-1},judge,409);
   assert.equal(m.status,'playing');
 }
 if(mode==='mystery'||mode==='assign'){const disclosed=(await A.get('/events/'+e.id+'/pool')).data;assert(disclosed.some(c=>c.title===charts[0].title));assert(!disclosed.some(c=>c.title===charts[1].title));}
 if(mode==='remove'||mode==='overlap')assert.equal(m.slots.length,2);
 if(mode==='double'&&m.bracket==='reset')resetSeen=true;
 if(!extraChecks&&mode==='first-to'){
   const judge=await A.register('scope-judge');scopeJudge=judge;
   const uploader=users.find(u=>u.user.id===m.a.userId);await A.post('/events/'+e.id+'/attempts',{entryId:m.a.id,matchId:m.id,items:m.slots.slice(0,1).map(s=>({slotId:s.id,value:'80'})),evidenceNote:'设备故障前的旧交分'},uploader);
   await A.post('/events/'+e.id+'/judges',{username:judge.user.username,matchId:m.id,remove:false},owner);
   await A.post('/matches/'+m.id+'/appeals',{reason:'设备故障，申请本场重赛'},users.find(u=>u.user.id===m.b.userId));
   const appeal=(await A.get('/events/'+e.id+'/appeals',judge)).data[0];assert(appeal);
   await A.post('/appeals/'+appeal.id+'/decision',{decision:'replay',reason:'核实设备故障，保留记录后重赛',expectedVersion:m.version},judge);
   m=await detail(m.id);assert.equal(m.generation,1);assert.equal(m.actions.length,0);assert((await A.get('/events/'+e.id+'/attempts',owner)).data.some(a=>a.status==='superseded'));m=await draft(m);
 }
 let aWins=mode==='double'?m.bracket!=='final':entries.findIndex(en=>en.id===m.a.id)<entries.findIndex(en=>en.id===m.b.id);
 if(mode==='round-tie'&&m.bracket==='round-robin'){const ia=entries.findIndex(en=>en.id===m.a.id),ib=entries.findIndex(en=>en.id===m.b.id);aWins=(ia+1)%3===ib;}
 const active=m.slots.filter(s=>s.extraRound===m.extraRound);const slots=['first-to','advantage'].includes(mode)?active.slice(0,m.rules.initialWinsA?1:2):active;
 for(const [en,score] of [[m.a,aWins?(mode==='preset'?'1000000':'100.0001'):(mode==='preset'?'999999':'100.0000')],[m.b,aWins?(mode==='preset'?'999999':'100.0000'):(mode==='preset'?'1000000':'100.0001')]]){
   const user=users.find(u=>u.user.id===en.userId);
   let memberScores=null;
   if(isTeam){
     const team=(await A.get('/events/'+e.id+'/teams',user)).data.find(t=>t.entryId===en.id);
     await A.post('/matches/'+m.id+'/lineups',{entryId:en.id,expectedVersion:m.version,items:slots.map(s=>({slotId:s.id,userIds:[team.members[0].id]}))},user);
     m=await detail(m.id);
     memberScores=slots.map(s=>({slotId:s.id,userId:team.members[0].id,value:score}));
   }
   let evidenceId=null;
   if(!extraChecks&&mode==='first-to'&&en.id===m.a.id){
     const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB9kAAAAASUVORK5CYII=','base64');
     const res=await fetch(A.base+(process.env.AREA_TEST_TRANSPORT==='rpc'?'/rpc/post-events-by-id-evidence?id='+encodeURIComponent(e.id):'/events/'+e.id+'/evidence'),{method:'POST',headers:{Origin:A.origin,Cookie:user.cookie,'X-Area-CSRF':user.csrf,'X-File-Name':'test.png','Content-Type':'image/png'},body:bytes});assert.equal(res.status,200);evidenceId=(await res.json()).id;
   }
   await A.post('/events/'+e.id+'/attempts',{entryId:en.id,matchId:m.id,items:isTeam?[]:slots.map(s=>({slotId:s.id,value:score})),memberScores,evidenceNote:'完整虚构验收：含私有见证',evidenceId},user);
   if(evidenceId){await A.get('/evidence/'+evidenceId,users.find(u=>u.user.id===m.b.userId),403);const res=await fetch(A.base+(process.env.AREA_TEST_TRANSPORT==='rpc'?'/rpc/evidence-read?id='+encodeURIComponent(evidenceId):'/evidence/'+evidenceId),{headers:{Cookie:owner.cookie}});assert.equal(res.status,200);assert.equal(res.headers.get('content-type'),'image/png');assert.deepEqual([...new Uint8Array(await res.arrayBuffer()).slice(0,8)],[137,80,78,71,13,10,26,10]);}
 }
 m=await detail(m.id);
 await A.post('/matches/'+m.id+'/finalize',{expectedVersion:m.version},owner,409);
 for(const a of (await A.get('/events/'+e.id+'/attempts',owner)).data.filter(a=>a.status==='pending')){
   if(isTeam){const idx=entries.findIndex(en=>en.id===a.entryId);const member=memberUsers[idx];await A.post('/events/'+e.id+'/judges',{username:member.user.username,matchId:m.id,remove:false},owner);await A.post('/attempts/'+a.id+'/review',{decision:'approved',reason:'禁止本队自审'},member,403);}
   if(scopeJudge&&extraChecks)await A.post('/attempts/'+a.id+'/review',{decision:'approved',reason:'禁止越过裁判场次范围'},scopeJudge,403);
   await A.post('/attempts/'+a.id+'/review',{decision:'approved',reason:'核对完整尝试和证据'},owner);
 }
 await A.post('/matches/'+m.id+'/finalize',{expectedVersion:m.version},owner);
 played++;extraChecks=true;
}
e=(await A.get('/instance',owner)).data.event;assert.equal(e.status,'completed',JSON.stringify(await A.get('/events/'+e.id+'/stages')));
if(qualificationOnly){const accepted=(await A.get('/events/'+e.id+'/entries')).data.filter(en=>en.seed!==null);assert.equal(accepted.length,2);assert.equal(played,0);}
if(mode==='double'){
 assert(resetSeen,'lower-bracket win must trigger a reset final');
 const schedule=(await A.get('/events/'+e.id+'/schedule')).data;
 const playedMatches=schedule.filter(m=>m.status==='finalized');
 const reset=playedMatches.find(m=>m.bracket==='reset');assert(reset?.winnerId);
 const groups=(await A.get('/events/'+e.id+'/elimination-groups',owner)).data.filter(g=>g.status==='completed'&&g.scheduleState==='current');
 const groupLosses=groups.flatMap(g=>g.placements.slice(g.advance));
 assert.equal(playedMatches.length+groupLosses.length,2*n-1,'reset double elimination needs 2N−1 loss events');
 for(const entry of entries){
   const losses=playedMatches.filter(m=>(m.a?.id===entry.id||m.b?.id===entry.id)&&m.winnerId!==entry.id).length+groupLosses.filter(id=>id===entry.id).length;
   assert.equal(losses,entry.id===reset.winnerId?1:2,'byes cannot add a loss; every eliminated entrant must have two');
 }
}
if(mode==='round-robin')assert.equal(played,n*(n-1)/2);
if(mode==='preset')assert.equal(played,7);
if(['single','first-to','sealed','team','remove','fixed','mystery','assign','overlap','cut'].includes(mode))assert.equal(played,n-1);
if(mode==='round-tie')assert.equal(played,4);
if(mode==='advantage')assert.equal(played,2*n-2);
if(mode==='multi')assert.equal(played,n*(n-1)/2+3);
console.log(`PASS ${mode}: ${n} entrants; ${played} real matches; ${resetSeen?'reset final; ':''}${qualificationOnly?'qualifications':'champion'} confirmed`);

