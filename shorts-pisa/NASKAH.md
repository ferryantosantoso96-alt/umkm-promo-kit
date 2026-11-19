# 800 Tahun Melawan Keruntuhan? — naskah (draf)

Shorts 9:16 (TikTok/Reels), 1080×1920, 30 fps. Gaya: 3D realistik sinematik, nuansa misterius-horor.
Dibuat dengan HTML + Three.js (`pisa3d.js`, `adegan1.html`), dirender lewat `tools/render.js` — **tanpa kredit ElevenLabs**.
`arsip-kling/` = percobaan lama dengan Kling (tidak dipakai).
Durasi target: **±95 detik** (11 adegan) — cukup untuk 6 poin edukasi tanpa bertele-tele. Waktu pasti mengikuti voiceover.
Semua di `video.html` (naskah = array `SENT`; waktu kalimat & adegan dihitung dari VO via `audio/waktu-vo.js`).
Subtitle: 160 px Montserrat tebal, 1–3 kata per tampilan, kata yang diucapkan menyala — **emas** angka/tahun, **merah** bahaya, **biru** tanah & sains.
Safe zone Reels/TikTok: semua teks di x 70–950, y 270–1420. Naskah ucapan VO: `audio/naskah-vo.txt` (`node tools/naskah-vo.js`).

| # | Adegan | Narasi |
|---|---|---|
| 1 | Hook, golden hour, Duomo di latar, garis TEGAK/MIRING ±4° | Delapan ratus tahun… ia terus condong ke tanah. Tapi anehnya… tak pernah jatuh. |
| 2 | Tanah teriris → fondasi ±3 m, lanau, lempung lunak, pasir padat | Rahasianya ada di bawah tanah. Fondasinya cuma tiga meter… di atas lumpur dan lempung lunak. |
| 3 | 1178: baru 2 lantai, mulai miring; perang; penghitung tahun → 1272 | Tahun 1178, baru dua lantai, menara ini mulai miring. Lalu perang… pembangunan terhenti hampir seratus tahun. |
| 4 | Potongan tanah: TANAH MEMADAT; garis merah "TANPA JEDA: ROBOH" | Jeda itu justru menyelamatkannya: tanah sempat memadat. Tanpa jeda, ia hampir pasti roboh. |
| 5 | Menara tumbuh 1272 → 1372, sisi miring dibuat lebih tinggi, garis lengkung (dilebih-lebihkan) | Tahun 1272, pembangunan berlanjut. Lantai atasnya dibuat lebih tinggi di sisi miring… jadi menaranya sedikit melengkung. |
| 6 | Titik berat + garis unting jatuh di dalam fondasi ✓ | Lalu, kenapa tak roboh? Titik beratnya masih jatuh di atas fondasi. |
| 7 | Senja: "1838 · KAKI MENARA DIGALI", "1934 · ±200 TON BETON", miring bertambah | Tapi manusia justru memperparahnya. Penggalian di kakinya, lalu suntikan beton… membuatnya makin miring. |
| 8 | Kilas balik sepia: Pavia runtuh, "4 TEWAS · 15 LUKA" | Maret 1989, menara tua di Pavia runtuh. Empat orang tewas. |
| 9 | Malam, petir: "DITUTUP · 7 JAN 1990", MIRING 5,5° | Sepuluh bulan kemudian, Pisa ditutup. Miringnya sudah 5,5 derajat… nyaris tumbang. |
| 10 | Potongan: pemberat timah sisi utara, pipa penyedot, menara berputar balik, "PUNCAK KEMBALI 45 CM" | Insinyur memasang pemberat timah… lalu menyedot tanah sedikit demi sedikit. Perlahan, puncaknya kembali 45 senti. |
| 11 | Gempa, "≥4 GEMPA KUAT SEJAK 1280 · TETAP BERDIRI", judul akhir ditahan ±4 dtk | Ironisnya, tanah lunak itu juga meredam gempa. Empat gempa kuat datang… ia tetap berdiri. Ia miring… untuk tetap hidup. |

Catatan: 5,5° → 3,97° dan "kembali ±45 cm" dari History.com; Burland menyebut koreksi ±10% / ±38 cm. Berat timah: sumber berbeda (600→900 t vs 870 t), jadi tidak ditulis angkanya.

## Sumber fakta

- Mulai dibangun 1173, miring sejak tahap awal, terhenti 1178 karena perang, dilanjutkan 1272, ruang lonceng selesai 1372; miring 5,5° (1990) → 3,97° setelah 1993–2001, mundur ±45 cm (posisi 1838); berhenti bergerak 2008 — History.com https://www.history.com/news/why-does-the-leaning-tower-of-pisa-lean , Discover https://discovermagazine.com/planet-earth/the-leaning-tower-of-pisa-wasnt-supposed-to-lean
- Ditutup 1990, komite 13 ahli dipimpin John Burland; underexcavation sisi utara; tegak kembali ±38–45 cm; dibuka lagi 2001 — Ingenia https://ingenia.org.uk/articles/the-stabilisation-of-the-leaning-tower-of-pisa/ , ICE https://www.ice.org.uk/what-is-civil-engineering/what-do-civil-engineers-do/stabilising-the-leaning-tower-of-pisa/ , Burland dkk. (Imperial) https://spiral.imperial.ac.uk/entities/publication/fe83f08f-89d7-4396-91a5-1e40c293546c
- Fondasi ±3 m; tanah: ±6 m lanau lunak endapan Arno, ±30 m lempung laut sangat lunak — EBSCO https://ebsco.com/research-starters/history/leaning-tower-pisa , Construction Equipment Guide (wawancara Burland) https://www.constructionequipmentguide.com/pisa-leans-on-contractor-to-save-its-tower/9468
- Torre Civica Pavia runtuh 17 Maret 1989, 4 tewas, 15 luka; Pisa ditutup 7 Januari 1990 karena khawatir bernasib sama — Panorama https://www.panorama.it/lifestyle/17-marzo-1989-crollo-torre-civica-pavia , Wikipedia https://en.wikipedia.org/wiki/Civic_Tower_(Pavia)
- Tahan ≥4 gempa kuat sejak 1280 karena interaksi dinamis tanah–struktur (Roma Tre, 2018) — EurekAlert https://www.eurekalert.org/news-releases/609741 , Popular Science https://www.popsci.com/leaning-tower-pisa-soil
- (Opsional, legenda) Camposanto di sebelah menara: tanah konon dibawa dari Golgota, jasad hancur dalam sehari; fresko *Trionfo della Morte* — Univ. Zürich https://dlf.uzh.ch/sites/camposanto/?p=894
- Jeda ±100 tahun membuat tanah memadat; tanpa jeda menara hampir pasti roboh; lantai atas dibuat lebih tinggi di satu sisi sehingga melengkung — Mental Floss https://www.mentalfloss.com/culture/architecture/why-does-leaning-tower-pisa-lean , Designing Buildings https://www.designingbuildings.co.uk/wiki/Tower_of_Pisa
- 1838 penggalian kaki menara (Gherardesca) & 1934 ±200 ton beton disuntikkan, keduanya menambah kemiringan — History.com https://www.history.com/this-day-in-history/February-27/leaning-tower-needs-help , EBSCO https://ebsco.com/research-starters/history/leaning-tower-pisa
- Pemberat timah di sisi utara (1993), sementara — Ingenia https://ingenia.org.uk/articles/the-stabilisation-of-the-leaning-tower-of-pisa/ , geotech.hr https://www.geotech.hr/en/why-the-tower-of-pisa-commence-to-lean/
