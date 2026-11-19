"""Selaraskan animasi ke voiceover.
Cari jeda antarkalimat di VO, cocokkan dengan 18 baris subtitle, lalu tulis peta waktu (warp)
yang memetakan detik video -> detik animasi. Animasi tiap kalimat dipercepat/diperlambat sedikit
supaya mulai tepat saat kalimat itu diucapkan.
pakai: python3 tools/selaras.py audio/vo-elevenlabs.mp3 video.html audio/warp.json [--target 45]"""
import json, re, subprocess, sys

vo, html, out = sys.argv[1:4]
target = float(sys.argv[sys.argv.index('--target') + 1]) if '--target' in sys.argv else None
JEDA_AWAL, EKOR = 0.25, 1.4          # VO mulai di detik 0,25; animasi penutup 1,4 dtk setelah kata terakhir

subs = re.findall(r"\[([\d.]+), ([\d.]+), '([^']+)'\]", open(html, encoding='utf-8').read())
A = [float(a) for a, _, _ in subs]
teks = [t.replace('*', '') for _, _, t in subs]
n = len(teks)

def ukur(path):
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]))
    log = subprocess.run(['ffmpeg', '-i', path, '-af', 'silencedetect=noise=-38dB:d=0.10', '-f', 'null', '-'], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
    en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
    if len(en) < len(st): en.append(dur)
    return dur, list(zip(st, en))

dur, sil = ukur(vo)
mulai = sil[0][1] if sil and sil[0][0] < 0.05 else 0.0
akhir = sil[-1][0] if sil and sil[-1][1] >= dur - 0.05 else dur
cand = [(s, e) for s, e in sil if s > mulai + 0.2 and e < akhir - 0.2]

# posisi batas yang diharapkan: sebanding dengan jumlah huruf
cum, tot = [], sum(len(t) for t in teks)
c = 0
for t in teks[:-1]:
    c += len(t); cum.append(mulai + (akhir - mulai) * c / tot)

# DP: pilih n-1 jeda berurutan, dekat posisi harapan, utamakan jeda panjang
INF = float('inf'); m = len(cand)
if m < n - 1: sys.exit(f'jeda terdeteksi hanya {m}, butuh {n - 1}')
cost = [[INF] * m for _ in range(n - 1)]; prev = [[-1] * m for _ in range(n - 1)]
def c1(k, j):
    s, e = cand[j]; mid = (s + e) / 2
    return ((mid - cum[k]) / 1.2) ** 2 - 3.0 * (e - s)
for j in range(m): cost[0][j] = c1(0, j)
for k in range(1, n - 1):
    best, bi = INF, -1
    for j in range(m):
        if j - 1 >= 0 and cost[k - 1][j - 1] < best: best, bi = cost[k - 1][j - 1], j - 1
        if bi >= 0: cost[k][j] = best + c1(k, j); prev[k][j] = bi
j = min(range(m), key=lambda x: cost[n - 2][x]); pilih = []
for k in range(n - 2, -1, -1): pilih.append(j); j = prev[k][j]
pilih.reverse()

V = [mulai] + [cand[j][1] - 0.04 for j in pilih]
skala = 1.0
if target:  # percepat VO sedikit (tanpa mengubah nada) bila melebihi target
    perlu = (akhir - mulai) + JEDA_AWAL + EKOR
    skala = min(1.0, (target - JEDA_AWAL - EKOR) / (akhir - mulai)) if perlu > target else 1.0
tempo = 1 / skala
V = [JEDA_AWAL + (v - mulai) * skala for v in V]
v_end = JEDA_AWAL + (akhir - mulai) * skala + EKOR
anchors = [[0.0, 0.0]] + [[round(v, 3), a] for v, a in zip(V, A)] + [[round(v_end, 3), 45.0]]
rasio = [(anchors[i + 1][1] - anchors[i][1]) / (anchors[i + 1][0] - anchors[i][0]) for i in range(len(anchors) - 1)]
json.dump({'anchors': anchors, 'durasi': round(v_end, 3),
           'vo': {'src': vo, 'mulai_sumber': round(mulai, 3), 'akhir_sumber': round(akhir, 3), 'tempo': round(tempo, 4), 'at': JEDA_AWAL, 'vol': 1.0}},
          open(out, 'w'), indent=1)
print(f'VO {dur:.2f}s, bicara {mulai:.2f}-{akhir:.2f}, tempo x{tempo:.3f}, video {v_end:.2f}s')
for i, t in enumerate(teks):
    print(f'{anchors[i + 1][0]:6.2f}s  (anim {A[i]:5.2f}, kecepatan x{rasio[i + 1]:.2f})  {t}')
