// Rebuild researched starters from sourced metadata, without touching runtime data.
import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const save = async (id, value) => writeFile(new URL(`examples/${id}/template.json`, root), JSON.stringify(value, null, 2) + '\n');
const plan = rules => ({ metric: rules.metric, matchMode: rules.matchMode, winsRequired: rules.winsRequired, draft: rules.draft, playOrder: rules.playOrder, resolution: rules.resolution });
const chart = (game, version, title, difficulty, ordinal, tags, roles, type = 'standard', level = null) => ({
  game_key: game, game_version: version, song_key: `${game}:${title}`, title, artist: '',
  chart_key: `${game}:${title}:${type}:${difficulty}`, chart_type: type, difficulty_label: difficulty,
  level_value: level, pool_tag: tags, role: roles, display_order: ordinal,
});

const cop = await read('examples/cop-2025/template.json');
const catalog = await read('data/paradigm-reboot/charts.json');
const titles = ['Zephyrs', 'И00.', 'Re: End of a Dream', 'Emancipator'];
await save('cop-2025', { ...cop, gameVersion: '3.9.0', verifiedAt: '2026-11-01',
  description: '第二轮预选：同次特别挑战四曲总分排名，前八获得线下资格；无 BP。',
  rules: { ...cop.rules, clientVersion: '3.9.0', metric: { ...cop.rules.metric, name: '分数' } },
  charts: titles.map((title, index) => {
    const found = catalog.find(c => c.title === title && c.difficulty_label === 'MASSIVE');
    if (!found) throw Error(`Missing COP chart: ${title}`);
    return { ...found, game_version: '3.9.0', level_value: null, pool_tag: 'qualifier', role: 'qualifier', display_order: index + 1 };
  }),
  research: {
    sources: [cop.sourceUrl, 'https://www.sina.cn/news/detail/5173058836107521.html'],
    format: '第二轮为四曲挑战排名，前八晋级；只有第一轮合格者计入排名。',
    bp: '固定课题，无 Ban/Pick。', pool: '四首均为 MASSIVE；顺序按特别挑战原有曲序。',
    limitations: ['官方同分细则未核实；保留裁判判定。', '谱面定数不采用当前曲库值冒充历史定数。'],
  },
});

const kop = await read('examples/kop-7th/template.json');
const kopPool = await read('data/competitions/kop7th-maimai.json');
const pick = (id, actor, pool) => ({ id, actor, action: 'pick', count: 1, pool, banApplies: true, target: 'pool' });
const order = [{ id: 'song-a', source: 'pick-a:1' }, { id: 'song-b', source: 'pick-b:1' }];
const two = pool => ({ ...plan(kop.rules), draft: [pick('pick-a', 'A', pool), pick('pick-b', 'B', pool)], playOrder: order });
const final = { ...two('final'), playOrder: [...order, { id: 'song-final', source: 'fixed:maimai-dx:7 Wonders:dx:MASTER' }] };
await save('kop-7th', { ...kop, name: 'KOP 7th · maimai 全国决赛', stage: '八强、半决赛、冠军赛', gameVersion: 'CiRCLE', verifiedAt: '2026-11-01',
  description: '八人单败；八强、半决赛各两曲，冠军赛加打 7 Wonders。赛前密封选曲，无 Ban。撞曲、跨轮禁重及 DX 同分由裁判复核。',
  rules: { ...kop.rules, clientVersion: 'CiRCLE', capacity: 8, ...two('main'),
    stages: [{ id: 'quarter', name: '八强赛', kind: 'single', advance: 4, plan: two('main') },
      { id: 'semi', name: '半决赛', kind: 'single', advance: 2, plan: two('main') },
      { id: 'final', name: '冠军赛', kind: 'single', advance: 1, plan: final }],
  },
  charts: [...kopPool.charts.map((c, index) => chart('maimai-dx', 'CiRCLE', c.title, c.difficulty, index + 1,
    c.quarterFinal === '○' ? 'main|final|extra' : 'final|extra', 'pick|assign|extra', c.humen === 'でらっくす' ? 'dx' : 'standard')),
    { ...chart('maimai-dx', 'CiRCLE', '7 Wonders', 'MASTER', 54, 'championship', 'fixed', 'dx'), artist: '削除' }],
  research: { sources: [kop.sourceUrl, kopPool.dataUrl, 'https://www.sega.jp/topics/detail/260317_8/', 'https://maimai.sega.jp/kop7th/final/result/'],
    format: '八人单败，三轮独立规则。前两轮两首总达成率，冠军赛三首总达成率。',
    bp: '赛前提交三轮自选；个人不能重复自选同谱；对手撞曲时第一曲保留、第二曲改由主办指定。无禁曲。',
    pool: '官方列出 53 张自选谱面，52 张可用于八强及半决赛，Re:MASTER PANDORA PARADOXXX 仅决赛开放。7 Wonders 为冠军赛追加指定曲。',
    tie: '先比较总达成率，再比较 DX 总分；仍平时主办指定追加曲。',
    limitations: ['系统密封选曲未自动执行个人跨轮禁重、双方撞曲替换和 DX 次级指标，须裁判复核。', 'P 位及双方自选演奏顺序按现场决定。'],
  },
});

const wec = await read('examples/wec-2026/template.json');
await save('wec-2026', { ...wec, verifiedAt: '2026-11-01', gameVersion: '中二节奏 2026',
  description: '固定三曲按序同局完成，取最佳完整尝试，前十二晋级；无 BP。同分比较三曲绝对正义总数。',
  rules: { ...wec.rules, clientVersion: '中二节奏 2026', metric: { ...wec.rules.metric, name: '分数' },
    stages: [{ id: 'wec-ranking', name: '海选排名 · 前十二晋级', kind: 'ranking', advance: 12 }] },
  charts: ['Climax', '黎明に殉ず', 'The Devil Incarnate'].map((title, index) => chart('chunithm', '中二节奏 2026', title, 'MASTER', index + 1, 'qualifier', 'qualifier', 'standard', 15)),
  research: { sources: [wec.sourceUrl, 'https://i0.hdslb.com/bfs/new_dyn/3effaf574a0cf27a587e4e65c4aba689332563726.png'],
    format: '全国海选排名前十二晋级；弃权顺延。', bp: '无 Ban/Pick，三曲固定且按公告顺序同局完成。',
    pool: 'Climax → 黎明に殉ず → The Devil Incarnate；全部 MASTER 15，已逐字核对官方海选海报。',
    tie: '三曲分数合计相同，比较三曲绝对正义总数。',
    limitations: ['绝对正义数量目前需裁判通过成绩证明复核。'],
  },
});

const pmt = await read('examples/pmt-2026/template.json');
await save('pmt-2026', { ...pmt, verifiedAt: '2026-11-01',
  description: '前段对局：投币定先后，各禁一谱、游玩两谱。后段五谱含神秘曲。完整图池及选曲步骤仍待官方材料核实。',
  research: { sources: [pmt.sourceUrl, 'https://pmt.pigeongames.net/'],
    format: ['8→6：两轮胜败组分流', '6→3：败者组继续淘汰', '3→2：胜者组、败者组决赛', '冠军赛：两人五谱'],
    bp: '前段投币决定先后，各禁一谱后游玩两谱；3→2 与冠军赛改为五谱并包含神秘曲。冠军赛由胜者组晋级者决定先后。',
    tie: '按既定先后双方各选一谱，两谱结算；仍平继续加赛。',
    pool: '官方规则页、赛事详情海报均未列出完整选曲名单，当前未核实。',
    limitations: ['不把社区近三年曲池说法作为完整官方清单。', '当前模板仅为前段单场，指定两曲只是未公开选曲步骤的占位；不能宣称完整双败赛程。', '计分口径、加赛累计范围及图池未确认，保留空图池阻止直接发布。'],
  },
});
console.log('Researched COP / KOP / PMT / WEC starters updated.');
