// Rebuild portable example configurations without creating users or runtime records.
import {readFile,mkdir,writeFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
const root=fileURLToPath(new URL('../',import.meta.url))
const rules={schemaVersion:1,gameKey:'custom-rhythm',gameName:'自定义音游',clientVersion:'自定义版本',entryMode:'solo',capacity:16,metric:{name:'达成率',unit:'%',decimals:4,minimum:'0',maximum:'101',higherWins:true},qualifierSelection:'whole-best',pendingPolicy:'retain',matchMode:'total',winsRequired:2,stages:[{id:'qualifier',name:'海选',kind:'ranking',advance:8},{id:'main',name:'淘汰赛',kind:'single',advance:1}],draft:[['ban-a','A','ban',true],['ban-b','B','ban',true],['pick-a','A','pick',true],['pick-b','B','pick',true],['random','referee','random',false]].map(([id,actor,action,banApplies])=>({id,actor,action,count:1,pool:'main',banApplies,target:'pool'})),playOrder:[{id:'song-a',source:'pick-a:1'},{id:'song-b',source:'pick-b:1'},{id:'song-r',source:'random:1'}],resolution:{tie:'extra',extraPool:'extra',extraCount:1,scope:'extra-only',maxExtraRounds:3,finalPolicy:'normal'},team:{min:3,max:4,perChart:3,maxAppearances:3,aggregation:'sum'}}
const appearance={brandName:'律竞',accentColor:'#a3edd1',contact:''}
const group=i=>i<3?'qualifier':i<15?'main':'extra'
const roles=i=>i<3?'qualifier':i<15?'ban|pick|random':'extra'
const all=JSON.parse(await readFile(root+'data/paradigm-reboot/charts.json','utf8'))
const qualifierTitles=['Emancipator','Spell of chaoS','Fractal Fission'];
const qualifier=qualifierTitles.map(title=>{const c=all.find(c=>c.title===title&&c.difficulty_label==='MASSIVE');if(!c)throw new Error('Missing qualifier '+title);return c.chart_key});
const prp=all.filter(c=>c.level_value>=16&&c.level_value<=16.9).map((c,i)=>({...c,pool_tag:[...(qualifier.includes(c.chart_key)?['qualifier']:[]),...(c.level_value<=16.5?['stage1']:[]),'stage2','extra'].join('|'),role:[...(qualifier.includes(c.chart_key)?['qualifier']:[]),'ban','pick','random','assign','extra'].join('|'),display_order:i+1}));
const phase=pool=>({metric:{name:'分数',unit:'分',decimals:0,minimum:'0',maximum:'1010000',higherWins:true},matchMode:'total',winsRequired:2,draft:rules.draft.map(s=>({...s,pool})),playOrder:rules.playOrder,resolution:rules.resolution});
const prpRules={...rules,gameKey:'paradigm-reboot',gameName:'范式：起源',clientVersion:'主办自定（演示）',...phase('stage1'),stages:[{id:'qualifier',name:'海选 · 固定三首',kind:'ranking',advance:8},{id:'stage1',name:'阶段 1 · 16.0–16.5',kind:'single',advance:4,plan:phase('stage1')},{id:'stage2',name:'阶段 2 · 16.0–16.9',kind:'single',advance:1,plan:phase('stage2')}]};
const custom=Array.from({length:18},(_,i)=>({game_key:'custom-rhythm',game_version:'1.0',song_key:`song-${i+1}`,title:['Signal','Orbit','Afterglow','Neon Path','Dawn','Resonance'][i%6]+` ${i+1}`,artist:'Demo Composer',chart_key:`chart-${i+1}`,chart_type:'standard',difficulty_label:i%2?'EXPERT':'MASTER',level_value:12+(i+1)/10,pool_tag:group(i),role:roles(i),display_order:i+1}))
for(const [id,name,description,r,charts,a]of [['custom','节拍实验室 · 公开挑战','虚构游戏示例：最高 101% 达成率，四位小数。可修改后用于自己的比赛。',rules,custom,appearance],['paradigm-reboot','范式起源 · 演示赛','由通用模板生成的单赛事示例。海选固定 Emancipator、Spell of chaoS、Fractal Fission 三首 MASSIVE；阶段 1 为全部 16.0–16.5，阶段 2 为全部 16.0–16.9。采用项目自定规则，不代表官方比赛。',prpRules,prp,{...appearance,brandName:'范式起源',accentColor:'#a6cce8'}]]){
  await mkdir(root+`examples/${id}`,{recursive:true})
  await writeFile(root+`examples/${id}/template.json`,JSON.stringify({format:'rhythm-area-template',schemaVersion:1,name,tagline:'EVERY NOTE, YOUR AREA.',description,rules:r,charts,appearance:a},null,2)+'\n')
}
await writeFile(root+'examples/paradigm-reboot/demo-data.json',JSON.stringify(['星野','空白','回响','北辰'].map((displayName,i)=>({username:`player-${String.fromCharCode(97+i)}`,displayName,password:'area-demo-2026'})),null,2)+'\n')
console.log('Portable example configuration and optional demo fixtures prepared.')
