import { readFileSync } from 'node:fs'
const contracts = JSON.parse(readFileSync(new URL('../docs/api-contracts.json', import.meta.url), 'utf8'))
function canonical(path,method){
 if(process.env.AREA_TEST_TRANSPORT!=='rpc')return path
 const uri=new URL(path,'http://test.invalid')
 const match=contracts.filter(c=>c.method===method).map(c=>{
   const keys=[];const regex=new RegExp('^'+c.path.split('/').map(v=>v.startsWith(':')?(keys.push(v.slice(1)),'([^/]+)'):v).join('/')+'$');return {c,keys,values:uri.pathname.match(regex)}
 }).find(v=>v.values)
 if(!match)return path
 match.keys.forEach((key,i)=>uri.searchParams.set(key,decodeURIComponent(match.values[i+1])))
 return '/rpc/'+match.c.message.replace(/Message$/,'').replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase()+(uri.searchParams.size?'?'+uri.searchParams:'')
}
import assert from 'node:assert/strict'
export function client(port=8083){
 if(![8083,8084].includes(port))throw new Error('Tests only support isolated API ports 8083/8084')
 const base=`http://127.0.0.1:${port}/api`,origin=`http://127.0.0.1:${port===8083?5175:5176}`
 async function req(path,{session,method='GET',body,expected=200,csrf=true,withOrigin=true}={}){
   if(path==='/instance/setup'&&body&&!Object.hasOwn(body,'setupToken'))body={...body,setupToken:readFileSync(new URL('../.local/setup-token',import.meta.url),'utf8').trim()}
   const response=await fetch(base+canonical(path,method),{method,headers:{'Content-Type':'application/json',...(withOrigin?{Origin:origin}:{}),...(session?{Cookie:session.cookie,...(csrf?{'X-Area-CSRF':session.csrf}:{})}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})})
   const data=await response.json();assert.equal(response.status,expected,`${port} ${method} ${path}: ${JSON.stringify(data)}`);return {data,response}
 }
 const get=(path,session,expected=200)=>req(path,{session,expected})
 const post=(path,body,session,expected=200)=>req(path,{session,method:'POST',body,expected})
 function session(result){return {...result.data,cookie:result.response.headers.get('set-cookie').split(';')[0]}}
 const setup=async()=>session(await post('/instance/setup',{username:'organizer',password:'test-owner-2026',displayName:'测试主办'}))
 const register=async(name)=>session(await post('/auth/register',{username:name,password:'test-player-2026',displayName:name}))
 return {base,origin,req,get,post,session,setup,register}
}
