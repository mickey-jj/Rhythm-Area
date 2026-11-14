import assert from 'node:assert/strict'
import {client} from './test-client.mjs'
const count=Number(process.argv[2]);if(![3,5,8].includes(count))throw new Error('Run via scripts/verify-single.ps1 with a fresh isolated instance per bracket size')
const A=client(8083),owner=await A.setup()
const preset=(await A.get('/templates',owner)).data.find(t=>t.id==='custom')
let e=(await A.post('/instance/event',{name:count+' 人单赛事验收',tagline:'ONE DEPLOYMENT / ONE EVENT',description:'虚构测试实例',rules:{...preset.rules,capacity:count,stages:[{id:"main",name:"正赛",kind:"single",advance:1}]},charts:preset.charts,appearance:preset.appearance},owner)).data
e=(await A.post('/events/'+e.id+'/publish',{expectedVersion:e.version},owner)).data
const users=[]
for(let i=0;i<count;i++){const user=await A.register('entrant-'+i);users.push(user);const en=(await A.post('/events/'+e.id+'/entries',{displayName:'选手 '+(i+1)},user)).data;await A.post('/entries/'+en.id+'/review',{decision:'accepted',reason:'Test approved'},owner)}
await A.post('/events/'+e.id+'/generate',{expectedVersion:e.version},owner)
let schedule=(await A.get('/events/'+e.id+'/schedule')).data
assert.equal(schedule.filter(m=>m.status==='bye').length,2**Math.ceil(Math.log2(count))-count)
let played=0
while(schedule.some(m=>m.status==='drafting')){
 let m=(await A.get('/matches/'+schedule.find(m=>m.status==='drafting').id)).data
 while(m.currentStep)m=(await A.post('/matches/'+m.id+'/draft-actions',{expectedVersion:m.version,chartKey:m.candidates[0]?.chart_key,idempotencyKey:crypto.randomUUID()},owner)).data
 for(const [side,score]of [[m.a,'100.0001'],[m.b,'100.0000']]){const user=users.find(u=>u.user.id===side.userId);await A.post('/events/'+e.id+'/attempts',{entryId:side.id,matchId:m.id,items:m.slots.map(s=>({slotId:s.id,value:score})),evidenceNote:'Virtual witness'},user)}
 for(const a of (await A.get('/events/'+e.id+'/attempts',owner)).data.filter(a=>a.status==='pending'))await A.post('/attempts/'+a.id+'/review',{decision:'approved',reason:'Verified test'},owner)
 await A.post('/matches/'+m.id+'/finalize',{expectedVersion:m.version},owner)
 schedule=(await A.get('/events/'+e.id+'/schedule')).data;played++;assert(played<=count-1)
}
assert.equal(played,count-1);assert.equal((await A.get('/instance')).data.event.status,'completed')
console.log('PASS single-instance '+count+' entrant bracket: '+played+' matches finalized, champion confirmed')
