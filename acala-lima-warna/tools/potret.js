// Potret detik tertentu: node tools/potret.js video.html folder-keluar 2.5 7 12 ...
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const [file, out, ...ts] = process.argv.slice(2);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', e => console.error('PAGEERROR', e.message)); p.on('console', m => m.type() === 'error' && console.error('CONSOLE', m.text()));
  await p.goto('file://' + path.resolve(file) + '?render=1');
  await p.waitForFunction(() => window.OPENER && window.OPENER.ready, null, { timeout: 30000 });
  for (const t of ts) { await p.evaluate(t => window.OPENER.seek(t), +t); await p.screenshot({ path: path.join(out, `detik-${String(t).replace('.', '_')}.jpg`), type: 'jpeg', quality: 85 }); }
  await b.close(); console.log('ok', ts.length);
})();
