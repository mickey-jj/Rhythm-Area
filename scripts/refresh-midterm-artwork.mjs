import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8').replace(/^\uFEFF/,''));
const config=read('instance.config.json');assert.equal(config.databaseName,'rhythm_area_midterm');
const origin=`http://127.0.0.1:${config.webPort}`;const base=`http://127.0.0.1:${config.apiPort}/api`;
const login=await fetch(base+'/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({username:'midterm-host',password:'Midterm-demo-2026!'})});
assert(login.ok,'Only the dedicated midterm sample account can run this updater');
const session=await login.json();const cookie=login.headers.get('set-cookie').split(';')[0];
async function request(resource,body,method=body===undefined?'GET':'PUT'){
  const response=await fetch(base+resource,{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie,'X-Area-CSRF':session.csrf},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=await response.json();assert(response.ok,`${resource}: ${data.message}`);return data;
}
const instance=await request('/instance');assert(instance.isOwner && instance.event?.name==='律竞 · 期中测试赛','The current event is not the dedicated review sample');
const event=await request(`/events/${instance.event.id}`);const original=await request(`/events/${event.id}/pool`);
const reports=[];
for(const preset of read('data/chart-presets/manifest.json').presets){
  const existing=await request(`/library?game=${preset.gameKey}`);
  const source=read(`data/chart-presets/${preset.file}`);const sourceByKey=new Map(source.map(c=>[c.chart_key,c]));
  const correctionFile=`data/chart-presets/${preset.gameKey}-corrections.json`;
  const corrections=fs.existsSync(path.join(root,correctionFile))?read(correctionFile):{mappings:[],removals:[]};
  const mappings=new Map((corrections.mappings??[]).map(c=>[c.oldChartKey,c]));
  const removed=new Set((corrections.removals??[]).map(c=>c.removedChartKey));
  const transformed=existing.flatMap(c=>{
    const mapping=mappings.get(c.chart_key);const key=mapping?.newChartKey ?? c.chart_key;
    if(removed.has(key) || removed.has(c.chart_key))return [];
    const presetChart=sourceByKey.get(key);
    if(!presetChart)return [c];
    const corrected=mapping?{...c,...presetChart}:{...c};
    return [{...corrected,cover_url:c.cover_url || presetChart.cover_url || null}];
  });
  const known=new Set(transformed.map(c=>c.chart_key));
  const merged=[...new Map([...transformed,...source.filter(c=>!known.has(c.chart_key))].map(c=>[c.chart_key,c])).values()].map(c=>({...c,cover_url:c.cover_url?.startsWith('/')?c.cover_url:c.cover_url?new URL(c.cover_url).href:null}));
  assert(merged.length<=10000);
  await request('/library',{gameKey:preset.gameKey,mode:'replace',charts:merged});
  reports.push({game:preset.gameKey,charts:merged.length,artwork:merged.filter(c=>c.cover_url).length});
}
// Add appearance metadata to this editable sample only; preserve every rule, chart key and assignment.
if(event.status==='draft'){
  const library=await request(`/library?game=${event.rules.gameKey}`);const byKey=new Map(library.map(c=>[c.chart_key,c]));
  const charts=original.map(c=>({...c,cover_url:c.cover_url || byKey.get(c.chart_key)?.cover_url || null}));
  if(JSON.stringify(charts)!==JSON.stringify(original))await request(`/events/${event.id}`,{name:event.name,tagline:event.tagline,description:event.description,rules:event.rules,charts,expectedVersion:event.version});
}
const after=await request(`/events/${event.id}/pool`);const current=await request(`/events/${event.id}`);
const withoutCover=charts=>charts.map(({cover_url,...c})=>c);
assert.deepEqual(withoutCover(after),withoutCover(original));assert.deepEqual(current.rules,event.rules);
assert((await request(`/events/${event.id}/validate`,{},'POST')).valid);
console.log(JSON.stringify({sample:current.name,status:current.status,poolCharts:after.length,poolArtwork:after.filter(c=>c.cover_url).length,rulesPreserved:true,libraries:reports},null,2));
