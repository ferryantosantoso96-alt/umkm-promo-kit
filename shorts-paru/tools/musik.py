"""Musik latar ceria & pelan, disintesis dari nol (bebas lisensi).
pakai: python3 tools/musik.py audio/musik.wav [durasi_detik]"""
import sys, wave
import numpy as np

SR = 48000
DUR = float(sys.argv[2]) if len(sys.argv) > 2 else 45.0
BPM = 100.0
BEAT = 60 / BPM
N = int(SR * (DUR + 2))
L = np.zeros(N); Rr = np.zeros(N)
rng = np.random.default_rng(3)

def hz(m): return 440 * 2 ** ((m - 69) / 12)

def tambah(sig, t, pan=0.0, gain=1.0):
    i = int(t * SR)
    if i >= N: return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt((1 - pan) / 2)
    Rr[i:i + len(sig)] += sig * np.sqrt((1 + pan) / 2)

def pluck(m, dur=0.9):
    t = np.arange(int(SR * dur)) / SR; f = hz(m)
    s = np.sin(2 * np.pi * f * t) + .35 * np.sin(4 * np.pi * f * t) * np.exp(-t * 9) + .12 * np.sin(6 * np.pi * f * t) * np.exp(-t * 14)
    env = np.minimum(1, t / .004) * np.exp(-t * 4.2)
    return s * env

def bel(m, dur=1.4):
    t = np.arange(int(SR * dur)) / SR; f = hz(m)
    s = np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)
    return s * np.minimum(1, t / .002) * np.exp(-t * 3.2)

def pad(ms, dur):
    t = np.arange(int(SR * dur)) / SR; s = np.zeros_like(t)
    for m in ms:
        for det in (-.07, .07):
            f = hz(m + det)
            s += np.sin(2 * np.pi * f * t) + .25 * np.sin(4 * np.pi * f * t) + .08 * np.sin(6 * np.pi * f * t)
    env = np.minimum(1, t / .5) * np.minimum(1, (dur - t) / .6).clip(0, 1)
    return s * env / (len(ms) * 2)

def bass(m, dur):
    t = np.arange(int(SR * dur)) / SR; f = hz(m)
    s = np.sin(2 * np.pi * f * t) + .2 * np.sin(4 * np.pi * f * t)
    return s * np.minimum(1, t / .01) * np.exp(-t * 2.2)

def kick():
    t = np.arange(int(SR * .35)) / SR
    f = 50 + 70 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)

def shaker():
    n = int(SR * .09); x = np.diff(rng.standard_normal(n + 1)); t = np.arange(n) / SR
    return x * np.minimum(1, t / .008) * np.exp(-t * 55) * .5

# C – G – Am – F  (nada MIDI)
akor = [(48, [60, 64, 67]), (43, [59, 62, 67]), (45, [60, 64, 69]), (41, [60, 65, 69])]
BAR = 4 * BEAT
nbar = int(np.ceil(DUR / BAR))
melodi = [76, 74, 72, 74, 76, 79, 76, 74, 72, 71, 72, 74, 72, 69, 67, 69]
for b in range(nbar):
    t0 = b * BAR
    if t0 > DUR - 3.0: break
    root, ch = akor[b % 4]
    tambah(pad(ch, BAR + .3), t0, 0, .16)
    tambah(bass(root, BAR / 2), t0, 0, .22); tambah(bass(root, BAR / 2), t0 + BAR / 2, 0, .16)
    arp = ch + [ch[1] + 12, ch[2] + 12, ch[1] + 12, ch[0] + 12, ch[1]]
    for k in range(8):
        tambah(pluck(arp[k % len(arp)]), t0 + k * BEAT / 2, (-.35 if k % 2 else .35), .09)
    if b >= 2:
        for k in range(4):
            if k in (0, 2): tambah(kick(), t0 + k * BEAT, 0, .2)
            tambah(shaker(), t0 + k * BEAT + BEAT / 2, .2, .1)
    if b >= 4 and b % 2 == 0:
        for k in range(4):
            tambah(bel(melodi[(b * 2 + k) % len(melodi)]), t0 + k * BEAT, -.1, .06)

# akor penutup
tend = DUR - 2.7
tambah(pad([60, 64, 67, 72], 3.2), tend, 0, .2); tambah(bass(48, 2.5), tend, 0, .25)
for k, m in enumerate([72, 76, 79, 84]): tambah(bel(m, 2.0), tend + k * .09, (k - 1.5) * .2, .07)

# gema sederhana (konvolusi dengan derau meluruh)
ir_t = np.arange(int(SR * 1.6)) / SR
def gema(x, seed):
    ir = np.random.default_rng(seed).standard_normal(len(ir_t)) * np.exp(-ir_t * 3.8); ir[0] = 0
    n = len(x) + len(ir); nf = 1 << (n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, nf) * np.fft.rfft(ir, nf), nf)[:len(x)]
    return y / np.max(np.abs(ir)) * .012
L2 = L + gema(L, 1); R2 = Rr + gema(Rr, 2)
st = np.stack([L2, R2], 1)[: int(SR * DUR)]
t = np.arange(len(st)) / SR
st *= np.minimum(1, t / 1.2)[:, None] * np.minimum(1, (DUR - t) / 1.5).clip(0, 1)[:, None]
st = st / np.max(np.abs(st)) * .7
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())
print('ok', sys.argv[1], f'{DUR}s')
