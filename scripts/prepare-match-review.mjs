import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8').replace(/^\uFEFF/,''));
const config=read('instance.config.json');assert.equal(config.databaseName,'rhythm_area_midterm');
const apiPort=config.apiPort+2,webPort=config.webPort+2;
const base=`http://127.0.0.1:${apiPort}/api`,origin=`http://127.0.0.1:${webPort}`;
async function request(resource,body,session){
  const response=await fetch(base+resource,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json',...(session?{Cookie:session.cookie,'X-Area-CSRF':session.csrf}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=await response.json();assert(response.ok,`${resource}: ${data.message}`);
  return {data,cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
const state=(await request('/instance')).data;
if(state.hasEvent){assert.equal(state.event?.name,'律竞 · 八强对决');console.log(`比赛样例已存在，保持进度：${origin}/schedule`);process.exit(0);}
assert(state.needsSetup,'Review instance already has an unrelated organizer');
const setup=await request('/instance/setup',{username:'review-host',password:'Match-review-2026!',displayName:'测试裁判'});
const owner={...setup.data,cookie:setup.cookie};
const starter=read('examples/custom/template.json');
const prp=read('examples/midterm-review/template.json');
const sample=prp.charts.filter(c=>c.difficulty_label==='MASSIVE').slice(0,24).map((c,i)=>({...c,pool_tag:i<18?'main':'extra',role:i<18?'ban|pick|random|assign':'extra',display_order:i+1}));
assert.equal(sample.length,24);assert(sample.every(c=>c.cover_url));
const rules={...starter.rules,gameKey:'paradigm-reboot',gameName:'范式：起源',clientVersion:'比赛样例',capacity:8,metric:prp.rules.metric,stages:[{id:'main',name:'八强对决',kind:'single',advance:1}],draftMode:'open',windows:{registrationOpen:null,registrationClose:null,qualifierClose:null}};
let event=(await request('/instance/event',{...starter,name:'律竞 · 八强对决',tagline:'THE NEXT NOTE IS YOURS.',description:'比赛页面测试样例 · 虚构赛事',rules,charts:sample,appearance:{brandName:'律竞',accentColor:'#91d8bd',contact:'比赛页面测试样例 · 虚构数据'}},owner)).data;
assert((await request(`/events/${event.id}/validate`,{},owner)).data.valid);
event=(await request(`/events/${event.id}/publish`,{expectedVersion:event.version},owner)).data;
const names=['青岚','白羽','晚星','序章','迟川','月汐','空镜','昼雨'];const players=[];
for(const [i,displayName] of names.entries()){
 const username=`review-player-${i+1}`;
 const registered=await request('/auth/register',{username,password:'Match-player-2026!',displayName});
 const session={...registered.data,cookie:registered.cookie};
 const entry=(await request(`/events/${event.id}/entries`,{displayName},session)).data;
 await request(`/entries/${entry.id}/review`,{decision:'accepted',reason:'测试资格通过'},owner);
 players.push({username,session,entry});
}
await request(`/events/${event.id}/generate`,{expectedVersion:event.version},owner);
const schedule=(await request(`/events/${event.id}/schedule`)).data;
const playable=schedule.filter(m=>m.status==='drafting');assert.equal(playable.length,4);
async function draft(id){let m=(await request(`/matches/${id}`,undefined,owner)).data;while(m.currentStep)m=(await request(`/matches/${id}/draft-actions`,{expectedVersion:m.version,chartKey:m.candidates[0]?.chart_key ?? null,idempotencyKey:crypto.randomUUID()},owner)).data;return m;}
async function submit(m,entry,value){const player=players.find(p=>p.entry.id===entry.id);await request(`/events/${event.id}/attempts`,{entryId:entry.id,matchId:m.id,items:m.slots.map((slot,i)=>({slotId:slot.id,value:String(value+i*100)})),evidenceNote:'本地比赛页面测试'},player.session);}
const completed=await draft(playable[0].id);
await submit(completed,completed.a,1002345);await submit(completed,completed.b,993210);
const playing=await draft(playable[1].id);await submit(playing,playing.a,998765);
for(const attempt of (await request(`/events/${event.id}/attempts`,undefined,owner)).data)await request(`/attempts/${attempt.id}/review`,{decision:'approved',reason:'测试成绩核对通过'},owner);
await request(`/matches/${completed.id}/finalize`,{expectedVersion:completed.version},owner);
const finalMatch=(await request(`/matches/${completed.id}`)).data;assert.equal(finalMatch.status,'finalized');
const info={origin,eventName:event.name,fictional:true,eventId:event.id,urls:{schedule:origin+'/schedule',completed:`${origin}/matches/${completed.id}`,playing:`${origin}/matches/${playing.id}`,drafting:`${origin}/matches/${playable[2].id}`},owner:{username:'review-host',password:'Match-review-2026!'},playingSideB:{username:players.find(p=>p.entry.id===playing.b.id).username,password:'Match-player-2026!'},mainDraftPreserved:true};
fs.writeFileSync(path.join(root,'.local/match-review.json'),JSON.stringify(info,null,2)+'\n');
console.log(JSON.stringify({event:event.name,urls:info.urls,players:players.length,stages:['finalized','playing','drafting'],mainDraftPreserved:true},null,2));
