# Panduan Setup Database MongoDB & Server Backend Siberma

Folder ini berisi kode program backend server berbasis **Node.js (Express.js)** yang terhubung dengan database **MongoDB** menggunakan library ORM **Mongoose**. Ini adalah rancangan siap pakai untuk tahap produksi jangka panjang chatbot Siberma.

---

## 🛠️ Persiapan dan Instalasi Software

Sebelum menjalankan backend server, ada beberapa software yang wajib diinstal di komputer/laptop Anda:

### 1. Instalasi Node.js
Node.js bertindak sebagai mesin yang menjalankan JavaScript di sisi server (backend).
*   Unduh installer Node.js versi terbaru (LTS) dari situs resminya: [https://nodejs.org/](https://nodejs.org/)
*   Jalankan file installer tersebut di Windows Anda dan ikuti proses instalasi sampai selesai.
*   Untuk memverifikasi instalasi, buka **Command Prompt (cmd)** lalu ketik:
    ```bash
    node -v
    npm -v
    ```
    (Jika menampilkan nomor versi, berarti instalasi berhasil).

### 2. Instalasi MongoDB Community Server (Lokal)
MongoDB adalah database NoSQL berbasis dokumen tempat data FAQ dan data statistik Siberma disimpan.
*   Unduh installer MongoDB Community Server untuk Windows di: [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
*   **Penting saat instalasi**:
    *   Pilih opsi **"Complete"** saat ditanya tipe setup.
    *   Centang bagian **"Run service as Network Service user"** agar MongoDB berjalan otomatis setiap kali komputer dinyalakan.
    *   Centang **"Install MongoDB Compass"** (Aplikasi GUI untuk melihat database Anda secara visual seperti database manager).

---

## 🚀 Cara Menjalankan Server Backend

Setelah semua software terinstal, ikuti langkah berikut untuk mengaktifkan database dan server backend:

### Langkah 1: Install Dependencies
1.  Buka terminal/Command Prompt pada direktori utama proyek:
    ```bash
    cd "C:\Tugas Akhir\Berma"
    ```
2.  Jalankan perintah ini jika belum mengunduh dependensi:
    ```bash
    npm install
    ```

### Langkah 2: Jalankan Server
1.  Untuk menjalankan server dalam mode biasa:
    ```bash
    npm start
    ```
2.  (Opsional) Jika Anda ingin server otomatis me-reload setiap kali ada perubahan kode (berguna saat pengembangan), jalankan perintah:
    ```bash
    npm run dev
    ```
    *Server akan berjalan di port `5000` (contoh: `http://localhost:5000`). database `siberma_db` akan dibuat secara otomatis di MongoDB.*

---

## 🔍 Cara Melihat Data di MongoDB (Menggunakan MongoDB Compass)

1.  Buka aplikasi **MongoDB Compass** yang telah terinstal di Windows Anda.
2.  Pada kolom URI, masukkan koneksi default:
    ```text
    mongodb://localhost:27017
    ```
3.  Klik tombol **Connect**.
4.  Anda akan melihat database baru bernama **`siberma_db`**.
5.  Di dalamnya terdapat dua koleksi (tabel):
    *   `faqs`: Berisi data pertanyaan, jawaban, kata kunci, dan statistik klik.
    *   `stats`: Berisi metrik performa efisiensi panitia.

---

## ☁️ Migrasi ke Cloud (MongoDB Atlas) untuk Online 24 Jam

Jika chatbot Siberma ingin dipublikasikan secara online agar bisa diakses oleh siapa saja lewat internet, Anda disarankan memindahkan database lokal Anda ke **MongoDB Atlas** (layanan database cloud gratis):

1.  Daftar akun gratis di [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2.  Buat cluster database gratis baru (*Shared Cluster*).
3.  Di menu **Database Access**, buat username dan password database.
4.  Di menu **Network Access**, tambahkan alamat IP `0.0.0.0/0` agar bisa diakses dari mana saja.
5.  Klik tombol **Connect** pada cluster Anda, lalu pilih **"Connect your application"** untuk menyalin string koneksi. String koneksi akan berbentuk seperti ini:
    ```text
    mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/siberma_db?retryWrites=true&w=majority
    ```
6.  Buka file `.env` di folder backend Anda, lalu ganti nilai `MONGO_URI` dengan string koneksi cloud tersebut:
    ```text
    PORT=5000
    MONGO_URI=mongodb+srv://user_unma:pass_unma@cluster0.abcde.mongodb.net/siberma_db?retryWrites=true&w=majority
    ```
7.  Restart server Node.js Anda. Database Anda kini berada di cloud dan aman untuk jangka panjang!
