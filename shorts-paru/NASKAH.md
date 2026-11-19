# Paru-paru Ngapain? — naskah & timecode

Video 9:16, 49.1 detik, 1080×1920, 30 fps.
Voiceover: ElevenLabs, model eleven_v4, suara **honeypie** (1 take, 693 kredit). Naskah lengkap: `audio/naskah-vo.txt`.
Animasi diselaraskan ke voiceover (`tools/selaras.py` → `audio/warp.json`): tiap kalimat mulai tepat saat diucapkan.

| Detik | Adegan | Narasi / subtitle |
|---|---|---|
| 00.29 – 02.63 | 1 · wajah, menarik napas | Setiap kali menarik napas… |
| 02.63 – 04.43 |  | apa yang terjadi di paru-paru? |
| 04.43 – 06.16 | 1 · kamera menyelam ke hidung | Yuk, menyelam lewat hidung! |
| 06.16 – 08.84 | 1 · rongga hidung | Bulu hidung dan lendir menangkap debu, |
| 08.84 – 11.99 |  | lalu udara dihangatkan dan dilembapkan. |
| 11.99 – 14.41 | 2 · trakea | Udara meluncur turun lewat trakea, |
| 14.41 – 16.67 | 2 · percabangan | lalu bercabang ke dua bronkus. |
| 16.67 – 19.46 | 3 · bronkiolus | Cabangnya makin kecil: bronkiolus. |
| 19.46 – 22.50 | 3 · alveolus | Ujungnya balon-balon mungil: alveolus! |
| 22.50 – 25.99 | 3 · penghitung | Jumlahnya sekitar 480 juta! |
| 25.99 – 28.71 | 4 · alveolus & kapiler | Alveolus dikelilingi pembuluh kapiler. |
| 28.71 – 31.41 | 4 · O₂ biru masuk darah | Oksigen menembus dinding tipis ke darah, |
| 31.41 – 33.73 |  | lalu menumpang di sel darah merah. |
| 33.73 – 37.10 | 4 · CO₂ abu-abu keluar | Sebaliknya, karbon dioksida keluar dari darah… |
| 37.10 – 39.48 |  | …masuk ke alveolus untuk dibuang. |
| 39.48 – 42.48 | 5 · kamera keluar, embus napas | Saat napas diembuskan, diafragma naik… |
| 42.48 – 44.76 |  | …dan karbon dioksida ikut keluar! |
| 44.76 – 49.09 | 5 · penutup | Semua itu terjadi di setiap tarikan napasmu! |

## Sumber fakta

- Bulu hidung & lendir menyaring, konka menghangatkan & melembapkan udara — Cleveland Clinic, *Nose*: https://my.clevelandclinic.org/health/body/21778-nose
- Trakea → bronkus → bronkiolus → alveolus; pertukaran O₂/CO₂ di kapiler; diafragma turun saat menghirup, rileks/naik saat mengembuskan — NHLBI, *How the Lungs Work*: https://www.nhlbi.nih.gov/health/lungs/respiratory-system
- O₂ di darah sebagian besar diikat hemoglobin dalam sel darah merah — West, *Respiratory Physiology*; ringkasan: https://med.libretexts.org/Bookshelves/Gerontology/Human_Aging%3A_Biological_Perspectives_(DiGiovanna)/05%3A_Respiratory_System/5.07%3A_Diffusion
- Rata-rata ±480 juta alveolus (rentang 274–790 juta) — Ochs dkk., *Am J Respir Crit Care Med* 2004;169:120–124: https://bionumbers.hms.harvard.edu/bionumber.aspx?id=101476

## Audio

- Musik: disintesis sendiri (`tools/musik.py`), bebas lisensi.
- Efek suara: Bonus Sound Effect Motion Format (`sfx/`), boleh dipakai untuk video sendiri/klien.
- Narator: ElevenLabs (honeypie, eleven_v4). Musik otomatis mengecil saat narator bicara (ducking).

## Render ulang

```
npm install            # gsap + font
python3 tools/musik.py audio/musik.wav 49.1
python3 tools/selaras.py audio/vo-elevenlabs.mp3 video.html audio/warp.json \
  --batas 0.10,2.44,4.24,5.97,8.65,11.80,14.22,16.48,19.27,22.31,25.80,28.52,31.22,33.54,36.91,39.29,42.29,44.57 --akhir 47.44
NODE_PATH=$(npm root -g) node tools/render.js video.html render/paru-paru-vo-9x16.mp4 --warp audio/warp.json --musik-vol .34 --sfx-vol .8
```
Pratinjau di browser: buka `video.html` (`?debug=1` = panel geser waktu, `?t=12.5` = berhenti di detik 12,5).
