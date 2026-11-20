import {withSetupToken} from './setup-token.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve(import.meta.dirname, '..');
const config = JSON.parse(readFileSync(path.join(root, 'instance.config.json'), 'utf8').replace(/^\uFEFF/, ''));
assert.equal(config.databaseName, 'rhythm_area_midterm', 'This sample initializer is only for the midterm fork');
const origin = `http://127.0.0.1:${config.webPort}`;
const base = `http://127.0.0.1:${config.apiPort}/api`;
async function request(resource, body, session) {
  const response = await fetch(base + resource, { method: body === undefined ? 'GET' : 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...(session ? { Cookie: session.cookie, 'X-Area-CSRF': session.csrf } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(withSetupToken(resource,body)) }) });
  const data = await response.json();
  if (!response.ok) throw new Error(`${resource}: ${data.message ?? response.status}`);
  return { data, cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
const state = (await request('/instance')).data;
if (state.hasEvent) {
  console.log(`已有赛事，保持现有内容。配置页：${origin}/manage/config`);
} else {
  assert(state.needsSetup, 'An organizer already exists. Initialize the sample through that account instead.');
  const setup = await request('/instance/setup', { username: 'midterm-host', password: 'Midterm-demo-2026!', displayName: '期中测试主办' });
  const owner = { ...setup.data, cookie: setup.cookie };
  const template = JSON.parse(readFileSync(path.join(root, 'examples/midterm-review/template.json'), 'utf8'));
  const event = (await request('/instance/event', template, owner)).data;
  const validation = (await request(`/events/${event.id}/validate`, {}, owner)).data;
  assert(validation.valid, JSON.stringify(validation.issues));
  mkdirSync(path.join(root, '.local'), { recursive: true });
  writeFileSync(path.join(root, '.local/midterm-sample.json'), JSON.stringify({ eventId: event.id, name: event.name, status: event.status, url: `${origin}/manage/config`, fictional: true }, null, 2));
  console.log(`已创建可编辑测试草稿：${event.name}（${event.poolCount} 张谱面）。`);
  console.log(`配置页：${origin}/manage/config`);
}
