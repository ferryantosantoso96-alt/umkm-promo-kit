"""Musik latar misterius + efek suara, disintesis dari nol (bebas lisensi, tanpa kredit).
pakai: python3 tools/audio.py hasil/musik-sfx.wav
Waktu efek mengikuti linimasa video.html (48 dtk)."""
import sys, wave
import numpy as np

SR = 48000
DUR = 48.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
mus = np.zeros((N, 2)); sfx = np.zeros((N, 2))

def hz(m): return 440 * 2 ** ((m - 69) / 12)
def tarr(d): return np.arange(int(SR * d)) / SR

def put(buf, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i + len(sig) <= 0: return
    if sig.ndim == 1: sig = np.stack([sig * np.sqrt((1 - pan) / 2), sig * np.sqrt((1 + pan) / 2)], 1)
    j = min(N, i + len(sig)); buf[i:j] += sig[: j - i] * gain

def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); s = 0.0
    # filter satu kutub, dijalankan per blok agar cepat
    from scipy.signal import lfilter
    return lfilter([1 - a], [1, -a], x)

def bandpass(x, f, q=4.0):
    from scipy.signal import iirpeak, lfilter
    b, a = iirpeak(f / (SR / 2), q); return lfilter(b, a, x)

def env(t, a, d):
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)

def noise(d): return rng.standard_normal(int(SR * d))

# ---------------- MUSIK ----------------
# drone D dengan napas pelan
t = np.arange(N) / SR
drone = (np.sin(2 * np.pi * hz(38) * t) + 0.5 * np.sin(2 * np.pi * hz(45) * t + 0.3) + 0.25 * np.sin(2 * np.pi * hz(50) * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * t / 9.0))
drone += 0.15 * lowpass(rng.standard_normal(N), 120)
mus[:, 0] += drone * 0.22; mus[:, 1] += drone * 0.22

def pad(ms, d, bright=1.0):
    tt = tarr(d); s = np.zeros_like(tt)
    for m in ms:
        for det in (-0.06, 0.0, 0.07):
            f = hz(m + det); s += np.sin(2 * np.pi * f * tt) + 0.3 * bright * np.sin(4 * np.pi * f * tt) + 0.1 * bright * np.sin(6 * np.pi * f * tt)
    e = np.minimum(1, tt / 1.6) * np.clip((d - tt) / 1.8, 0, 1)
    return s * e / (len(ms) * 3)

# Dm – Bb – Gm – A (minor, menggantung); senyap saat kilas balik Pavia
prog = [(0, [62, 65, 69]), (6, [58, 62, 65]), (12, [55, 58, 62]), (18, [57, 61, 64]),
        (35.2, [62, 65, 69]), (41.6, [58, 62, 65]), (44.5, [62, 65, 69, 74])]
for i, (t0, ch) in enumerate(prog):
    d = (prog[i + 1][0] - t0 + 1.8) if i + 1 < len(prog) else DUR - t0
    put(mus, pad(ch, d, 0.8), t0, 0.16, (-0.3 if i % 2 else 0.3))
# denyut jantung rendah (Pavia & malam)
def beat():
    tt = tarr(0.35); f = 45 + 35 * np.exp(-tt * 25)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(tt, 0.004, 0.09)
for k, tb in enumerate(np.arange(25.0, 35.0, 0.85)):
    put(mus, beat(), tb, 0.5); put(mus, beat(), tb + 0.22, 0.32)
# senar tinggi tegang di malam hari
tt = tarr(5.6); s = np.sin(2 * np.pi * hz(86) * tt + 0.3 * np.sin(2 * np.pi * 5.5 * tt)) * np.minimum(1, tt / 2) * np.clip((5.6 - tt) / 1, 0, 1)
put(mus, s, 29.6, 0.035, 0.4)

# ---------------- EFEK SUARA ----------------
def bell(f0=110, d=7.0):
    tt = tarr(d); s = np.zeros_like(tt)
    for r, a, dec in [(0.5, 0.6, 3.5), (1, 1, 2.6), (1.19, 0.5, 2.0), (1.56, 0.35, 1.6), (2.0, 0.4, 1.3), (2.51, 0.25, 0.9), (3.0, 0.18, 0.7)]:
        s += a * np.sin(2 * np.pi * f0 * r * tt + rng.random() * 6) * np.exp(-tt / dec)
    return s * np.minimum(1, tt / 0.003) / 3

def wind(d, fc=420):
    x = noise(d); y = bandpass(x, fc, 1.2) + 0.5 * lowpass(x, 250)
    tt = tarr(d); m = 0.55 + 0.45 * np.sin(2 * np.pi * tt / 5.3) * np.sin(2 * np.pi * tt / 2.1 + 1)
    return y * m

def crow():
    tt = tarr(0.42); f = 680 + 260 * np.sin(np.pi * tt / 0.42)
    car = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5 + 0.3 * noise(0.42)
    return bandpass(car, 1300, 2.5) * np.sin(np.pi * np.clip(tt / 0.42, 0, 1)) ** 0.6

def whoosh(d, f1, f2, rev=False):
    x = noise(d); tt = tarr(d)
    from scipy.signal import lfilter
    out = np.zeros_like(x); blk = 1024
    for i in range(0, len(x), blk):
        f = f1 + (f2 - f1) * (i / len(x)); out[i:i + blk] = bandpass(x[i:i + blk], f, 1.4)
    e = np.sin(np.pi * tt / d) ** 2
    if rev: e = (tt / d) ** 2.5 * np.clip((d - tt) / 0.06, 0, 1)
    return out * e

def rumble(d, peak=0.4, fc=90):
    x = lowpass(noise(d), fc); x = lowpass(x, fc); tt = tarr(d)
    return x / (np.max(np.abs(x)) + 1e-9) * np.minimum(1, tt / (d * peak)) * np.clip((d - tt) / (d * (1 - peak)), 0, 1)

def thunder(d=4.5):
    tt = tarr(d); crack = bandpass(noise(d), 2500, 0.7) * env(tt, 0.002, 0.08)
    roll = rumble(d, 0.08, 160) * (0.7 + 0.3 * np.sin(2 * np.pi * tt * 1.7))
    return crack * 0.8 + roll * 1.4

def thump():
    tt = tarr(0.8); f = 38 + 60 * np.exp(-tt * 18)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(tt, 0.002, 0.25)

def creak(d=1.4, f=180):
    tt = tarr(d); imp = np.zeros_like(tt)
    rate = 40 + 30 * np.sin(np.pi * tt / d)
    ph = np.cumsum(rate) / SR; imp[np.where(np.diff(np.floor(ph), prepend=0) > 0)] = 1
    s = bandpass(imp + 0.05 * noise(d), f, 6) + 0.5 * bandpass(imp, f * 2.3, 8)
    return s * np.sin(np.pi * tt / d)

def crackle(d):
    x = np.zeros(int(SR * d)); idx = rng.integers(0, len(x), int(d * 90)); x[idx] = rng.standard_normal(len(idx))
    return bandpass(x, 3000, 0.8) + 0.08 * bandpass(noise(d), 1500, 0.5)

def debris(d=2.5):
    tt = tarr(d); s = np.zeros_like(tt)
    for _ in range(140):
        t0 = rng.random() ** 1.6 * d * 0.85; i = int(t0 * SR); n = int(SR * 0.08)
        c = bandpass(noise(0.08), 300 + rng.random() * 2500, 3) * np.exp(-np.arange(n) / SR / 0.02)
        s[i:i + n] += c[: len(s) - i] * (0.3 + rng.random())
    return s

def motor(d):
    tt = tarr(d); s = np.sin(2 * np.pi * 52 * tt) + 0.5 * np.sin(2 * np.pi * 104 * tt) + 0.3 * lowpass(noise(d), 400)
    gl = bandpass(noise(d), 700, 3) * (0.5 + 0.5 * np.sin(2 * np.pi * 3.1 * tt) ** 8)
    return (s * 0.5 + gl) * np.minimum(1, tt / 0.6) * np.clip((d - tt) / 0.8, 0, 1)

def norm(x): return x / (np.max(np.abs(x)) + 1e-9)

# angin di seluruh adegan Pisa
put(sfx, norm(wind(25.0)), 0.0, 0.10, -0.2)
put(sfx, norm(wind(13.0, 520)), 35.2, 0.10, 0.2)
# 1 · lonceng & gagak
put(sfx, norm(bell(98)), 0.4, 0.55)
put(sfx, norm(bell(98, 5)), 6.8, 0.3)
for tc, pn in [(2.3, -0.5), (2.75, -0.45), (5.4, 0.55), (8.2, 0.3)]: put(sfx, norm(crow()), tc, 0.10, pn)
# 2 · menembus tanah
put(sfx, norm(whoosh(1.4, 300, 2200, rev=True)), 8.8, 0.35)
put(sfx, norm(whoosh(1.8, 1800, 160)), 9.9, 0.4)
put(sfx, norm(thump()), 11.6, 0.8)
put(sfx, norm(rumble(4.0, 0.5, 70)), 12.0, 0.35)
put(sfx, norm(thump()), 12.45, 0.45)
put(sfx, norm(creak(1.6, 160)), 15.8, 0.22, 0.3)
put(sfx, norm(whoosh(0.9, 800, 200)), 17.3, 0.3)
# 3 · 1178: batu berderit, waktu berlalu
put(sfx, norm(creak(1.8, 140)), 19.8, 0.28, -0.3)
put(sfx, norm(whoosh(2.6, 200, 3500)), 21.8, 0.32)
for k in range(14): put(sfx, norm(thump()) * 0.3, 21.9 + k * 0.165, 0.12)
put(sfx, norm(whoosh(0.8, 1500, 200)), 24.4, 0.3)
# 4 · Pavia: derak film, retak, runtuh
put(sfx, norm(crackle(4.6)), 25.0, 0.12)
put(sfx, norm(bandpass(noise(0.25), 1800, 1.0) * env(tarr(0.25), 0.001, 0.05)), 25.85, 0.6)
put(sfx, norm(rumble(4.0, 0.2, 110)), 25.9, 0.9)
put(sfx, norm(debris(3.0)), 26.1, 0.45)
put(sfx, norm(thump()), 26.7, 0.8)
# 5 · malam: guntur, hujan
put(sfx, norm(thunder(4.5)), 29.6, 0.85)
put(sfx, norm(thunder(3.5)), 33.0, 0.6)
rain = bandpass(noise(5.6), 4000, 0.6) + 0.4 * lowpass(noise(5.6), 900)
put(sfx, norm(rain) * np.minimum(1, tarr(5.6) / 0.4) * np.clip((5.6 - tarr(5.6)) / 0.5, 0, 1), 29.6, 0.09)
# 6 · penyelamatan: mesin bor & sedot
put(sfx, norm(whoosh(0.8, 300, 1400)), 35.0, 0.25)
put(sfx, norm(motor(5.2)), 36.0, 0.14)
put(sfx, norm(creak(2.6, 120)), 37.6, 0.2, -0.2)
# 7 · gempa & penutup
put(sfx, norm(whoosh(1.6, 200, 2000)), 41.6, 0.3)
put(sfx, norm(rumble(3.6, 0.3, 60)), 43.3, 1.0)
put(sfx, norm(debris(2.2)) * 0.5, 43.7, 0.25)
put(sfx, norm(bell(98, 5)), 46.0, 0.45)
for tc, pn in [(45.0, -0.4), (45.45, -0.35)]: put(sfx, norm(crow()), tc, 0.09, pn)

# gema sederhana untuk musik & sfx
def reverb(x, seed, dec=2.2, mix=0.25):
    irn = int(SR * 2.5); ti = np.arange(irn) / SR
    ir = np.random.default_rng(seed).standard_normal(irn) * np.exp(-ti * 3 / dec); ir[:200] = 0
    nf = 1 << (len(x) + irn - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, nf) * np.fft.rfft(ir, nf), nf)[: len(x)]
    return x + y / np.sqrt(np.sum(ir ** 2)) * mix
for c in range(2):
    mus[:, c] = reverb(mus[:, c], 11 + c, 3.0, 0.35); sfx[:, c] = reverb(sfx[:, c], 21 + c, 1.8, 0.18)

out = mus / (np.max(np.abs(mus)) + 1e-9) * 0.42 + sfx * 1.0
fade = np.minimum(1, t / 0.8) * np.clip((DUR - t) / 1.6, 0, 1)
out *= fade[:, None]
out = np.tanh(out * 1.1) / np.tanh(1.1)
out = out / np.max(np.abs(out)) * 0.89
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype('<i2').tobytes())
print('ok', sys.argv[1])
