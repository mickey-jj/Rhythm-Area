import { readFileSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const config=JSON.parse(readFileSync(path.join(root,'instance.config.json'),'utf8').replace(/^\uFEFF/,''));
assert.equal(config.databaseName,'rhythm_area_midterm');
const base=`http://127.0.0.1:${config.apiPort}/api`;
const origin=`http://127.0.0.1:${config.webPort}`;
const login=await fetch(base+'/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({username:'midterm-host',password:'Midterm-demo-2026!'})});
if(!login.ok) { console.log('未找到测试主办账号，保留现有曲库。');process.exit(0); }
const session=await login.json();const cookie=login.headers.get('set-cookie').split(';')[0];
async function request(resource,body){const response=await fetch(base+resource,{method:body===undefined?'GET':'PUT',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie,'X-Area-CSRF':session.csrf},...(body===undefined?{}:{body:JSON.stringify(body)})});const data=await response.json();assert(response.ok,`${resource}: ${data.message}`);return data;}
const instance=await request('/instance');if(!instance.isOwner || instance.event?.name!=='律竞 · 期中测试赛'){console.log('当前内容不是指定测试样例，保持原样。');process.exit(0);}
const before=await request(`/events/${instance.event.id}/pool`);
const {presets}=JSON.parse(readFileSync(path.join(root,'data/chart-presets/manifest.json'),'utf8'));
for(const preset of presets){
  const existing=await request(`/library?game=${preset.gameKey}`);
  const keys=new Set(existing.map(c=>c.chart_key));
  const charts=JSON.parse(readFileSync(path.join(root,'data/chart-presets',preset.file),'utf8')).filter(c=>!keys.has(c.chart_key));
  if(charts.length){const rows=await request('/library',{gameKey:preset.gameKey,charts,mode:'merge'});console.log(`${preset.title}: ${rows.length} 张谱面`);}
}
assert.deepEqual(await request(`/events/${instance.event.id}/pool`),before);
console.log(`曲库已就绪，赛事图池保持原样：${origin}/manage/pools`);
