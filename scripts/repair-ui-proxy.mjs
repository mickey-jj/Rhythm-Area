// Local, isolated UI regression fixture; never use as a production server.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../frontend/dist');
let uploads=0;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
http.createServer((req,res)=>{
 if(req.url.startsWith('/api/')){
  const evidence=req.method==='POST'&&(/\/evidence(?:\?|$)/.test(req.url)||req.url.includes('/rpc/post-events-by-id-evidence'));
  const forward=()=>{
   if(evidence&&++uploads===1){req.resume();res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({code:'TEST_UPLOAD_FAILURE',message:'隔离验收：模拟上传失败，请重试或移除附件'}));return;}
   const upstream=http.request({host:'127.0.0.1',port:8187,path:req.url,method:req.method,headers:req.headers},reply=>{res.writeHead(reply.statusCode,reply.headers);reply.pipe(res);});
   upstream.on('error',()=>{res.writeHead(502,{'Content-Type':'application/json'});res.end(JSON.stringify({message:'验收 API 尚未启动'}));});req.pipe(upstream);
  };
  if(evidence)setTimeout(forward,2500);else forward();return;
 }
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const candidate=path.resolve(root,'.'+pathname);
 if(candidate!==root&&!candidate.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 const file=fs.existsSync(candidate)&&fs.statSync(candidate).isFile()?candidate:path.join(root,'index.html');
 res.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
}).listen(5287,'127.0.0.1',()=>console.log('Isolated UI review: http://127.0.0.1:5287'));
