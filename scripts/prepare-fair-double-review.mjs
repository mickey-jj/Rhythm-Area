import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),config=JSON.parse(fs.readFileSync(path.join(root,'instance.config.json'),'utf8').replace(/^\uFEFF/,''));
assert.equal(config.databaseName,'rhythm_area_midterm');
const origin=`http://127.0.0.1:${config.webPort+2}`,base=`http://127.0.0.1:${config.apiPort+2}/api`;
async function request(resource,body,session,method=body===undefined?'GET':'POST'){
 const response=await fetch(base+resource,{method,headers:{Origin:origin,'Content-Type':'application/json',...(session?{Cookie:session.cookie,'X-Area-CSRF':session.csrf}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await response.json();assert(response.ok,`${resource}: ${data.message}`);return {data,cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
const login=async(username,password)=>{const r=await request('/auth/login',{username,password});return {...r.data,cookie:r.cookie};};
const owner=await login('review-host','Match-review-2026!');
let event=(await request('/instance',undefined,owner)).data.event;
assert.equal(event.name,'律竞 · 八强对决');
let groups=(await request(`/events/${event.id}/elimination-groups`,undefined,owner)).data.filter(g=>g.scheduleState==='current');
if(!groups.length){
 assert.equal(event.status,'running');assert.equal(event.rules.stages.length,1);
 const charts=(await request(`/events/${event.id}/pool`,undefined,owner)).data;
 const rules={...event.rules,stages:event.rules.stages.map(s=>({...s,kind:'double'})),resolution:{...event.rules.resolution,finalPolicy:'reset',maxExtraRounds:event.rules.resolution.maxExtraRounds+1}};
 event=(await request(`/events/${event.id}`,{name:event.name,tagline:event.tagline,description:event.description,rules,charts,expectedVersion:event.version},owner,'PUT')).data;
 groups=(await request(`/events/${event.id}/elimination-groups`,undefined,owner)).data.filter(g=>g.scheduleState==='current');
}
assert.equal(groups.length,1);assert.equal(groups[0].expectedParticipants,3);assert.equal(groups[0].advance,2);
const players=[];
for(let i=1;i<=8;i++)players.push(await login(`review-player-${i}`,'Match-player-2026!'));
const sessionFor=id=>players.find(p=>p.user.id===id);
const detail=async id=>(await request(`/matches/${id}`,undefined,owner)).data;
const schedule=(await request(`/events/${event.id}/schedule`,undefined,owner)).data;
for(const row of schedule.filter(m=>m.scheduleState==='current'&&m.bracket==='winners'&&m.round===1&&m.a&&m.b&&['drafting','playing','awaiting-reveal'].includes(m.status))){
 let m=await detail(row.id);
 while(m.currentStep)m=(await request(`/matches/${m.id}/draft-actions`,{expectedVersion:m.version,chartKey:m.candidates[0]?.chart_key??null,idempotencyKey:crypto.randomUUID()},owner)).data;
 if(m.status==='awaiting-reveal'){await request(`/matches/${m.id}/reveal`,{expectedVersion:m.version},owner);m=await detail(m.id);}
 const existing=(await request(`/events/${event.id}/attempts`,undefined,owner)).data.filter(a=>a.matchId===m.id&&a.status!=='superseded');
 for(const [i,en] of [m.a,m.b].entries())if(!existing.some(a=>a.entryId===en.id))await request(`/events/${event.id}/attempts`,{entryId:en.id,matchId:m.id,items:m.slots.filter(s=>s.extraRound===m.extraRound).map((s,j)=>({slotId:s.id,value:String((i?985000:1000000)+j*100)})),evidenceNote:'本地七方双败样例 · 虚构成绩'},sessionFor(en.userId));
 for(const attempt of (await request(`/events/${event.id}/attempts`,undefined,owner)).data.filter(a=>a.matchId===m.id&&a.status==='pending'))await request(`/attempts/${attempt.id}/review`,{decision:'approved',reason:'虚构样例成绩核对'},owner);
 await request(`/matches/${m.id}/finalize`,{expectedVersion:m.version},owner);
}
const room=(await request(`/elimination-groups/${groups[0].id}`,undefined,owner)).data,group=room.group;
const attempts=(await request(`/events/${event.id}/attempts`,undefined,owner)).data.filter(a=>a.groupId===group.id);
if(group.status==='playing'&&!attempts.length){
 for(const [i,en] of room.entries.entries())await request(`/events/${event.id}/attempts`,{entryId:en.id,matchId:null,groupId:group.id,items:group.charts.map((c,j)=>({slotId:c.chart_key,value:String([1000123,995432,991234][i]+j*100)})),evidenceNote:'共同演奏曲目成绩 · 本地虚构样例'},sessionFor(en.userId));
 for(const a of (await request(`/events/${event.id}/attempts`,undefined,owner)).data.filter(a=>a.groupId===group.id&&a.entryId!==room.entries[2].id))await request(`/attempts/${a.id}/review`,{decision:'approved',reason:'已核对同曲完整成绩'},owner);
}
const info={fictional:true,eventId:event.id,groupId:group.id,origin,urls:{schedule:origin+'/schedule',group:`${origin}/elimination-groups/${group.id}`,originalCompleted:JSON.parse(fs.readFileSync(path.join(root,'.local/match-review.json'),'utf8').replace(/^\uFEFF/,'')).urls.completed},owner:{username:'review-host',password:'Match-review-2026!'}};
fs.writeFileSync(path.join(root,'.local/fair-double-review.json'),JSON.stringify(info,null,2)+'\n');
console.log(JSON.stringify({urls:info.urls,originalResultsPreserved:true,group:'3进2'},null,2));
