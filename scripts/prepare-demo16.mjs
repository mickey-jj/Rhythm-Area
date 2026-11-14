import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';

// Explicitly invoked local demonstration reset. A validated database backup precedes any deletion.
const root=path.resolve(import.meta.dirname,'..');
const config=JSON.parse(fs.readFileSync(path.join(root,'instance.config.json'),'utf8'));
assert.equal(config.databaseName,'rhythm_area_single');
const dir=path.join(root,'.local','demo16',new Date().toISOString().replaceAll(/[:.]/g,'-'));
fs.mkdirSync(dir,{recursive:true});
const env={...process.env,PGCLIENTENCODING:'UTF8',PGPASSWORD:fs.readFileSync(path.join(root,'.local/database-password'),'utf8').trim()};
const pg=process.env.PG_BIN??'C:/Program Files/PostgreSQL/18/bin';
const args=['-h','127.0.0.1','-p',String(config.databasePort),'-U','area','-d',config.databaseName];
const sql=query=>execFileSync(path.join(pg,'psql.exe'),[...args,'-X','-v','ON_ERROR_STOP=1','-t','-A','-f','-'],{env,encoding:'utf8',input:Buffer.from(query,'utf8')}).trim();
const before=JSON.parse(sql("select jsonb_build_object('owner',(select owner_id from instance_settings),'event',(select event_id from instance_settings),'status',(select status from events),'users',(select jsonb_agg(username order by username) from users),'matches',(select count(*) from matches),'teams',(select count(*) from teams))"));
assert.equal(before.status,'draft');assert.equal(before.matches,0);assert.equal(before.teams,0);
assert.deepEqual(before.users,['admin','player-a','player-b','player-c','player-d']);
const backup=path.join(dir,'before-reset.dump');
execFileSync(path.join(pg,'pg_dump.exe'),[...args,'-Fc','-f',backup],{env,stdio:'pipe'});
execFileSync(path.join(pg,'pg_restore.exe'),['-l',backup],{env,stdio:'pipe'});
assert(fs.statSync(backup).size>10000);
fs.writeFileSync(path.join(dir,'before.json'),JSON.stringify(before,null,2));
sql(`BEGIN;
 CREATE TEMP TABLE old_demo_users AS SELECT id FROM users WHERE username IN ('player-a','player-b','player-c','player-d');
 CREATE TEMP TABLE old_demo_attempts AS SELECT id FROM attempts WHERE submitted_by IN (SELECT id FROM old_demo_users);
 DELETE FROM reviews WHERE attempt_id IN (SELECT id FROM old_demo_attempts) OR reviewer_id IN (SELECT id FROM old_demo_users);
 DELETE FROM attempt_items WHERE attempt_id IN (SELECT id FROM old_demo_attempts);
 DELETE FROM attempt_member_scores WHERE attempt_id IN (SELECT id FROM old_demo_attempts);
 DELETE FROM attempts WHERE id IN (SELECT id FROM old_demo_attempts);
 DELETE FROM qualifier_snapshots WHERE event_id='${before.event}';
 DELETE FROM qualification_orders WHERE event_id='${before.event}';
 DELETE FROM competition_stages WHERE event_id='${before.event}';
 DELETE FROM entries WHERE user_id IN (SELECT id FROM old_demo_users);
 DELETE FROM evidence_files WHERE user_id IN (SELECT id FROM old_demo_users);
 DELETE FROM event_judges WHERE user_id IN (SELECT id FROM old_demo_users);
 DELETE FROM judge_grants WHERE user_id IN (SELECT id FROM old_demo_users);
 UPDATE audit_logs SET detail=detail||' [原演示选手已按要求重建]',user_id=NULL WHERE user_id IN (SELECT id FROM old_demo_users);
 DELETE FROM sessions WHERE user_id IN (SELECT id FROM old_demo_users);
 DELETE FROM users WHERE id IN (SELECT id FROM old_demo_users);
 COMMIT;`);
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const token=crypto.randomUUID(),csrf=crypto.randomUUID();
sql(`INSERT INTO sessions(token_hash,user_id,csrf,expires_at) VALUES ('${hash(token)}','${before.owner}','${csrf}',now()+interval '20 minutes')`);
const cookieName='area_session_'+hash(`jdbc:postgresql://127.0.0.1:${config.databasePort}/${config.databaseName}`).slice(0,12);
const owner={cookie:cookieName+'='+token,csrf};
const base=`http://127.0.0.1:${config.apiPort}/api`,origin=`http://127.0.0.1:${config.webPort}`;
const contracts=JSON.parse(fs.readFileSync(path.join(root,'docs/api-contracts.json'),'utf8'));
function url(resource,method){const match=contracts.filter(c=>c.method===method).map(c=>{const keys=[];const re=new RegExp('^'+c.path.split('/').map(s=>s.startsWith(':')?(keys.push(s.slice(1)),'([^/]+)'):s).join('/')+'$');return {c,keys,values:resource.match(re)}}).find(m=>m.values);assert(match,'Missing canonical contract');const params=new URLSearchParams(match.keys.map((k,i)=>[k,match.values[i+1]]));return base+'/rpc/'+match.c.message.replace(/Message$/,'').replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase()+(params.size?'?'+params:'');}
async function request(resource,method='GET',body,session=owner){const r=await fetch(url(resource,method),{method,headers:{Origin:origin,'Content-Type':'application/json',...(session?{Cookie:session.cookie,'X-Area-CSRF':session.csrf}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok)throw new Error(`${method} ${resource}: ${r.status} ${data.code} ${data.message}`);return {data,cookie:r.headers.get('set-cookie')?.split(';')[0]};}
const get=async p=>(await request(p)).data,post=async(p,b,s=owner)=>(await request(p,'POST',b,s)).data;
const players=[],names=Array.from({length:16},(_,i)=>'选手'+(i+1));
const password='Demo16-2026!';
try{
 let e=(await get('/instance')).event;
 assert.equal(e.rules.capacity,16);assert.equal(e.rules.entryMode,'solo');
 e=await post('/events/'+e.id+'/publish',{expectedVersion:e.version});
 for(const [i,name] of names.entries()){
  const username='demo16-'+String(i+1).padStart(2,'0');
  const result=await request('/auth/register','POST',{username,password,displayName:name},null);
  const session={...result.data,cookie:result.cookie};
  const entry=await post('/events/'+e.id+'/entries',{displayName:name},session);
  await post('/entries/'+entry.id+'/review',{decision:'accepted',reason:'虚构选手，供作业演示使用'});
  players.push({username,name,session,entry});
 }
 console.log('Recreated 16 fictional players; owner and rules preserved.');
 const charts=await get('/events/'+e.id+'/pool');const q=charts.filter(c=>c.pool_tag.split('|').includes('qualifier'));assert.equal(q.length,3);
 for(const [i,p] of players.entries())await post('/events/'+e.id+'/attempts',{entryId:p.entry.id,matchId:null,items:q.map((c,j)=>({slotId:c.chart_key,value:String(1000000-i*2000-j*17)})),evidenceNote:'虚构演示成绩，不代表实际游玩'},p.session);
 for(const a of await get('/events/'+e.id+'/attempts'))if(a.status==='pending')await post('/attempts/'+a.id+'/review',{decision:'approved',reason:'虚构演示：完整三首成绩审核'});
 fs.writeFileSync(path.join(dir,'qualifier.json'),JSON.stringify(await get('/events/'+e.id+'/rankings'),null,2));
 await post('/events/'+e.id+'/generate',{expectedVersion:e.version});
 console.log('Qualifier complete: 16 -> 8.');
 let finalMatch;
 for(let guard=0;guard<12;guard++){
  const schedule=await get('/events/'+e.id+'/schedule');
  const next=schedule.find(m=>['drafting','playing'].includes(m.status));assert(next,'Expected active match');
  let m=await get('/matches/'+next.id);
  while(m.currentStep)m=await post('/matches/'+m.id+'/draft-actions',{expectedVersion:m.version,chartKey:m.candidates[0]?.chart_key??null,idempotencyKey:crypto.randomUUID()});
  for(const [entry,score] of [[m.a,'1000000'],[m.b,'990000']]){
   const p=players.find(p=>p.entry.id===entry.id);
   await post('/events/'+e.id+'/attempts',{entryId:entry.id,matchId:m.id,items:m.slots.map(s=>({slotId:s.id,value:score})),evidenceNote:'虚构演示成绩；BP 为主办有审计记录的代操作'},p.session);
  }
  for(const a of await get('/events/'+e.id+'/attempts'))if(a.status==='pending')await post('/attempts/'+a.id+'/review',{decision:'approved',reason:'虚构演示：双方完整成绩确认'});
  // Preserve the final confirmation as the student's on-camera action.
  if(m.stageId==='stage2'&&m.round===2){finalMatch=await get('/matches/'+m.id);break;}
  await post('/matches/'+m.id+'/finalize',{expectedVersion:m.version});
  console.log('Finalized '+m.stageName+' / round '+m.round+' / '+m.a.displayName+' vs '+m.b.displayName);
 }
 assert(finalMatch,'Final was not reached');
 const schedule=await get('/events/'+e.id+'/schedule'),stages=await get('/events/'+e.id+'/stages');
 assert.equal((await get('/events/'+e.id+'/entries')).length,16);
 assert.equal(schedule.filter(m=>m.status==='finalized').length,6);
 const summary={eventId:e.id,players:16,flow:'16 -> 8 -> 4 -> 2 -> champion confirmation pending',stages,finalMatchId:finalMatch.id,finalUrl:origin+'/matches/'+finalMatch.id,finalists:[finalMatch.a.displayName,finalMatch.b.displayName],completedMatches:6,finalStatus:finalMatch.status,backup:path.relative(root,backup)};
 fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(summary,null,2));fs.writeFileSync(path.join(root,'.local/demo16/latest.json'),JSON.stringify(summary,null,2));
 fs.writeFileSync(path.join(dir,'demo-accounts.md'),'# 虚构演示账号\n\n仅供本地作业演示，共用密码：`'+password+'`。主办账号和密码未改动。\n\n'+players.map(p=>'- '+p.username+'：'+p.name).join('\n')+'\n');
 console.log(JSON.stringify({players:16,completedMatches:6,finalUrl:summary.finalUrl,finalists:summary.finalists,backup:summary.backup},null,2));
} finally {sql(`DELETE FROM sessions WHERE token_hash='${hash(token)}'`);}
