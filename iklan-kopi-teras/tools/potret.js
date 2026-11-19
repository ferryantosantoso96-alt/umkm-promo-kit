// pakai: node tools/potret.js <file.html> <outdir> t1 t2 ...
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [file, out, ...ts] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.error('PAGEERROR', e.message));
  p.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await p.goto('file://' + path.resolve(file) + '?render=1');
  await p.waitForFunction(() => window.OPENER && window.OPENER.ready, null, { timeout: 15000 });
  require('fs').mkdirSync(out, { recursive: true });
  for (const t of ts) {
    await p.evaluate(t => window.OPENER.seek(+t), t);
    await p.waitForTimeout(60);
    const f = path.join(out, `t${String(t).replace('.', '_')}.png`);
    await p.screenshot({ path: f }); console.log(f);
  }
  await b.close();
})();
