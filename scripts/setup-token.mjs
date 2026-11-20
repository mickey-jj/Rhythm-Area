import {readFileSync} from 'node:fs';
export function withSetupToken(resource,body){
 return resource==='/instance/setup'&&body ? {...body,setupToken:process.env.AREA_SETUP_TOKEN??readFileSync(new URL('../.local/setup-token',import.meta.url),'utf8').trim()} : body;
}
