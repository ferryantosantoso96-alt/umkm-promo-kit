// Render halaman adegan (window.render(t), window.DUR) jadi MP4 1080×1920 @30fps, atau potret di detik tertentu.
// Video:  node tools/render.js adegan1.html hasil/adegan1.mp4
// Potret: node tools/render.js adegan1.html potret-adegan1 --detik 2,5.5,8.5
// Segmen: node tools/render.js video.html render/seg1.mp4 --frame 0,1200   (frame awal, frame akhir eksklusif)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

(async () => {
  const [html, out, flag, list] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.goto('file://' + path.resolve(html));
  await page.evaluate(() => document.fonts.ready);
  const shot = async t => { await page.evaluate(t => window.render(t), t); return page.screenshot({ type: 'png' }); };

  if (flag === '--detik') {
    fs.mkdirSync(out, { recursive: true });
    const name = path.basename(html, '.html');
    for (const s of list.split(',').map(Number)) {
      const f = path.join(out, `${name}-detik-${s.toFixed(1).padStart(4, '0').replace('.', '_')}.png`);
      fs.writeFileSync(f, await shot(s)); console.log(f);
    }
  } else {
    const fps = 30, dur = await page.evaluate(() => window.DUR); let n = Math.round(dur * fps), f0 = 0;
    if (flag === '--frame') { const [a, b] = list.split(',').map(Number); f0 = a; n = Math.min(n, b); }
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let i = f0; i < n; i++) {
      const buf = await shot(i / fps);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 30 === 0) console.log(`frame ${i}/${n} (${((Date.now() - t0) / 1000).toFixed(0)} dtk)`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    console.log('selesai:', out);
  }
  await browser.close();
})();
