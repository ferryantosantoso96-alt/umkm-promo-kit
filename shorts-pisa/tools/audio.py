"""Musik latar misterius + efek suara, disintesis dari nol (bebas lisensi, tanpa kredit).
pakai: python3 tools/audio.py hasil/musik-sfx.wav [audio/ev.json]
Waktu efek dibaca dari audio/ev.json (ditulis tools/waktu.js dari linimasa video.html)."""
import sys, wave, json
import numpy as np

EV = json.load(open(sys.argv[2] if len(sys.argv) > 2 else 'audio/ev.json'))
SC = EV['sc']
SR = 48000
DUR = float(EV['dur'])
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

# Dm – Bb – Gm – A berganti tiap adegan; senyap di kilas balik Pavia (adegan 8)
CH = [[62, 65, 69], [58, 62, 65], [55, 58, 62], [57, 61, 64]]
for i, (a0, b0) in enumerate(SC):
    if i == 7: continue
    br = 0.5 if i in (8,) else 0.8
    put(mus, pad(CH[i % 4] if i < len(SC) - 1 else [62, 65, 69, 74], b0 - a0 + 1.8, br), a0, 0.16 if i != 8 else 0.1, (-0.3 if i % 2 else 0.3))
def beat():
    tt = tarr(0.35); f = 45 + 35 * np.exp(-tt * 25)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(tt, 0.004, 0.09)
for tb in np.arange(SC[7][0], SC[8][1], 0.85):          # denyut jantung: Pavia & malam
    put(mus, beat(), tb, 0.5); put(mus, beat(), tb + 0.22, 0.32)
d9 = SC[8][1] - SC[8][0]; tt = tarr(d9)
put(mus, np.sin(2 * np.pi * hz(86) * tt + 0.3 * np.sin(2 * np.pi * 5.5 * tt)) * np.minimum(1, tt / 2) * np.clip((d9 - tt) / 1, 0, 1), SC[8][0], 0.035, 0.4)

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

# angin (tidak di kilas balik Pavia)
put(sfx, norm(wind(SC[7][0])), 0.0, 0.10, -0.2)
put(sfx, norm(wind(DUR - SC[8][1])), SC[8][1], 0.10, 0.2)
for tb in EV['bell'][:2]: put(sfx, norm(bell(98, 6)), tb, 0.45)
put(sfx, norm(bell(98, 7)), EV['bell'][2], 0.45)
for k, tc in enumerate(EV['crows']): put(sfx, norm(crow()), tc, 0.10, (-0.5, -0.45, 0.55, 0.3, -0.4, -0.35)[k % 6])
for tc in EV['cut']:                                      # tanah diiris
    put(sfx, norm(whoosh(1.4, 300, 2200, rev=True)), tc - 1.2, 0.3)
    put(sfx, norm(whoosh(1.8, 1800, 160)), tc + 0.1, 0.38)
    put(sfx, norm(rumble(3.0, 0.4, 70)), tc + 1.2, 0.3)
for tc in EV['cutUp']: put(sfx, norm(whoosh(1.8, 200, 2000)), tc, 0.3)
for tc in EV['thump']: put(sfx, norm(thump()), tc, 0.7)
for tc in EV['creak']: put(sfx, norm(creak(1.6, 150)), tc, 0.25, -0.2)
t0, t1 = EV['timelapse']; put(sfx, norm(whoosh(t1 - t0, 200, 3500)), t0, 0.3)
for k in range(int((t1 - t0) / 0.165)): put(sfx, norm(thump()) * 0.3, t0 + k * 0.165, 0.12)
b0, b1 = EV['build']                                      # batu disusun
for k in range(int((b1 - b0) / 0.42)): put(sfx, norm(bandpass(noise(0.12), 900 + 300 * (k % 3), 3) * env(tarr(0.12), 0.002, 0.03)), b0 + k * 0.42, 0.22, (k % 2) * 0.4 - 0.2)
p0, p1, pc = EV['pavia']                                  # kilas balik Pavia
put(sfx, norm(crackle(p1 - p0)), p0, 0.12)
put(sfx, norm(bandpass(noise(0.25), 1800, 1.0) * env(tarr(0.25), 0.001, 0.05)), pc - 0.05, 0.6)
put(sfx, norm(rumble(4.0, 0.2, 110)), pc, 0.9); put(sfx, norm(debris(3.0)), pc + 0.2, 0.45); put(sfx, norm(thump()), pc + 0.8, 0.8)
n0, n1, nt = EV['night']                                  # malam: guntur & hujan
put(sfx, norm(thunder(4.5)), n0, 0.85); put(sfx, norm(thunder(3.5)), nt, 0.6)
dn = n1 - n0; rain = bandpass(noise(dn), 4000, 0.6) + 0.4 * lowpass(noise(dn), 900)
put(sfx, norm(rain) * np.minimum(1, tarr(dn) / 0.4) * np.clip((dn - tarr(dn)) / 0.5, 0, 1), n0, 0.09)
m0, m1 = EV['motor']; put(sfx, norm(motor(m1 - m0)), m0, 0.14)
q0, q1 = EV['quake']; put(sfx, norm(rumble(q1 - q0 + 0.8, 0.3, 60)), q0, 1.0); put(sfx, norm(debris(2.2)) * 0.5, q0 + 0.4, 0.25)
def ding():
    tt = tarr(1.2); return (np.sin(2 * np.pi * 1318 * tt) + 0.4 * np.sin(2 * np.pi * 1976 * tt)) * env(tt, 0.003, 0.35)
for tc in EV['ding']: put(sfx, norm(ding()), tc, 0.12)

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
