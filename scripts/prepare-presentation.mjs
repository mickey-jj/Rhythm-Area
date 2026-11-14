import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8').replace(/^\uFEFF/,''));
const config=read('instance.config.json');assert.equal(config.databaseName,'rhythm_area_midterm');
const origin=`http://127.0.0.1:${config.webPort+10}`,base=`http://127.0.0.1:${config.apiPort+10}/api`;
async function request(resource,body,session,method=body===undefined?'GET':'POST'){
 const r=await fetch(base+resource,{method,headers:{Origin:origin,'Content-Type':'application/json',...(session?{Cookie:session.cookie,'X-Area-CSRF':session.csrf}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await r.json();assert(r.ok,`${resource}: ${r.status} ${data.message}`);return {data,cookie:r.headers.get('set-cookie')?.split(';')[0]};
}
const title='律竞 · 期中展示赛',state=(await request('/instance')).data;
if(state.hasEvent){const saved=fs.existsSync(path.join(root,'.local/presentation.json'))?read('.local/presentation.json'):null;assert(state.event.name===title||saved?.eventId===state.event.id,'This port belongs to an unrelated event');console.log(`展示实例已存在，保持现场进度：${origin}/schedule`);process.exit(0);}
assert(state.needsSetup);
const setup=await request('/instance/setup',{username:'presentation-host',password:'Presentation-2026!',displayName:'演示主办'}),owner={...setup.data,cookie:setup.cookie};
const starter=read('examples/custom/template.json'),prp=read('examples/midterm-review/template.json');
const source=prp.charts.filter(c=>c.difficulty_label==='MASSIVE').slice(0,36);assert.equal(source.length,36);assert(source.every(c=>c.cover_url));
const charts=source.map((c,i)=>({...c,pool_tag:i<3?'qualifier':i<18?'stage1':i<33?'stage2':'extra',role:i<3?'qualifier':i<33?'ban|pick|random|assign':'extra',display_order:i+1}));
const plan=pool=>({metric:prp.rules.metric,matchMode:'total',winsRequired:1,draft:starter.rules.draft.map(d=>({...d,pool})),playOrder:starter.rules.playOrder,resolution:starter.rules.resolution,draftMode:'open',tieBreak:[]});
const ranking={startMode:'publish',endMode:'manual',startAt:null,deadline:null,durationSeconds:null,targetCount:null,targetScore:null};
const rules={...starter.rules,gameKey:'paradigm-reboot',gameName:'范式：起源',clientVersion:'期中展示',capacity:16,metric:prp.rules.metric,windows:null,stages:[{id:'ranking',name:'排名赛 · 十六进八',kind:'ranking',advance:8,ranking},{id:'stage1',name:'第一阶段 · 八进四',kind:'single',advance:4,plan:plan('stage1')},{id:'stage2',name:'第二阶段 · 冠军争夺',kind:'single',advance:1,plan:plan('stage2')}]};
let e=(await request('/instance/event',{...starter,name:title,tagline:'',description:'16 位选手与全部成绩均为虚构演示数据。',rules,charts,appearance:{brandName:'律竞',accentColor:'#91d8bd',contact:'期中作业展示 · 虚构赛事数据'}},owner)).data;
const library=charts.map(({pool_tag,role,...c})=>c);
await request('/library',{gameKey:'paradigm-reboot',mode:'replace',charts:library},owner,'PUT');
assert((await request(`/events/${e.id}/validate`,{},owner)).data.valid);
e=(await request(`/events/${e.id}/publish`,{expectedVersion:e.version},owner)).data;
const players=[];
for(let i=1;i<=16;i++){
 const username=`presentation-player-${String(i).padStart(2,'0')}`,r=await request('/auth/register',{username,password:'Presentation-player-2026!',displayName:`选手${i}`});
 const session={...r.data,cookie:r.cookie},entry=(await request(`/events/${e.id}/entries`,{displayName:`选手${i}`},session)).data;
 await request(`/entries/${entry.id}/review`,{decision:'accepted',reason:'虚构演示选手'},owner);players.push({session,entry});
 await request(`/events/${e.id}/attempts`,{entryId:entry.id,matchId:null,items:charts.slice(0,3).map((c,j)=>({slotId:c.chart_key,value:String(1000000-i*1000-j*17)})),evidenceNote:'虚构演示成绩'},session);
}
async function approve(){for(const a of (await request(`/events/${e.id}/attempts`,undefined,owner)).data.filter(a=>a.status==='pending'))await request(`/attempts/${a.id}/review`,{decision:'approved',reason:'演示：完整成绩核对'},owner);}
await approve();
await request(`/events/${e.id}/generate`,{expectedVersion:e.version},owner);
let final;
for(let guard=0;guard<10;guard++){
 const schedule=(await request(`/events/${e.id}/schedule`,undefined,owner)).data;
 const next=schedule.find(m=>['drafting','playing'].includes(m.status));assert(next);
 let m=(await request(`/matches/${next.id}`,undefined,owner)).data;
 while(m.currentStep)m=(await request(`/matches/${m.id}/draft-actions`,{expectedVersion:m.version,chartKey:m.candidates[0]?.chart_key??null,idempotencyKey:crypto.randomUUID()},owner)).data;
 for(const entry of [m.a,m.b]){
  const player=players.find(p=>p.entry.id===entry.id),index=players.indexOf(player),value=1000000-index*1000;
  await request(`/events/${e.id}/attempts`,{entryId:entry.id,matchId:m.id,items:m.slots.map(s=>({slotId:s.id,value:String(value)})),evidenceNote:'虚构演示成绩；选禁为主办有记录代操作'},player.session);
 }
 await approve();
 if(m.stageId==='stage2'&&m.round===2){final=(await request(`/matches/${m.id}`,undefined,owner)).data;break;}
 await request(`/matches/${m.id}/finalize`,{expectedVersion:m.version},owner);
}
assert(final);assert.equal(final.status,'playing');
const schedule=(await request(`/events/${e.id}/schedule`,undefined,owner)).data,attempts=(await request(`/events/${e.id}/attempts`,undefined,owner)).data;
assert.equal(schedule.filter(m=>m.status==='finalized').length,6);assert.equal(attempts.filter(a=>a.status==='approved').length,30);assert(!attempts.some(a=>a.status==='pending'));
const info={origin,eventId:e.id,name:title,fictional:true,players:16,completedMatches:6,approvedAttempts:30,finalStatus:final.status,finalists:[final.a.displayName,final.b.displayName],finalTotals:[final.a,final.b].map(en=>{const a=attempts.find(a=>a.matchId===final.id&&a.entryId===en.id);return a.items.reduce((n,i)=>n+Number(i.value),0);}),urls:{home:origin+'/',rules:origin+'/rules',participants:origin+'/participants',ranking:origin+'/qualifier',schedule:origin+'/schedule',final:origin+'/matches/'+final.id,library:origin+'/manage/library',pools:origin+'/manage/pools',config:origin+'/manage/config?step=3'},owner:{username:'presentation-host',password:'Presentation-2026!'}};
fs.writeFileSync(path.join(root,'.local/presentation.json'),JSON.stringify(info,null,2)+'\n');
fs.mkdirSync(path.join(root,'docs/presentation-2026-11-08'),{recursive:true});
fs.writeFileSync(path.join(root,'docs/presentation-2026-11-08/state.json'),JSON.stringify({...info,owner:undefined},null,2)+'\n');
console.log(JSON.stringify({...info,owner:undefined},null,2));
