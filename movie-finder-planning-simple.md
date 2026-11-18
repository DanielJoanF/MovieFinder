# Movie Finder & Player
## Perencanaan Proyek (Versi Sederhana)

**Target:** Browser
**Arsitektur:** Frontend Vanilla JavaScript + backend Node.js/Express
**Tujuan:** Mencari film, menampilkan detailnya, lalu memutar video dari sumber yang valid dan diizinkan.

---

## 1. Fitur

**Tahap awal (MVP):**
- Cari film berdasarkan judul (poster, sinopsis, tahun, genre, rating)
- Halaman detail film
- Film trending
- Favorit, riwayat tontonan, dan progres pemutaran (disimpan lokal)
- Pemutar video HTML5 untuk URL media yang valid dan diizinkan

**Ditunda (setelah MVP berjalan):**
- Integrasi provider tambahan (metadata, katalog, availability, media)
- Subtitle WebVTT
- Pencocokan film lintas provider

---

## 2. Tech Stack

| Bagian | Teknologi |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Dev server frontend | Vite |
| Backend | Node.js + Express |
| Database lokal | SQLite melalui sql.js |
| Persistensi database | IndexedDB |
| Metadata utama | TMDB API |
| Video player | HTML5 Video API |
| Subtitle | WebVTT |

API key disimpan di `.env` backend, bukan di frontend. Versi dependensi dikunci lewat `package-lock.json`.

---

## 3. Alur Sistem

```text
User -> Frontend (Vanilla JS) -> Express API -> TMDB
                |
                v
        SQLite (sql.js + IndexedDB)
                |
                v
        HTML5 Video Player
```

- Frontend menampilkan UI dan menyimpan data pribadi (favorit, riwayat, progres) di SQLite lokal.
- Express menjadi perantara ke TMDB agar API key tetap aman.
- Pemutar hanya memutar URL media langsung yang valid dan penggunaannya diizinkan.

---

## 4. Struktur Folder

Dibuat dua bagian saja: `client/` untuk tampilan, `server/` untuk API.

```text
movie-finder/
├── client/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── main.js        <- titik masuk aplikasi
│   │   ├── api.js         <- request ke backend
│   │   ├── db.js          <- sql.js + IndexedDB
│   │   ├── search.js      <- pencarian & daftar film
│   │   ├── detail.js      <- halaman detail film
│   │   ├── player.js      <- video player
│   │   └── library.js     <- favorit & riwayat
│   └── public/
│       └── sql-wasm/      <- file WASM sql.js
│
├── server/
│   ├── index.js           <- Express + semua route
│   ├── tmdb.js            <- fungsi panggil TMDB
│   └── providers/         <- kosong dulu, diisi belakangan
│
├── .env                   <- TMDB_API_KEY
├── .env.example
├── .gitignore
├── package.json
└── vite.config.js
```

**Fungsi singkat tiap file:**

| File | Tugas |
|---|---|
| `main.js` | Inisialisasi aplikasi dan navigasi antar halaman |
| `api.js` | Semua `fetch` ke backend dikumpulkan di sini |
| `db.js` | Buat tabel, simpan/pulihkan database dari IndexedDB |
| `search.js` | Kolom pencarian dan kartu hasil |
| `detail.js` | Detail film dan tombol putar |
| `player.js` | Mengatur elemen `<video>` dan menyimpan progres |
| `library.js` | Daftar favorit dan riwayat |
| `server/index.js` | Route API dan konfigurasi Express |
| `server/tmdb.js` | Pencarian, detail, dan trending dari TMDB |

---

## 5. Database Lokal

| Tabel | Isi |
|---|---|
| `movies` | Cache metadata film (tmdbId, judul, tahun, poster, sinopsis) |
| `favorites` | Film favorit |
| `watch_history` | Riwayat tontonan |
| `watch_progress` | Posisi terakhir pemutaran |

- Database diekspor dengan `db.export()` lalu disimpan di IndexedDB, dan dipulihkan saat aplikasi dibuka.
- File video tidak disimpan di database.

---

## 6. API Backend

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/health` | Cek status server |
| GET | `/api/movies/search?q=` | Cari film |
| GET | `/api/movies/trending` | Film populer |
| GET | `/api/movies/:id` | Detail film |

Endpoint untuk provider ditambahkan nanti (misalnya `/api/movies/:id/sources`).

---

## 7. Tahapan Implementasi

1. **Fondasi:** setup Node.js, Express, Vite; hubungkan frontend dengan backend; setup sql.js + IndexedDB.
2. **Metadata:** integrasi TMDB (search, detail, trending) dan halaman UI-nya.
3. **Player & Library:** pemutar HTML5, simpan progres, favorit, dan riwayat.
4. **UI & Testing:** tema dark cinematic, responsive, uji persistensi database.
5. **Provider (belakangan):** tambah provider satu per satu, mulai dari Internet Archive dan JSON Catalog untuk uji playback, lalu OMDb, dan lainnya setelah diverifikasi.

---

## 8. Rencana Provider (Belakangan)

Folder `server/providers/` disiapkan kosong. Saat tahap 5 dimulai, setiap provider cukup berupa satu file dengan fungsi yang sama:

```javascript
// server/providers/contoh.js
export async function search(query) { /* ... */ }
export async function getDetails(item) { /* ... */ }
```

Daftar provider yang direncanakan: OMDb, IMDb API, FilmAffinity, YTS, 1337x, Popcorn Time, JustWatch, Netflix/Hulu pihak ketiga, Internet Archive, JSON Catalog.

Aturan saat integrasi nanti:
- Verifikasi dokumentasi, ketentuan penggunaan, dan endpoint sebelum mengaktifkan provider.
- Kegagalan satu provider tidak boleh menggagalkan yang lain (`Promise.allSettled()`).
- Hanya sumber media yang aksesnya sah dan diizinkan yang diputar; DRM, paywall, dan pembatasan akses tidak dilewati.

---

## 9. Risiko Utama

- API pihak ketiga bisa berubah, dibatasi kuota, atau berhenti beroperasi.
- CORS dapat membatasi akses media dari browser.
- Format video tidak selalu kompatibel dengan HTML5 Video.
- URL media bisa kedaluwarsa.

---

## 10. Keputusan Final

| Komponen | Keputusan |
|---|---|
| Frontend | Vanilla JavaScript + Vite |
| Backend | Node.js + Express |
| Database | sql.js + IndexedDB |
| Metadata | TMDB |
| Provider lain | Ditunda ke tahap akhir |
| Playback | HTML5 Video API |
| UI | Dark cinematic |
| Struktur | `client/` + `server/`, file datar tanpa subfolder berlapis |
