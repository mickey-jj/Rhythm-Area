import fs from 'node:fs';import path from 'node:path';import ts from '../frontend/node_modules/typescript/lib/typescript.js';
const root=path.resolve(import.meta.dirname,'..');
function files(dir,extension){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{const file=path.join(dir,entry.name);return entry.isDirectory()?files(file,extension):file.endsWith(extension)?[file]:[]})}
const backend=files(path.join(root,'backend/src/main/scala'),'.scala');const frontend=[...files(path.join(root,'frontend/src'),'.tsx'),...files(path.join(root,'frontend/src'),'.ts')];const failures=[];
const relative=f=>path.relative(root,f).replaceAll('\\','/');
for(const file of backend){const source=fs.readFileSync(file,'utf8');const pureCode=source.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'').replace(/"""[\s\S]*?"""/g,'""').replace(/"(?:\\.|[^"\\])*"/g,'""');
 if(!relative(file).startsWith('backend/src/main/scala/services/'))failures.push(relative(file)+': source must have service ownership');
 if(/\b(var|while|try|catch|finally|Try)\b|scala\.collection\.mutable|unsafeRunSync|unsafeToFuture/.test(pureCode))failures.push(relative(file)+': forbidden Scala control/effect pattern');
 if(/\bsql"|\bfr"|private val \w+Sql\b/.test(source)&&!relative(file).includes('/tables/'))failures.push(relative(file)+': SQL outside table ownership');
 if(file.endsWith('Message.scala')&&/final case class/.test(source)&&(!/extends (APIMessage|NoRequestMessage)\[/.test(source)||!/def plan\(connection: Connection\): IO\[/.test(source)))failures.push(relative(file)+': missing executable message contract');
 if(file.endsWith('Table.scala')&&/\bP\d+:|value\d+:|def \w+.*sql: String/.test(source))failures.push(relative(file)+': generic or arbitrary SQL boundary');
 if(relative(file).includes('/utils/')&&/^  def /m.test(source))failures.push(relative(file)+': utility helper lacks service-private visibility');
 const definitions=[...pureCode.matchAll(/(?:final )?case class (\w+)/g)];if(definitions.length>1)failures.push(relative(file)+': aggregate object definitions');
 if(definitions.some(m=>!pureCode.includes('final case class '+m[1])))failures.push(relative(file)+': data structure must be final');
}
for(const file of frontend){const source=fs.readFileSync(file,'utf8');const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);function visit(n){
 if(ts.isForStatement(n)||ts.isForInStatement(n)||ts.isForOfStatement(n)||ts.isWhileStatement(n)||ts.isDoStatement(n))failures.push(relative(file)+': imperative source loop');
 if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&['push','splice','unshift','pop','shift','add'].includes(n.expression.name.text))failures.push(relative(file)+': mutation accumulator');
 if(ts.isClassDeclaration(n)&&n.heritageClauses?.some(h=>h.types.some(t=>/React\.Component|^Component$/.test(t.expression.getText(ast)))))failures.push(relative(file)+': React class component');
 ts.forEachChild(n,visit)}visit(ast);
}
const contracts=JSON.parse(fs.readFileSync(path.join(root,'docs/api-contracts.json'),'utf8'));const registry=backend.filter(f=>f.endsWith('Routes.scala')).map(f=>fs.readFileSync(f,'utf8')).join('\n');
for(const contract of contracts){const name=contract.message.replace(/Message$/,'API');const caller=frontend.find(f=>path.basename(f)===name+'.ts');if(!caller)failures.push('missing frontend caller: '+name);const owner=backend.find(f=>path.basename(f)===contract.message+'.scala')?.replaceAll('\\','/').match(/services\/([^/]+)\/api\//)?.[1];if(caller&&owner&&!relative(caller).startsWith('frontend/src/apis/'+owner+'/'))failures.push(name+': frontend service ownership differs from backend');if(!registry.includes('.'+contract.message+']'))failures.push('missing derived backend registration: '+contract.message);if(caller&&!/send\(\)/.test(fs.readFileSync(caller,'utf8')))failures.push(name+': missing concrete send()');}
const css=fs.readFileSync(path.join(root,'frontend/src/styles.css'),'utf8');if(!css.includes('@import "tailwindcss"'))failures.push('Tailwind entry missing');if(!fs.readFileSync(path.join(root,'frontend/vite.config.ts'),'utf8').includes('keepNames: true'))failures.push('API name preservation is required in production builds');
for(const page of ['EventEditorPage','MatchRoomPage','OrganizerConsolePage']){for(const folder of ['components','hooks','objects'])if(!fs.existsSync(path.join(root,'frontend/src/pages',page,folder)))failures.push(page+': missing '+folder)}
if(failures.length){console.error(failures.join('\n'));process.exit(1);}console.log(JSON.stringify({scalaFiles:backend.length,frontendFiles:frontend.length,registeredAPIs:contracts.length,structuralChecks:'passed'},null,2));
