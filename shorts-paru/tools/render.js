// Render video.html frame demi frame lalu gabungkan dengan audio (musik + SFX dari AUDIO_PLAN).
// pakai: node tools/render.js video.html render/paru-paru-9x16.mp4 [--fps 30] [--sampai 45]
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const path = require('path'), fs = require('fs');
const arg = process.argv.slice(2);
const opt = (k, d) => { const i = arg.indexOf(k); return i >= 0 ? arg[i + 1] : d; };
const [file, out] = arg;
const FPS = +opt('--fps', 30);
(async () => {
  const dir = path.dirname(path.resolve(file));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.error('PAGEERROR', e.message));
  await p.goto('file://' + path.resolve(file) + '?render=1');
  await p.waitForFunction(() => window.OPENER && window.OPENER.ready, null, { timeout: 20000 });
  const { D, plan } = await p.evaluate(() => ({ D: window.OPENER.DURATION, plan: window.AUDIO_PLAN }));
  const dur = Math.min(D, +opt('--sampai', D)), n = Math.round(dur * FPS);
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  const silent = out.replace(/\.mp4$/, '.tanpa-suara.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < n; f++) {
    await p.evaluate(t => window.OPENER.seek(t), f / FPS);
    const buf = await p.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 90 === 0) console.log(`frame ${f}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();

  // audio: musik + efek suara
  const ins = [], flt = [], mix = [];
  if (plan.music) { ins.push('-i', path.join(dir, plan.music.src)); flt.push(`[0:a]atrim=0:${dur},volume=${plan.music.vol}[m]`); mix.push('[m]'); }
  plan.sfx.filter(s => s.at < dur).forEach((s, i) => {
    const k = ins.length / 2; ins.push('-i', path.join(dir, s.src));
    const ms = Math.round(s.at * 1000);
    flt.push(`[${k}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${s.vol},adelay=${ms}|${ms}[s${i}]`); mix.push(`[s${i}]`);
  });
  const audio = out.replace(/\.mp4$/, '.audio.wav');
  flt.push(`${mix.join('')}amix=inputs=${mix.length}:normalize=0:dropout_transition=0,atrim=0:${dur},alimiter=limit=0.89[a]`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...ins, '-filter_complex', flt.join(';'), '-map', '[a]', '-ar', '48000', audio]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', audio, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
  console.log('selesai', out, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
})();
