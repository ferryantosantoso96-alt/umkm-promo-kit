"""Hitung perkiraan suku kata per potongan ucapan VO (puncak energi vokal, gaya De Jong & Wempe)."""
import subprocess, sys, numpy as np
from scipy.signal import butter, sosfiltfilt, find_peaks
SR = 16000
def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    return np.frombuffer(raw, '<i2').astype(np.float32) / 32768
def nuclei(x):
    sos = butter(4, [300, 2500], 'bandpass', fs=SR, output='sos'); y = sosfiltfilt(sos, x)
    hop = SR // 100; e = np.sqrt(np.convolve(y ** 2, np.hanning(int(SR * 0.04)) / (SR * 0.02), 'same')[::hop] + 1e-12)
    db = 20 * np.log10(e); floor = np.percentile(db, 95) - 25
    pk, pr = find_peaks(db, prominence=2.5, distance=8, height=floor)
    return pk * 0.01, db
if __name__ == '__main__':
    x = load(sys.argv[1]); t, _ = nuclei(x)
    print(len(t), 'puncak'); print(' '.join(f'{v:.2f}' for v in t))
