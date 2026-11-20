import fs from 'node:fs';
import assert from 'node:assert/strict';
assert.match(process.env.DB_NAME??'',/^area_verify_[0-9]{14}_[a-f0-9]{5}_ui$/);
const base='http://127.0.0.1:8187/api',origin='http://127.0.0.1:5287';
async function request(resource,body,session){
 const res=await fetch(base+resource,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json',...(session?{Cookie:session.cookie,'X-Area-CSRF':session.csrf}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await res.json();assert.equal(res.status,200,JSON.stringify(data));return {...data,cookie:res.headers.get('set-cookie')?.split(';')[0]};
}
assert((await request('/instance')).needsSetup);
const owner=await request('/instance/setup',{username:'repair-ui-owner',password:'test-owner-2026',displayName:'验收主办',setupToken:fs.readFileSync('.local/setup-token','utf8').trim()});
const source=JSON.parse(fs.readFileSync('examples/paradigm-reboot/template.json','utf8'));
source.name='修复验收 · 独立演示赛';source.rules.capacity=8;source.rules.stages[0].advance=8;
source.rules.stages[0].ranking={startMode:'publish',endMode:'duration',startAt:null,deadline:null,durationSeconds:3600,targetCount:null,targetScore:null};
let event=await request('/instance/event',source,owner);
event=await request(`/events/${event.id}/publish`,{expectedVersion:event.version},owner);
const songs=source.charts.filter(c=>c.pool_tag.split('|').includes('qualifier'));
for(let i=0;i<4;i++){
 const player=await request('/auth/register',{username:'repair-virtual-'+i,password:'test-player-2026',displayName:'虚构选手'+(i+1)});
 const entry=await request(`/events/${event.id}/entries`,{displayName:player.user.displayName},player);
 await request(`/entries/${entry.id}/review`,{decision:'accepted',reason:'独立验收的虚构参赛者'},owner);
 await request(`/events/${event.id}/attempts`,{entryId:entry.id,matchId:null,items:songs.map(c=>({slotId:c.chart_key,value:String(980000+i*1000)})),evidenceNote:'独立验收预置虚构成绩'},player);
}
const attempts=await fetch(base+`/events/${event.id}/attempts`,{headers:{Cookie:owner.cookie}}).then(r=>r.json());
for(const a of attempts)await request(`/attempts/${a.id}/review`,{decision:'approved',reason:'核对虚构验收课题与成绩'},owner);
fs.writeFileSync('.local/repair-ui-evidence.png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB9kAAAAASUVORK5CYII=','base64'));
console.log('Seeded isolated UI review with four fictional participants; original event data untouched.');
