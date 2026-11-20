import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync,utimesSync,existsSync,statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import http from 'node:http';
import {client} from './test-client.mjs';

const mode=process.argv[2];
assert(['ranking','solo','team','load','secure','maintenance'].includes(mode));
assert.match(process.env.DB_NAME??'',/^area_verify_[0-9]{14}_[a-f0-9]{5}_repair_(ranking|solo|team|load|secure)$/);
const evidenceDirectory='.local/evidence/'+createHash('sha256').update(process.env.DB_NAME).digest('hex').slice(0,24);
const pg=(process.env.PG_BIN??'C:/Program Files/PostgreSQL/18/bin')+'/psql.exe';
function sql(statement,runtime=false){
 return execFileSync(pg,['-h','127.0.0.1','-p',process.env.DB_PORT,'-U',runtime?'area_app':'area','-d',process.env.DB_NAME,'-X','-A','-t','-v','ON_ERROR_STOP=1','-c',statement],{encoding:'utf8',env:{...process.env,PGPASSWORD:readFileSync(runtime?'.local/runtime-password':'.local/database-password','utf8').trim()},stdio:['ignore','pipe','pipe']}).trim();
}
if(mode==='maintenance'){
 const fixture=JSON.parse(readFileSync('.local/repair-maintenance-'+process.env.DB_NAME+'.json','utf8'));
 assert.equal(sql('select count(*) from evidence_files'),'0');
 fixture.files.forEach(id=>assert(!existsSync(evidenceDirectory+'/'+id)));
 console.log('PASS S06 startup expiry removes stale unlinked metadata and old orphan files inside this database namespace');
 process.exit(0);
}
if(mode==='secure'){
 const origin='https://rhythm-test.example.test';
 const setup=await fetch('http://127.0.0.1:8083/api/instance/setup',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({username:'secure-owner',password:'test-owner-2026',displayName:'HTTPS配置回归',setupToken:readFileSync('.local/setup-token','utf8').trim()})});
 assert.equal(setup.status,200);assert.match(setup.headers.get('set-cookie'),/^__Host-area_session_/);assert.match(setup.headers.get('set-cookie'),/; Secure/);assert.match(setup.headers.get('set-cookie'),/; HttpOnly/);assert(!setup.headers.get('set-cookie').includes('Domain='));
 for(const username of ['secure-owner','unknown-account']){
  for(let i=0;i<9;i++){const response=await fetch('http://127.0.0.1:8083/api/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({username,password:'incorrect-password'})});assert.equal(response.status,i<8?401:429);}
 }
 console.log('PASS S08 configured HTTPS cookies use Secure, HttpOnly and __Host; equal limits protect existing and nonexistent accounts');
 process.exit(0);
}
const A=client(),owner=await A.setup(),template=(await A.get('/templates',owner)).data.find(t=>t.id==='custom');
const rules=structuredClone(template.rules),charts=template.charts,isTeam=mode==='team';
rules.capacity=mode==='ranking'?3:2;rules.timing=null;
rules.entryMode=isTeam?'team':'solo';rules.team={...rules.team,min:2,max:2,perChart:1,maxAppearances:2,aggregation:'sum'};
rules.stages=[...(mode==='ranking'?[{id:'qualifier',name:'海选',kind:'ranking',advance:2}]:[]),{id:'main',name:'正赛',kind:'single',advance:1}];
rules.draft=[];rules.playOrder=charts.filter(c=>c.pool_tag.split('|').includes('main')).slice(0,2).map((c,i)=>({id:'fixed-'+i,source:'fixed:'+c.chart_key}));
assert.equal(rules.playOrder.length,2);rules.matchMode='total';rules.resolution={...rules.resolution,tie:'extra',extraCount:1,maxExtraRounds:2,scope:'extra-only'};
let event=(await A.post('/instance/event',{...template,name:'修复回归 '+mode,rules,charts},owner)).data;
event=(await A.post(`/events/${event.id}/publish`,{expectedVersion:event.version},owner)).data;
const players=[],entries=[],teams=[];
for(let i=0;i<rules.capacity;i++){
 const player=await A.register('repair-player-'+i);players.push(player);
 if(isTeam){
  await A.post(`/events/${event.id}/teams`,{name:'修复队伍'+i,code:null},player);
  const team=(await A.get(`/events/${event.id}/teams`,player)).data.find(t=>t.captainId===player.user.id);
  const member=await A.register('repair-member-'+i);
  await A.post(`/events/${event.id}/teams/join`,{name:'',code:team.code},member);
  teams.push({captain:player,member,id:team.id});
 }
 const entry=(await A.post(`/events/${event.id}/entries`,{displayName:'修复选手'+i},player)).data;entries.push(entry);
 await A.post(`/entries/${entry.id}/review`,{decision:'accepted',reason:'隔离回归资格确认'},owner);
}
const outsider=await A.register('repair-outsider');
assert.equal(sql("select not(rolsuper or rolcreatedb or rolcreaterole or rolreplication or rolbypassrls) from pg_roles where rolname=current_user",true),'t');
assert.throws(()=>sql('CREATE TABLE public.runtime_privilege_probe(id integer)',true));
assert.throws(()=>sql('CREATE DATABASE runtime_privilege_probe',true));
console.log('PASS S09 runtime role is non-administrative and cannot create tables or databases');
await A.get(`/events/${event.id}/judge-candidates?search=repair`,outsider,403);
assert((await A.get(`/events/${event.id}/judge-candidates?search=repair-player`,owner)).data.length>=2);

async function review(){
 const pending=(await A.get(`/events/${event.id}/attempts`,owner)).data.filter(a=>a.status==='pending');
 for(const a of pending){assert(Number.isSafeInteger(a.submittedAt)&&a.submittedAt>0);await A.post(`/attempts/${a.id}/review`,{decision:'approved',reason:'核对回归反例与见证'},owner);}
}
if(mode==='ranking'){
 const songs=charts.filter(c=>c.pool_tag.split('|').includes('qualifier'));
 for(let i=0;i<players.length;i++)await A.post(`/events/${event.id}/attempts`,{entryId:entries[i].id,matchId:null,items:songs.map(c=>({slotId:c.chart_key,value:['99','99.0','99.00'][i]})),evidenceNote:'数值等值，必须同分裁决'},players[i]);
 await review();
 const board=(await A.get(`/events/${event.id}/ranking-board`,owner)).data;
 assert(board.rankings.every(r=>r.rank===1));
 const rejected=await A.post(`/events/${event.id}/generate`,{expectedVersion:event.version},owner,409);
 assert.equal(rejected.data.code,'QUALIFICATION_TIE');
 await A.post(`/events/${event.id}/qualifier-order`,{order:entries.map(e=>e.id),reason:'独立附加赛的真实回归排序',expectedVersion:event.version},owner);
 await A.post(`/events/${event.id}/generate`,{expectedVersion:event.version},owner);
 console.log('PASS S01 99 / 99.0 / 99.00 tie across the advancement cutoff requires an explicit resolution');
 process.exit(0);
}
await A.post(`/events/${event.id}/generate`,{expectedVersion:event.version},owner);
let match=(await A.get(`/events/${event.id}/schedule`,owner)).data.find(m=>m.status==='playing');assert(match);
const detail=async()=>match=(await A.get(`/matches/${match.id}`,owner)).data;
await detail();
const playerFor=en=>players.find(p=>p.user.id===en.userId);
async function submitRound(tied){
 for(const [index,entry] of [match.a,match.b].entries()){
  const player=playerFor(entry),slots=match.slots.filter(s=>s.extraRound===match.extraRound),score=tied?'50':index===0?'60':'59';
  let memberScores=null;
  if(isTeam){
   const team=teams.find(t=>t.captain.user.id===player.user.id);
   const items=slots.map((s,i)=>({slotId:s.id,userIds:[i%2?team.member.user.id:player.user.id]}));
   await A.post(`/matches/${match.id}/lineups`,{entryId:entry.id,expectedVersion:match.version,items},player);await detail();
   memberScores=items.map(i=>({slotId:i.slotId,userId:i.userIds[0],value:score}));
  }
  await A.post(`/events/${event.id}/attempts`,{entryId:entry.id,matchId:match.id,items:isTeam?[]:slots.map(s=>({slotId:s.id,value:score})),memberScores,evidenceNote:'独立测试库中的完整见证'},player);
 }
 await review();await detail();
}
if(mode==='load'){
 const slow=[];
 try{
  const queryLogStart=statSync('.local/postgres.log').size,waitLogStart=statSync('.local/test-repair_load.out.log').size;
  for(let i=0;i<3;i++){const request=http.request(A.base+'/auth/login',{method:'POST',headers:{Origin:A.origin,'Content-Type':'application/json'}});request.on('error',()=>{});request.write('{"username":"slow-');slow.push(request);}
  await new Promise(resolve=>setTimeout(resolve,200));
  const times=[];
  const timed=async fn=>{const start=performance.now();await fn();times.push(performance.now()-start);};
  const viewers=Promise.all(Array.from({length:8},async()=>{for(let i=0;i<12;i++)await timed(()=>fetch(i%2?`${A.base}/matches/${match.id}/clock`:`${A.base}/matches/${match.id}`,{signal:AbortSignal.timeout(3000)}).then(async r=>{assert.equal(r.status,200);await r.arrayBuffer();}));}));
  const judging=(async()=>{for(let i=0;i<6;i++)await timed(()=>submitRound(false));})();
  await Promise.all([viewers,judging]);
  const sorted=times.toSorted((a,b)=>a-b),p95=sorted[Math.ceil(sorted.length*.95)-1];assert(p95<3000);
  const queries=readFileSync('.local/postgres.log').subarray(queryLogStart).toString('utf8'),waits=[...readFileSync('.local/test-repair_load.out.log').subarray(waitLogStart).toString('utf8').matchAll(/DB_WAIT_MS:([0-9.]+)/g)].map(m=>Number(m[1])).toSorted((a,b)=>a-b);
  const report={S07:'mixed-load-passed',slowIncompleteBodies:3,viewerWorkers:8,viewRequests:96,judgeRounds:6,p50Ms:Math.round(sorted[Math.floor(sorted.length/2)]),p95Ms:Math.round(p95),maxMs:Math.round(sorted.at(-1)),sqlSelects:(queries.match(/duration:.*(?:statement:|execute [^:]+:)\s*select/gi)??[]).length,matchClockScoreQueries:(queries.match(/duration:.*select distinct a.entry_id,i.slot_id from attempts/gi)??[]).length,connectionWaitSamples:waits.length,connectionWaitP95Ms:waits[Math.ceil(waits.length*.95)-1]??null,connectionWaitMaxMs:waits.at(-1)??null,scope:'local isolated database; not a production capacity claim'};
  assert(report.sqlSelects>0);assert(report.connectionWaitSamples>0);assert(report.matchClockScoreQueries>0);
  writeFileSync('.local/repair-load-result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{slow.forEach(r=>r.destroy());}
 process.exit(0);
}
if(!isTeam){
 const before=(await A.get(`/events/${event.id}/attempts`,owner)).data.length;
 const rejected=await A.post(`/events/${event.id}/attempts`,{entryId:match.a.id,matchId:match.id,items:match.slots.map(s=>({slotId:s.id,value:'50'})),memberScores:[{slotId:match.slots[0].id,userId:outsider.user.id,value:'90'}],evidenceNote:'恶意注入无关账号'},playerFor(match.a),400);
 assert.equal(rejected.data.code,'UNEXPECTED_MEMBER_SCORES');assert.equal((await A.get(`/events/${event.id}/attempts`,owner)).data.length,before);
 console.log('PASS S12 solo submissions reject unrelated member scores without persistence');
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB9kAAAAASUVORK5CYII=','base64');
 async function upload(player,expected){const res=await fetch(`${A.base}/events/${event.id}/evidence`,{method:'POST',headers:{Origin:A.origin,Cookie:player.cookie,'X-Area-CSRF':player.csrf,'X-File-Name':'regression.png','Content-Type':'image/png'},body:png});assert.equal(res.status,expected);return res.json();}
 await upload(outsider,403);
 for(let i=0;i<5;i++)await upload(players[0],200);
 await upload(players[0],429);
 sql("update evidence_files set size=52428800,created_at=now()-interval '2 hours'");await upload(players[0],429);
 sql("update evidence_files set size=68");
 const files=readdirSync(evidenceDirectory).length;
 sql("CREATE FUNCTION reject_evidence() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected evidence registration failure'; END $$; CREATE TRIGGER reject_evidence BEFORE INSERT ON evidence_files FOR EACH ROW EXECUTE FUNCTION reject_evidence();");
 await upload(players[1],500);assert.equal(readdirSync(evidenceDirectory).length,files);sql('DROP TRIGGER reject_evidence ON evidence_files; DROP FUNCTION reject_evidence();');
 console.log('PASS S06 unregistered uploads, rate/cumulative quota and registration-failure file compensation');
}
const participant=isTeam?teams[0].member:players[0];
await A.post(`/events/${event.id}/judges`,{username:participant.user.username,matchId:match.id,remove:false},owner);
const unchanged=JSON.stringify(await detail());
const correction=await A.post(`/matches/${match.id}/replay`,{expectedVersion:match.version,reason:'参赛裁判试图改判',winnerId:match.a.id},participant,403);
assert.equal(correction.data.code,'SELF_DECISION');assert.equal(JSON.stringify(await detail()),unchanged);
console.log('PASS S02 participant referee cannot correct the winner and failed corrections roll back');
await submitRound(isTeam);
if(isTeam)await A.post(`/matches/${match.id}/finalize`,{expectedVersion:match.version},owner);
else await A.post(`/matches/${match.id}/replay`,{expectedVersion:match.version,reason:'独立获授权裁判依据录像纠正赛果',winnerId:match.a.id},owner);
await detail();
if(isTeam){
 assert.equal(match.extraRound,1);
 const original=(await A.get(`/matches/${match.id}/lineups`,owner)).data;
 await submitRound(false);
 const after=(await A.get(`/matches/${match.id}/lineups`,owner)).data;
 assert(original.every(row=>after.some(next=>JSON.stringify(next)===JSON.stringify(row))));
 await A.post(`/matches/${match.id}/finalize`,{expectedVersion:match.version},owner);
 console.log('PASS S03 tied team match permits new extra-round lineups, retains old lineups, accepts and finalizes extra scores');
}
event=(await A.get('/instance',owner)).data.event;assert.equal(event.status,'completed');
await A.post(`/events/${event.id}/archive`,{expectedVersion:event.version},owner);
event=(await A.get('/instance',owner)).data.event;assert.equal(event.status,'archived');
const schedule=JSON.stringify((await A.get(`/events/${event.id}/schedule`)).data);
const denied=await A.req(`/events/${event.id}`,{session:owner,method:'PUT',body:{...template,name:'不能覆盖归档',rules:{...rules,capacity:8},expectedVersion:event.version},expected:409});
assert.equal(denied.data.code,'ARCHIVED_READ_ONLY');assert.equal(JSON.stringify((await A.get(`/events/${event.id}/schedule`)).data),schedule);
console.log('PASS S14 archived configuration cannot change final schedule or results');
if(mode==='solo'){
 const files=sql('select id from evidence_files').split('\n').filter(Boolean);
 sql("update evidence_files set created_at=now()-interval '2 days'");
 const orphan=crypto.randomUUID();writeFileSync(evidenceDirectory+'/'+orphan,'orphan fixture');utimesSync(evidenceDirectory+'/'+orphan,new Date(Date.now()-172800000),new Date(Date.now()-172800000));
 writeFileSync('.local/repair-maintenance-'+process.env.DB_NAME+'.json',JSON.stringify({files:[...files,orphan]}));
}
