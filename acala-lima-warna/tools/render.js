// Render video.html frame demi frame (paralel, tanpa audio) ke MP4 1920x1080.
// pakai: node tools/render.js video.html hasil/video.mp4 [--fps 30] [--mulai 0] [--sampai 62] [--proses 3]
const { chromium } = require('playwright'); const { spawn, execFileSync } = require('child_process');
const path = require('path'), fs = require('fs'), os = require('os');
const arg = process.argv.slice(2), opt = (k, d) => { const i = arg.indexOf(k); return i >= 0 ? arg[i + 1] : d; };
const [file, out] = arg, FPS = +opt('--fps', 30), NP = +opt('--proses', 3);
(async () => {
  const b = await chromium.launch();
  const probe = await b.newPage(); await probe.goto('file://' + path.resolve(file) + '?render=1');
  await probe.waitForFunction(() => window.OPENER && window.OPENER.ready, null, { timeout: 30000 });
  const D = await probe.evaluate(() => window.OPENER.DURATION); await probe.close();
  const t0s = +opt('--mulai', 0), t1s = Math.min(D, +opt('--sampai', D));
  const f0 = Math.round(t0s * FPS), f1 = Math.round(t1s * FPS), n = f1 - f0, per = Math.ceil(n / NP);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'render-')); const T = Date.now(); let done = 0;
  const parts = await Promise.all([...Array(NP)].map(async (_, k) => {
    const a = f0 + k * per, z = Math.min(f1, a + per); if (a >= z) return null;
    const part = path.join(tmp, `part${k}.mp4`);
    const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    p.on('pageerror', e => console.error('PAGEERROR', e.message));
    await p.goto('file://' + path.resolve(file) + '?render=1');
    await p.waitForFunction(() => window.OPENER && window.OPENER.ready, null, { timeout: 30000 });
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), part], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = a; f < z; f++) {
      await p.evaluate(t => window.OPENER.seek(t), f / FPS);
      const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (++done % 150 === 0) console.log(`frame ${done}/${n}  ${((Date.now() - T) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); await p.close(); return part;
  }));
  await b.close();
  const list = path.join(tmp, 'list.txt'); fs.writeFileSync(list, parts.filter(Boolean).map(p => `file '${p}'`).join('\n'));
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', out]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('selesai', out, `${((Date.now() - T) / 1000).toFixed(0)}s`);
})();
