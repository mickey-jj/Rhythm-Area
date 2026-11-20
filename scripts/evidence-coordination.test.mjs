import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const requireFrontend = createRequire(path.join(root, 'frontend/package.json'));
const { build } = requireFrontend('esbuild');
const { JSDOM } = requireFrontend('jsdom');
const bundle = path.join(root, 'frontend/node_modules/.cache/evidence-coordination.mjs');
await mkdir(path.dirname(bundle), { recursive: true });
await build({
  stdin: {
    contents: `export { AttemptForm } from './src/features/scoring/AttemptForm'; export { QueryClient, QueryClientProvider } from '@tanstack/react-query';`,
    resolveDir: path.join(root, 'frontend'), loader: 'tsx',
  },
  bundle: true, format: 'esm', platform: 'node', packages: 'external',
  jsx: 'automatic', keepNames: true, outfile: bundle,
});

test('selected evidence blocks submission through upload failure until removal or a successful retry', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
  const priorFetch = globalThis.fetch;
  const saved = new Map(['window', 'document', 'HTMLElement', 'navigator'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const key of saved.keys()) Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
  const React = requireFrontend('react');
  const { render, fireEvent, waitFor, cleanup } = requireFrontend('@testing-library/react');
  const { AttemptForm, QueryClient, QueryClientProvider } = await import(pathToFileURL(bundle));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let finishUpload;
  const attempts = [];
  globalThis.fetch = async (url, options) => {
    if (String(url).includes('post-events-by-id-evidence')) return await new Promise(resolve => { finishUpload = resolve; });
    if (String(url).includes('post-events-by-id-attempts')) {
      attempts.push(JSON.parse(options.body));
      return Response.json({ ok: true });
    }
    throw new Error(`Unexpected request ${url}`);
  };
  try {
    const view = render(React.createElement(QueryClientProvider, { client }, React.createElement(AttemptForm, {
      event: { id: 'isolated-event' }, entry: { id: 'isolated-player' },
      slots: [{ id: 'chart-1', title: '验收曲目' }],
      metric: { name: '分数', unit: '分', minimum: 0, maximum: 1000000, decimals: 0 },
    })));
    fireEvent.change(view.getByRole('textbox', { name: /验收曲目/ }), { target: { value: '901000' } });
    fireEvent.change(view.getByRole('textbox', { name: /现场见证说明/ }), { target: { value: '裁判现场核验；隔离组件验收。' } });
    const submit = view.getByRole('button', { name: '提交完整尝试' });
    const selectFile = () => fireEvent.change(view.container.querySelector('input[type=file]'), {
      target: { files: [new File(['test image'], 'isolated.png', { type: 'image/png' })] },
    });
    selectFile();
    assert.equal(submit.disabled, true);
    fireEvent.submit(submit.closest('form'));
    assert.equal(attempts.length, 0);
    await waitFor(() => assert.equal(typeof finishUpload, 'function'));
    finishUpload(Response.json({ code: 'TEST_UPLOAD_FAILURE', message: '测试上传失败' }, { status: 503 }));
    await view.findByText('上传未成功，请重试或移除附件后提交');
    assert.equal(submit.disabled, true);
    assert.equal(view.queryByText('已上传 isolated.png'), null);
    fireEvent.submit(submit.closest('form'));
    assert.equal(attempts.length, 0);
    fireEvent.click(view.getByRole('button', { name: /移除附件/ }));
    assert.equal(submit.disabled, false);
    finishUpload = undefined;
    selectFile();
    assert.equal(submit.disabled, true);
    await waitFor(() => assert.equal(typeof finishUpload, 'function'));
    finishUpload(Response.json({ id: 'evidence-ready', name: 'isolated.png', mime: 'image/png', size: 10 }));
    await waitFor(() => assert.equal(submit.disabled, false));
    fireEvent.submit(submit.closest('form'));
    await view.findByText('已提交，等待主办方审核。');
    assert.equal(attempts.length, 1);
    assert.equal(attempts[0].evidenceId, 'evidence-ready');
    assert.equal(attempts[0].items[0].value, '901000');
  } finally {
    cleanup(); client.clear(); dom.window.close(); globalThis.fetch = priorFetch;
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
});
