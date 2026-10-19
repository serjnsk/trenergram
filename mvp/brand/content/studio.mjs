// Студия — локальный просмотр роликов: список видео из exports/, рамка телефона,
// наложения интерфейса площадок, рендер сцен кнопкой.
//
//   npm run studio            → http://localhost:8790/brand/content/studio.html
//
// Сервер отдаёт mvp/ целиком (сцены открывают страницы прототипа), видео —
// с поддержкой Range (перемотка), превью кадров кеширует в exports/.thumbs/.
// Изменения в exports/ и scenes/ приходят в студию сами (SSE).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');                       // mvp/
const EXPORTS = path.join(HERE, 'exports');
const SCENES = path.join(HERE, 'scenes');
const THUMBS = path.join(EXPORTS, '.thumbs');
const PORT = +(process.env.PORT || 8790);
const VIDEO = /\.(mp4|mov|m4v|webm)$/i;
fs.mkdirSync(THUMBS, { recursive: true });

// ───── метаданные видео (ffprobe), кеш по пути и mtime ─────
const metaCache = new Map();
function probe(file) {
  return new Promise(res => execFile('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file],
    (err, out) => {
      if (err) return res(null);
      try {
        const j = JSON.parse(out), v = j.streams.find(s => s.codec_type === 'video');
        if (!v) return res(null);
        let [w, h] = [v.width, v.height];
        const rot = Math.abs(+(v.tags?.rotate || v.side_data_list?.find(d => d.rotation != null)?.rotation || 0));
        if (rot === 90 || rot === 270) [w, h] = [h, w];
        const [a, b] = (v.avg_frame_rate || '30/1').split('/').map(Number);
        res({ w, h, duration: +j.format.duration || 0, fps: b ? Math.round(a / b * 100) / 100 : 30,
              audio: j.streams.some(s => s.codec_type === 'audio') });
      } catch (e) { res(null); }
    }));
}
function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    if (d.name.startsWith('.')) return [];                         // .thumbs, .rendering-*
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p, base) : VIDEO.test(d.name) ? [path.relative(base, p).split(path.sep).join('/')] : [];
  });
}
async function listVideos() {
  const out = [];
  for (const rel of walk(EXPORTS)) {
    const f = path.join(EXPORTS, rel), st = fs.statSync(f), key = rel + ':' + st.mtimeMs;
    if (!metaCache.has(key)) metaCache.set(key, await probe(f));
    const m = metaCache.get(key);
    if (!m) continue;                                              // файл ещё пишется или битый
    out.push({ path: rel, name: path.basename(rel).replace(VIDEO, ''), folder: path.dirname(rel) === '.' ? '' : path.dirname(rel),
               size: st.size, mtime: st.mtimeMs, ...m });
  }
  return out.sort((a, b) => b.mtime - a.mtime);
}
function listScenes() {
  if (!fs.existsSync(SCENES)) return [];
  return fs.readdirSync(SCENES).filter(f => /^\d.*\.html$/.test(f)).sort().map(f => {
    const src = fs.readFileSync(path.join(SCENES, f), 'utf8');
    const name = f.replace(/\.html$/, ''), mp4 = path.join(EXPORTS, name + '.mp4');
    const st = fs.statSync(path.join(SCENES, f));
    const dur = +(src.match(/duration:\s*([\d.]+)/) || [])[1] || null;
    const fmt = (src.match(/format:\s*'([\d:]+)'/) || [])[1] || '9:16';
    // ролик устарел, если сцена или общий движок новее видео
    const engine = Math.max(...['engine.js', 'engine.css'].map(e => fs.statSync(path.join(SCENES, e)).mtimeMs));
    const v = fs.existsSync(mp4) ? fs.statSync(mp4).mtimeMs : 0;
    return { file: f, name, title: (src.match(/<title>([^<]*)/) || [])[1] || name, duration: dur, format: fmt,
             video: v ? name + '.mp4' : null, stale: !!v && Math.max(st.mtimeMs, engine) > v };
  });
}

// ───── превью кадра ─────
function thumb(rel) {
  const f = path.join(EXPORTS, rel), st = fs.statSync(f);
  const id = crypto.createHash('md5').update(rel + st.mtimeMs).digest('hex').slice(0, 16);
  const out = path.join(THUMBS, id + '.jpg');
  if (fs.existsSync(out)) return Promise.resolve(out);
  return new Promise(res => {
    const m = [...metaCache.entries()].find(([k]) => k.startsWith(rel + ':'))?.[1];
    const at = m ? Math.min(1.2, m.duration / 3) : 1;
    execFile('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(at), '-i', f, '-frames:v', '1', '-vf', 'scale=-2:240', '-q:v', '4', out],
      () => res(fs.existsSync(out) ? out : null));
  });
}

// ───── события: изменения папок и прогресс рендера ─────
const clients = new Set();
const send = (type, data) => { const s = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`; for (const c of clients) c.write(s); };
let tm;
const changed = () => { clearTimeout(tm); tm = setTimeout(async () => send('library', { videos: await listVideos(), scenes: listScenes(), queue: queueState() }), 400); };
fs.mkdirSync(EXPORTS, { recursive: true });
fs.watch(EXPORTS, { recursive: true }, (e, f) => { if (f && !f.startsWith('.thumbs')) changed(); });
fs.watch(SCENES, changed);

// ───── рендер: очередь, по одному ─────
const queue = []; let current = null;
const queueState = () => ({ current, waiting: queue.slice() });
function enqueue(scene) {
  if (current?.scene === scene || queue.includes(scene)) return;
  queue.push(scene); send('queue', queueState()); next();
}
function next() {
  if (current || !queue.length) return;
  const scene = queue.shift();
  current = { scene, pct: 0, log: '' };
  send('queue', queueState());
  const p = spawn(process.execPath, [path.join(HERE, 'render.mjs'), 'scenes/' + scene], { cwd: HERE });
  const onData = d => {
    const s = d.toString(); current.log += s;
    const m = [...s.matchAll(/(\d+)%/g)].pop();
    if (m) { current.pct = +m[1]; send('queue', queueState()); }
  };
  p.stdout.on('data', onData); p.stderr.on('data', onData);
  p.on('exit', code => {
    const done = { scene, ok: code === 0, log: current.log.split('\r').pop().trim().slice(-2000) };
    current = null; send('rendered', done); send('queue', queueState()); changed(); next();
  });
}

// ───── HTTP ─────
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.json': 'application/json', '.md': 'text/plain; charset=utf-8', '.mp4': 'video/mp4', '.mov': 'video/quicktime',
  '.m4v': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.tgs': 'application/octet-stream' };

function serveFile(req, res, f) {
  const st = fs.statSync(f), type = TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
  if (range) {
    const start = range[1] ? +range[1] : st.size - +range[2];
    const end = range[1] && range[2] ? Math.min(+range[2], st.size - 1) : st.size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes',
                         'Content-Length': end - start + 1, 'Cache-Control': 'no-cache' });
    return fs.createReadStream(f, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
  fs.createReadStream(f).pipe(res);
}
const json = (res, data, code = 200) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
const inside = (base, rel) => { const f = path.resolve(base, rel); return f.startsWith(base + path.sep) ? f : null; };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x'), p = decodeURIComponent(url.pathname);
  try {
    if (p === '/') { res.writeHead(302, { Location: '/brand/content/studio.html' }); return res.end(); }
    if (p === '/api/library') return json(res, { videos: await listVideos(), scenes: listScenes(), queue: queueState() });
    if (p === '/api/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write('retry: 1500\n\n'); clients.add(res); req.on('close', () => clients.delete(res)); return;
    }
    if (p === '/api/render' && req.method === 'POST') {
      const scene = url.searchParams.get('scene');
      if (!scene || !/^[\w.-]+\.html$/.test(scene) || !fs.existsSync(path.join(SCENES, scene))) return json(res, { error: 'нет сцены' }, 400);
      enqueue(scene); return json(res, queueState());
    }
    if (p === '/api/reveal' && req.method === 'POST') {                  // показать файл в Finder
      const f = inside(EXPORTS, url.searchParams.get('path') || '');
      if (f && fs.existsSync(f)) spawn('open', ['-R', f]);
      return json(res, { ok: !!f });
    }
    if (p.startsWith('/video/')) {
      const f = inside(EXPORTS, p.slice(7));
      if (!f || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
      return serveFile(req, res, f);
    }
    if (p.startsWith('/thumb/')) {
      const f = inside(EXPORTS, p.slice(7));
      const t = f && fs.existsSync(f) && await thumb(path.relative(EXPORTS, f));
      if (!t) { res.writeHead(404); return res.end(); }
      return serveFile(req, res, t);
    }
    let f = path.join(ROOT, p.endsWith('/') ? p + 'index.html' : p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    serveFile(req, res, f);
  } catch (e) { console.error(e); if (!res.headersSent) { res.writeHead(500); res.end(String(e)); } }
}).listen(PORT, () => {
  const u = `http://localhost:${PORT}/brand/content/studio.html`;
  console.log('Студия:', u);
  if (!process.argv.includes('--no-open')) spawn('open', [u]);
});
