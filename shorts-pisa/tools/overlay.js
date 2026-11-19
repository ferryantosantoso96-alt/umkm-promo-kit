// Render overlay HTML jadi urutan PNG transparan 1080×1920 @30fps.
// Pakai: node tools/overlay.js <html> <outdir> <durasi_detik> [GARIS_json]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const [html, out, durStr, garis] = process.argv.slice(2);
  const fps = 30, n = Math.round(parseFloat(durStr) * fps);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  if (garis) await page.addInitScript(g => { window.GARIS = JSON.parse(g); }, garis);
  await page.goto('file://' + path.resolve(html));
  await page.evaluate(() => document.fonts.ready);
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => window.render(t), i / fps);
    await page.screenshot({ path: path.join(out, `f${String(i).padStart(4, '0')}.png`), omitBackground: true });
  }
  await browser.close();
  console.log(`${n} frame -> ${out}`);
})();
