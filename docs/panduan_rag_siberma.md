# Panduan Integrasi: RAG (Retrieval-Augmented Generation) & Prompt Engine untuk Siberma

Untuk membuat Siberma menjadi AI cerdas yang dapat membaca **dokumen resmi** (seperti PDF Buku Panduan PMB UNMA) dan menggunakan **Prompt Engine (LLM)** untuk menjawab secara natural, Anda perlu menggunakan arsitektur **RAG (Retrieval-Augmented Generation)**.

Dokumen ini menjelaskan alur kerja RAG dan cara mengubah kode Siberma yang sudah ada agar dapat terhubung dengan AI tersebut.

---

## 🏗️ 1. Alur Kerja Arsitektur RAG

Dalam RAG, chatbot tidak menghafal dokumen Anda, melainkan mencari informasi yang relevan di dalam dokumen secara dinamis saat ditanya oleh pengguna.

```
                                  📂 [Dokumen Resmi (PDF/Docx)]
                                                │
                                                ▼
                                    [Pecah Teks ke Chunks]
                                                │
                                                ▼
                                    [Ubah Teks ke Vector] (Embedding Model)
                                                │
                                                ▼
                                    [Simpan di Vector Database]
                                                │
[Pertanyaan User] ──> [Cari Teks Relevan] ──────┘
      │                     │
      ▼                     ▼
[PROMPT ENGINE]: "Anda adalah Siberma... Jawablah pertanyaan: {tanya} berdasarkan data ini: {teks_relevan}"
      │
      ▼
   [LLM] (Gemini API / OpenAI API) ──> [Jawaban Cerdas & Akurat]
```

---

## 💻 2. Sisi Backend (Python & LangChain) - Contoh Implementasi

Gunakan framework **LangChain** atau **LlamaIndex** dengan Python untuk membuat API Backend RAG. Berikut adalah contoh kode backend Python (`app_api.py`) menggunakan **Gemini API**:

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
import os

app = FastAPI()

# 1. Tentukan API Key Gemini Anda
os.environ["GOOGLE_API_KEY"] = "MASUKKAN_GEMINI_API_KEY_DI_SINI"

# 2. Muat Dokumen Resmi PMB (PDF) & Siapkan Database Vector
# (Dijalankan sekali saat server pertama kali berjalan)
loader = PyPDFLoader("buku_panduan_pmb_unma.pdf")
docs = loader.load()

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
splits = text_splitter.split_documents(docs)

embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
vectorstore = FAISS.from_documents(splits, embeddings)
retriever = vectorstore.as_retriever()

# 3. Buat Prompt Engine (System Prompt)
system_prompt = (
    "Anda adalah Siberma, asisten virtual resmi Penerimaan Mahasiswa Baru (PMB) Universitas Majalengka.\n"
    "Gunakan kutipan teks dokumen berikut untuk menjawab pertanyaan pengguna.\n"
    "Jika Anda tidak tahu jawabannya atau tidak ada di dokumen, katakan bahwa Anda tidak tahu, lalu "
    "sarankan untuk menghubungi nomor WhatsApp resmi Panitia di 0811-2233-4455.\n"
    "Jawablah dengan bahasa Indonesia yang sopan, ramah, dan ramah mahasiswa.\n\n"
    "Konteks Dokumen Resmi:\n{context}"
)

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}"),
])

# 4. Siapkan LLM & RAG Chain
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.3)
question_answer_chain = create_stuff_documents_chain(llm, prompt)
rag_chain = create_retrieval_chain(retriever, question_answer_chain)

# Pydantic Schema untuk Request
class ChatQuery(BaseModel):
    message: str

# 5. Endpoint API untuk Frontend Siberma
@app.post("/api/chat")
async def chat_endpoint(query: ChatQuery):
    try:
        response = rag_chain.invoke({"input": query.message})
        return {"reply": response["answer"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 🔗 3. Hubungkan Widget Frontend ke API Backend RAG

Di dalam kode widget Anda (`siberma-widget.js`), Anda hanya perlu mengganti fungsi pencocokan data lokal (`processBotLogic`) agar melakukan panggilan HTTP request (`fetch`) ke endpoint backend Python di atas.

### Kode Sebelum (Pencocokan Lokal):
```javascript
function processBotLogic(text) {
    // Mencari kata kunci di localStorage...
    // (Kode saat ini)
}
```

### Kode Sesudah (Menghubungkan ke Prompt Engine & PDF Backend):
Ubah fungsi `sendUserMessage` pada [siberma-widget.js](file:///C:/tugas%20akhir/projek%20ta/siberma-widget.js) bagian baris pemrosesan bot menjadi asinkron (`async`) seperti ini:

```javascript
// Ubah fungsi sendUserMessage menjadi Async
async function sendUserMessage(text) {
    chatInput.value = "";
    appendMessage(text, "sent");

    // Update statistics
    const storedStats = localStorage.getItem("siberma_stats");
    let stats = storedStats ? JSON.parse(storedStats) : { totalChats: 0, totalSolved: 0 };
    stats.totalChats = parseInt(stats.totalChats) + 1;
    localStorage.setItem("siberma_stats", JSON.stringify(stats));

    showTypingIndicator();

    try {
        // Panggil API Backend RAG Python
        const response = await fetch('http://127.0.0.1:8000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: text })
        });
        
        const data = await response.json();
        hideTypingIndicator();
        appendMessage(data.reply, "received"); // Tampilkan jawaban cerdas dari Prompt Engine LLM
        
    } catch (error) {
        console.error("Gagal terhubung ke RAG Server:", error);
        hideTypingIndicator();
        appendMessage("Maaf, Siberma kesulitan terhubung ke server kecerdasan AI. Silakan coba beberapa saat lagi.", "received");
    }

    window.dispatchEvent(new Event('storage'));
}
```

---

## 🌟 Keuntungan Metode Ini Untuk Sidang Tugas Akhir Anda:
1.  **Akurasi Tinggi (Anti Halusinasi)**: Karena menggunakan RAG, AI hanya akan menjawab berdasarkan berkas PDF resmi PMB UNMA yang diunggah. Kecil kemungkinan AI mengarang jawaban.
2.  **Fleksibilitas Prompts**: Anda dapat mengubah kepribadian bot (misalnya menjadi sangat jenaka, formal, atau santai) cukup dengan mengubah teks pada variabel `system_prompt` di sisi backend, tanpa perlu memodifikasi frontend HTML/CSS lagi.
