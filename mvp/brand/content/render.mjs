// Рендер сцены в MP4: Chrome открывает сцену в режиме ?render, шагает кадрами
// (seek(кадр/fps) → снимок) и отдаёт кадры в ffmpeg.
//
//   node render.mjs scenes/01-copy-workout.html            → exports/01-copy-workout.mp4
//   node render.mjs scenes/01-copy-workout.html --fps 60 --from 3 --to 6 --still 4.5
//
// --still t   один кадр PNG в момент t (проверить композицию без рендера)
// --from/--to кусок ролика
// Нужны: Google Chrome, ffmpeg (brew install ffmpeg), npm install в этой папке.
// Сцены грузятся с локального сервера из mvp/ — его render.mjs поднимает сам.
// Chrome без --disable-gpu: с ним плашки календаря рисуются пустыми.
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');                       // mvp/
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf('--' + k); return i < 0 ? null : args[i + 1]; };
const scene = args.find(a => a.endsWith('.html'));
if (!scene) { console.error('Укажите сцену: node render.mjs scenes/<имя>.html'); process.exit(1); }
const name = path.basename(scene, '.html');
const still = opt('still');

// ───── статический сервер mvp/ ─────
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.json': 'application/json', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;
const rel = path.relative(ROOT, path.resolve(HERE, scene)).split(path.sep).join('/');

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--hide-scrollbars', '--force-device-scale-factor=1', '--autoplay-policy=no-user-gesture-required'],
});
try {
  const page = await browser.newPage();
  page.on('console', m => { if (['error', 'warn'].includes(m.type()) && !m.text().startsWith('Failed to load resource')) console.log(`[${m.type()}] ${m.text()}`); });
  page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) console.log(`[${r.status()}] ${r.url()}`); });
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.setViewport({ width: 1080, height: 1920 });
  await page.goto(`http://localhost:${port}/${rel}?render`, { waitUntil: 'load' });
  await page.waitForFunction('window.__scene', { timeout: 15000 });
  const meta = await page.evaluate(() => ({ size: __scene.size, duration: __scene.duration, fps: __scene.fps }));
  const [W, H] = meta.size;
  await page.setViewport({ width: W, height: H });
  await page.evaluate(() => __scene.ready);
  await page.evaluate(() => document.fonts.ready);

  const fps = +(opt('fps') || meta.fps);
  const from = +(opt('from') || 0), to = +(opt('to') || meta.duration);
  const outDir = path.join(HERE, 'exports');
  fs.mkdirSync(outDir, { recursive: true });

  // сцена идёт только вперёд: прокручиваем до начала куска без снимков
  const warm = still != null ? +still : from;
  for (let t = 0; t < warm; t += 1 / fps) await page.evaluate(t => __scene.seek(t), t);

  if (still != null) {
    await page.evaluate(t => __scene.seek(t), +still);
    const file = path.join(outDir, `${name}@${still}s.png`);
    await page.screenshot({ path: file });
    console.log('Кадр:', path.relative(process.cwd(), file));
  } else {
    const file = path.join(outDir, `${name}.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', file],
      { stdio: ['pipe', 'inherit', 'inherit'] });
    const total = Math.round((to - from) * fps);
    const started = Date.now();
    for (let i = 0; i < total; i++) {
      await page.evaluate(t => __scene.seek(t), from + i / fps);
      const buf = await page.screenshot({ type: 'png' });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % fps === 0) process.stdout.write(`\r${name}: ${Math.round(i / total * 100)}%  `);
    }
    ff.stdin.end();
    await new Promise((r, j) => ff.on('close', c => (c ? j(new Error('ffmpeg ' + c)) : r())));
    console.log(`\r${name}: готово за ${Math.round((Date.now() - started) / 1000)} с → ${path.relative(process.cwd(), file)}`);
  }
} finally {
  await browser.close();
  server.close();
}
