// Cetak waktu kalimat & adegan dari video.html. pakai: node tools/waktu.js
const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.error('[pageerror]', e.message));
  await p.goto('file://' + path.resolve(process.argv[2] || 'video.html'));
  const r = await p.evaluate(() => ({ dur: window.DUR, sc: window.SC.slice(1).map(s => [+s.a.toFixed(2), +s.b.toFixed(2)]), s: window.SENT.map(s => [s.sc, +s.t0.toFixed(2), +s.t1.toFixed(2), s.t]) }));
  console.log('DUR', r.dur); r.sc.forEach((s, i) => console.log('adegan', i + 1, s.join(' – '))); r.s.forEach((s, i) => console.log(i, s.join(' | ')));
  await b.close(); })();
