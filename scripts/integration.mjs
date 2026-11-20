import assert from 'node:assert/strict'
import {client} from './test-client.mjs'
import {readFileSync} from 'node:fs'
const A=client(8083),B=client(8084);const checks=[]
function pass(name){checks.push(name);console.log('PASS '+name)}
assert.deepEqual((await A.get('/instance')).data,{needsSetup:true,hasEvent:false,published:false,isOwner:false,event:null,appearance:{brandName:'律竞',accentColor:'#a3edd1',contact:''},demoLoaded:false,isJudge:false})
await A.post('/auth/register',{username:'too-early',password:'test-player-2026',displayName:'No'},null,409)
pass('clean first run has no event, no demo accounts and no public registration')
await A.post('/instance/setup',{username:'intruder',password:'test-owner-2026',displayName:'No',setupToken:''},null,403)
const race=await Promise.all([0,1].map(()=>fetch(A.base+'/instance/setup',{method:'POST',headers:{Origin:A.origin,'Content-Type':'application/json'},body:JSON.stringify({username:'organizer',password:'test-owner-2026',displayName:'测试主办',setupToken:readFileSync('.local/setup-token','utf8').trim()})})))
assert.deepEqual(race.map(r=>r.status).sort(),[200,409])
const winning=race.find(r=>r.status===200);const ownerA={...await winning.json(),cookie:winning.headers.get('set-cookie').split(';')[0]}
const ownerB=await B.setup()
await A.post('/instance/setup',{username:'another',password:'test-owner-2026',displayName:'No'},null,409)
await B.get('/me',ownerA,401)
pass('one-time organizer setup is concurrent-safe; deployments use separate session cookies')
await A.get('/events',null,410)
await A.post('/events',{},ownerA,410)
await A.get('/templates',null,401)
const templates=(await A.get('/templates',ownerA)).data
assert.deepEqual(templates.map(t=>t.id),['blank','paradigm-reboot','custom','cop-2025','kop-7th','pmt-2026','wec-2026'])
for(const [id,count] of [['cop-2025',4],['kop-7th',54],['pmt-2026',0],['wec-2026',3]]){
  const reference=templates.find(t=>t.id===id)
  assert(reference.description.length>0 && reference.description.length<150)
  assert.equal(reference.charts.length,count)
}
pass('template API replaces six generic starters with four sourced research references')
const preset=templates.find(t=>t.id==='custom')
const input={name:'独立实例 A · 自动验证',tagline:'INSTANCE A',description:'仅测试库',rules:preset.rules,charts:preset.charts.map(c=>({...c,display_order:99})),appearance:{brandName:'节拍 A',accentColor:'#a3edd1',contact:'A contact'}}
const created=await Promise.all([0,1].map(()=>fetch(A.base+'/instance/event',{method:'POST',headers:{Origin:A.origin,'Content-Type':'application/json',Cookie:ownerA.cookie,'X-Area-CSRF':ownerA.csrf},body:JSON.stringify(input)})))
assert.deepEqual(created.map(r=>r.status).sort(),[200,409])
let event=(await A.get('/instance',ownerA)).data.event
await A.post('/instance/event',input,ownerA,409)
assert.equal((await A.get('/instance')).data.event,null)
await A.get('/events/'+event.id,null,404)
assert.deepEqual((await A.get('/events/'+event.id+'/pool',ownerA)).data.map(c=>c.display_order),Array.from({length:18},(_,i)=>i+1))
await A.req('/events/'+event.id,{session:ownerA,method:'PUT',body:{...input,expectedVersion:0},expected:409})
await A.req('/events/'+event.id,{session:ownerA,method:'PUT',body:{...input,expectedVersion:event.version},csrf:false,expected:403})
pass('single-event binding rejects duplicate creation; drafts are private; versions, CSRF and pool order are enforced')
assert.equal((await A.post('/events/'+event.id+'/validate',{},ownerA)).data.valid,true)
assert.equal((await A.post('/events/'+event.id+'/simulate',{},ownerA)).data.playOrder.length,3)
const exported=(await A.get('/instance/export',ownerA)).data
assert.deepEqual(Object.keys(exported).sort(),['appearance','charts','description','format','name','rules','schemaVersion','tagline'])
assert(!JSON.stringify(exported).includes('test-owner-2026'))
pass('portable export is a whitelist of configuration, charts and appearance only')
const prp=(await B.get('/templates',ownerB)).data.find(t=>t.id==='paradigm-reboot')
let other=(await B.post('/instance/event',{name:prp.name,tagline:prp.tagline,description:prp.description,rules:prp.rules,charts:prp.charts,appearance:prp.appearance},ownerB)).data
await B.get('/events/'+event.id,ownerB,404)
await B.post('/instance/demo-data',{},ownerB)
assert.equal((await B.get('/instance',ownerB)).data.demoLoaded,true)
assert.equal((await A.get('/instance',ownerA)).data.demoLoaded,false)
await B.post('/instance/demo-data',{},ownerB,409)
other=(await B.get('/instance',ownerB)).data.event
const copied={...exported,name:'独立实例 B · 导入 A 模板',rules:{...exported.rules,metric:{...exported.rules.metric,maximum:'102'}},charts:exported.charts.map((c,i)=>i===0?{...c,title:'Only changed in B'}:c),appearance:{brandName:'节拍 B',accentColor:'#a6cce8',contact:'B contact'},expectedVersion:other.version}
other=(await B.req('/events/'+other.id,{session:ownerB,method:'PUT',body:copied})).data
assert.notEqual((await A.get('/events/'+event.id+'/pool',ownerA)).data[0].title,'Only changed in B')
assert.equal((await A.get('/instance',ownerA)).data.appearance.brandName,'节拍 A')
assert.equal((await B.get('/instance',ownerB)).data.appearance.brandName,'节拍 B')
assert.equal((await B.get('/events/'+other.id+'/entries',ownerB)).data.length,4)
pass('optional example/data are explicit; copied template produces independent rules, pools, appearance, users and entries')
const frozenVersion=event.version
event=(await A.post('/events/'+event.id+'/publish',{expectedVersion:event.version},ownerA)).data
assert.equal((await A.get('/instance')).data.event.id,event.id)
const a=await A.register('player-a'),b=await A.register('player-b')
await A.post('/instance/event',input,a,403)
const ea=(await A.post('/events/'+event.id+'/entries',{displayName:'Tester A'},a)).data
const eb=(await A.post('/events/'+event.id+'/entries',{displayName:'Tester B'},b)).data
await A.post('/events/'+event.id+'/entries',{displayName:'Again'},a,409)
assert.equal((await A.get('/events/'+event.id+'/entries')).data.length,0)
for(const en of [ea,eb])await A.post('/entries/'+en.id+'/review',{decision:'accepted',reason:'Checked'},ownerA)
pass('publication exposes only the current event; normal registration and role checks work')
const q=preset.charts.filter(c=>c.pool_tag==='qualifier')
for(const [session,en,score]of [[a,ea,'100.0001'],[b,eb,'100.0000']])await A.post('/events/'+event.id+'/attempts',{entryId:en.id,matchId:null,items:q.map(c=>({slotId:c.chart_key,value:score})),evidenceNote:'Test witness'},session)
let attempts=(await A.get('/events/'+event.id+'/attempts',ownerA)).data
for(const attempt of attempts)await A.post('/attempts/'+attempt.id+'/review',{decision:'approved',reason:'Checked full attempt'},ownerA)
assert.equal((await A.get('/events/'+event.id+'/rankings')).data[0].total,'300.0003')
assert.equal((await A.get('/events/'+event.id+'/attempts',a)).data.length,1)
pass('full qualifier attempts, private evidence and exact decimal ranking are preserved')
await A.post('/events/'+event.id+'/generate',{expectedVersion:event.version},ownerA)
let match=await A.get('/events/'+event.id+'/schedule').then(r=>A.get('/matches/'+r.data[0].id)).then(r=>r.data)
await A.post('/matches/'+match.id+'/draft-actions',{expectedVersion:match.version,chartKey:match.candidates[0].chart_key,idempotencyKey:crypto.randomUUID()},b,403)
const concurrent=await Promise.all([0,1].map(i=>fetch(A.base+'/matches/'+match.id+'/draft-actions',{method:'POST',headers:{Origin:A.origin,'Content-Type':'application/json',Cookie:a.cookie,'X-Area-CSRF':a.csrf},body:JSON.stringify({expectedVersion:match.version,chartKey:match.candidates[i].chart_key,idempotencyKey:crypto.randomUUID()})})))
assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409])
match=(await A.get('/matches/'+match.id)).data
while(match.currentStep){const session=match.currentStep.actor==='A'?a:match.currentStep.actor==='B'?b:ownerA;match=(await A.post('/matches/'+match.id+'/draft-actions',{expectedVersion:match.version,chartKey:match.candidates[0]?.chart_key,idempotencyKey:crypto.randomUUID()},session)).data}
assert.equal(match.slots.length,3);assert.deepEqual((await A.get('/matches/'+match.id)).data.slots,match.slots)
pass('wrong-turn and concurrent BP rejected; draw results and independent play slots persist')
const beforeInvalidReplay=(await A.get('/matches/'+match.id,ownerA)).data
await A.post('/matches/'+match.id+'/replay',{expectedVersion:match.version,reason:'Rollback regression: invalid winner',winnerId:'not-a-participant'},ownerA,400)
const afterInvalidReplay=(await A.get('/matches/'+match.id,ownerA)).data
assert.deepEqual(afterInvalidReplay,beforeInvalidReplay)
pass('failed replay rolls back draft, slots, generation, version and status')

async function play(sa,sb){for(const [session,en,score]of [[a,ea,sa],[b,eb,sb]])await A.post('/events/'+event.id+'/attempts',{entryId:en.id,matchId:match.id,items:match.slots.filter(s=>s.extraRound===match.extraRound).map(s=>({slotId:s.id,value:score})),evidenceNote:'Private test evidence'},session);await A.post('/matches/'+match.id+'/finalize',{expectedVersion:match.version},ownerA,409);const pending=(await A.get('/events/'+event.id+'/attempts',ownerA)).data.filter(a=>a.status==='pending');for(const attempt of pending)await A.post('/attempts/'+attempt.id+'/review',{decision:'approved',reason:'Verified'},ownerA)}
await play('100.0000','100.0000')
await A.post('/matches/'+match.id+'/finalize',{expectedVersion:match.version},ownerA)
match=(await A.get('/matches/'+match.id)).data;assert.equal(match.extraRound,1)
await play('100.0001','100.0000')
const scores=(await A.get('/matches/'+match.id+'/scores')).data;assert.equal(scores.length,4);assert(!JSON.stringify(scores).includes('evidence'))
await A.post('/matches/'+match.id+'/finalize',{expectedVersion:match.version},ownerA)
match=(await A.get('/matches/'+match.id)).data;assert.equal(match.winnerId,ea.id)
await A.post('/matches/'+match.id+'/finalize',{expectedVersion:match.version},ownerA,409)
event=(await A.get('/instance',ownerA)).data.event;assert.equal(event.status,'completed')
await A.post('/events/'+event.id+'/archive',{expectedVersion:event.version},ownerA)
assert.equal((await A.get('/instance')).data.event.status,'archived')
assert.equal((await A.get('/instance')).data.event.ruleVersion,frozenVersion)
assert.equal((await A.get('/matches/'+match.id)).data.winnerId,ea.id)
await A.post('/events/'+event.id+'/entries',{displayName:'Late'},a,409)
assert.equal((await B.get('/instance',ownerB)).data.event.status,'draft')
const audit=(await A.get('/events/'+event.id+'/audit',ownerA)).data;assert(audit.some(l=>l.action==='event.archive'));await A.get('/events/'+event.id+'/audit',a,403)
pass('reviewed scores, real tie-break, champion and archive preserve history without affecting deployment B')
other=(await B.post('/events/'+other.id+'/publish',{expectedVersion:other.version},ownerB)).data
const ownerEntry=(await B.post('/events/'+other.id+'/entries',{displayName:'Owner as player'},ownerB)).data
await B.post('/entries/'+ownerEntry.id+'/review',{decision:'accepted',reason:'Eligibility checked'},ownerB)
await B.post('/events/'+other.id+'/attempts',{entryId:ownerEntry.id,matchId:null,items:copied.charts.filter(c=>c.pool_tag==='qualifier').map(c=>({slotId:c.chart_key,value:'100'})),evidenceNote:'Self-review must fail'},ownerB)
const ownAttempt=(await B.get('/events/'+other.id+'/attempts',ownerB)).data[0]
await B.post('/attempts/'+ownAttempt.id+'/review',{decision:'approved',reason:'Must not pass'},ownerB,403)
pass('organizer cannot review their own score in the single-event deployment')
const logout=await A.post('/auth/logout',{},ownerA)
assert(logout.response.headers.get('set-cookie').toLowerCase().includes('path=/'))
await A.get('/me',ownerA,401)
pass('logout invalidates the server session and clears the same-path cookie')
console.log(JSON.stringify({passed:checks.length,eventA:event.id,eventB:other.id,checks},null,2))
