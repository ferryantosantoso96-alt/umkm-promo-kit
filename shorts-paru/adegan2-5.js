/* Adegan 2–5 untuk Shorts paru-paru. Dipanggil dari bangun() di video.html.
   Memakai helper global dari skrip utama: el, $, INK, R, label, awan, bulat, cincinGoyang. */
const SFX = [];
function sfx(nama, at, vol) { SFX.push({ at: Math.max(0, +at.toFixed(3)), src: `sfx/${nama}.mp3`, vol: vol == null ? .5 : vol }); }

function grad(id, jenis, at, stops) {
  const defs = document.querySelector('#sv defs');
  const g = el(jenis, Object.assign({ id }, at), defs);
  stops.forEach(([o, c, op]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op == null ? 1 : op }, g));
  return g;
}
/* label dengan dua garis penunjuk (satu papan nama, dua sasaran) */
function label2(par, o) {
  const L = label(par, o);
  const d = `M${o.x} ${o.y}L${o.tx2} ${o.ty2}`, Ln = Math.hypot(o.tx2 - o.x, o.ty2 - o.y);
  const a = el('path', { d, stroke: INK, 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }), b = el('path', { d, stroke: '#fff', 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round' });
  L.g.insertBefore(b, L.g.firstChild); L.g.insertBefore(a, L.g.firstChild);
  [a, b].forEach(p => { p.style.strokeDasharray = Ln; p.style.strokeDashoffset = Ln; });
  const dot = el('g', {}, L.g); el('circle', { cx: o.tx2, cy: o.ty2, r: 15, fill: '#fff', stroke: INK, 'stroke-width': 5 }, dot); el('circle', { cx: o.tx2, cy: o.ty2, r: 7, fill: o.warna || '#FF7FAE' }, dot);
  L.g.appendChild(L.pill);
  const masuk = L.masuk;
  L.masuk = (tl, at) => { masuk(tl, at); tl.to([a, b], { strokeDashoffset: 0, duration: .35, ease: 'power2.out' }, at + .15).from(dot, { scale: 0, svgOrigin: `${o.tx2} ${o.ty2}`, duration: .35, ease: 'back.out(3)' }, at + .42); };
  return L;
}
function bola(par, jenis) { // jenis 'o2' biru atau 'co2' abu-abu
  const luar = el('g', {}, par), g = el('g', { transform: 'scale(1.3)' }, luar), biru = jenis === 'o2';
  el('circle', { cx: 0, cy: 0, r: 31, fill: biru ? '#4FB3FF' : '#AEB4C6', stroke: INK, 'stroke-width': 5 }, g);
  el('ellipse', { cx: -11, cy: -12, rx: 9, ry: 6, fill: '#fff', opacity: .9, transform: 'rotate(-30 -11 -12)' }, g);
  const t = el('text', { x: 0, y: biru ? 10 : 8, 'text-anchor': 'middle', 'font-family': 'Fredoka', 'font-weight': 700, 'font-size': biru ? 28 : 22, fill: '#fff', stroke: INK, 'stroke-width': 6, 'paint-order': 'stroke fill' }, g);
  t.textContent = biru ? 'O₂' : 'CO₂';
  return luar;
}
function chipLegenda(par, x, y, jenis, teks) {
  const g = el('g', {}, par);
  const t = el('text', { x: x + 34, y: y + 15, 'text-anchor': 'middle', 'font-family': 'Fredoka', 'font-weight': 700, 'font-size': 42, fill: INK }, g); t.textContent = teks;
  const w = t.getBBox().width + 130, h = 78;
  const r = el('rect', { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 39, fill: '#fff', stroke: INK, 'stroke-width': 6 }, g); g.insertBefore(r, t);
  const b = bola(g, jenis); b.setAttribute('transform', `translate(${x - w / 2 + 44} ${y}) scale(.7)`);
  return g;
}

function bangunLanjut(tl, lb) {
  const lama = Array.from(lb.children);
  tl.to(lama, { opacity: 0, duration: .25 }, 9.5);
  sfxAdegan1();
  adegan2(tl, lb); adegan3(tl, lb); adegan4(tl, lb); adegan5(tl, lb);
}

function sfxAdegan1() {
  sfx('pop-gelembung', .3, .5); sfx('teks-muncul', .35, .35);
  sfx('reverse-swell', .95, .35);
  sfx('klik-lembut', 1.6, .5); sfx('klik-lembut', 2.3, .5);
  sfx('whoosh-panjang', 3.65, .55);
  sfx('swoosh-naik', 4.7, .35);
  [5.35, 5.7, 6.05, 6.4, 6.75].forEach((t, i) => sfx('pop-gelembung', t, .32 + (i % 2) * .08));
  sfx('klik-lembut', 5.4, .4); sfx('klik-lembut', 6.0, .4); sfx('klik-lembut', 6.6, .4);
  sfx('pop-ganda', 7.85, .45); sfx('pop-ganda', 8.45, .45);
  sfx('tick-hover', 8.5, .5); sfx('tick-hover', 8.7, .5);
  sfx('swoosh-turun', 9.65, .5);
}

/* ================= ADEGAN 2 (9.7 – 17): trakea lalu bercabang ke bronkus ================= */
function adegan2(tl, lb) {
  const g = $('#s2'), VP = [540, 880];
  grad('gTrakea', 'radialGradient', { gradientUnits: 'userSpaceOnUse', cx: 540, cy: 880, r: 1250 }, [[0, '#FFF7F2'], [.12, '#FFDCE2'], [.42, '#F7AEC1'], [.85, '#E07898']]);
  grad('gLubang', 'radialGradient', { cx: .5, cy: .5, r: .5 }, [[0, '#FFF3F6'], [.35, '#F7A3BC'], [.8, '#C95783'], [1, '#B04674']]);
  el('rect', { x: -1200, y: -1600, width: 3480, height: 5120, fill: 'url(#gTrakea)' }, g);
  const glow = el('circle', { cx: VP[0], cy: VP[1], r: 150, fill: '#fff', filter: 'url(#fBlur)', opacity: .85 }, g);
  // cincin tulang rawan trakea yang melaju
  const cg = el('g', {}, g), P = 1.5, N = 7;
  for (let i = 0; i < N; i++) {
    const r = el('g', {}, cg);
    el('ellipse', { cx: VP[0], cy: VP[1], rx: 330, ry: 360, fill: 'none', stroke: INK, 'stroke-width': 34 }, r);
    el('ellipse', { cx: VP[0], cy: VP[1], rx: 330, ry: 360, fill: 'none', stroke: '#FFE1E8', 'stroke-width': 22 }, r);
    el('path', { d: `M${VP[0] - 300} ${VP[1] - 150}Q${VP[0] - 250} ${VP[1] - 330} ${VP[0] - 40} ${VP[1] - 355}`, fill: 'none', stroke: '#fff', 'stroke-width': 7, 'stroke-linecap': 'round' }, r);
    const t0 = 9.8 - P + i * P / N, n = Math.max(1, Math.floor((14.2 - t0) / P));
    tl.fromTo(r, { scale: .04, svgOrigin: `${VP[0]} ${VP[1]}` }, { scale: 3.4, duration: P, ease: 'power2.in', repeat: n - 1, immediateRender: false }, t0);
  }
  // titik udara melaju
  const ud = el('g', {}, g);
  for (let i = 0; i < 10; i++) { const a = R(0, 6.28), c = el('circle', { cx: 0, cy: 0, r: 16, fill: '#EAF8FF', stroke: '#6CC8F5', 'stroke-width': 5 }, ud);
    const t0 = 10.0 + i * .33;
    tl.fromTo(c, { x: VP[0] + Math.cos(a) * 460, y: VP[1] + Math.sin(a) * 600, scale: 1.4, opacity: 0 }, { x: VP[0], y: VP[1], scale: .1, duration: 1.3, ease: 'power1.out', immediateRender: false }, t0)
      .fromTo(c, { opacity: 0 }, { opacity: 1, duration: .2, immediateRender: false }, t0).to(c, { opacity: 0, duration: .3 }, t0 + 1.0); }
  tl.set(ud.children, { opacity: 0 }, 0);

  // percabangan: dua lubang bronkus dan sekat (karina)
  const cab = el('g', { opacity: 0 }, g);
  el('rect', { x: -1200, y: -1600, width: 3480, height: 5120, fill: 'url(#gTrakea)' }, cab);
  const hole = (cx, cy) => { const h = el('g', {}, cab);
    el('ellipse', { cx, cy, rx: 205, ry: 262, fill: 'none', stroke: INK, 'stroke-width': 30 }, h);
    el('ellipse', { cx, cy, rx: 205, ry: 262, fill: 'none', stroke: '#FFE1E8', 'stroke-width': 18 }, h);
    el('ellipse', { cx, cy, rx: 182, ry: 236, fill: 'url(#gLubang)', stroke: INK, 'stroke-width': 7 }, h);
    el('ellipse', { cx, cy, rx: 120, ry: 158, fill: 'none', stroke: '#FFD1DD', 'stroke-width': 8, opacity: .8 }, h);
    el('ellipse', { cx, cy, rx: 62, ry: 82, fill: 'none', stroke: '#FFD1DD', 'stroke-width': 6, opacity: .7 }, h);
    el('circle', { cx, cy, r: 50, fill: '#fff', filter: 'url(#fBlur)', opacity: .7 }, h);
    el('path', { d: `M${cx - 170} ${cy - 120}Q${cx - 140} ${cy - 250} ${cx - 10} ${cy - 262}`, fill: 'none', stroke: '#fff', 'stroke-width': 8, 'stroke-linecap': 'round' }, h); return h; };
  el('ellipse', { cx: 540, cy: 900, rx: 560, ry: 640, fill: 'none', stroke: INK, 'stroke-width': 30 }, cab);
  el('ellipse', { cx: 540, cy: 900, rx: 560, ry: 640, fill: 'none', stroke: '#FFE1E8', 'stroke-width': 18 }, cab);
  const hL = hole(318, 920), hR = hole(762, 920);
  el('path', { d: 'M540 650Q556 900 540 1180', fill: 'none', stroke: '#fff', 'stroke-width': 12, 'stroke-linecap': 'round', opacity: .9 }, cab);
  tl.set(cab, { opacity: 1 }, 13.55).fromTo(cab, { scale: .2, svgOrigin: '540 900' }, { scale: 1, duration: 1.0, ease: 'power3.out', immediateRender: false }, 13.55)
    .to(cg, { opacity: 0, duration: .3 }, 13.6);
  // udara masuk ke dua lubang
  const ud2 = el('g', {}, cab);
  for (let i = 0; i < 10; i++) { const kiri = i % 2 === 0, tx = kiri ? 318 : 762, c = el('circle', { cx: 0, cy: 0, r: 16, fill: '#EAF8FF', stroke: '#6CC8F5', 'stroke-width': 5 }, ud2);
    const t0 = 14.3 + i * .16, x0 = kiri ? R(-80, 260) : R(820, 1160);
    tl.fromTo(c, { x: x0, y: R(1500, 1800), scale: 1.6, opacity: 0 }, { x: tx + R(-20, 20), y: 920 + R(-20, 20), scale: .15, duration: 1.1, ease: 'power1.out', immediateRender: false }, t0)
      .fromTo(c, { opacity: 0 }, { opacity: 1, duration: .15, immediateRender: false }, t0).to(c, { opacity: 0, duration: .25 }, t0 + .85); }
  tl.set(ud2.children, { opacity: 0 }, 0);

  const Ltrakea = label(lb, { x: 540, y: 300, tx: 270, ty: 590, teks: 'Trakea', warna: '#FFB24D' });
  const Lbronkus = label2(lb, { x: 540, y: 1360, tx: 360, ty: 1130, tx2: 720, ty2: 1130, teks: 'Bronkus', warna: '#7FD3FF' });
  Ltrakea.masuk(tl, 10.7); Ltrakea.keluar(tl, 13.4);
  Lbronkus.masuk(tl, 14.45); Lbronkus.keluar(tl, 15.8);

  // menyelam ke lubang kanan → adegan 3
  tl.to('#b1', { scale: 2.6, svgOrigin: '540 860', opacity: 0, duration: .5, ease: 'power2.in' }, 9.7)
    .set(g, { opacity: 1 }, 9.8).from(g, { scale: .7, svgOrigin: '540 880', duration: .7, ease: 'power3.out' }, 9.8)
    .from(glow, { opacity: 0, duration: .4 }, 9.8)
    .to(g, { scale: 8, svgOrigin: '762 920', duration: 1.05, ease: 'power3.in' }, 15.85)
    .to('#flash', { opacity: 1, duration: .2 }, 16.75).set(g, { opacity: 0 }, 17.0).to('#flash', { opacity: 0, duration: .45 }, 17.0);
  sfx('whoosh-cepat', 10.0, .45); sfx('klik-lembut', 10.75, .5);
  sfx('swoosh-naik', 13.5, .4); sfx('pop-ganda', 14.5, .4);
  sfx('whoosh-berat', 15.85, .55);
}

/* ================= ADEGAN 3 (17 – 25): bronkiolus bercabang, berujung di alveolus ================= */
function adegan3(tl, lb) {
  const g = $('#s3');
  grad('gLembut', 'linearGradient', { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, '#EFE4FF'], [.6, '#FFE6EF'], [1, '#FFD7E5']]);
  grad('gBalon', 'radialGradient', { cx: .38, cy: .34, r: .7 }, [[0, '#FFFFFF'], [.35, '#FFE0EA'], [1, '#FF94B6']]);
  el('rect', { x: -1200, y: -1600, width: 3480, height: 5120, fill: 'url(#gLembut)' }, g);
  const dek = el('g', {}, g);
  for (let i = 0; i < 16; i++) el('circle', { cx: R(0, 1080), cy: R(0, 1920), r: R(40, 110), fill: '#FFC6D8', opacity: R(.18, .35) }, dek);

  const pohon = el('g', {}, g), cab = [], daun = [];
  seed = 11;
  (function cabang(x, y, ang, len, w, depth, rute) {
    const x2 = x + Math.sin(ang) * len, y2 = y + Math.cos(ang) * len;
    const cx = (x + x2) / 2 + R(-18, 18), cy = (y + y2) / 2 + R(-10, 10);
    const r2 = `${rute}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    cab.push({ d: `M${x} ${y}Q${cx} ${cy} ${x2} ${y2}`, w, depth, mx: (x + 2 * cx + x2) / 4, my: (y + 2 * cy + y2) / 4 });
    if (depth === 0) { daun.push({ x: x2, y: y2, rute: r2 }); return; }
    const sp = [.2, .24, .28, .33][depth - 1] + R(-.04, .04);
    cabang(x2, y2, ang - sp, len * .85, w * .68, depth - 1, r2);
    cabang(x2, y2, ang + sp, len * .85, w * .68, depth - 1, r2);
  })(540, -80, 0, 330, 92, 4, 'M540 -80');
  const lapis = (stroke, tambah, extra) => cab.forEach(c => el('path', Object.assign({ d: c.d, fill: 'none', stroke, 'stroke-width': c.w + tambah, 'stroke-linecap': 'round' }, extra || {}), pohon));
  lapis(INK, 14); lapis('#FFB3C7', 0);
  cab.forEach(c => el('path', { d: c.d, fill: 'none', stroke: '#FFE3EB', 'stroke-width': Math.max(3, c.w * .22), 'stroke-linecap': 'round', transform: `translate(${-c.w * .2} 0)`, opacity: .9 }, pohon));
  const gugus = daun.map(d => { const k = el('g', {}, pohon);
    const pos = [[0, 0]].concat([0, 1, 2, 3, 4, 5].map(i => [Math.cos(i * 1.047 + .3) * 36, Math.sin(i * 1.047 + .3) * 36]));
    pos.sort((a, b) => a[1] - b[1]).forEach(([dx, dy], i) => { const r = i === 3 ? 30 : R(24, 29);
      el('circle', { cx: d.x + dx, cy: d.y + dy + 22, r, fill: 'url(#gBalon)', stroke: INK, 'stroke-width': 5 }, k);
      el('ellipse', { cx: d.x + dx - r * .35, cy: d.y + dy + 22 - r * .38, rx: r * .22, ry: r * .13, fill: '#fff', transform: `rotate(-30 ${d.x + dx - r * .35} ${d.y + dy + 22 - r * .38})` }, k); });
    return k; });

  // udara mengalir ke ujung cabang, balon mengembang
  const ud = el('g', {}, pohon);
  daun.forEach((d, i) => { const c = el('circle', { cx: 0, cy: 0, r: 13, fill: '#EAF8FF', stroke: '#4FB3FF', 'stroke-width': 5 }, ud);
    const t0 = 17.5 + (i % 8) * .32 + (i >= 8 ? .16 : 0), dur = 1.9;
    tl.fromTo(c, { opacity: 0 }, { opacity: 1, duration: .15, immediateRender: false }, t0)
      .fromTo(c, { x: 0, y: 0 }, { motionPath: { path: d.rute }, duration: dur, ease: 'power1.inOut', immediateRender: false }, t0)
      .to(c, { opacity: 0, duration: .2 }, t0 + dur - .1)
      .fromTo(gugus[i], { scale: .82, svgOrigin: `${d.x} ${d.y + 22}` }, { scale: 1.08, duration: .35, ease: 'back.out(3)', immediateRender: false }, t0 + dur - .15)
      .to(gugus[i], { scale: 1, svgOrigin: `${d.x} ${d.y + 22}`, duration: .5, ease: 'sine.inOut' }, t0 + dur + .2); });
  tl.set(ud.children, { opacity: 0 }, 0).set(gugus, { scale: .82, transformOrigin: '50% 50%' }, 0);

  // label
  const b2 = cab.filter(c => c.depth === 2 && c.mx < 540).sort((a, b) => b.mx - a.mx)[0];
  const sas = daun.filter(d => d.x > 380 && d.x < 700).sort((a, b) => b.y - a.y)[0] || daun[8];
  const Lbk = label(lb, { x: 300, y: 330, tx: b2.mx, ty: b2.my, teks: 'Bronkiolus', warna: '#FFB24D' });
  const Lalv = label(lb, { x: 540, y: 1430, tx: sas.x, ty: sas.y + 70, teks: 'Alveolus', warna: '#FF7FAE' });
  Lbk.masuk(tl, 18.4); Lalv.masuk(tl, 20.3);
  Lbk.keluar(tl, 22.05); Lalv.keluar(tl, 23.4);

  // penghitung ±480 JUTA
  const cnt = el('g', { opacity: 0 }, g);
  el('rect', { x: 170, y: 120, width: 740, height: 230, rx: 60, fill: '#fff', stroke: INK, 'stroke-width': 8 }, cnt);
  el('rect', { x: 182, y: 330, width: 716, height: 14, rx: 7, fill: INK, opacity: .2 }, cnt);
  const angka = el('text', { x: 540, y: 255, 'text-anchor': 'middle', 'font-family': 'Fredoka', 'font-weight': 700, 'font-size': 118, fill: '#FF6FA3', stroke: INK, 'stroke-width': 10, 'paint-order': 'stroke fill' }, cnt);
  angka.textContent = '±0 JUTA';
  const kecil = el('text', { x: 540, y: 318, 'text-anchor': 'middle', 'font-family': 'Nunito', 'font-weight': 900, 'font-size': 40, fill: INK }, cnt);
  kecil.textContent = 'alveolus di dua paru-paru';
  const hit = { v: 0 };
  tl.set(cnt, { opacity: 1 }, 22.3).from(cnt, { scale: 0, svgOrigin: '540 235', duration: .45, ease: 'back.out(2.2)' }, 22.3)
    .fromTo(hit, { v: 0 }, { v: 480, duration: 1.3, ease: 'power2.out', immediateRender: false, onUpdate: () => { angka.textContent = `±${Math.round(hit.v)} JUTA`; } }, 22.5)
    .to(cnt, { opacity: 0, duration: .3 }, 24.3);
  tl.add(() => { angka.textContent = '±0 JUTA'; }, 22.0);

  // masuk & keluar adegan
  tl.set(g, { opacity: 1 }, 17.0)
    .fromTo(pohon, { scale: 2.6, svgOrigin: '540 0' }, { scale: 1, duration: 1.4, ease: 'power3.out', immediateRender: false }, 17.0)
    .to(pohon, { scale: 5.2, svgOrigin: `${sas.x} ${sas.y + 22}`, x: 540 - sas.x, y: 760 - (sas.y + 22), duration: 1.4, ease: 'power2.in' }, 23.55)
    .to('#flash', { opacity: 1, duration: .2 }, 24.75).set(g, { opacity: 0 }, 25.0).to('#flash', { opacity: 0, duration: .45 }, 25.0);
  sfx('klik-lembut', 18.45, .5); sfx('pop-ganda', 19.3, .3); sfx('pop-ganda', 19.9, .3);
  sfx('klik-lembut', 20.35, .5); sfx('pop-gelembung', 20.6, .35);
  sfx('counter-angka', 22.4, .45);
  sfx('whoosh-panjang', 23.4, .45);
}

/* ================= ADEGAN 4 (25 – 37): pertukaran gas — O₂ biru masuk, CO₂ abu-abu keluar ================= */
function adegan4(tl, lb) {
  const g = $('#s4'), AC = [540, 700], AR = 320;
  grad('gJaringan', 'linearGradient', { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, '#FFE9F1'], [1, '#FFD3E1']]);
  grad('gAlv', 'radialGradient', { cx: .42, cy: .38, r: .65 }, [[0, '#FFFFFF'], [.55, '#FFEEF3'], [1, '#FFC9D8']]);
  grad('gKapiler', 'linearGradient', { gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 1080, y2: 0 }, [[0, '#A88BE6'], [.45, '#D982B6'], [.62, '#FF6F8E'], [1, '#FF5577']]);
  el('rect', { x: -1200, y: -1600, width: 3480, height: 5120, fill: 'url(#gJaringan)' }, g);
  const tetangga = el('g', {}, g);
  [[60, 300, 190], [1040, 360, 210], [90, 1500, 170], [1010, 1560, 190], [540, 1820, 160]].forEach(([x, y, r]) => { el('circle', { cx: x, cy: y, r, fill: '#FFF3F7', stroke: '#F3A9C1', 'stroke-width': 8 }, tetangga); });
  // saluran udara masuk dari atas
  el('path', { d: `M${AC[0]} -60L${AC[0]} ${AC[1] - AR + 30}`, stroke: INK, 'stroke-width': 150, fill: 'none' }, g);
  el('path', { d: `M${AC[0]} -60L${AC[0]} ${AC[1] - AR + 40}`, stroke: '#FFE6EE', 'stroke-width': 136, fill: 'none' }, g);
  // pembuluh kapiler
  const CAPD = 'M-120 1265C180 1265 250 1075 540 1075C830 1075 900 1265 1200 1265';
  el('path', { d: CAPD, stroke: INK, 'stroke-width': 188, fill: 'none' }, g);
  el('path', { d: CAPD, stroke: 'url(#gKapiler)', 'stroke-width': 172, fill: 'none' }, g);
  el('path', { d: CAPD, stroke: '#fff', 'stroke-width': 10, fill: 'none', opacity: .55, transform: 'translate(0 -58)', 'stroke-linecap': 'round' }, g);
  const cap = el('path', { d: CAPD, fill: 'none', stroke: 'none' }, g);
  // alveolus (balon besar)
  const alv = el('g', {}, g);
  el('circle', { cx: AC[0], cy: AC[1], r: AR, fill: 'url(#gAlv)', stroke: INK, 'stroke-width': 9 }, alv);
  el('circle', { cx: AC[0], cy: AC[1], r: AR - 16, fill: 'none', stroke: '#FF9DBB', 'stroke-width': 18, opacity: .45 }, alv);
  el('rect', { x: AC[0] - 64, y: AC[1] - AR - 12, width: 128, height: 50, fill: '#FFE6EE' }, alv);
  el('path', { d: `M${AC[0] - 68} ${AC[1] - AR - 20}L${AC[0] - 68} ${AC[1] - AR + 12}M${AC[0] + 68} ${AC[1] - AR - 20}L${AC[0] + 68} ${AC[1] - AR + 12}`, stroke: INK, 'stroke-width': 8 }, alv);
  el('path', { d: `M${AC[0] - 230} ${AC[1] - 120}Q${AC[0] - 200} ${AC[1] - 230} ${AC[0] - 110} ${AC[1] - 270}`, fill: 'none', stroke: '#fff', 'stroke-width': 16, 'stroke-linecap': 'round' }, alv);
  const isiAlv = el('g', {}, g); // tempat bola-bola
  const darah = el('g', {}, g);

  // sel darah merah imut yang mengalir
  const D = 5.0, sel = [];
  const buatSel = () => { const s = el('g', {}, darah);
    const luar = el('ellipse', { cx: 0, cy: 0, rx: 46, ry: 31, fill: '#C06A9E', stroke: INK, 'stroke-width': 5 }, s);
    const dalam = el('ellipse', { cx: 0, cy: 3, rx: 25, ry: 12, fill: '#9A4E80' }, s);
    el('circle', { cx: -13, cy: -9, r: 4.5, fill: INK }, s); el('circle', { cx: 13, cy: -9, r: 4.5, fill: INK }, s);
    el('path', { d: 'M-7 -1Q0 5 7 -1', fill: 'none', stroke: INK, 'stroke-width': 3.5, 'stroke-linecap': 'round' }, s);
    return { s, luar, dalam }; };
  for (let i = 0; i < 20; i++) { const c = buatSel(), s0 = 22.5 + i * .72; sel.push({ c, s0 });
    tl.set(c.s, { x: -400, y: -400 }, 0)
      .fromTo(c.s, { x: -400 }, { motionPath: { path: cap, align: cap, alignOrigin: [.5, .5], autoRotate: true }, duration: D, ease: 'none', immediateRender: false }, s0)
      .fromTo(c.luar, { attr: { fill: '#C06A9E' } }, { attr: { fill: '#FF4D6D' }, duration: .45, immediateRender: false }, s0 + D * .5)
      .fromTo(c.dalam, { attr: { fill: '#9A4E80' } }, { attr: { fill: '#E0304F' }, duration: .45, immediateRender: false }, s0 + D * .5); }
  const L = cap.getTotalLength(), titik = p => cap.getPointAtLength(p * L);

  // O₂ masuk ke darah dan menumpang di sel darah merah
  const o2 = [];
  [4, 5, 6, 7, 8].forEach((idx, k) => { const b = bola(isiAlv, 'o2'), { s0 } = sel[idx], tiba = s0 + D * .5, q = titik(.5);
    const x0 = AC[0] + R(-200, 200), y0 = AC[1] + R(-170, 120);
    o2.push(b);
    tl.set(b, { x: x0, y: y0, opacity: 0 }, 0)
      .fromTo(b, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: .4, ease: 'back.out(2.5)', immediateRender: false }, 26.6 + k * .14)
      .to(b, { y: '-=18', duration: .7, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 27.0 + k * .1)
      .to(b, { x: q.x, y: q.y - 40, duration: 1.0, ease: 'power2.inOut' }, tiba - 1.0)
      .fromTo(b, { x: q.x }, { motionPath: { path: cap, align: cap, alignOrigin: [.5, 1], start: .5, end: 1 }, duration: D * .5, ease: 'none', immediateRender: false }, tiba);
    sfx(k === 0 ? 'notif-sukses' : 'pop-gelembung', tiba, k === 0 ? .32 : .4); });
  // CO₂ menumpang di sel darah, lalu keluar ke alveolus
  [11, 12, 13, 14].forEach((idx, k) => { const b = bola(darah, 'co2'), { s0 } = sel[idx], lepas = s0 + D * .42, q = titik(.42);
    const tx = AC[0] + R(-170, 170), ty = AC[1] + R(-120, 60);
    tl.set(b, { x: -400, y: -400 }, 0)
      .fromTo(b, { x: -400 }, { motionPath: { path: cap, align: cap, alignOrigin: [.5, 1], start: 0, end: .42 }, duration: D * .42, ease: 'none', immediateRender: false }, s0)
      .to(b, { x: tx, y: ty, duration: 1.0, ease: 'power2.out' }, lepas)
      .to(b, { y: '-=24', duration: .6, yoyo: true, repeat: 1, ease: 'sine.inOut' }, lepas + 1.0)
      .to(b, { x: AC[0] + R(-40, 40), y: AC[1] - AR - 260, duration: 1.4, ease: 'power2.in' }, 35.4 + k * .12);
    sfx('swish-tipis', lepas, .45); });

  // legenda & label
  const leg = el('g', {}, g);
  const c1 = chipLegenda(leg, 300, 150, 'o2', 'Oksigen'), c2 = chipLegenda(leg, 740, 150, 'co2', 'Karbon dioksida');
  tl.from(c1, { scale: 0, svgOrigin: '300 150', duration: .45, ease: 'back.out(2.4)' }, 27.3)
    .from(c2, { scale: 0, svgOrigin: '740 150', duration: .45, ease: 'back.out(2.4)' }, 31.9);
  const La = label(lb, { x: 230, y: 420, tx: 330, ty: 560, teks: 'Alveolus', warna: '#FF7FAE' });
  const Lk = label(lb, { x: 320, y: 1450, tx: 250, ty: 1215, teks: 'Pembuluh kapiler', warna: '#A88BE6' });
  const Ls = label(lb, { x: 740, y: 1440, tx: 880, ty: 1205, teks: 'Sel darah merah', warna: '#FF4D6D', fs: 46 });
  La.masuk(tl, 25.6); Lk.masuk(tl, 26.2); La.keluar(tl, 29.6); Lk.keluar(tl, 29.6);
  Ls.masuk(tl, 30.25); Ls.keluar(tl, 32.0);

  tl.set(g, { opacity: 1 }, 25.0)
    .fromTo(g, { scale: .55, svgOrigin: '540 760' }, { scale: 1, duration: 1.1, ease: 'power3.out', immediateRender: false }, 25.0)
    .fromTo(alv, { scale: .92, svgOrigin: `${AC[0]} ${AC[1]}` }, { scale: 1.02, duration: 1.5, yoyo: true, repeat: 6, ease: 'sine.inOut', immediateRender: false }, 25.2)
    .to(g, { scale: .25, svgOrigin: '540 760', opacity: 0, duration: .8, ease: 'power2.in' }, 36.6);
  sfx('klik-lembut', 25.65, .5); sfx('klik-lembut', 26.25, .5); sfx('teks-muncul', 27.3, .4);
  sfx('klik-lembut', 30.3, .5); sfx('teks-muncul', 31.9, .4);
  sfx('swoosh-naik', 35.4, .35);
}

/* ================= ADEGAN 5 (37 – 45): kamera keluar, embuskan napas, penutup ================= */
function adegan5(tl, lb) {
  tl.set('#a1', { opacity: 1 }, 37.0)
    .to('#dunia', { scale: 1, svgOrigin: '540 852', duration: 1.4, ease: 'power3.out' }, 37.0)
    .to('#bokeh', { scale: 1, svgOrigin: '540 852', opacity: 1, duration: 1.2, ease: 'power2.out' }, 37.0)
    .to('#garisCepat', { opacity: 0, duration: .5 }, 37.0)
    .set('#lubangHidung', { opacity: 0 }, 38.2).to('#hidungGaris', { opacity: 1, duration: .2 }, 38.2);
  // diafragma muncul, lalu naik saat mengembuskan napas
  tl.to('#diafragma', { y: 0, duration: 2.2, ease: 'sine.inOut' }, 38.7)
    .to('#paruGrup', { scaleX: 1, scaleY: 1, svgOrigin: '540 1195', duration: 2.2, ease: 'sine.inOut' }, 38.7)
    .set('#mataB', { opacity: 0 }, 38.6).set('#mataT', { opacity: 1 }, 38.6)
    .set('#mataB', { opacity: 1 }, 41.2).set('#mataT', { opacity: 0 }, 41.2);
  // kepulan CO₂ keluar dari hidung
  const kep = $('#kepulan');
  for (let i = 0; i < 6; i++) { const w = el('g', {}, kep); awan(w, 1, '#D3D7E2');
    const t = el('text', { x: 0, y: 12, 'text-anchor': 'middle', 'font-family': 'Fredoka', 'font-weight': 700, 'font-size': 24, fill: '#fff', stroke: INK, 'stroke-width': 6, 'paint-order': 'stroke fill' }, w); t.textContent = 'CO₂';
    const path = i % 2 ? '#ud2' : '#ud1', t0 = 38.8 + i * .34;
    tl.set(w, { opacity: 0 }, 0)
      .fromTo(w, { opacity: 0 }, { opacity: 1, duration: .15, immediateRender: false }, t0)
      .fromTo(w, { scale: .3 }, { motionPath: { path, align: path, alignOrigin: [.5, .5], start: 1, end: 0 }, scale: 1.25, duration: 1.3, ease: 'power1.out', immediateRender: false }, t0)
      .to(w, { opacity: 0, duration: .25 }, t0 + 1.1); }
  const Ld = label(lb, { x: 200, y: 1430, tx: 372, ty: 1530, teks: 'Diafragma', warna: '#FF9F8E' });
  Ld.masuk(tl, 39.3); Ld.keluar(tl, 42.2);
  // penutup
  tl.set('#akhir', { opacity: 1 }, 42.3)
    .from('#akhir .l1', { y: -60, opacity: 0, duration: .45, ease: 'back.out(2)' }, 42.3)
    .from('#akhir .a', { scale: .3, opacity: 0, duration: .55, ease: 'back.out(2.2)', transformOrigin: '50% 50%' }, 42.5)
    .from('#akhir .b', { scale: .3, opacity: 0, duration: .55, ease: 'back.out(2.2)', transformOrigin: '50% 50%' }, 42.85)
    .to('#akhir .a, #akhir .b', { rotation: 2, duration: .45, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 43.4);
  sfx('whoosh-panjang', 36.7, .45); sfx('klik-lembut', 39.35, .5);
  sfx('swoosh-turun', 38.8, .35); sfx('swoosh-turun', 39.6, .3);
  sfx('logo-sting', 42.3, .45);
}
