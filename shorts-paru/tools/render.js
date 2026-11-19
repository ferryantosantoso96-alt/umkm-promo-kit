// Render video.html frame demi frame lalu gabungkan dengan audio (musik + SFX dari AUDIO_PLAN).
// pakai: node tools/render.js video.html render/paru-paru-9x16.mp4 [--fps 30] [--sampai 45] [--warp audio/warp.json] [--musik-vol .2]
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const path = require('path'), fs = require('fs');
const arg = process.argv.slice(2);
const opt = (k, d) => { const i = arg.indexOf(k); return i >= 0 ? arg[i + 1] : d; };
const [file, out] = arg;
const FPS = +opt('--fps', 30);
const W = opt('--warp') ? JSON.parse(fs.readFileSync(opt('--warp'), 'utf8')) : null;
// peta waktu: detik video -> detik animasi (dan kebalikannya untuk efek suara)
function interp(pts, x, i0, i1) { for (let i = 0; i < pts.length - 1; i++) { const p = pts[i], q = pts[i + 1];
  if (x <= q[i0] || i === pts.length - 2) return p[i1] + (q[i1] - p[i1]) * (x - p[i0]) / (q[i0] - p[i0]); } }
const keAnim = v => W ? interp(W.anchors, v, 0, 1) : v, keVideo = a => W ? interp(W.anchors, a, 1, 0) : a;
(async () => {
  const dir = path.dirname(path.resolve(file));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.error('PAGEERROR', e.message));
  await p.goto('file://' + path.resolve(file) + '?render=1');
  await p.waitForFunction(() => window.OPENER && window.OPENER.ready, null, { timeout: 20000 });
  const { D, plan } = await p.evaluate(() => ({ D: window.OPENER.DURATION, plan: window.AUDIO_PLAN }));
  const full = W ? W.durasi : D, dur = Math.min(full, +opt('--sampai', full)), n = Math.round(dur * FPS);
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  const silent = out.replace(/\.mp4$/, '.tanpa-suara.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < n; f++) {
    await p.evaluate(t => window.OPENER.seek(t), Math.min(D, keAnim(f / FPS)));
    const buf = await p.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 90 === 0) console.log(`frame ${f}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();

  // audio: musik + efek suara
  const ins = [], flt = [], mix = [];
  if (plan.music) { ins.push('-i', path.join(dir, plan.music.src)); flt.push(`[0:a]atrim=0:${dur},volume=${opt('--musik-vol', plan.music.vol)}[m]`); mix.push('[m]'); }
  if (W && W.vo) { const k = ins.length / 2, v = W.vo, ms = Math.round(v.at * 1000); ins.push('-i', path.join(dir, v.src));
    flt.push(`[${k}:a]atrim=${v.mulai_sumber}:${v.akhir_sumber + 0.3},asetpts=PTS-STARTPTS,atempo=${v.tempo},aresample=48000,aformat=channel_layouts=stereo,volume=${v.vol},adelay=${ms}|${ms},apad=whole_dur=${dur},asplit[vo][vosc]`); mix.push('[vo]');
    // ducking: musik mengecil saat narator bicara
    if (plan.music) { flt[0] = flt[0].replace('[m]', '[m0]'); flt.push('[m0][vosc]sidechaincompress=threshold=0.02:ratio=5:attack=30:release=450:makeup=1[m]'); } }
  plan.sfx.map(s => Object.assign({}, s, { at: keVideo(s.at) })).filter(s => s.at < dur).forEach((s, i) => {
    const k = ins.length / 2; ins.push('-i', path.join(dir, s.src));
    const ms = Math.round(s.at * 1000);
    flt.push(`[${k}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${(s.vol * +opt('--sfx-vol', 1)).toFixed(3)},adelay=${ms}|${ms}[s${i}]`); mix.push(`[s${i}]`);
  });
  const audio = out.replace(/\.mp4$/, '.audio.wav');
  flt.push(`${mix.join('')}amix=inputs=${mix.length}:normalize=0:dropout_transition=0,atrim=0:${dur},alimiter=limit=0.89[a]`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...ins, '-filter_complex', flt.join(';'), '-map', '[a]', '-ar', '48000', audio]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', audio, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
  console.log('selesai', out, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
})();
