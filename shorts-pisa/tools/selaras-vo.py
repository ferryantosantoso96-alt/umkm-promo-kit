"""Selaraskan video ke voiceover ElevenLabs.
1. Cari jeda di VO, potong per kalimat (23 kalimat SENT di video.html).
2. Susun ulang kalimat di linimasa video: jeda alami di dalam adegan, jeda >= GAP_SC antar-adegan
   (memberi ruang transisi), lalu tulis trek VO baru audio/vo-tersusun.wav.
3. Hitung waktu tiap kata: jeda di dalam kalimat dicocokkan ke tanda baca (… , :), sisanya dibagi per suku kata.
4. Tulis audio/waktu-vo.js (VO_TIMES & VO_WORDS) yang dibaca video.html.
pakai: python3 tools/selaras-vo.py audio/vo-elevenlabs.mp3
"""
import json, re, subprocess, sys, wave
import numpy as np
sys.path.insert(0, 'tools'); from sukukata import load as sk_load, nuclei

SR = 48000
VO = sys.argv[1]
START, GAP_SC, GAP_IN_MAX = 0.8, 1.0, 0.7
SIG = float(sys.argv[2]) if len(sys.argv) > 2 else 0.2
BON = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
src = open('video.html', encoding='utf-8').read()
SENT = [dict(id=m[0], sc=int(m[1]), t=m[2], say=m[3] or None) for m in re.findall(r"\{ id: '(\w+)', sc: (\d+), t: '([^']+)'(?:, say: '([^']+)')?", src)]
NUM = {'1178': 'seribu seratus tujuh puluh delapan', '1272': 'seribu dua ratus tujuh puluh dua', '1989': 'seribu sembilan ratus delapan puluh sembilan',
       '5,5': 'lima koma lima', '45': 'empat puluh lima', '1838': 'seribu delapan ratus tiga puluh delapan', '1934': 'seribu sembilan ratus tiga puluh empat', '1280': 'seribu dua ratus delapan puluh'}
n = len(SENT)

# --- muat audio mono
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', VO, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
x = np.frombuffer(raw, '<i2').astype(np.float32) / 32768
dur = len(x) / SR

# --- deteksi jeda (energi RMS 10 ms)
hop = int(SR * 0.01); fr = np.sqrt(np.convolve(x ** 2, np.ones(hop) / hop, 'same')[::hop] + 1e-12)
db = 20 * np.log10(fr); thr = max(-42, np.percentile(db, 95) - 32)
quiet = db < thr
sil = []; i = 0
while i < len(quiet):
    if quiet[i]:
        j = i
        while j < len(quiet) and quiet[j]: j += 1
        if (j - i) * 0.01 >= 0.12: sil.append((i * 0.01, j * 0.01))
        i = j
    else: i += 1
mulai = sil[0][1] if sil and sil[0][0] < 0.05 else 0.0
akhir = sil[-1][0] if sil and sil[-1][1] >= dur - 0.05 else dur
cand = [(s, e) for s, e in sil if s > mulai + 0.2 and e < akhir - 0.2]

def syl(w): return max(1, len(re.findall(r'[aiueo]+', w.lower())))
def spoken(s):
    t = re.sub(r'[*!~]', '', s['say'] or s['t'])
    for k, v in NUM.items(): t = re.sub(r'(^|\s)' + re.escape(k) + r'(?=[\s,.…])', r'\1' + v, t)
    return t
# --- frasa: kalimat dipecah di … , : ; tiap frasa punya jumlah suku kata
def words_of(sx):
    w = re.sub(r'([*!~])([^*!~]+?)\1', lambda mm: ' '.join(mm.group(1) + q + mm.group(1) for q in mm.group(2).split(' ')), sx['t']).split()
    return w
def wsyl(w):
    bare = re.sub(r'[*!~.,…?!:]', '', w); return sum(syl(q) for q in NUM[bare].split()) if bare in NUM else syl(bare)
PK, _ = nuclei(sk_load(VO))           # puncak suku kata (detik)
SY = [sum(wsyl(w) for w in words_of(sx)) for sx in SENT]
print('puncak terdeteksi', len(PK), '· suku kata naskah', sum(SY))
gaps = cand; M = len(gaps)
def pc(k, a0, b0, gl):
    npk = int(np.sum((PK >= a0) & (PK < b0))); sy = SY[k]
    return ((npk - sy) / (1.0 + 0.08 * sy)) ** 2 - BON * min(gl, 0.7) + (50 if npk == 0 else 0)
INF = 1e18
D = np.full((n, M), INF); BK = np.full((n, M), -1, int)
for j in range(M): D[0][j] = pc(0, mulai, gaps[j][0], gaps[j][1] - gaps[j][0])
for k in range(1, n - 1):
    for j in range(k, M):
        best, bi = INF, -1
        for i in range(k - 1, j):
            v = D[k - 1][i] + pc(k, gaps[i][1], gaps[j][0], gaps[j][1] - gaps[j][0])
            if v < best: best, bi = v, i
        D[k][j], BK[k][j] = best, bi
best, bj = INF, -1
for j in range(n - 2, M):
    v = D[n - 2][j] + pc(n - 1, gaps[j][1], akhir, 0.7)
    if v < best: best, bj = v, j
chosen = [bj]
for k in range(n - 2, 0, -1): chosen.append(BK[k][chosen[-1]])
chosen.reverse()
seg = [(mulai, gaps[chosen[0]][0])] + [(gaps[chosen[q - 1]][1], gaps[chosen[q]][0]) for q in range(1, n - 1)] + [(gaps[chosen[-1]][1], akhir)]
for k in range(n): print(f'  {k:2d} {seg[k][0]:6.2f}–{seg[k][1]:6.2f}  puncak {int(np.sum((PK >= seg[k][0]) & (PK < seg[k][1]))):2d} / naskah {SY[k]:2d}  {SENT[k]["t"][:44]}')

# --- susun ulang di linimasa video
out = np.zeros(int(SR * (dur + n * GAP_SC + 5)), np.float32)
t = START; VO_TIMES = []; VO_WORDS = []
PAD = 0.05
for k, (a, b) in enumerate(seg):
    if k > 0:
        nat = seg[k][0] - seg[k - 1][1]
        t += max(GAP_SC, nat) if SENT[k]['sc'] != SENT[k - 1]['sc'] else min(nat, GAP_IN_MAX)
    clip = x[int((a - PAD) * SR): int((b + PAD) * SR)].copy()
    f = np.minimum(1, np.arange(len(clip)) / (0.02 * SR)); clip *= f * f[::-1]
    i0 = int((t - PAD) * SR); out[i0:i0 + len(clip)] += clip
    t0, t1 = t, t + (b - a); VO_TIMES.append([round(t0, 3), round(t1, 3)])
    ws = words_of(SENT[k]); wt = [None] * len(ws)
    pa, pe = a, b; S = SY[k]; pk = PK[(PK >= pa) & (PK < pe)]; cs = 0
    for i in range(len(ws)):
        w = wsyl(ws[i])
        if len(pk) >= 2:
            j0 = min(len(pk) - 1, int(round(cs * len(pk) / S))); j1 = int(round((cs + w) * len(pk) / S))
            st_ = pa if j0 == 0 else max(pa, pk[j0] - 0.06); en_ = pe if j1 >= len(pk) else max(st_ + 0.05, pk[j1] - 0.06)
        else:
            st_ = pa + (pe - pa) * cs / S; en_ = pa + (pe - pa) * (cs + w) / S
        wt[i] = [round(t0 + st_ - a, 3), round(t0 + en_ - a, 3)]; cs += w
    VO_WORDS.append(wt)
    t = t1

total = t
wav = out[: int(SR * (total + 6))]
wav = wav / (np.max(np.abs(wav)) + 1e-9) * 0.9
with wave.open('audio/vo-tersusun.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((wav * 32767).astype('<i2').tobytes())
open('audio/waktu-vo.js', 'w').write('// dibuat tools/selaras-vo.py dari ' + VO + '\nwindow.VO_TIMES = ' + json.dumps(VO_TIMES) + ';\nwindow.VO_WORDS = ' + json.dumps(VO_WORDS) + ';\n')
print(f'VO asli {dur:.1f} dtk (ucapan {mulai:.2f}–{akhir:.2f}); tersusun selesai di {total:.1f} dtk')
for k, s in enumerate(SENT): print(k, s['sc'], VO_TIMES[k], s['t'][:50])
