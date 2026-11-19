# Paru-paru Ngapain? — naskah & timecode

Video 9:16, 45 detik, 1080×1920, 30 fps. Narasi = teks subtitle di bawah (sudah ditanam di video).
Kalau mau menambah suara: rekam sendiri, atau pakai fitur *Teks ke ucapan* gratis di CapCut/TikTok
(pilih suara perempuan bahasa Indonesia), lalu taruh tiap kalimat di detik yang tertulis.

| Detik | Adegan | Narasi / subtitle |
|---|---|---|
| 00.2 – 01.9 | 1 · wajah, menarik napas | Setiap kali kamu menarik napas… |
| 01.9 – 03.6 | | apa yang terjadi di paru-paru? |
| 03.6 – 05.2 | 1 · kamera menyelam ke hidung | Yuk, kita menyelam lewat hidung! |
| 05.3 – 07.6 | 1 · rongga hidung | Bulu hidung dan lendir menangkap debu, |
| 07.6 – 09.9 | | lalu udara dihangatkan dan dilembapkan. |
| 10.1 – 13.4 | 2 · trakea | Udara meluncur turun lewat trakea, |
| 13.5 – 16.8 | 2 · percabangan | lalu bercabang ke dua bronkus: kanan dan kiri. |
| 17.1 – 19.9 | 3 · bronkiolus | Cabangnya makin kecil, namanya bronkiolus. |
| 20.0 – 22.3 | 3 · alveolus | Ujungnya gugusan balon mungil: alveolus! |
| 22.4 – 24.9 | 3 · penghitung | Jumlahnya sekitar 480 juta! |
| 25.1 – 27.4 | 4 · alveolus & kapiler | Alveolus dikelilingi pembuluh kapiler. |
| 27.5 – 30.2 | 4 · O₂ biru masuk darah | Oksigen menembus dinding tipis ke dalam darah, |
| 30.3 – 32.0 | | lalu menumpang di sel darah merah. |
| 32.1 – 34.7 | 4 · CO₂ abu-abu keluar | Sebaliknya, karbon dioksida keluar dari darah… |
| 34.8 – 37.0 | | …masuk ke alveolus untuk dibuang. |
| 37.3 – 40.3 | 5 · kamera keluar, embus napas | Saat kita mengembuskan napas, diafragma naik… |
| 40.4 – 42.3 | | …dan karbon dioksida ikut keluar! |
| 42.4 – 45.0 | 5 · penutup | Semua itu terjadi di setiap tarikan napasmu! |

## Sumber fakta

- Bulu hidung & lendir menyaring, konka menghangatkan & melembapkan udara — Cleveland Clinic, *Nose*: https://my.clevelandclinic.org/health/body/21778-nose
- Trakea → bronkus → bronkiolus → alveolus; pertukaran O₂/CO₂ di kapiler; diafragma turun saat menghirup, rileks/naik saat mengembuskan — NHLBI, *How the Lungs Work*: https://www.nhlbi.nih.gov/health/lungs/respiratory-system
- O₂ di darah sebagian besar diikat hemoglobin dalam sel darah merah — West, *Respiratory Physiology*; ringkasan: https://med.libretexts.org/Bookshelves/Gerontology/Human_Aging%3A_Biological_Perspectives_(DiGiovanna)/05%3A_Respiratory_System/5.07%3A_Diffusion
- Rata-rata ±480 juta alveolus (rentang 274–790 juta) — Ochs dkk., *Am J Respir Crit Care Med* 2004;169:120–124: https://bionumbers.hms.harvard.edu/bionumber.aspx?id=101476

## Audio

- Musik: disintesis sendiri (`tools/musik.py`), bebas lisensi.
- Efek suara: Bonus Sound Effect Motion Format (`sfx/`), boleh dipakai untuk video sendiri/klien.
- Tanpa ElevenLabs (tidak ada kredit terpakai).

## Render ulang

```
npm install            # gsap + font
python3 tools/musik.py audio/musik.wav 45
NODE_PATH=$(npm root -g) node tools/render.js video.html render/paru-paru-9x16.mp4
```
Pratinjau di browser: buka `video.html` (`?debug=1` = panel geser waktu, `?t=12.5` = berhenti di detik 12,5).
