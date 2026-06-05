/* ============================================================
   离线生成百炼(DashScope) qwen-tts 语音 → assets/tts/<id>.<ext> + assets/tts/manifest.js
   工作台 file:// 零依赖，无法在浏览器直调 DashScope（CORS+暴露key），所以把固定脚本里的
   每句口播离线合成成音频文件，引擎按文案 id 命中播放（见 js/engine.js _ttsFile/_speakAudio）。

   用法（Node 18+，自带 fetch）：
     设置 key（任选其一）：
       PowerShell:  $env:DASHSCOPE_API_KEY="sk-xxx"
       bash:        export DASHSCOPE_API_KEY=sk-xxx
     生成（默认旅游场景）：  node tools/gen_tts.mjs
     指定场景：             node tools/gen_tts.mjs travel_chengdu_3d weather_5d
   可选 env：TTS_VOICE(默认 Cherry) · TTS_MODEL(默认 qwen-tts-latest) · DASHSCOPE_BASE(默认北京)
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'assets', 'tts');
const KEY = process.env.DASHSCOPE_API_KEY || process.env.BAILIAN_API_KEY;
const VOICE = process.env.TTS_VOICE || 'Cherry';
const MODEL = process.env.TTS_MODEL || 'qwen3-tts-flash';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = process.env.DASHSCOPE_BASE || 'https://dashscope.aliyuncs.com';
const ENDPOINT = BASE + '/api/v1/services/aigc/multimodal-generation/generation';

if (!KEY) { console.error('缺少 key：请设置 DASHSCOPE_API_KEY 或 BAILIAN_API_KEY'); process.exit(1); }

// 与 js/engine.js _ttsId 完全一致的 djb2 hash
function ttsId(s) { let h = 5381, i = (s || '').length; while (i) h = (h * 33) ^ s.charCodeAt(--i); return (h >>> 0).toString(16); }

// 用 window 垫片加载纯数据 case 文件，收集口播文案
function loadCaseTexts(ids) {
  const texts = new Map();   // id -> text
  for (const cid of ids) {
    const file = path.join(ROOT, 'cases', cid + '.js');
    if (!fs.existsSync(file)) { console.warn('跳过：找不到 case', file); continue; }
    const win = {};
    // 文件形如 (function(global){ global.LOONA_CASES=...; })(window);
    // eslint-disable-next-line no-new-func
    new Function('window', fs.readFileSync(file, 'utf8'))(win);
    const c = win.LOONA_CASES && win.LOONA_CASES[cid];
    if (!c) { console.warn('跳过：case 未注册', cid); continue; }
    for (const ev of c.events || []) {
      const t1 = ev.comp === 'tts' ? ev.text : null;
      const t2 = ev.tts && ev.tts.text;
      for (const t of [t1, t2]) if (t && String(t).trim()) texts.set(ttsId(t), String(t).trim());
    }
  }
  return texts;
}

async function synth(text) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, input: { text, voice: VOICE } })
  });
  const bodyText = await res.text();
  if (!res.ok) throw new Error('qwen-tts ' + res.status + ': ' + bodyText.slice(0, 400));
  let json; try { json = JSON.parse(bodyText); } catch (e) { throw new Error('响应非 JSON: ' + bodyText.slice(0, 200)); }
  const audio = json.output && json.output.audio;
  const url = audio && audio.url;
  if (!url) throw new Error('响应无 output.audio.url: ' + bodyText.slice(0, 300));
  const ext = (url.split('?')[0].match(/\.(\w{2,4})$/) || [, 'wav'])[1];
  const ab = await (await fetch(url)).arrayBuffer();
  return { buf: Buffer.from(ab), ext };
}

async function main() {
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['travel_chengdu_3d'];
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const texts = loadCaseTexts(ids);
  console.log(`场景 ${ids.join(', ')} · 口播 ${texts.size} 句 · 模型 ${MODEL} · 音色 ${VOICE}`);
  // 合并已有 manifest：只重生成本次场景的句子，别把其它 case 的条目挤掉
  let manifest = {};
  try {
    const mf = path.join(OUT_DIR, 'manifest.js');
    if (fs.existsSync(mf)) { const w = {}; new Function('window', fs.readFileSync(mf, 'utf8'))(w); if (w.LOONA_TTS) manifest = w.LOONA_TTS; }
  } catch (e) {}
  let n = 0;
  for (const [id, text] of texts) {
    // 已有则复用（同 id 任意扩展名）
    const existing = fs.readdirSync(OUT_DIR).find((f) => f.startsWith(id + '.') && f !== id + '.txt');
    if (existing) { manifest[id] = 'assets/tts/' + existing; console.log(`· 跳过(已存在) ${id}  ${text.slice(0, 16)}…`); continue; }
    try {
      const { buf, ext } = await synth(text);
      const fname = id + '.' + ext;
      fs.writeFileSync(path.join(OUT_DIR, fname), buf);
      manifest[id] = 'assets/tts/' + fname;
      n++; console.log(`✓ ${id}.${ext}  ${text.slice(0, 20)}…`);
    } catch (e) { console.error(`✗ ${id}  ${text.slice(0, 20)}…  ${e.message}`); }
    await sleep(1500);   // 避免 Throttling.RateQuota 限流
  }
  const js = '/* 自动生成 by tools/gen_tts.mjs，勿手改 */\nwindow.LOONA_TTS = ' + JSON.stringify(manifest, null, 2) + ';\n';
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.js'), js, 'utf8');
  console.log(`完成：新合成 ${n} 句，manifest 共 ${Object.keys(manifest).length} 条 → assets/tts/manifest.js`);
}
main().catch((e) => { console.error(e); process.exit(1); });
