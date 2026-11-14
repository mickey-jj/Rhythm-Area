import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8').replace(/^\uFEFF/,''));
const config=read('instance.config.json'),mode=process.argv[2]??'solo',team=mode==='team';
assert(['solo','team'].includes(mode));assert.equal(config.databaseName,'rhythm_area_midterm');
const offset=team?14:12,origin=`http://127.0.0.1:${config.webPort+offset}`,base=`http://127.0.0.1:${config.apiPort+offset}/api`;
const savedPath=path.join(root,`.local/playable-${mode}.json`);
const checkpoint=path.join(root,`.local/playable-${mode}-initializing.json`);
async function request(resource,body,session,method=body===undefined?'GET':'POST'){
 const response=await fetch(base+resource,{method,headers:{Origin:origin,'Content-Type':'application/json',...(session?{Cookie:session.cookie,'X-Area-CSRF':session.csrf}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await response.json();assert(response.ok,`${resource}: ${data.message}`);return {data,cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
const state=(await request('/instance')).data;
if(state.hasEvent&&fs.existsSync(savedPath)){
 assert.equal(state.event.id,read(`.local/playable-${mode}.json`).eventId);
 console.log(`保留${team?'团队':'个人'}赛实例进度：${origin}/schedule`);process.exit(0);
}
assert(state.needsSetup||fs.existsSync(checkpoint)&&JSON.parse(fs.readFileSync(checkpoint,'utf8')).eventId===state.event?.id,'该实例已有无关数据，不执行覆盖');
const title=team?'律竞 · 团队赛演示':'律竞 · 个人赛演示';
const setup=await request(state.needsSetup?'/instance/setup':'/auth/login',{username:'demo-host',password:'Demo-host-2026!',displayName:'演示主办'}),owner={...setup.data,cookie:setup.cookie};
const starter=read('examples/custom/template.json'),prp=read('examples/midterm-review/template.json');
const charts=prp.charts.filter(c=>c.difficulty_label==='MASSIVE').slice(0,24).map((c,i)=>({...c,pool_tag:i<18?'main':'extra',role:i<18?'ban|pick|random|assign':'extra',display_order:i+1}));
const timing={draftSeconds:60,chartSeconds:240};
const rules={...starter.rules,gameKey:'paradigm-reboot',gameName:'范式：起源',clientVersion:'展示实例',entryMode:team?'team':'solo',capacity:8,metric:prp.rules.metric,timing,windows:null,team:{...starter.rules.team,min:2,max:2,perChart:2,maxAppearances:3,aggregation:'sum',captainSelection:'free',formation:'free',captainCount:8,draftOrder:'snake'},stages:[{id:'main',name:team?'八队冠军赛':'八人冠军赛',kind:'single',advance:1}]};
let event=state.event??(await request('/instance/event',{...starter,name:title,tagline:'',description:team?'八支双人队伍 · 全部人员与成绩为虚构演示数据。':'八位选手 · 全部人员与成绩为虚构演示数据。',rules,charts,appearance:{brandName:'律竞',accentColor:'#91d8bd',contact:'期中作业 · 独立演示实例'}},owner)).data;
fs.writeFileSync(checkpoint,JSON.stringify({eventId:event.id})+'\n');
await request('/library',{gameKey:'paradigm-reboot',mode:'replace',charts:charts.map(({pool_tag,role,...c})=>c)},owner,'PUT');
assert((await request(`/events/${event.id}/validate`,{},owner)).data.valid);
if(event.status==='draft')event=(await request(`/events/${event.id}/publish`,{expectedVersion:event.version},owner)).data;
async function account(username,displayName){
 const r=await fetch(base+'/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({username,password:'Demo-player-2026!'})});
 if(r.ok)return {...await r.json(),cookie:r.headers.get('set-cookie').split(';')[0]};
 assert.equal(r.status,401);const created=await request('/auth/register',{username,password:'Demo-player-2026!',displayName});return {...created.data,cookie:created.cookie};
}
const names=['青岚','白羽','晚星','序章','迟川','月汐','空镜','昼雨'],teamNames=['夜航星列','回声边界','薄荷电台','月面巡游','白昼信号','暮色和弦','极光轨迹','星河电波'];
const players=[];
for(let i=0;i<8;i++){
 const username=`${mode}-${team?'captain':'player'}-${String(i+1).padStart(2,'0')}`;
 const session=await account(username,names[i]);let member;
 if(team){
  if(!(await request(`/events/${event.id}/teams`,undefined,session)).data.some(t=>t.captainId===session.user.id))await request(`/events/${event.id}/teams`,{name:teamNames[i],code:null},session);
  const t=(await request(`/events/${event.id}/teams`,undefined,session)).data.find(t=>t.captainId===session.user.id);
  member=await account(`team-member-${String(i+1).padStart(2,'0')}`,`${names[i]}的队友`);
  if(!t.members.some(m=>m.id===member.user.id))await request(`/events/${event.id}/teams/join`,{name:'',code:t.code},member);
 }
 const existing=(await request(`/events/${event.id}/entries`,undefined,owner)).data.find(en=>en.userId===session.user.id);
 const entry=existing??(await request(`/events/${event.id}/entries`,{displayName:team?teamNames[i]:names[i]},session)).data;
 if(entry.status!=='accepted')await request(`/entries/${entry.id}/review`,{decision:'accepted',reason:'独立实例演示资格'},owner);players.push({username,session,member,entry});
}
await request(`/events/${event.id}/generate`,{expectedVersion:event.version},owner);
const detail=async id=>(await request(`/matches/${id}`,undefined,owner)).data;
const clock=async id=>(await request(`/matches/${id}/clock`,undefined,owner)).data;
const control=async(id,action)=>request(`/matches/${id}/clock`,{action,expectedVersion:(await clock(id)).clock.version},owner);
const first=(await request(`/events/${event.id}/schedule`,undefined,owner)).data.filter(m=>m.a&&m.b&&m.status==='drafting');assert.equal(first.length,4);
async function prepare(id){
 let m=await detail(id);await control(id,'start');
 while(m.currentStep)m=(await request(`/matches/${id}/draft-actions`,{expectedVersion:m.version,chartKey:m.candidates[0]?.chart_key??null,idempotencyKey:crypto.randomUUID()},owner)).data;
 if(team)for(const en of [m.a,m.b]){const p=players.find(p=>p.entry.id===en.id);await request(`/matches/${id}/lineups`,{entryId:en.id,expectedVersion:(await detail(id)).version,items:m.slots.map(s=>({slotId:s.id,userIds:[p.session.user.id,p.member.user.id]}))},p.session);}
 await control(id,'start');return await detail(id);
}
async function submit(m,count){
 for(const [i,en] of [m.a,m.b].entries()){
  const p=players.find(p=>p.entry.id===en.id),slots=m.slots.slice(0,count),value=String(1000000-i*3000);
  await request(`/events/${event.id}/attempts`,{entryId:en.id,matchId:m.id,items:team?[]:slots.map(s=>({slotId:s.id,value})),memberScores:team?slots.flatMap(s=>[p.session,p.member].map(member=>({slotId:s.id,userId:member.user.id,value}))):null,evidenceNote:'虚构演示成绩'},p.session);
 }
 for(const a of (await request(`/events/${event.id}/attempts`,undefined,owner)).data.filter(a=>a.status==='pending'))await request(`/attempts/${a.id}/review`,{decision:'approved',reason:'演示成绩核对'},owner);
}
const completed=await prepare(first[0].id);
for(let count=1;count<=completed.slots.length;count++){await submit(completed,count);if(count<completed.slots.length)await control(completed.id,'next');}
await request(`/matches/${completed.id}/finalize`,{expectedVersion:(await detail(completed.id)).version},owner);
const playing=await prepare(first[1].id);await submit(playing,1);await control(playing.id,'pause');
const bp=await detail(first[2].id),captain=players.find(p=>p.entry.id===bp.a.id),opponent=players.find(p=>p.entry.id===bp.b.id);
const info={fictional:true,mode,eventId:event.id,origin,name:title,entries:8,members:team?16:8,timing,urls:{home:origin+'/',schedule:origin+'/schedule',bp:origin+'/matches/'+bp.id,playing:origin+'/matches/'+playing.id,completed:origin+'/matches/'+completed.id,library:origin+'/manage/library',pools:origin+'/manage/pools',teams:team?origin+'/teams':null},owner:{username:'demo-host',password:'Demo-host-2026!'},sideA:{username:captain.username,password:'Demo-player-2026!',name:bp.a.displayName},sideB:{username:opponent.username,password:'Demo-player-2026!',name:bp.b.displayName}};
fs.writeFileSync(savedPath,JSON.stringify(info,null,2)+'\n');
const dir=path.join(root,'docs/playable-demos-2026-11-08');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,mode+'.json'),JSON.stringify(info,null,2)+'\n');
fs.writeFileSync(path.join(dir,mode+'-template.json'),JSON.stringify({...starter,name:title,rules,charts,appearance:{brandName:'律竞',accentColor:'#91d8bd',contact:''}},null,2)+'\n');
console.log(JSON.stringify({mode,event:title,entries:8,members:info.members,urls:info.urls},null,2));
