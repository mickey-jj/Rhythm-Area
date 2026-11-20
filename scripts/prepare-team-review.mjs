import {withSetupToken} from './setup-token.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8').replace(/^\uFEFF/,''));
const config=read('instance.config.json');assert.equal(config.databaseName,'rhythm_area_midterm');
const mode=process.argv[2] ?? 'draft';assert(['free','draft'].includes(mode));
const offset=mode==='free'?6:4,base=`http://127.0.0.1:${config.apiPort+offset}/api`,origin=`http://127.0.0.1:${config.webPort+offset}`;
async function request(resource,body,session){
 const response=await fetch(base+resource,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json',...(session?{Cookie:session.cookie,'X-Area-CSRF':session.csrf}:{})},...(body===undefined?{}:{body:JSON.stringify(withSetupToken(resource,body))})});
 const data=await response.json();assert(response.ok,`${resource}: ${data.message}`);return {data,cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
const state=(await request('/instance')).data;
const title=mode==='free'?'律竞 · 自由组队夜':'律竞 · 队长选人夜';
if(state.hasEvent){assert.equal(state.event?.name,title);console.log(`团队样例已存在，保留当前进度：${origin}/${mode==='free'?'teams':'team-draft'}`);process.exit(0);}
assert(state.needsSetup);
const setup=await request('/instance/setup',{username:'team-host',password:'Team-review-2026!',displayName:'组队夜主办'}),owner={...setup.data,cookie:setup.cookie};
const starter=read('examples/custom/template.json'),prp=read('examples/midterm-review/template.json');
const charts=prp.charts.filter(c=>c.difficulty_label==='MASSIVE').slice(0,24).map((c,i)=>({...c,pool_tag:i<18?'main':'extra',role:i<18?'ban|pick|random|assign':'extra',display_order:i+1}));
const rules={...starter.rules,gameKey:'paradigm-reboot',gameName:'范式：起源',clientVersion:'组队夜',entryMode:'team',capacity:4,metric:prp.rules.metric,team:{min:2,max:4,perChart:1,maxAppearances:3,aggregation:'sum',captainSelection:mode==='free'?'free':'appointed',formation:mode,captainCount:4,draftOrder:'snake'},stages:[{id:'main',name:'组队夜决赛',kind:'single',advance:1}],windows:null};
let event=(await request('/instance/event',{...starter,name:title,tagline:'',description:'团队赛功能测试 · 所有账号与队伍均为虚构样例',rules,charts,appearance:{brandName:'律竞',accentColor:'#91d8bd',contact:'组队页面测试样例 · 虚构数据'}},owner)).data;
event=(await request(`/events/${event.id}/publish`,{expectedVersion:event.version},owner)).data;
const names=['青岚','白羽','晚星','序章','迟川','月汐','空镜','昼雨','栖木','听澜','北辰','知夏'];
const notes=['擅长高密度谱面 · MASSIVE','偏好旋律与读谱 · INVADED / MASSIVE','稳定发挥 · 节奏型谱面','常玩范式：起源 · 周末参赛','擅长交互与纵连','喜欢电子与鼓打贝斯','长键、位移谱面更熟悉','稳定分数优先 · 期待队友','擅长复杂拍号 · 可补位','喜欢旋律型谱面 · 可沟通出场','多指谱面 · 高定数练习中','周末在线 · 配合团队安排'];
const players=[];
for(const [i,displayName] of names.entries()){
 const username=`team-${mode}-player-${i+1}`,registered=await request('/auth/register',{username,password:'Team-player-2026!',displayName}),session={...registered.data,cookie:registered.cookie};
 await request(`/events/${event.id}/team-candidates`,{note:notes[i]},session);players.push({username,session});
}
const teamNames=['夜航星列','回声边界','薄荷电台','月面巡游'];
for(const [i,p] of players.slice(0,4).entries()){
 if(mode==='free')await request(`/events/${event.id}/teams`,{name:teamNames[i],code:null},p.session);
 else await request(`/events/${event.id}/captains/decision`,{userId:p.session.user.id,decision:'approved'},owner);
}
if(mode==='draft'){
 await request(`/events/${event.id}/team-draft/start`,{},owner);
 for(let i=0;i<2;i++){
  const b=(await request(`/events/${event.id}/team-formation`,undefined,owner)).data;
  await request(`/events/${event.id}/team-draft/pick`,{userId:b.candidates.find(c=>!c.teamId).user.id,expectedVersion:b.draft.version},owner);
 }
}else{
 const teams=(await request(`/events/${event.id}/teams`,undefined,owner)).data;
 for(const [i,p] of players.slice(4,8).entries())await request(`/events/${event.id}/teams/${teams.find(t=>t.captainId===players[i].session.user.id).id}/join`,{},p.session);
}
const info={fictional:true,eventId:event.id,name:title,origin,urls:{lobby:origin+'/teams',draft:origin+'/team-draft',config:origin+'/manage/config?step=5'},owner:{username:'team-host',password:'Team-review-2026!'},player:{username:`team-${mode}-player-9`,password:'Team-player-2026!'}};
fs.writeFileSync(path.join(root,`.local/team-${mode}-review.json`),JSON.stringify(info,null,2)+'\n');
console.log(JSON.stringify({event:title,urls:info.urls,players:12,teams:4,mainDraftPreserved:true},null,2));
