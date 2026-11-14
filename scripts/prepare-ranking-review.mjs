import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8').replace(/^\uFEFF/,''));
const config=read('instance.config.json');assert.equal(config.databaseName,'rhythm_area_midterm');
const origin=`http://127.0.0.1:${config.webPort+8}`,base=`http://127.0.0.1:${config.apiPort+8}/api`;
async function request(resource,body,session,method=body===undefined?'GET':'POST'){
 const response=await fetch(base+resource,{method,headers:{Origin:origin,'Content-Type':'application/json',...(session?{Cookie:session.cookie,'X-Area-CSRF':session.csrf}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await response.json();assert(response.ok,`${resource}: ${data.message}`);return {data,cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
const state=(await request('/instance')).data,title='律竞 · 两小时刷分挑战';
if(state.hasEvent){assert.equal(state.event?.name,title);console.log(`排名赛样例已存在，保留当前成绩：${origin}/qualifier`);process.exit(0);}
assert(state.needsSetup);
const setup=await request('/instance/setup',{username:'ranking-host',password:'Ranking-review-2026!',displayName:'刷分挑战主办'}),owner={...setup.data,cookie:setup.cookie};
const starter=read('examples/custom/template.json'),prp=read('examples/midterm-review/template.json');
const library=prp.charts.filter(c=>c.difficulty_label==='MASSIVE').slice(0,36).map(({pool_tag,role,...c},i)=>({...c,display_order:i+1}));
await request('/library',{gameKey:'paradigm-reboot',mode:'replace',charts:library},owner,'PUT');
const charts=library.slice(0,21).map((c,i)=>({...c,pool_tag:i<3?'qualifier':i<18?'main':'extra',role:i<3?'qualifier':i<18?'ban|pick|random|assign':'extra'}));
const ranking={startMode:'manual',endMode:'duration',startAt:null,deadline:null,durationSeconds:7200,targetCount:null,targetScore:null};
const rules={...starter.rules,gameKey:'paradigm-reboot',gameName:'范式：起源',clientVersion:'刷分挑战',capacity:12,metric:prp.rules.metric,stages:[{id:'ranking',name:'两小时刷分挑战',kind:'ranking',advance:4,ranking}],windows:null};
let event=(await request('/instance/event',{...starter,name:title,tagline:'',description:'',rules,charts,appearance:{brandName:'律竞',accentColor:'#91d8bd',contact:'排名赛与图池工作台测试样例 · 虚构数据'}},owner)).data;
event=(await request(`/events/${event.id}/publish`,{expectedVersion:event.version},owner)).data;
const board=(await request(`/events/${event.id}/ranking-board`,undefined,owner)).data;
await request(`/events/${event.id}/ranking-control`,{action:'start',expectedVersion:board.session.version},owner);
const names=['青岚','白羽','晚星','序章','迟川','月汐','空镜','昼雨'];
for(const [i,displayName] of names.entries()){
 const registered=await request('/auth/register',{username:`ranking-player-${i+1}`,password:'Ranking-player-2026!',displayName}),session={...registered.data,cookie:registered.cookie};
 const entry=(await request(`/events/${event.id}/entries`,{displayName},session)).data;
 await request(`/entries/${entry.id}/review`,{decision:'accepted',reason:'虚构样例参赛资格'},owner);
 if(i<7){
  await request(`/events/${event.id}/attempts`,{entryId:entry.id,matchId:null,items:charts.slice(0,3).map((c,j)=>({slotId:c.chart_key,value:String(1006123-i*2456+j*137)})),evidenceNote:'本地虚构样例成绩'},session);
  if(i<6){const attempts=(await request(`/events/${event.id}/attempts`,undefined,owner)).data;const a=attempts.find(a=>a.entryId===entry.id&&a.status==='pending');await request(`/attempts/${a.id}/review`,{decision:'approved',reason:'虚构成绩已核对'},owner);}
 }
}
const info={fictional:true,eventId:event.id,name:title,origin,urls:{ranking:origin+'/qualifier',pools:origin+'/manage/pools',config:origin+'/manage/config?step=3'},owner:{username:'ranking-host',password:'Ranking-review-2026!'},player:{username:'ranking-player-8',password:'Ranking-player-2026!'}};
fs.writeFileSync(path.join(root,'.local/ranking-review.json'),JSON.stringify(info,null,2)+'\n');
console.log(JSON.stringify({event:title,urls:info.urls,players:8,approved:6,pending:1,library:library.length},null,2));
