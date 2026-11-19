# Lima Vidyaraja Acalanatha — video uji (16:9, tanpa suara)

Video 1920×1080, 30 fps, 62 detik. Dibuat gratis: HTML + GSAP + canvas, dirender frame demi frame
dengan Playwright + ffmpeg (tanpa AI video, tanpa kredit ElevenLabs). Bahan utama: gambar referensi
user, dipotong per sosok (latar dihapus dengan rembg) lalu dianimasikan dengan efek elemen.

## Pemetaan warna (disetujui user, mengikuti gambar referensi)

| Warna | Arah | Elemen | Efek |
|---|---|---|---|
| Putih | Barat | Logam | sinar perak, serpihan logam berkilau, cincin cahaya |
| Merah | Selatan | Api | kobaran api, gelombang api, bara |
| Biru | Utara | Air | ombak berlapis, arus berputar, gelembung |
| Kuning | Tengah | Bumi | gunung emas naik, batu bercahaya, debu emas |
| Hijau | Timur | Kayu | pohon tumbuh, daun berputar, rerumputan |

Di adegan kota / batas suci / mandala, arah mengikuti peta: Utara = atas/belakang, Selatan = bawah/depan,
Barat = kiri, Timur = kanan, Tengah = pusat.

## Urutan adegan

| Detik | Adegan |
|---|---|
| 0 – 9 | 1 · Mandala emas tergambar di langit kosmik, lima bola cahaya turun, kilat → kelima pelindung tampil |
| 9 – 34 | 2 · Lima pelindung satu per satu (5 dtk tiap sosok): Barat, Selatan, Utara, Tengah, Timur |
| 34 – 42 | 3 · Kota kuno, mandala lima warna mengembang, lima sinar dari lima arah, kubah cahaya |
| 42 – 48 | 4 · Simabandhana: lingkar batas lima warna di sekeliling kuil, energi gelap terpental |
| 48 – 54 | 5 · Praktisi bermeditasi, lima cahaya turun, aura lima warna |
| 54 – 62 | Akhir · Lima pelindung bersatu, energi menyatu jadi mandala raksasa, cahaya emas |

## Cara pakai

- Pratinjau: buka `video.html` di browser (berputar terus). `?t=12.5` berhenti di detik 12,5.
- Potret detik tertentu: `node tools/potret.js video.html folder-keluar 4 16.5 39`
- Render: `node tools/render.js video.html hasil/acala-lima-warna-16x9.mp4 --proses 3`
  (`--mulai` / `--sampai` untuk merender sebagian).

## Batasan versi gratis

Bukan 3D realistis: ini ilustrasi 2.5D (gambar referensi + gerak kamera + efek partikel).
Resolusi sosok terbatas karena gambar sumber hanya 1600×863.
