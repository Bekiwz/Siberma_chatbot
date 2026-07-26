# Siberma - Chatbot AI PMB Universitas Majalengka (UNMA)

Siberma (Asisten Siber PMB UNMA) adalah sistem chatbot cerdas berbasis AI dengan pendekatan RAG (*Retrieval-Augmented Generation*) untuk melayani calon mahasiswa baru Universitas Majalengka.

---

## 📁 Struktur Folder Proyek

```
c:\Tugas Akhir\Berma\
├── public/                    # Seluruh aset web frontend (Static Files)
│   ├── index.html             # Panel Admin & Dashboard Analitik Panitia PMB
│   ├── widget-test.html       # Simulasi Situs Resmi PMB UNMA dengan Widget Chatbot
│   ├── css/                   # Stylesheet CSS
│   │   ├── styles.css         # Styling Dashboard Panel Admin
│   │   └── siberma-widget.css # Styling Embeddable Widget
│   └── js/                    # Logika JavaScript Frontend
│       ├── app.js             # Logika Dasbor & Statistik Panitia
│       └── siberma-widget.js  # Logika Widget Chatbot Embeddable
├── data/                      # Basis Data Pengetahuan RAG
│   └── dokumen_pmb_unma.txt   # Dokumen Informasi Resmi PMB UNMA 2026/2027
├── docs/                      # Dokumentasi & Panduan Tambahan
│   ├── panduan_rag_siberma.md # Panduan RAG & Integrasi Gemini/Groq AI
│   └── README_MONGODB.md      # Panduan Instalasi & Konfigurasi MongoDB
├── .env                       # Variabel Lingkungan / API Keys Server
├── .env.example               # Template Variabel Lingkungan
├── package.json               # Manifest NPM & Skrip Aplikasi
├── package-lock.json          # Lockfile Dependensi Node.js
└── server.js                  # Server API Backend (Express + AI RAG)
```

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Prasyarat
- **Node.js**: Versi 16 atau yang lebih baru.
- **MongoDB** (Opsional): Jika tidak ada MongoDB yang berjalan, server akan secara otomatis beralih ke mode *In-Memory Fallback*.
- **API Key** (Opsional untuk AI RAG): Tambahkan `GROQ_API_KEY` atau `GEMINI_API_KEY` pada berkas `.env`.

### 2. Jalankan Server Backend
Buka terminal pada direktori proyek lalu jalankan:

```bash
# Menggunakan mode development (dengan restart otomatis jika ada perubahan kode)
npm run dev

# Atau menggunakan mode standar Node.js
npm start
```

### 3. Akses Halaman Web pada Browser
- **Panel Admin & Dashboard Analitik Panitia**: [http://localhost:5000/](http://localhost:5000/)
- **Simulasi Website PMB UNMA (Widget Chatbot)**: [http://localhost:5000/widget-test.html](http://localhost:5000/widget-test.html)

---

## 🔌 API Endpoints

- `GET /api/faqs` - Mengambil seluruh data FAQ.
- `POST /api/faqs` - Menambahkan FAQ baru.
- `PUT /api/faqs/:id` - Mengubah data FAQ.
- `DELETE /api/faqs/:id` - Menghapus data FAQ.
- `GET /api/stats` - Mengambil statistik performa chatbot.
- `POST /api/chat` - Mengirim pesan ke AI RAG (Groq Llama 3.3 / Gemini 1.5 Flash).
