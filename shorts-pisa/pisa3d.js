// Menara Miring Pisa 3D (Three.js, tanpa layanan AI). Semua tekstur dibuat prosedural.
// Ukuran mengikuti menara asli: tinggi ±56 m, diameter dasar ±15,5 m, 8 tingkat
// (lantai dasar 15 lengkung buta, 6 galeri × 30 kolom, ruang lonceng), miring 3,97°.
(function () {
  const W = 1080, H = 1920;
  const T = THREE;

  // ---------- util acak & noise (periodik supaya tekstur bisa diulang mulus) ----------
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function noise2(px, py, seed) {
    const r = rng(seed), g = new Float32Array(px * py); for (let i = 0; i < g.length; i++) g[i] = r();
    return (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      const x0 = ((xi % px) + px) % px, x1 = (x0 + 1) % px, y0 = ((yi % py) + py) % py, y1 = (y0 + 1) % py;
      const a = g[y0 * px + x0], b = g[y0 * px + x1], c = g[y1 * px + x0], d = g[y1 * px + x1];
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
  }
  function fbmMaker(px, py, seed, oct = 5) {
    const ns = []; for (let o = 0; o < oct; o++) ns.push(noise2(px << o, py << o, seed + o * 101));
    return (u, v) => { let s = 0, a = 0.5, n = 0; for (let o = 0; o < oct; o++) { s += a * ns[o](u * (px << o), v * (py << o)); n += a; a *= 0.5; } return s / n; };
  }
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;

  // ---------- pelukis dinding marmer ----------
  // opts: wM,hM (meter), px per meter, course (tinggi batu), seed, deco(xM,yM,ctx) -> {dc, dh, a, tint}
  function paintMarble(opts) {
    const ppm = opts.ppm, w = Math.round(opts.wM * ppm), h = Math.round(opts.hM * ppm);
    const perX = Math.max(1, Math.round(opts.wM * 1.2)), perY = Math.max(1, Math.round(opts.hM * 1.2));
    const fb = fbmMaker(perX, perY, opts.seed, 5);
    const vein = fbmMaker(perX * 2, perY, opts.seed + 7, 4);
    const streak = fbmMaker(perX * 6, Math.max(1, Math.round(perY / 3)), opts.seed + 13, 3);
    const col = new Float32Array(w * h * 3), hei = new Float32Array(w * h), alp = new Float32Array(w * h).fill(1);
    const course = opts.course || 0.55;
    const r = rng(opts.seed + 99);
    const nCourses = Math.ceil(opts.hM / course) + 1;
    const offs = []; for (let i = 0; i < nCourses; i++) offs.push(r());
    const base = opts.base || [0.93, 0.905, 0.85];
    for (let y = 0; y < h; y++) {
      const yM = opts.hM - (y + 0.5) / ppm;           // meter dari bawah
      const ci = Math.floor(yM / course), cy = yM - ci * course;
      const blockW = 0.9 + offs[ci % nCourses] * 0.7;
      for (let x = 0; x < w; x++) {
        const xM = (x + 0.5) / ppm, u = x / w, v = y / h, i = y * w + x;
        const n = fb(u, v);
        const vv = Math.abs(Math.sin((u * 3 + v * 1.3 + vein(u, v) * 3.5) * Math.PI * 2));
        const veinD = Math.pow(1 - vv, 18) * 0.22;
        const st = streak(u, v);
        let k = 0.93 + n * 0.12 - veinD;
        k *= mix(1, 0.86, smooth(0.45, 0.75, st));    // noda luntur vertikal
        // bata/blok: tiap course sedikit beda warna
        const bx = (xM + offs[ci % nCourses] * 3) / blockW, bi = Math.floor(bx);
        const bt = rng((ci * 131 + bi) * 7 + opts.seed)(); k *= 0.965 + bt * 0.06;
        let hh = n * 0.25;
        if (opts.joints !== false) {
          const jy = Math.min(cy, course - cy), jx = Math.min(bx - bi, 1 - (bx - bi)) * blockW;
          const j = Math.min(jy, jx);
          if (j < 0.012) { hh -= 0.8; k *= 0.82; } else if (j < 0.03) { hh -= 0.8 * (1 - (j - 0.012) / 0.018); }
        }
        let c = [base[0] * k, base[1] * k, base[2] * k * (0.98 + n * 0.03)];
        if (opts.deco) {
          const d = opts.deco(xM, yM, n);
          if (d) {
            if (d.a !== undefined) alp[i] = d.a;
            if (d.h !== undefined) hh += d.h;
            if (d.mul !== undefined) { c[0] *= d.mul; c[1] *= d.mul; c[2] *= d.mul; }
            if (d.rgb) { const t = d.t === undefined ? 1 : d.t; c = [mix(c[0], d.rgb[0] * (0.85 + n * 0.3), t), mix(c[1], d.rgb[1] * (0.85 + n * 0.3), t), mix(c[2], d.rgb[2] * (0.85 + n * 0.3), t)]; }
          }
        }
        if (opts.ao) { const a = opts.ao(yM); c[0] *= a; c[1] *= a; c[2] *= a; }
        col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; hei[i] = hh;
      }
    }
    return toTextures(w, h, col, hei, alp, opts.normalStrength || 3, opts.repeatX || 1);
  }

  function toTextures(w, h, col, hei, alp, strength, repeatX) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const nv = document.createElement('canvas'); nv.width = w; nv.height = h;
    const cx = cv.getContext('2d'), nx = nv.getContext('2d');
    const ci = cx.createImageData(w, h), ni = nx.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      ci.data[i * 4] = Math.min(255, col[i * 3] * 255); ci.data[i * 4 + 1] = Math.min(255, col[i * 3 + 1] * 255);
      ci.data[i * 4 + 2] = Math.min(255, col[i * 3 + 2] * 255); ci.data[i * 4 + 3] = alp[i] * 255;
      const xl = hei[y * w + (x - 1 + w) % w], xr = hei[y * w + (x + 1) % w];
      const yu = hei[Math.max(0, y - 1) * w + x], yd = hei[Math.min(h - 1, y + 1) * w + x];
      let ddx = (xr - xl) * strength, ddy = (yu - yd) * strength;
      const l = Math.hypot(ddx, ddy, 1);
      ni.data[i * 4] = (-ddx / l * 0.5 + 0.5) * 255; ni.data[i * 4 + 1] = (-ddy / l * 0.5 + 0.5) * 255;
      ni.data[i * 4 + 2] = (1 / l * 0.5 + 0.5) * 255; ni.data[i * 4 + 3] = 255;
    }
    cx.putImageData(ci, 0, 0); nx.putImageData(ni, 0, 0);
    const map = new T.CanvasTexture(cv); map.colorSpace = T.SRGBColorSpace;
    const nrm = new T.CanvasTexture(nv);
    for (const t of [map, nrm]) { t.wrapS = T.RepeatWrapping; t.wrapT = T.ClampToEdgeWrapping; t.repeat.set(repeatX, 1); t.anisotropy = 8; }
    return { map, nrm };
  }

  // ---------- dimensi menara ----------
  const R0 = 7.74;          // jari-jari luar lantai dasar
  const PLINTH = 0.55;
  const G_TOP = 11.0;       // atap lantai dasar
  const FL = 6.4;           // tinggi tiap galeri
  const NG = 6;
  const BELL_Y = G_TOP + NG * FL; // 49.4
  const BELL_H = 5.9, BELL_R = 4.85;
  const TOP_Y = BELL_Y + BELL_H + 0.55;  // ±55.9
  const LEAN = 3.97 * Math.PI / 180;

  function mat(tex, o = {}) {
    return new T.MeshStandardMaterial(Object.assign({ map: tex.map, normalMap: tex.nrm, normalScale: new T.Vector2(0.9, 0.9), roughness: 0.62, metalness: 0 }, o));
  }

  function buildTower() {
    const tower = new T.Group();
    const marbleGeneric = paintMarble({ wM: 4, hM: 1.2, ppm: 128, seed: 3, course: 0.4, repeatX: 1 });
    marbleGeneric.map.wrapT = marbleGeneric.nrm.wrapT = T.RepeatWrapping;
    const mGen = mat(marbleGeneric);
    const cyl = (r1, r2, h, y, m, seg = 96, open = false, repX = 1) => {
      const g = new T.CylinderGeometry(r1, r2, h, seg, 1, open);
      const mesh = new T.Mesh(g, m); mesh.position.y = y + h / 2; mesh.castShadow = mesh.receiveShadow = true; tower.add(mesh); return mesh;
    };
    const cornice = (r, y, h = 0.42) => {
      const m = mGen.clone(); m.map = m.map.clone(); m.map.repeat.set(Math.round(r * 2), 1); m.map.needsUpdate = true;
      cyl(r, r - 0.12, h * 0.45, y, m); cyl(r - 0.12, r - 0.2, h * 0.55, y + h * 0.45, m);
      const top = new T.Mesh(new T.RingGeometry(r - 2.2, r, 96), m); top.rotation.x = -Math.PI / 2; top.position.y = y + h; tower.add(top); top.receiveShadow = true;
    };

    // Plinth bertingkat
    cyl(R0 + 0.55, R0 + 0.6, PLINTH * 0.5, 0, mGen); cyl(R0 + 0.3, R0 + 0.35, PLINTH * 0.5, PLINTH * 0.5, mGen);

    // ---- Lantai dasar: 15 lengkung buta + belah ketupat ----
    const bayG = 2 * Math.PI * R0 / 15, gH = G_TOP - PLINTH - 0.42;
    const gTex = paintMarble({
      wM: bayG, hM: gH, ppm: 150, seed: 11, course: 0.5, repeatX: 15, normalStrength: 4,
      deco: (x, y) => {
        const cx = bayG / 2, hw = bayG / 2 - 0.5, spring = 7.35;
        const dx = Math.abs(x - cx);
        // lengkung buta (cekung)
        let inside = false, edge = 9;
        if (y < spring) { inside = dx < hw && y > 0.0; edge = hw - dx; }
        else { const d = Math.hypot(dx, y - spring); inside = d < hw; edge = hw - d; }
        let res = {};
        // garis-garis abu-putih khas lantai dasar
        const band = Math.floor(y / 0.55) % 2 === 0;
        if (band && y < spring + hw + 0.4) res.mul = 0.93;
        if (inside) {
          res.h = -1.2; res.mul = (res.mul || 1) * 0.86;
          if (edge < 0.05) res.mul *= 0.75;
          // belah ketupat di lunet
          const ly = spring + 0.48, ddx = Math.abs(x - cx) / 0.46, ddy = Math.abs(y - ly) / 0.46;
          const dd = ddx + ddy;
          if (dd < 1) {
            res.h = -0.6;
            if (dd > 0.82) { res.rgb = [0.38, 0.4, 0.37]; res.t = 0.85; }
            else if (dd < 0.45) { res.rgb = [0.36, 0.38, 0.35]; res.t = 0.7; }
          }
        } else if (edge > -0.09 && edge < 0) { res.h = 0.5; res.mul = (res.mul || 1) * 1.03; }   // archivolt
        return res;
      }
    });
    const gMat = mat(gTex);
    cyl(R0, R0, gH, PLINTH, gMat, 150, true, 15);
    // kolom menempel (half-columns) 15 buah
    const colG = new T.CylinderGeometry(0.36, 0.38, 7.0, 16), capG = new T.CylinderGeometry(0.5, 0.36, 0.45, 16), baseG = new T.CylinderGeometry(0.46, 0.5, 0.35, 16);
    for (let i = 0; i < 15; i++) {
      const a = i / 15 * Math.PI * 2;
      const x = Math.sin(a) * (R0 + 0.12), z = Math.cos(a) * (R0 + 0.12);
      for (const [g, y] of [[baseG, PLINTH + 0.17], [colG, PLINTH + 0.35 + 3.5], [capG, PLINTH + 0.35 + 7.0 + 0.22]]) {
        const m = new T.Mesh(g, mGen); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; tower.add(m);
      }
    }
    // pintu menghadap kamera
    const door = new T.Mesh(new T.BoxGeometry(1.7, 3.4, 0.3), new T.MeshStandardMaterial({ color: 0x1d1410, roughness: 0.8 }));
    const dA = 0.18; door.position.set(Math.sin(dA) * (R0 - 0.08), PLINTH + 1.7, Math.cos(dA) * (R0 - 0.08)); door.rotation.y = dA; tower.add(door);
    const lintel = new T.Mesh(new T.BoxGeometry(2.2, 0.35, 0.4), mGen); lintel.position.set(Math.sin(dA) * (R0 - 0.02), PLINTH + 3.55, Math.cos(dA) * (R0 - 0.02)); lintel.rotation.y = dA; lintel.castShadow = true; tower.add(lintel);
    cornice(R0 + 0.28, G_TOP - 0.42, 0.42);

    // ---- 6 galeri ----
    const RC = 7.5, RW = 6.15, N = 30, bay = 2 * Math.PI * RC / N;
    const colH = 3.95, bandH = 1.5;
    const bandTex = paintMarble({
      wM: bay, hM: bandH, ppm: 170, seed: 21, course: 0.5, repeatX: N, normalStrength: 4,
      deco: (x, y) => {
        const cx = bay / 2, r = bay / 2 - 0.1, d = Math.hypot(x - cx, y);
        if (d < r) return { a: 0 };
        let res = {};
        if (d < r + 0.09) { res.h = 0.6; res.mul = 0.97; if (d < r + 0.025) res.mul = 0.8; }
        // medali kecil di bidang segitiga antar-lengkung
        const md = Math.min(Math.hypot(x, y - 0.98), Math.hypot(x - bay, y - 0.98));
        if (md < 0.1) { res.rgb = [0.4, 0.42, 0.4]; res.t = 0.8; res.h = -0.4; }
        return res;
      }
    });
    const bandMat = mat(bandTex, { alphaTest: 0.5, side: T.DoubleSide });
    const innerTex = paintMarble({
      wM: 2 * Math.PI * RW / 10, hM: FL, ppm: 110, seed: 31, course: 0.5, repeatX: 10, normalStrength: 3,
      deco: (x, y) => {
        const cx = Math.PI * RW / 10, hw = 0.5, top = 0.42 + 2.3;
        const dx = Math.abs(x - cx);
        if (cx > 0 && y > 2.2 && y < 2.9 && dx < 0.18) return { rgb: [0.03, 0.025, 0.02], t: 1, h: -1 };  // jendela kecil
        return null;
      },
      ao: y => 0.55 + 0.45 * smooth(FL, FL - 1.6, y) * smooth(0.1, 0.6, y)
    });
    const innerMat = mat(innerTex, { color: new T.Color(0.62, 0.6, 0.57) });
    const colGeo = new T.CylinderGeometry(0.15, 0.17, colH - 0.5, 12), capGeo = new T.CylinderGeometry(0.27, 0.16, 0.3, 12), abGeo = new T.BoxGeometry(0.56, 0.12, 0.56), cbGeo = new T.CylinderGeometry(0.22, 0.26, 0.2, 12);
    const instCol = new T.InstancedMesh(colGeo, mGen, N * NG), instCap = new T.InstancedMesh(capGeo, mGen, N * NG), instAb = new T.InstancedMesh(abGeo, mGen, N * NG), instCb = new T.InstancedMesh(cbGeo, mGen, N * NG);
    const M4 = new T.Matrix4(), Q = new T.Quaternion(), S1 = new T.Vector3(1, 1, 1);
    let k = 0;
    for (let f = 0; f < NG; f++) {
      const y0 = G_TOP + f * FL;
      const floor = new T.Mesh(new T.RingGeometry(RW, RC + 0.35, 96), mGen); floor.rotation.x = -Math.PI / 2; floor.position.y = y0 + 0.36; floor.receiveShadow = true; tower.add(floor);
      cyl(RC + 0.32, RC + 0.36, 0.36, y0, mGen);                                   // alas kolonade
      cyl(RW, RW, FL, y0, innerMat, 120, true);                                    // dinding dalam
      const bY = y0 + 0.36 + colH;
      cyl(RC + 0.14, RC + 0.14, bandH, bY, bandMat, 180, true);                    // lengkungan (muka luar)
      cyl(RC - 0.24, RC - 0.24, bandH, bY, bandMat, 180, true);                    // tebal lengkung
      const ceil = new T.Mesh(new T.RingGeometry(RW, RC + 0.15, 96), new T.MeshStandardMaterial({ color: 0x6d675e, roughness: 0.9, side: T.DoubleSide })); ceil.rotation.x = Math.PI / 2; ceil.position.y = bY + bandH - 0.01; tower.add(ceil);
      cornice(RC + 0.42, bY + bandH, FL - 0.36 - colH - bandH);
      for (let i = 0; i < N; i++) {
        const a = (i + (f % 2) * 0) / N * Math.PI * 2;
        const x = Math.sin(a) * RC, z = Math.cos(a) * RC;
        Q.setFromAxisAngle(new T.Vector3(0, 1, 0), a);
        M4.compose(new T.Vector3(x, y0 + 0.36 + 0.1, z), Q, S1); instCb.setMatrixAt(k, M4);
        M4.compose(new T.Vector3(x, y0 + 0.36 + 0.2 + (colH - 0.5) / 2, z), Q, S1); instCol.setMatrixAt(k, M4);
        M4.compose(new T.Vector3(x, y0 + 0.36 + colH - 0.27, z), Q, S1); instCap.setMatrixAt(k, M4);
        M4.compose(new T.Vector3(x, y0 + 0.36 + colH - 0.06, z), Q, S1); instAb.setMatrixAt(k, M4);
        k++;
      }
    }
    for (const im of [instCol, instCap, instAb, instCb]) { im.castShadow = im.receiveShadow = true; tower.add(im); }

    // ---- teras atas + ruang lonceng ----
    const terrace = new T.Mesh(new T.CircleGeometry(RC + 0.3, 96), mGen); terrace.rotation.x = -Math.PI / 2; terrace.position.y = BELL_Y + 0.02; terrace.receiveShadow = true; tower.add(terrace);
    const rail = new T.Mesh(new T.TorusGeometry(RC + 0.1, 0.03, 6, 160), new T.MeshStandardMaterial({ color: 0x22201d, metalness: 0.6, roughness: 0.5 })); rail.rotation.x = Math.PI / 2; rail.position.y = BELL_Y + 1.05; tower.add(rail);
    const postG = new T.CylinderGeometry(0.025, 0.025, 1.05, 4), pm = rail.material;
    const posts = new T.InstancedMesh(postG, pm, 90);
    for (let i = 0; i < 90; i++) { const a = i / 90 * Math.PI * 2; M4.compose(new T.Vector3(Math.sin(a) * (RC + 0.1), BELL_Y + 0.52, Math.cos(a) * (RC + 0.1)), new T.Quaternion(), S1); posts.setMatrixAt(i, M4); }
    tower.add(posts);
    const bellBay = 2 * Math.PI * BELL_R / 12;
    const bellTex = paintMarble({
      wM: bellBay, hM: BELL_H, ppm: 150, seed: 41, course: 0.5, repeatX: 12, normalStrength: 4,
      deco: (x, y) => {
        const cx = bellBay / 2, hw = 0.68, spring = 3.75, dx = Math.abs(x - cx);
        const d = y < spring ? (y > 0.9 && dx < hw ? 0 : 9) : Math.hypot(dx, y - spring) - hw;
        if (d < 0) return { a: 0 };
        let res = {};
        if (d < 0.1) { res.h = 0.6; res.mul = d < 0.03 ? 0.8 : 0.97; }
        const pil = Math.min(x, bellBay - x); if (pil < 0.22) { res.h = (res.h || 0) + 0.8; res.mul = (res.mul || 1) * 1.02; }
        return res;
      }
    });
    const bellMat = mat(bellTex, { alphaTest: 0.5, side: T.DoubleSide });
    cyl(BELL_R, BELL_R, BELL_H, BELL_Y, bellMat, 144, true);
    cyl(BELL_R - 0.5, BELL_R - 0.5, BELL_H, BELL_Y, bellMat, 144, true);
    const dark = new T.Mesh(new T.CylinderGeometry(BELL_R - 0.55, BELL_R - 0.55, BELL_H, 48, 1, true), new T.MeshStandardMaterial({ color: 0x0b0908, roughness: 1, side: T.BackSide }));
    dark.position.y = BELL_Y + BELL_H / 2; tower.add(dark);
    // lonceng perunggu
    const bellG = new T.LatheGeometry([[0, 1.1], [0.25, 1.05], [0.42, 0.75], [0.48, 0.25], [0.66, 0]].map(p => new T.Vector2(p[0], p[1])), 24);
    const bronze = new T.MeshStandardMaterial({ color: 0x5a4126, metalness: 0.85, roughness: 0.45 });
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.3; const b = new T.Mesh(bellG, bronze); b.position.set(Math.sin(a) * 2.6, BELL_Y + 2.6, Math.cos(a) * 2.6); tower.add(b); }
    cornice(BELL_R + 0.3, BELL_Y + BELL_H, 0.55);
    const roof = new T.Mesh(new T.CircleGeometry(BELL_R + 0.2, 64), mGen); roof.rotation.x = -Math.PI / 2; roof.position.y = TOP_Y; tower.add(roof);
    const rail2 = rail.clone(); rail2.geometry = new T.TorusGeometry(BELL_R + 0.05, 0.03, 6, 120); rail2.position.y = TOP_Y + 0.9; tower.add(rail2);

    // fondasi dangkal: drum batu ±3 m di bawah lantai dasar (ikut berotasi bersama menara)
    const fTex = paintMarble({ wM: 6, hM: 3, ppm: 60, seed: 5, course: 0.6, repeatX: 10, base: [0.62, 0.58, 0.52] });
    const found = new T.Mesh(new T.CylinderGeometry(9.8, 9.8, 3, 96), mat(fTex));
    found.position.y = -1.5; found.castShadow = found.receiveShadow = true; tower.add(found);
    const pivot = new T.Group(); pivot.add(tower); pivot.rotation.z = -LEAN; // miring ke +X (kanan layar)
    pivot.userData.tower = tower;
    // potongan atas (untuk menara yang belum selesai, 1178)
    const clipTop = new T.Plane(new T.Vector3(0, -1, 0), 1e5);
    tower.traverse(o => { if (o.material) { o.material.clippingPlanes = [clipTop]; o.material.clipShadows = true; if (o.material.side === T.FrontSide) o.material.side = T.DoubleSide; } });
    pivot.userData.clipTop = clipTop;
    return pivot;
  }

  // ---------- tanah, jalan, latar ----------
  function canvasTex(w, h, fn, rep) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const cx = cv.getContext('2d'); const im = cx.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = fn(x / w, y / h); const i = (y * w + x) * 4; im.data[i] = c[0] * 255; im.data[i + 1] = c[1] * 255; im.data[i + 2] = c[2] * 255; im.data[i + 3] = (c[3] === undefined ? 1 : c[3]) * 255; }
    cx.putImageData(im, 0, 0); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; if (rep) t.repeat.set(rep[0], rep[1]); t.anisotropy = 8; return t;
  }

  const clipZ = new T.Plane(new T.Vector3(0, 0, -1), 1e5);   // memotong tanah: simpan z <= konstanta
  const groups = {};
  function buildGround(scene) {
    const modern = new T.Group(), bg = new T.Group(); scene.add(modern, bg); groups.modern = modern; groups.bg = bg;
    const g1 = fbmMaker(8, 8, 51, 5), g2 = fbmMaker(64, 64, 52, 3);
    const grass = canvasTex(512, 512, (u, v) => { const n = g1(u, v), m = g2(u, v); const stripe = (Math.floor(u * 4) % 2) ? 1.06 : 0.94; const k = (0.72 + n * 0.45 + (m - 0.5) * 0.4) * stripe; return [0.25 * k, 0.32 * k, 0.1 * k]; }, [90, 90]);
    const lawn = new T.Mesh(new T.PlaneGeometry(1600, 1600), new T.MeshStandardMaterial({ map: grass, roughness: 0.95 }));
    lawn.rotation.x = -Math.PI / 2; lawn.receiveShadow = true; scene.add(lawn); groups.lawn = lawn;
    // jalan batu dari kamera ke menara
    const s1 = fbmMaker(4, 16, 61, 4);
    const stone = canvasTex(256, 1024, (u, v) => {
      const row = Math.floor(v * 16), off = (row % 2) * 0.5, col = Math.floor(u * 3 + off);
      const fy = v * 16 - row, fx = u * 3 + off - col; const j = Math.min(fy, 1 - fy, fx * 0.33, (1 - fx) * 0.33);
      const r = rng(row * 17 + col)(); const n = s1(u, v); let k = 0.55 + r * 0.12 + n * 0.25; if (j < 0.03) k *= 0.45;
      return [0.62 * k, 0.56 * k, 0.48 * k];
    }, [3, 30]);
    const path = new T.Mesh(new T.PlaneGeometry(9, 240), new T.MeshStandardMaterial({ map: stone, roughness: 0.85 }));
    path.rotation.x = -Math.PI / 2; path.position.set(4, 0.02, 120 + 6); path.receiveShadow = true; modern.add(path);
    const ring = new T.Mesh(new T.RingGeometry(R0 + 0.5, 15, 96), new T.MeshStandardMaterial({ map: stone, roughness: 0.85 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.025; ring.receiveShadow = true; modern.add(ring);
    // tiang & rantai pembatas (bayangan panjang)
    const postM = new T.MeshStandardMaterial({ color: 0x1a1714, roughness: 0.6, metalness: 0.4 });
    const pg = new T.CylinderGeometry(0.035, 0.045, 0.6, 6);
    for (const side of [-1, 1]) for (let z = 16; z < 240; z += 3.2) {
      const p = new T.Mesh(pg, postM); p.position.set(4 + side * 4.8, 0.3, z); p.castShadow = true; modern.add(p);
      const pts = []; for (let k = 0; k <= 8; k++) { const f = k / 8; pts.push(new T.Vector3(4 + side * 4.8, 0.55 - Math.sin(f * Math.PI) * 0.18, z + f * 3.2)); }
      const ch = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 8, 0.012, 3), postM); ch.castShadow = true; modern.add(ch);
    }
    // Camposanto & tembok kota di belakang (siluet terkena kabut)
    const wallTex = paintMarble({ wM: 6, hM: 11, ppm: 40, seed: 71, course: 0.6, repeatX: 50, joints: false,
      deco: (x, y) => { const cx = 3, hw = 1.7, sp = 6.2, dx = Math.abs(x - cx); const ins = (y < sp && y > 0 && dx < hw) || Math.hypot(dx, y - sp) < hw; return ins ? { mul: 0.72, h: -1 } : null; } });
    const camposanto = new T.Mesh(new T.BoxGeometry(300, 11, 8), mat(wallTex, { color: new T.Color(0.55, 0.5, 0.45) }));
    camposanto.position.set(-30, 5.5, -150); camposanto.receiveShadow = camposanto.castShadow = true; modern.add(camposanto); // Camposanto baru dibangun 1278
    const cityWall = new T.Mesh(new T.BoxGeometry(900, 12, 3), new T.MeshStandardMaterial({ color: 0x8a6b4e, roughness: 1 }));
    cityWall.position.set(0, 6, -230); bg.add(cityWall);
    // pohon cemara
    const cyp = new T.MeshStandardMaterial({ color: 0x0c140a, roughness: 1 });
    const r = rng(81);
    for (let i = 0; i < 34; i++) {
      const side = i % 2 ? 1 : -1, x = side * (20 + r() * 170), z = -175 - r() * 60, h = 15 + r() * 9;
      const c = new T.Mesh(new T.SphereGeometry(1, 14, 10), cyp);
      if (r() < 0.75) { c.scale.set(1.8 + r(), h / 2, 1.8 + r()); c.position.set(x, h / 2, z); }          // cemara
      else { c.scale.set(5 + r() * 3, 2.2 + r(), 5 + r() * 3); c.position.set(x, h * 0.75, z);           // pinus payung
        const tr = new T.Mesh(new T.CylinderGeometry(0.3, 0.4, h * 0.75, 6), cyp); tr.position.set(x, h * 0.37, z); bg.add(tr); }
      c.castShadow = true; bg.add(c);
    }
    for (const o of [lawn, modern]) o.traverse(m => { if (m.material) { m.material.clippingPlanes = [clipZ]; m.material.clipShadows = true; } });
    // muka potongan tanah (lapisan menurut Burland: ±6 m lanau Arno, ±30 m lempung laut lunak, lalu pasir padat)
    const sf = fbmMaker(16, 16, 201, 5), sg = fbmMaker(128, 64, 202, 2);
    const soilTex = canvasTex(1024, 1024, (u, v) => {
      const y = -v * 80, n = sf(u, v), g = sg(u, v);
      let c;
      if (y > -0.6) c = [0.2, 0.15, 0.09];                                            // tanah atas
      else if (y > -6 + (n - 0.5) * 0.8) c = [0.5, 0.39, 0.25];                           // lanau & pasir
      else if (y > -36 + (n - 0.5) * 1.5) { const lam = 0.94 + 0.06 * Math.sin(y * 9 + n * 6); c = [0.33 * lam, 0.35 * lam, 0.36 * lam]; } // lempung laut lunak
      else c = [0.6, 0.52, 0.36];                                                       // pasir padat
      const k = 0.8 + n * 0.3 + (g - 0.5) * 0.25; return [c[0] * k, c[1] * k, c[2] * k];
    }, [4, 1]);
    soilTex.wrapT = T.ClampToEdgeWrapping;
    const cap = new T.Mesh(new T.PlaneGeometry(400, 80), new T.MeshStandardMaterial({ map: soilTex, roughness: 1, emissive: 0xffffff, emissiveMap: soilTex, emissiveIntensity: 0.25 }));
    cap.position.set(0, -40.02, 0); cap.visible = false; scene.add(cap); groups.cap = cap;
  }

  // ---------- perancah kayu (masa pembangunan 1178) ----------
  function buildScaffold(scene) {
    const g = new T.Group(), m = new T.MeshStandardMaterial({ color: 0x5a3f28, roughness: 0.9 });
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2, r = 9.2;
      const p = new T.Mesh(new T.CylinderGeometry(0.09, 0.11, 27, 5), m); p.position.set(Math.sin(a) * r, 13.5, Math.cos(a) * r); p.castShadow = true; g.add(p);
    }
    for (let y = 3; y < 27; y += 3.2) { const t = new T.Mesh(new T.TorusGeometry(9.2, 0.06, 4, 48), m); t.rotation.x = Math.PI / 2; t.position.y = y; g.add(t); }
    g.visible = false; scene.add(g); return g;
  }

  // ---------- kabel baja penahan (1990-an), dari lantai 3 sisi utara ke jangkar ----------
  function buildCables(scene) {
    const m = new T.MeshStandardMaterial({ color: 0x15171a, metalness: 0.8, roughness: 0.35 });
    const cs = [0, 1].map(() => { const c = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1, 6), m); c.castShadow = true; scene.add(c); return c; });
    const anchors = [new T.Vector3(-62, 0, 20), new T.Vector3(-62, 0, -20)];
    const grp = { visible: false, cs, update(pivot) {
      cs.forEach((c, i) => {
        c.visible = grp.visible; if (!grp.visible) return;
        const a = new T.Vector3(-7.7, G_TOP + 2 * FL + 0.5, i ? -1.8 : 1.8).applyMatrix4(pivot.matrixWorld), b = anchors[i];
        c.position.copy(a).add(b).multiplyScalar(0.5); c.scale.set(1, a.distanceTo(b), 1);
        c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      });
    } };
    return grp;
  }

  // ---------- Torre Civica Pavia (bata, ±60 m) untuk kilas balik runtuh 1989 ----------
  function buildPavia(scene) {
    const g = new T.Group(); g.visible = false; scene.add(g);
    const bn = fbmMaker(8, 8, 301, 4);
    const brick = canvasTex(256, 256, (u, v) => {
      const row = Math.floor(v * 32), off = (row % 2) * 0.5, col = Math.floor(u * 8 + off), fy = v * 32 - row, fx = u * 8 + off - col;
      const r = rng(row * 31 + col)(), n = bn(u, v); let k = 0.75 + r * 0.25 + n * 0.2; if (fy < 0.12 || fx < 0.05) k = 0.45;
      return [0.52 * k, 0.28 * k, 0.18 * k];
    }, [3, 1]);
    const bm = new T.MeshStandardMaterial({ map: brick, roughness: 0.95 });
    const pieces = [], L = 20, S = 11, Hh = 3;
    const r = rng(311);
    const dk = new T.MeshStandardMaterial({ color: 0x080605, roughness: 1 });
    for (let i = 0; i < L; i++) for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) {
      const a = k * Math.PI / 2, off = (j - 1) * S / 3;
      const w = new T.Mesh(new T.BoxGeometry(S / 3 - 0.05, Hh - 0.05, 1.4), bm);
      const cx = Math.sin(a) * (S / 2 - 0.7) + Math.cos(a) * off, cz = Math.cos(a) * (S / 2 - 0.7) - Math.sin(a) * off;
      w.position.set(cx, Hh / 2 + i * Hh, cz); w.rotation.y = a;
      if ((i === 16 || i === 17) && j === 1) { const win = new T.Mesh(new T.BoxGeometry(1.6, i === 17 ? 2.2 : 3, 1.5), dk); w.add(win); }  // bukaan lonceng
      if (i % 5 === 4 && j !== 1) { const sl = new T.Mesh(new T.BoxGeometry(0.4, 0.9, 1.5), dk); w.add(sl); }                            // celah jendela
      w.castShadow = w.receiveShadow = true; g.add(w);
      const ang = Math.atan2(cx, cz);
      w.userData = { y0: w.position.y, x0: cx, z0: cz, a: ang, ry: a, i, rx: (r() - 0.5) * 3, rz: (r() - 0.5) * 3, out: 1 + r() * 5, rest: 0.8 + r() * (i < 6 ? 7 : 3.5), dl: r() * 0.25 };
      pieces.push(w);
    }
    // atap bata & mahkota
    const crown = new T.Mesh(new T.BoxGeometry(S + 0.6, 1.2, S + 0.6), bm); crown.position.y = L * Hh + 0.6; crown.castShadow = true; g.add(crown);
    crown.userData = { y0: crown.position.y, x0: 0, z0: 0, a: 0.4, ry: 0, i: L, rx: 0.9, rz: -0.6, out: 2, rest: 3, dl: 0 }; pieces.push(crown);
    // bangunan kota di sekitarnya
    const hm = new T.MeshStandardMaterial({ color: 0x3a2f28, roughness: 1 });
    for (let i = 0; i < 18; i++) { const h = 10 + r() * 14, x = (r() - 0.5) * 160, z = -30 - r() * 80; if (Math.abs(x) < 14 && z > -40) continue; const b = new T.Mesh(new T.BoxGeometry(14 + r() * 16, h, 14), hm); b.position.set(x, h / 2, z); b.castShadow = true; g.add(b); }
    const pav = new T.Mesh(new T.PlaneGeometry(400, 400), new T.MeshStandardMaterial({ color: 0x3b3835, roughness: 1 })); pav.rotation.x = -Math.PI / 2; pav.position.y = 0.04; pav.receiveShadow = true; g.add(pav);
    // debu
    const dt = canvasTex(128, 128, (u, v) => { const d = Math.hypot(u - 0.5, v - 0.5) * 2; const a = Math.max(0, 1 - d); return [0.55, 0.5, 0.45, a * a]; });
    const dust = [];
    for (let i = 0; i < 90; i++) {
      const sp = new T.Sprite(new T.SpriteMaterial({ map: dt, transparent: true, depthWrite: false, opacity: 0, color: 0xd8cfc4 }));
      sp.userData = { a: r() * 6.28, sp: 4 + r() * 14, up: r() * 30, d: r() * 1.4, s: 6 + r() * 14 }; g.add(sp); dust.push(sp);
    }
    // tc = detik sejak mulai runtuh (<0 = masih berdiri)
    g.userData.collapse = tc => {
      for (const w of pieces) {
        const u = w.userData, d = Math.max(0, tc - u.dl - (L - u.i) * 0.012);
        const fall = tc > 0 ? 0.5 * 9.8 * d * d : 0;
        const y = Math.max(u.rest, u.y0 - fall);
        const landed = y <= u.rest + 0.01 && tc > 0;
        const spread = tc > 0 ? Math.min(1, fall / Math.max(1, u.y0)) : 0;
        w.position.set(u.x0 + Math.sin(u.a) * u.out * spread, y, u.z0 + Math.cos(u.a) * u.out * spread);
        w.rotation.set(u.rx * spread, u.ry, u.rz * spread);
      }
      dust.forEach(sp => {
        const u = sp.userData, k = Math.max(0, tc - u.d);
        sp.material.opacity = tc > 0 ? Math.min(0.9, k * 1.6) * Math.max(0, 1 - k / 10) : 0;
        const rr = 4 + k * u.sp; sp.position.set(Math.sin(u.a) * rr, 2 + Math.min(u.up, k * 9) + (1 - Math.exp(-k)) * 8, Math.cos(u.a) * rr * 0.7 + 4);
        const sc = u.s * (0.5 + k * 0.8); sp.scale.set(sc, sc, 1);
      });
    };
    g.userData.collapse(-1);
    return g;
  }

  // ---------- langit senja dengan awan gelap ----------
  const skyVS = `varying vec3 vDir; void main(){ vDir = position; vec4 p = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*p; gl_Position.z = gl_Position.w; }`;
  const skyFS = `
    varying vec3 vDir; uniform vec3 sunDir; uniform float time; uniform float gloom; uniform float night; uniform float flash;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
    float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<6;i++){ s+=a*noise(p); p=p*2.03+vec2(1.7,9.2); a*=0.5; } return s; }
    void main(){
      vec3 d = normalize(vDir); float h = d.y;
      vec3 hor = vec3(1.1,0.5,0.16), low = vec3(0.7,0.4,0.24), mid = vec3(0.10,0.17,0.30), zen = vec3(0.02,0.035,0.075);
      vec3 col = mix(hor, low, smoothstep(0.0,0.06,h)); col = mix(col, mid, smoothstep(0.05,0.3,h)); col = mix(col, zen, smoothstep(0.25,0.8,h));
      float sd = max(dot(d, sunDir), 0.0);
      col += vec3(1.0,0.42,0.12) * pow(sd, 5.0) * 0.9 * (1.0 - smoothstep(0.0,0.45,h));
      col += vec3(1.0,0.6,0.3) * pow(sd, 50.0) * 2.0 + vec3(3.0,2.2,1.4) * pow(sd, 900.0) * 30.0;
      vec2 uv = d.xz / (h + 0.08);
      float c = fbm(uv * 0.9 + vec2(time * 0.012, time * 0.004));
      float c2 = fbm(uv * 2.3 - vec2(time * 0.02, 0.0));
      float dens = c * 0.75 + c2 * 0.25;
      float cover = smoothstep(0.42 - gloom*0.08, 0.68, dens) * smoothstep(0.03, 0.22, h);
      cover = mix(cover * 0.55, cover, smoothstep(0.12, 0.5, h)) ;
      vec3 cloud = vec3(0.035,0.038,0.05) + vec3(0.65,0.3,0.12) * pow(sd, 3.0) * (1.0 - smoothstep(0.05, 0.45, h)) * 0.6;
      float rim = smoothstep(0.45,0.55,dens) * (1.0 - smoothstep(0.55,0.75,dens));
      cloud += vec3(1.0,0.55,0.25) * rim * pow(sd, 2.0) * 0.45;
      col = mix(col, cloud, clamp(cover, 0.0, 0.95));
      vec3 nc = mix(vec3(0.012,0.016,0.03), vec3(0.002,0.003,0.008), smoothstep(0.0,0.6,h));
      nc = mix(nc, vec3(0.006,0.007,0.01) + vec3(0.05,0.06,0.09)*rim, cover);
      col = mix(col, nc, night);
      col += vec3(0.7,0.75,0.9) * flash * (0.4 + cover * 1.2);
      gl_FragColor = vec4(col, 1.0);
    }`;

  // ---------- pasca-proses: ACES, grading teal-amber, vinyet, grain ----------
  const postFS = `
    varying vec2 vUv; uniform sampler2D tDiffuse; uniform float exposure, seed, vig, fade, sat, grain, flick, sepia;
    vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))+seed)*43758.5453); }
    vec3 toSRGB(vec3 c){ return mix(c*12.92, 1.055*pow(c, vec3(1.0/2.4))-0.055, step(0.0031308, c)); }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb * exposure;
      // bloom murah: sampel lebar untuk area sangat terang
      vec3 b = vec3(0.0);
      for (int i=0;i<12;i++){ float a = float(i)*0.5236; vec2 o = vec2(cos(a), sin(a)*0.5625)*0.012; b += max(texture2D(tDiffuse, vUv+o).rgb*exposure-3.0, 0.0); }
      c += b/12.0*0.2;
      c = aces(c);
      float l = dot(c, vec3(0.2126,0.7152,0.0722));
      c = mix(vec3(l), c, sat);
      c += vec3(-0.012,0.006,0.02)*(1.0-smoothstep(0.0,0.35,l));   // bayangan kebiruan
      c *= mix(vec3(1.0), vec3(1.05,1.0,0.92), smoothstep(0.45,0.9,l)); // sorot ambar
      c = toSRGB(c);
      float l2 = dot(c, vec3(0.299,0.587,0.114)); c = mix(c, vec3(l2)*vec3(1.08,0.98,0.84), sepia);
      c = (c-0.5)*1.06+0.5;
      vec2 q = vUv-0.5; q.y *= 1.4; c *= 1.0 - vig*smoothstep(0.25, 0.85, length(q));
      c += (h(vUv*vec2(1080.0,1920.0))-0.5)*grain; c *= flick;
      gl_FragColor = vec4(c*fade, 1.0);
    }`;

  // ---------- burung gagak ----------
  function buildCrows(scene) {
    const crows = [], m = new T.MeshBasicMaterial({ color: 0x050505, side: T.DoubleSide });
    const wing = new T.BufferGeometry(); wing.setAttribute('position', new T.Float32BufferAttribute([0, 0, -0.18, 0, 0, 0.18, 0.75, 0, 0.05], 3));
    const r = rng(91);
    for (let i = 0; i < 6; i++) {
      const g = new T.Group();
      const body = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), m); body.scale.set(1, 0.7, 2.2); g.add(body);
      const wl = new T.Mesh(wing, m), wr = new T.Mesh(wing, m); wr.scale.x = -1; g.add(wl, wr);
      g.userData = { wl, wr, rad: 11 + r() * 9, y: 47 + r() * 14, sp: 0.18 + r() * 0.12, ph: r() * 6.28, fl: 9 + r() * 4, dir: r() > 0.3 ? 1 : -1 };
      g.scale.setScalar(1.25); g.userData.isCrow = true; scene.add(g); crows.push(g);
    }
    return t => crows.forEach(c => {
      const u = c.userData, a = u.ph + t * u.sp * u.dir;
      c.position.set(Math.sin(a) * u.rad + 2.5, u.y + Math.sin(t * 0.7 + u.ph) * 1.2, Math.cos(a) * u.rad);
      c.rotation.y = a + (u.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
      const fl = Math.sin(t * u.fl + u.ph) * 0.7;
      u.wl.rotation.z = fl; u.wr.rotation.z = -fl;
    });
  }

  // ---------- kabut rendah ----------
  function buildMist(scene) {
    const f = fbmMaker(4, 2, 101, 5);
    const tex = canvasTex(512, 128, (u, v) => { const n = f(u, v); const e = smooth(0, 0.35, v) * smooth(1, 0.55, v); return [0.85, 0.8, 0.75, Math.max(0, n - 0.35) * 1.6 * e]; });
    tex.wrapT = T.ClampToEdgeWrapping;
    const ms = [], r = rng(111);
    for (let i = 0; i < 14; i++) {
      const m = new T.Mesh(new T.PlaneGeometry(70, 7), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.06 + r() * 0.06, depthWrite: false, color: new T.Color(1.0, 0.82, 0.68) }));
      m.position.set(-60 + r() * 120, 1.2 + r() * 1.8, -70 + r() * 60); m.userData = { x0: m.position.x, sp: 0.4 + r() * 0.6, off: r() };
      tex.offset.x = r(); m.userData.isMist = true; scene.add(m); ms.push(m);
    }
    return (t, cam) => ms.forEach(m => { m.position.x = m.userData.x0 + t * m.userData.sp; m.lookAt(cam.position.x, m.position.y, cam.position.z); });
  }

  // ---------- rakit dunia ----------
  window.Pisa = {
    W, H, LEAN, TOP_Y, BELL_Y,
    // titik penting (koordinat dunia) untuk overlay
    baseCenter: new T.Vector3(0, 0, 0),
    axisTop: new T.Vector3(Math.sin(LEAN) * TOP_Y, Math.cos(LEAN) * TOP_Y, 0),
    init(canvas) {
      const renderer = new T.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
      renderer.setPixelRatio(1); renderer.setSize(W, H, false);
      renderer.localClippingEnabled = true; renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
      const scene = new T.Scene();
      scene.fog = new T.FogExp2(new T.Color(0.5, 0.33, 0.22), 0.0026);
      const camera = new T.PerspectiveCamera(55, W / H, 0.5, 4000);
      const sunDir = new T.Vector3(-0.8, 0.12, 0.55).normalize();
      const sun = new T.DirectionalLight(new T.Color(1.0, 0.58, 0.3), 8.0);
      sun.position.copy(sunDir).multiplyScalar(400); sun.target.position.set(0, 0, 0);
      sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
      Object.assign(sun.shadow.camera, { left: -60, right: 200, top: 75, bottom: -30, near: 50, far: 1400 });
      sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
      scene.add(sun, sun.target);
      const hemi = new T.HemisphereLight(new T.Color(0.3, 0.4, 0.62), new T.Color(0.14, 0.1, 0.06), 0.32); scene.add(hemi);
      const sky = new T.Mesh(new T.SphereGeometry(2000, 64, 32), new T.ShaderMaterial({ vertexShader: skyVS, fragmentShader: skyFS, side: T.BackSide, depthWrite: false, fog: false, uniforms: { sunDir: { value: sunDir }, time: { value: 0 }, gloom: { value: 0 }, night: { value: 0 }, flash: { value: 0 } } }));
      sky.renderOrder = -1; scene.add(sky);
      const tower = buildTower(); scene.add(tower);
      buildGround(scene);
      const crows = buildCrows(scene), mist = buildMist(scene);
      const scaffold = buildScaffold(scene), cables = buildCables(scene), pavia = buildPavia(scene);
      const moon = new T.DirectionalLight(new T.Color(0.55, 0.65, 0.95), 0); moon.position.set(120, 260, 160); scene.add(moon);
      const DEF = { sun: 8.0, sunColor: [1.0, 0.58, 0.3], hemi: 0.32, moon: 0, fogColor: [0.5, 0.33, 0.22], fog: 0.0026, night: 0, flash: 0, gloom: 0,
                    exposure: 1.0, sat: 0.9, vig: 0.6, grain: 0.035, flick: 1, sepia: 0 };
      this.mood = (o = {}) => {
        const m = Object.assign({}, DEF, o);
        sun.intensity = m.sun; sun.color.setRGB(...m.sunColor); hemi.intensity = m.hemi; moon.intensity = m.moon;
        scene.fog.color.setRGB(...m.fogColor); scene.fog.density = m.fog;
        const su = sky.material.uniforms; su.night.value = m.night; su.flash.value = m.flash; su.gloom.value = m.gloom;
        const pu = post.uniforms; pu.exposure.value = m.exposure; pu.sat.value = m.sat; pu.vig.value = m.vig; pu.grain.value = m.grain; pu.flick.value = m.flick; pu.sepia.value = m.sepia;
      };
      this.setLean = deg => { tower.rotation.z = -deg * Math.PI / 180; tower.updateMatrixWorld(true);
        const L = deg * Math.PI / 180; this.axisTop.set(Math.sin(L) * TOP_Y, Math.cos(L) * TOP_Y, 0);
        tower.userData.clipTop.normal.set(-Math.sin(L), -Math.cos(L), 0); };
      this.setBuiltHeight = h => { tower.userData.clipTop.constant = h; };   // h meter sepanjang sumbu menara
      this.setCut = z => { clipZ.constant = z; groups.cap.visible = z < 400; groups.cap.position.z = z; };
      this.show = o => { for (const k in o) { const v = o[k];
        if (k === 'modern') groups.modern.visible = v; else if (k === 'bg') groups.bg.visible = v; else if (k === 'lawn') groups.lawn.visible = v;
        else if (k === 'tower') tower.visible = v; else if (k === 'scaffold') scaffold.visible = v; else if (k === 'cables') cables.visible = v;
        else if (k === 'pavia') pavia.visible = v; else if (k === 'crows') this.crowsOn = v; else if (k === 'mist') this.mistOn = v; } };
      this.paviaCollapse = tc => pavia.userData.collapse(tc);
      this.crowsOn = true; this.mistOn = true;
      const rt = new T.WebGLRenderTarget(W, H, { type: T.HalfFloatType, samples: 4 });
      const post = new T.ShaderMaterial({ vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0);} ', fragmentShader: postFS,
        uniforms: { tDiffuse: { value: rt.texture }, exposure: { value: 1.0 }, seed: { value: 0 }, vig: { value: 0.6 }, fade: { value: 1 }, sat: { value: 0.9 }, grain: { value: 0.035 }, flick: { value: 1 }, sepia: { value: 0 } } });
      const postScene = new T.Scene(); postScene.add(new T.Mesh(new T.PlaneGeometry(2, 2), post));
      const postCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      this.renderer = renderer; this.groups = groups; this.scene = scene; this.camera = camera; this.sky = sky; this.post = post; this.tower = tower; this.sun = sun;
      this.frame = (t, skyT = t) => {
        crows(t); mist(t, camera);
        scene.traverse(o => { if (o.userData && o.userData.isCrow) o.visible = this.crowsOn; if (o.userData && o.userData.isMist) o.visible = this.mistOn; });
        tower.updateMatrixWorld(true); cables.update(tower);
        sky.position.copy(camera.position); sky.material.uniforms.time.value = skyT;
        post.uniforms.seed.value = (t * 37.13) % 100;
        renderer.setRenderTarget(rt); renderer.render(scene, camera);
        renderer.setRenderTarget(null); renderer.render(postScene, postCam);
      };
      // proyeksi titik dunia → piksel layar
      this.project = (v) => { const p = v.clone().project(camera); return { x: (p.x * 0.5 + 0.5) * W, y: (1 - (p.y * 0.5 + 0.5)) * H }; };
    }
  };
})();
