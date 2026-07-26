// API Server for Siberma Chatbot (Node.js + Express + MongoDB + In-Memory Fallback + Gemini AI RAG)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ====================================================
// MIDDLEWARE SETUP
// ====================================================

// CORS — widget publik boleh dari mana saja
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Session Middleware (untuk autentikasi admin panel)
app.use(session({
  secret: process.env.SESSION_SECRET || 'siberma_fallback_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,      // Tidak bisa diakses JavaScript browser (XSS protection)
    secure: false,       // Ubah ke true jika sudah pakai HTTPS di production
    maxAge: 8 * 60 * 60 * 1000  // Session berlaku 8 jam
  }
}));

// ====================================================
// RATE LIMITING
// ====================================================

// Limiter untuk endpoint chat (publik) — cegah abuse Groq API
const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,  // 10 menit
  max: 20,                    // Max 20 request per 10 menit per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Terlalu banyak permintaan chat. Silakan tunggu beberapa menit sebelum mencoba lagi.'
  }
});

// Limiter umum untuk semua API route (admin)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 menit
  max: 200,                   // Max 200 request per 15 menit per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Terlalu banyak permintaan. Silakan coba lagi dalam beberapa menit.'
  }
});

// Terapkan limiter umum ke semua /api/*
app.use('/api/', apiLimiter);

// ====================================================
// AUTH MIDDLEWARE
// ====================================================

// Middleware: cek apakah user sudah login (untuk proteksi admin routes)
function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin === true) {
    return next();
  }
  return res.status(401).json({ error: 'Sesi tidak valid. Silakan login kembali.', redirect: '/login.html' });
}

// ====================================================
// STATIC FILES — Atur SEBELUM route proteksi
// ====================================================

// File publik yang bebas diakses tanpa login (login.html, widget, CSS, images)
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Halaman login — bebas diakses
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Halaman widget test — bebas diakses (simulasi situs PMB)
app.get('/widget-test.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'widget-test.html'));
});

// Halaman utama (dashboard admin) — WAJIB login
app.get('/', (req, res) => {
  if (req.session && req.session.isAdmin === true) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.redirect('/login.html');
  }
});

// ====================================================
// DATABASE SCHEMAS & MODELS
// ====================================================

// FAQ Schema (Legacy support & Admin CRUD panel)
const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  keywords: [{ type: String, lowercase: true, trim: true }],
  answer: { type: String, required: true },
  count: { type: Number, default: 0 }
});

const FAQ = mongoose.model('FAQ', faqSchema);

// Statistics Schema
const statSchema = new mongoose.Schema({
  totalChats: { type: Number, default: 24 },
  totalSolved: { type: Number, default: 148 },
  hoursSaved: { type: Number, default: 30 },
  reliefPercent: { type: Number, default: 82 }
});

const Stat = mongoose.model('Stat', statSchema);

// ====================================================
// IN-MEMORY DATABASE FALLBACK SETUP
// ====================================================
let isMongoConnected = false;

const defaultFAQs = [
  {
    _id: "647a1b2c3d4e5f6a7b8c9d01",
    question: "Berapa biaya pendaftaran dan biaya kuliah per semester di UNMA?",
    keywords: ["biaya", "uang", "kuliah", "bayar", "semester", "spp", "ukt", "mahal", "murah", "cicilan"],
    answer: "Biaya pendaftaran PMB Universitas Majalengka adalah Rp 250.000. Untuk biaya kuliah per semester bervariasi antara Rp 2.500.000 hingga Rp 4.500.000 tergantung pada Fakultas dan Program Studi pilihan Anda. Pembayaran dapat diangsur dan UNMA juga menyediakan berbagai beasiswa (Prestasi, KIP Kuliah, Pemerintah Daerah).",
    count: 42
  },
  {
    _id: "647a1b2c3d4e5f6a7b8c9d02",
    question: "Apa saja dokumen persyaratan untuk mendaftar sebagai mahasiswa baru?",
    keywords: ["syarat", "berkas", "dokumen", "persyaratan", "persiapan", "butuh", "ijazah", "kk", "ktp"],
    answer: "Persyaratan umum pendaftaran PMB UNMA meliputi:\n1. Scan Ijazah atau Surat Keterangan Lulus (SKL) SMA/SMK/MA sederajat.\n2. Scan Kartu Keluarga (KK) dan KTP.\n3. Pas foto berwarna terbaru ukuran 3x4.\n4. Bukti transfer biaya pendaftaran sebesar Rp 250.000.",
    count: 35
  },
  {
    _id: "647a1b2c3d4e5f6a7b8c9d03",
    question: "Apa saja jalur pendaftaran yang dibuka di Universitas Majalengka?",
    keywords: ["jalur", "prestasi", "reguler", "kip", "beasiswa", "tes", "raport", "ujian", "bebas tes"],
    answer: "UNMA membuka 3 jalur pendaftaran:\n1. Jalur Reguler: Melalui ujian saringan masuk mandiri.\n2. Jalur Prestasi: Bebas tes berdasarkan nilai Raport (Semester 1-5 rata-rata min. 80) atau prestasi olahraga/seni/keagamaan min. tingkat Kabupaten.\n3. Jalur Beasiswa / KIP Kuliah: Beasiswa penuh bagi calon mahasiswa kurang mampu yang berprestasi.",
    count: 27
  },
  {
    _id: "647a1b2c3d4e5f6a7b8c9d04",
    question: "Fakultas dan Program Studi apa saja yang tersedia di UNMA?",
    keywords: ["fakultas", "jurusan", "prodi", "pilihan", "program studi", "teknik", "ekonomi", "hukum", "pertanian", "pendidikan"],
    answer: "UNMA memiliki 7 Fakultas dengan Program Studi S1 terakreditasi:\n- Fakultas Teknik: Teknik Informatika, Teknik Sipil, Teknik Industri, Teknik Mesin.\n- Fakultas Ekonomi & Bisnis: Manajemen, Akuntansi.\n- Fakultas Keguruan & Ilmu Pendidikan: PGSD, Penjas, B. Inggris, B. Indonesia, Matematika.\n- Fakultas Hukum: Ilmu Hukum.\n- Fakultas Pertanian: Agroteknologi, Agribisnis.\n- Fakultas Ilmu Sosial & Ilmu Politik: Ilmu Administrasi Publik, Ilmu Komunikasi.\n- Fakultas Agama Islam: Pendidikan Agama Islam, Pendidikan Islam Anak Usia Dini.",
    count: 19
  },
  {
    _id: "647a1b2c3d4e5f6a7b8c9d05",
    question: "Kapan jadwal pendaftaran dibuka dan ditutup (Gelombang)?",
    keywords: ["jadwal", "kapan", "gelombang", "tanggal", "buka", "tutup", "batas", "mulai"],
    answer: "Pendaftaran PMB UNMA dibuka dalam 3 gelombang:\n- Gelombang 1: Januari s.d. April (Mendapatkan potongan dana pengembangan 15%)\n- Gelombang 2: Mei s.d. Juni\n- Gelombang 3: Juli s.d. September\nPendaftaran dapat dilakukan secara online melalui pmb.unma.ac.id atau offline di Sekretariat PMB UNMA.",
    count: 12
  },
  {
    _id: "647a1b2c3d4e5f6a7b8c9d06",
    question: "Bagaimana cara menghubungi panitia PMB jika ada kendala pendaftaran?",
    keywords: ["kontak", "wa", "telepon", "nomor", "admin", "panitia", "hubungi", "whatsapp", "helpdesk"],
    answer: "Anda dapat menghubungi Helpdesk Panitia PMB UNMA melalui:\n- WhatsApp Resmi: 0811-2233-4455\n- Email: pmb@unma.ac.id\n- Alamat Sekretariat: Gedung Rektorat Lantai 1 Kampus UNMA, Jl. KH. Abdul Halim No. 103, Majalengka (Senin - Sabtu, 08:00 - 16:00 WIB).",
    count: 8
  },
  {
    _id: "647a1b2c3d4e5f6a7b8c9d07",
    question: "Siapa Rektor Universitas Majalengka (UNMA) saat ini?",
    keywords: ["rektor", "pimpinan", "pemimpin", "rektor unma", "kepala unma"],
    answer: "Rektor Universitas Majalengka (UNMA) saat ini adalah Dr. H. Otong Syuhada, S.H., M.H.",
    count: 25
  },
  {
    _id: "647a1b2c3d4e5f6a7b8c9d08",
    question: "Siapa saja Wakil Rektor Universitas Majalengka (UNMA)?",
    keywords: ["wakil rektor", "warek", "warek 1", "warek 2", "warek 3", "pimpinan rektorat"],
    answer: "Wakil Rektor UNMA terdiri dari:\n1. Wakil Rektor I (Bidang Akademik, Kemahasiswaan & Alumni): Dr. Yoyo Ansori Zakaria, S.Ag., M.Pd.\n2. Wakil Rektor II (Bidang Sumberdaya, Keuangan & Tata Kelola): Prof. Dr. Sri Ayu Andayani, S.P., M.P.\n3. Wakil Rektor III (Bidang Kerjasama, Inovasi & Pengembangan): Dr. Endi Rustandi, S.Pd., M.Pd.",
    count: 18
  }
];

let memoryFAQs = JSON.parse(JSON.stringify(defaultFAQs));
let memoryStats = {
  totalChats: 24,
  totalSolved: 148,
  hoursSaved: 30,
  reliefPercent: 82
};

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/siberma_db';
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully!');
    isMongoConnected = true;
    seedDatabase();
  })
  .catch(err => {
    console.warn('\n========================================================================');
    console.warn('⚠️  PERINGATAN: Gagal terhubung ke database MongoDB.');
    console.warn('   Server akan tetap berjalan menggunakan mode fallback "In-Memory Database".');
    console.warn('   Data FAQ dan statistik akan disimpan sementara di memori server.');
    console.warn('========================================================================\n');
  });

// ====================================================
// SEED DEFAULT DATA IF DATABASE IS EMPTY
// ====================================================
async function seedDatabase() {
  try {
    const faqCount = await FAQ.countDocuments();
    if (faqCount === 0) {
      console.log('FAQ database is empty. Seeding default data...');
      const seedFAQs = defaultFAQs.map(faq => {
        const { _id, ...rest } = faq;
        return rest;
      });
      await FAQ.insertMany(seedFAQs);
      console.log('Default FAQs successfully seeded!');
    }

    const statCount = await Stat.countDocuments();
    if (statCount === 0) {
      console.log('Stats database is empty. Seeding default statistics...');
      await Stat.create({
        totalChats: 24,
        totalSolved: 148,
        hoursSaved: 30,
        reliefPercent: 82
      });
      console.log('Default statistics seeded!');
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

// ====================================================
// AUTH ROUTES (Tidak memerlukan login)
// ====================================================

// POST /api/auth/login — Proses login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  const validUsername = process.env.ADMIN_USERNAME || 'admin';
  const validPassword = process.env.ADMIN_PASSWORD || 'siberma2026';

  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }

  if (username === validUsername && password === validPassword) {
    req.session.isAdmin = true;
    req.session.loginTime = new Date().toISOString();
    console.log(`✅ Admin login berhasil: ${username} pada ${req.session.loginTime}`);
    return res.json({ success: true, message: 'Login berhasil.' });
  } else {
    console.warn(`⚠️  Percobaan login gagal untuk username: "${username}" dari IP: ${req.ip}`);
    return res.status(401).json({ error: 'Username atau password salah.' });
  }
});

// GET /api/auth/logout — Proses logout
app.get('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal logout.' });
    }
    res.clearCookie('connect.sid');
    res.redirect('/login.html');
  });
});

// GET /api/auth/check — Cek status sesi (digunakan oleh login.html)
app.get('/api/auth/check', (req, res) => {
  res.json({ authenticated: req.session && req.session.isAdmin === true });
});

// ====================================================
// API ROUTES (Semua dilindungi requireAuth, kecuali /api/chat)
// ====================================================

// 1. GET ALL FAQs
app.get('/api/faqs', requireAuth, async (req, res) => {
  try {
    if (isMongoConnected) {
      const faqs = await FAQ.find();
      res.json(faqs);
    } else {
      res.json(memoryFAQs);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. CREATE NEW FAQ
app.post('/api/faqs', requireAuth, async (req, res) => {
  try {
    const { question, keywords, answer } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Question dan answer wajib diisi.' });
    }
    if (isMongoConnected) {
      const newFAQ = new FAQ({ question, keywords, answer });
      await newFAQ.save();
      res.status(201).json(newFAQ);
    } else {
      const newFAQ = {
        _id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        question,
        keywords: keywords ? keywords.map(kw => kw.toLowerCase().trim()) : [],
        answer,
        count: 0
      };
      memoryFAQs.push(newFAQ);
      res.status(201).json(newFAQ);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. UPDATE FAQ
app.put('/api/faqs/:id', requireAuth, async (req, res) => {
  try {
    const { question, keywords, answer } = req.body;
    if (isMongoConnected) {
      const updatedFAQ = await FAQ.findByIdAndUpdate(
        req.params.id,
        { question, keywords, answer },
        { new: true }
      );
      if (!updatedFAQ) return res.status(404).json({ error: 'FAQ not found' });
      res.json(updatedFAQ);
    } else {
      const index = memoryFAQs.findIndex(f => f._id === req.params.id);
      if (index === -1) return res.status(404).json({ error: 'FAQ not found' });
      memoryFAQs[index].question = question || memoryFAQs[index].question;
      memoryFAQs[index].keywords = keywords ? keywords.map(kw => kw.toLowerCase().trim()) : memoryFAQs[index].keywords;
      memoryFAQs[index].answer = answer || memoryFAQs[index].answer;
      res.json(memoryFAQs[index]);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. DELETE FAQ
app.delete('/api/faqs/:id', requireAuth, async (req, res) => {
  try {
    if (isMongoConnected) {
      const deletedFAQ = await FAQ.findByIdAndDelete(req.params.id);
      if (!deletedFAQ) return res.status(404).json({ error: 'FAQ not found' });
      res.json({ message: 'FAQ deleted successfully' });
    } else {
      const index = memoryFAQs.findIndex(f => f._id === req.params.id);
      if (index === -1) return res.status(404).json({ error: 'FAQ not found' });
      memoryFAQs.splice(index, 1);
      res.json({ message: 'FAQ deleted successfully' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. GET STATISTICS
app.get('/api/stats', requireAuth, async (req, res) => {
  try {
    if (isMongoConnected) {
      let stats = await Stat.findOne();
      if (!stats) stats = await Stat.create({});
      res.json(stats);
    } else {
      res.json(memoryStats);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. INCREMENT CHATS
app.post('/api/stats/increment-chats', requireAuth, async (req, res) => {
  try {
    if (isMongoConnected) {
      let stats = await Stat.findOne();
      if (!stats) stats = await Stat.create({});
      stats.totalChats += 1;
      await stats.save();
      res.json(stats);
    } else {
      memoryStats.totalChats += 1;
      res.json(memoryStats);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. INCREMENT SOLVED (AND FAQ ASK COUNT)
app.post('/api/stats/increment-solved/:faqId', requireAuth, async (req, res) => {
  try {
    const { faqId } = req.params;
    if (isMongoConnected) {
      const faq = await FAQ.findById(faqId);
      if (faq) {
        faq.count += 1;
        await faq.save();
      }
      let stats = await Stat.findOne();
      if (!stats) stats = await Stat.create({});
      stats.totalSolved += 1;
      stats.hoursSaved = Math.floor(stats.totalSolved / 5);
      const baseRelief = 75;
      const incrementalRelief = Math.min(21, Math.floor(stats.totalSolved / 25));
      stats.reliefPercent = Math.min(96, baseRelief + incrementalRelief);
      await stats.save();
      res.json({ stats, faq });
    } else {
      const faq = memoryFAQs.find(f => f._id === faqId);
      if (faq) faq.count = (faq.count || 0) + 1;
      memoryStats.totalSolved += 1;
      memoryStats.hoursSaved = Math.floor(memoryStats.totalSolved / 5);
      const baseRelief = 75;
      const incrementalRelief = Math.min(21, Math.floor(memoryStats.totalSolved / 25));
      memoryStats.reliefPercent = Math.min(96, baseRelief + incrementalRelief);
      res.json({ stats: memoryStats, faq });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. CHATBOT ROUTE — PUBLIK (tidak perlu login, tapi ada rate limiting)
app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Sanitasi dasar: potong pesan yang terlalu panjang
    const sanitizedMessage = String(message).substring(0, 1000);

    const groqApiKey = process.env.GROQ_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!groqApiKey && !geminiApiKey) {
      console.warn('⚠️  Peringatan: Baik GROQ_API_KEY maupun GEMINI_API_KEY tidak ditemukan di file .env.');
      return res.json({
        reply: "Halo! Saya **Siberma**. Mohon maaf, untuk saat ini otak kecerdasan AI saya belum dapat terhubung karena **kunci API belum dikonfigurasi** di file `.env` server backend.\n\nSilakan tambahkan variabel `GROQ_API_KEY=Kunci_Groq_Anda` atau `GEMINI_API_KEY=Kunci_Gemini_Anda` pada file `.env` di folder backend lalu jalankan ulang server agar saya dapat menjawab pertanyaan Anda secara cerdas dan interaktif berdasarkan dokumen resmi kampus!"
      });
    }

    // Read the official document file
    const docPath = path.join(__dirname, 'data', 'dokumen_pmb_unma.txt');
    let documentContext = '';
    try {
      documentContext = fs.readFileSync(docPath, 'utf8');
    } catch (err) {
      console.error('Error reading dokumen_pmb_unma.txt:', err);
      documentContext = 'Informasi pendaftaran PMB UNMA saat ini belum tersedia secara tertulis di server.';
    }

    // System Instruction / Prompt Engine configuration (Gen Z Casual Student Persona)
    const systemInstruction =
      "Kamu adalah Siberma, maskot & bestie AI resmi untuk Penerimaan Mahasiswa Baru (PMB) Universitas Majalengka (UNMA).\n" +
      "Karaktermu adalah mahasiswa Gen Z yang ramah, supel, santai, asyik diajak ngobrol, tapi tetap sopan dan informatif!\n\n" +
      "GAYA BAHASA & PERSONA GEN Z:\n" +
      "- Gunakan sapaan yang santai dan akrab khas anak muda seperti 'Halo Kak!', 'Sampurasun Bestie!', 'Halo calon Maba UNMA!', atau 'Wah seru nih!'.\n" +
      "- Bicara dengan gaya percakapan anak muda yang santai dan alami. JANGAN gunakan bahasa formal birokratis yang kaku seperti robot AI.\n" +
      "- Contoh gaya tutur: 'Nah, buat biaya pendaftarannya cuma Rp 250.000 aja kok Kak!', 'Simple banget kan syaratnya?', 'Yuk, sini Siberma jelasin prodi-prodinya!'.\n" +
      "- Gunakan poin-poin singkat yang enak dibaca dan dipahami.\n\n" +
      "ATURAN DAN BATASAN PENTING:\n" +
      "1. Kamu WAJIB memberikan informasi AKURAT yang hanya bersumber dari DOKUMEN RESMI KAMPUS di bawah ini.\n" +
      "2. Jika jawaban dari pertanyaan pengguna tidak tercantum atau tidak dapat disimpulkan dari dokumen resmi, katakan dengan santai bahwa kamu belum tahu infonya, lalu arahkan untuk hubungi WA Panitia PMB di 0811-2233-4455.\n" +
      "3. JANGAN mengarang biaya, jalur pendaftaran, atau kontak di luar dokumen resmi (cegah halusinasi).\n\n" +
      "DOKUMEN RESMI KAMPUS PMB UNMA:\n" +
      documentContext;

    let responseText = '';

    if (groqApiKey) {
      const formattedHistory = Array.isArray(history) ? history.slice(-6).map(h => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: String(h.content).substring(0, 500) // Sanitasi history
      })) : [];

      const messagesPayload = [
        { role: 'system', content: systemInstruction },
        ...formattedHistory,
        { role: 'user', content: sanitizedMessage }
      ];

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: messagesPayload,
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Groq API error (${response.status}): ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      responseText = data.choices[0].message.content.trim();
      console.log('🤖 Responded using Groq API (Llama 3.3 with Conversation History)');
    } else {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction,
      });

      const contents = [];
      if (Array.isArray(history)) {
        history.slice(-6).forEach(h => {
          contents.push({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: String(h.content).substring(0, 500) }]
          });
        });
      }
      contents.push({ role: 'user', parts: [{ text: sanitizedMessage }] });

      const result = await model.generateContent({
        contents: contents,
        generationConfig: { temperature: 0.3, maxOutputTokens: 1000 }
      });

      responseText = result.response.text().trim();
      console.log('🤖 Responded using Gemini API (1.5 Flash with Conversation History)');
    }

    // Analytics — update statistik server secara otomatis
    try {
      if (isMongoConnected) {
        let stats = await Stat.findOne();
        if (!stats) stats = await Stat.create({});
        stats.totalChats += 1;
        const isNotSolved = responseText.toLowerCase().includes("belum tahu") ||
                            responseText.toLowerCase().includes("0811-2233-4455") ||
                            responseText.toLowerCase().includes("tidak tercantum");
        if (!isNotSolved) {
          stats.totalSolved += 1;
          stats.hoursSaved = Math.floor(stats.totalSolved / 5);
          const baseRelief = 75;
          const incrementalRelief = Math.min(21, Math.floor(stats.totalSolved / 25));
          stats.reliefPercent = Math.min(96, baseRelief + incrementalRelief);
        }
        await stats.save();
      } else {
        memoryStats.totalChats += 1;
        const isNotSolved = responseText.toLowerCase().includes("belum tahu") ||
                            responseText.toLowerCase().includes("0811-2233-4455") ||
                            responseText.toLowerCase().includes("tidak tercantum");
        if (!isNotSolved) {
          memoryStats.totalSolved += 1;
          memoryStats.hoursSaved = Math.floor(memoryStats.totalSolved / 5);
          const baseRelief = 75;
          const incrementalRelief = Math.min(21, Math.floor(memoryStats.totalSolved / 25));
          memoryStats.reliefPercent = Math.min(96, baseRelief + incrementalRelief);
        }
      }
    } catch (statErr) {
      console.warn('Analytics logging warning:', statErr.message);
    }

    res.json({ reply: responseText });

  } catch (err) {
    console.error('Error generating AI response:', err);
    res.status(500).json({ error: 'Gagal menghasilkan tanggapan AI: ' + err.message });
  }
});

// Serve file unduhan (PDF) — tersedia untuk publik tanpa login
app.use('/downloads', express.static(path.join(__dirname, 'public', 'downloads')));

// Route eksplisit per file agar browser memunculkan dialog "Simpan File"
// (bukan membuka PDF di tab browser)
const downloadFiles = [
  { route: '/download/panduan-pmb', file: 'buku-panduan-pmb-unma.pdf', name: 'Buku Panduan PMB UNMA 2025-2026.pdf' },
  { route: '/download/surat-pernyataan', file: 'surat-pernyataan-calon-maba.pdf', name: 'Surat Pernyataan Calon Maba UNMA.pdf' },
  { route: '/download/biaya-kuliah', file: 'rincian-tarif-biaya-kuliah.pdf', name: 'Rincian Tarif Biaya Kuliah UNMA 2025-2026.pdf' },
];

downloadFiles.forEach(({ route, file, name }) => {
  app.get(route, (req, res) => {
    const filePath = path.join(__dirname, 'public', 'downloads', file);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File tidak ditemukan.' });
    }
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);
  });
});


app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 Siberma API Server is running on port ${PORT}`);
  console.log(`🌐 Buka tautan ini di browser: http://localhost:${PORT}/`);
  console.log(`🔐 Panel admin dilindungi dengan autentikasi session`);
  console.log(`⚡ Rate limiting aktif: 20 chat/10 menit, 200 API/15 menit per IP\n`);
});
