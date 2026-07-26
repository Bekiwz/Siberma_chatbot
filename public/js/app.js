// Application Logic for Siberma Admin & Analytics Dashboard
// DATA SOURCE: API Server (MongoDB/In-Memory) — bukan localStorage
// Versi: 2.0 — dengan sinkronisasi penuh ke backend

// ====================================================
// STATE
// ====================================================
let faqs = [];
let stats = {};
let activeTab = 'faq-manager';
let isLoading = false;

// ====================================================
// INIT
// ====================================================
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    addLogoutButton();
});

// Tambahkan tombol Logout ke header
function addLogoutButton() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    const logoutBtn = document.createElement('a');
    logoutBtn.href = '/api/auth/logout';
    logoutBtn.className = 'btn-secondary';
    logoutBtn.id = 'btn-logout';
    logoutBtn.title = 'Keluar dari Panel Admin';
    logoutBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Logout';
    logoutBtn.style.color = 'var(--accent-red, #ef4444)';
    logoutBtn.style.borderColor = 'rgba(239,68,68,0.25)';
    headerActions.appendChild(logoutBtn);
}

// ====================================================
// DATA LOADING (dari API Server)
// ====================================================

// Load semua data dari server sekaligus
async function loadAllData() {
    setLoadingState(true);
    try {
        await Promise.all([fetchFAQs(), fetchStats()]);
        renderStats();
        renderPopularChart();
        renderFAQList();
    } catch (err) {
        console.error('Gagal memuat data dari server:', err);
        // Jika 401 (tidak terautentikasi), redirect ke login
        if (err.status === 401) {
            window.location.replace('/login.html');
        } else {
            showToast('Gagal memuat data dari server. Coba refresh halaman.', 'error');
        }
    } finally {
        setLoadingState(false);
    }
}

async function fetchFAQs() {
    const res = await apiRequest('GET', '/api/faqs');
    faqs = res;
}

async function fetchStats() {
    const res = await apiRequest('GET', '/api/stats');
    stats = res;
}

// ====================================================
// HELPER: API REQUEST
// ====================================================
async function apiRequest(method, url, body = null) {
    const options = {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(url, options);

    // Jika sesi kedaluwarsa, redirect ke login
    if (res.status === 401) {
        const err = new Error('Unauthorized');
        err.status = 401;
        throw err;
    }

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request gagal: ${res.status}`);
    }

    return res.json();
}

// ====================================================
// LOADING STATE
// ====================================================
function setLoadingState(loading) {
    isLoading = loading;
    const listContainer = document.getElementById('faq-list-container');
    if (loading && listContainer) {
        listContainer.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:1rem;">
                ${[1,2,3].map(() => `
                    <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-color);
                        border-radius:16px; padding:1.25rem; animation: shimmer 1.5s infinite;">
                        <div style="height:14px; width:60%; background:rgba(255,255,255,0.05); border-radius:6px; margin-bottom:0.75rem;"></div>
                        <div style="height:10px; width:90%; background:rgba(255,255,255,0.03); border-radius:6px; margin-bottom:0.5rem;"></div>
                        <div style="height:10px; width:75%; background:rgba(255,255,255,0.03); border-radius:6px;"></div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// ====================================================
// RENDER STATISTICS
// ====================================================
function renderStats() {
    if (!stats || Object.keys(stats).length === 0) return;

    document.getElementById('stat-total-chats').innerText = stats.totalChats ?? 0;
    document.getElementById('stat-total-solved').innerText = stats.totalSolved ?? 0;
    document.getElementById('stat-hours-saved').innerText = (stats.hoursSaved ?? 0) + ' jam';

    const reliefPercent = stats.reliefPercent ?? 0;
    document.getElementById('relief-percent').innerText = reliefPercent + '%';

    const gaugeFill = document.getElementById('relief-gauge-fill');
    if (gaugeFill) {
        const maxDash = 220;
        const offset = maxDash - (reliefPercent / 100) * maxDash;
        gaugeFill.style.strokeDashoffset = offset;
    }
}

// ====================================================
// RENDER POPULAR CHART
// ====================================================
function renderPopularChart() {
    const chartContainer = document.getElementById('popular-topics-chart');
    if (!chartContainer) return;
    chartContainer.innerHTML = '';

    if (!faqs || faqs.length === 0) {
        chartContainer.innerHTML = '<p style="color:var(--text-secondary); font-size:0.85rem;">Belum ada data FAQ.</p>';
        return;
    }

    const sortedFAQs = [...faqs].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 5);
    const maxCount = Math.max(...sortedFAQs.map(f => f.count || 0), 1);

    sortedFAQs.forEach(faq => {
        const count = faq.count || 0;
        const percent = Math.round((count / maxCount) * 100);
        const rawLabel = faq.question || '';
        const label = rawLabel.length > 32 ? rawLabel.substring(0, 30) + '…' : rawLabel;

        const chartItem = document.createElement('div');
        chartItem.className = 'chart-item';
        chartItem.innerHTML = `
            <div class="chart-lbl-row">
                <span style="color:var(--text-primary); font-size:0.8rem;">${escapeHtml(label)}</span>
                <span style="color:var(--accent-gold); font-size:0.8rem;">${count}x</span>
            </div>
            <div class="chart-bar-bg">
                <div class="chart-bar-fill" style="width:${percent}%"></div>
            </div>
        `;
        chartContainer.appendChild(chartItem);
    });
}

// ====================================================
// RENDER FAQ LIST
// ====================================================
function renderFAQList(filteredList = null) {
    const listContainer = document.getElementById('faq-list-container');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const displayList = filteredList !== null ? filteredList : faqs;

    if (displayList.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align:center; padding:3rem; color:var(--text-secondary);">
                <i class="fa-solid fa-folder-open" style="font-size:2.5rem; margin-bottom:0.75rem; color:var(--border-color); display:block;"></i>
                <p style="font-weight:600;">Belum ada respons FAQ yang tersimpan.</p>
                <p style="font-size:0.8rem; margin-top:0.3rem;">Gunakan form di atas untuk menambahkan FAQ baru.</p>
            </div>
        `;
        return;
    }

    displayList.forEach((faq) => {
        const faqId = faq._id || faq.id;
        const card = document.createElement('div');
        card.className = 'faq-card';
        card.setAttribute('data-id', faqId);

        const badgeHTML = (faq.keywords || []).map(kw => `<span class="keyword-badge">${escapeHtml(kw)}</span>`).join('');

        card.innerHTML = `
            <div class="faq-card-header">
                <div class="faq-question">${escapeHtml(faq.question || '')}</div>
                <div class="faq-actions">
                    <button class="btn-icon edit" title="Edit FAQ" onclick="editFAQ('${faqId}')">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-icon delete" title="Hapus FAQ" onclick="deleteFAQ('${faqId}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="faq-answer">${escapeHtml(faq.answer || '').replace(/\n/g, '<br>')}</div>
            <div class="faq-keywords">
                ${badgeHTML}
                <span style="margin-left:auto; font-size:0.75rem; color:var(--text-secondary);">
                    <i class="fa-solid fa-comments"></i> ${faq.count || 0}x ditanyakan
                </span>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

// ====================================================
// TAB SWITCHING
// ====================================================
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.getElementById(tabId).classList.add('active');
    activeTab = tabId;
}

// ====================================================
// SEARCH / FILTER
// ====================================================
function filterFAQs() {
    const query = document.getElementById('faq-search').value.toLowerCase().trim();
    if (!query) {
        renderFAQList();
        return;
    }
    const filtered = faqs.filter(faq => {
        return (faq.question || '').toLowerCase().includes(query) ||
               (faq.answer || '').toLowerCase().includes(query) ||
               (faq.keywords || []).some(kw => kw.toLowerCase().includes(query));
    });
    renderFAQList(filtered);
}

// ====================================================
// SAVE FAQ (Create / Update) — ke API Server
// ====================================================
async function saveFAQ() {
    if (isLoading) return;

    const question = document.getElementById('faq-question').value.trim();
    const keywordsInput = document.getElementById('faq-keywords').value.trim();
    const answer = document.getElementById('faq-answer').value.trim();
    const editId = document.getElementById('edit-faq-index').value;

    if (!question || !keywordsInput || !answer) {
        showToast('Mohon lengkapi semua kolom input formulir!', 'error');
        return;
    }

    const keywords = keywordsInput.split(',')
        .map(kw => kw.trim().toLowerCase())
        .filter(kw => kw.length > 0);

    if (keywords.length === 0) {
        showToast('Minimal masukkan 1 kata kunci pemicu!', 'error');
        return;
    }

    const saveBtn = document.querySelector('.faq-form .btn-primary');
    const originalHTML = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
        saveBtn.disabled = true;
    }

    try {
        if (editId) {
            // UPDATE
            await apiRequest('PUT', `/api/faqs/${editId}`, { question, keywords, answer });
            showToast('Respons FAQ berhasil diperbarui!');
        } else {
            // CREATE
            await apiRequest('POST', '/api/faqs', { question, keywords, answer });
            showToast('Respons FAQ baru berhasil ditambahkan!');
        }
        clearFAQForm();
        await fetchFAQs();
        renderFAQList();
        renderPopularChart();
    } catch (err) {
        showToast('Gagal menyimpan FAQ: ' + err.message, 'error');
    } finally {
        if (saveBtn) {
            saveBtn.innerHTML = originalHTML;
            saveBtn.disabled = false;
        }
    }
}

// ====================================================
// EDIT FAQ
// ====================================================
function editFAQ(faqId) {
    const faq = faqs.find(f => (f._id || f.id) === faqId);
    if (!faq) return;

    document.getElementById('edit-faq-index').value = faqId;
    document.getElementById('faq-question').value = faq.question || '';
    document.getElementById('faq-keywords').value = (faq.keywords || []).join(', ');
    document.getElementById('faq-answer').value = faq.answer || '';

    document.getElementById('form-action-title').innerHTML =
        `<i class="fa-solid fa-edit"></i> Edit Respons FAQ`;
    document.getElementById('btn-cancel-edit').style.display = 'inline-block';
    document.getElementById('faq-form-container').scrollIntoView({ behavior: 'smooth' });
}

// ====================================================
// CLEAR / CANCEL FORM
// ====================================================
function clearFAQForm() {
    document.getElementById('edit-faq-index').value = '';
    document.getElementById('faq-question').value = '';
    document.getElementById('faq-keywords').value = '';
    document.getElementById('faq-answer').value = '';
    document.getElementById('form-action-title').innerHTML =
        `<i class="fa-solid fa-plus-circle"></i> Tambah Respons FAQ Baru`;
    document.getElementById('btn-cancel-edit').style.display = 'none';
}

// ====================================================
// DELETE FAQ — ke API Server
// ====================================================
async function deleteFAQ(faqId) {
    if (!confirm('Apakah Anda yakin ingin menghapus respons FAQ ini secara permanen?')) return;
    if (isLoading) return;

    try {
        await apiRequest('DELETE', `/api/faqs/${faqId}`);
        showToast('Respons FAQ berhasil dihapus!');
        await fetchFAQs();
        renderFAQList();
        renderPopularChart();
    } catch (err) {
        showToast('Gagal menghapus FAQ: ' + err.message, 'error');
    }
}

// ====================================================
// RESET DEMO DATA
// ====================================================
function resetDemoData() {
    showToast('Fitur reset data tersedia melalui konfigurasi database langsung.', 'error');
}

// ====================================================
// CHAT TESTER LOGIC (menggunakan API Server /api/chat)
// ====================================================
let testerChatHistory = [];

function handleTesterKeyPress(e) {
    if (e.key === 'Enter') sendTesterMessage();
}

async function sendTesterMessage() {
    const input = document.getElementById('tester-chat-input');
    const text = input.value.trim();
    if (!text || isLoading) return;

    input.value = '';
    appendTesterMsg(text, 'sent');
    showTesterTyping();

    try {
        // Panggil API chatbot yang sesungguhnya
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, history: testerChatHistory })
        });

        hideTesterTyping();

        if (res.status === 429) {
            // Rate limit tercapai
            appendTesterMsg('⚠️ Terlalu banyak pesan dikirim. Tunggu beberapa menit ya!', 'received');
            return;
        }

        const data = await res.json();
        const reply = data.reply || 'Maaf, tidak ada respons dari server.';
        appendTesterMsg(reply, 'received');

        // Update history untuk konteks percakapan
        testerChatHistory.push({ role: 'user', content: text });
        testerChatHistory.push({ role: 'assistant', content: reply });
        if (testerChatHistory.length > 12) testerChatHistory = testerChatHistory.slice(-12);

        // Refresh statistik setelah chat (data sudah diupdate server)
        await fetchStats();
        renderStats();

    } catch (err) {
        hideTesterTyping();
        appendTesterMsg('❌ Gagal menghubungi server chatbot. Pastikan server berjalan.', 'received');
    }
}

function appendTesterMsg(text, sender) {
    const messagesContainer = document.getElementById('tester-chat-messages');
    const msgRow = document.createElement('div');
    msgRow.className = `msg-row ${sender}`;

    // Render markdown sederhana: **bold**, \n → <br>
    const formatted = escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    msgRow.innerHTML = `
        <div class="msg-bubble">
            ${formatted}
            <span class="msg-time">${getCurrentTime()}</span>
        </div>
    `;
    messagesContainer.appendChild(msgRow);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTesterTyping() {
    const messagesContainer = document.getElementById('tester-chat-messages');
    const typingRow = document.createElement('div');
    typingRow.className = 'msg-row received typing-row';
    typingRow.innerHTML = `
        <div class="msg-bubble typing-bubble">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
    `;
    messagesContainer.appendChild(typingRow);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTesterTyping() {
    const typingRow = document.querySelector('.chat-tester-messages .typing-row');
    if (typingRow) typingRow.remove();
}

// ====================================================
// TOAST NOTIFICATION
// ====================================================
function showToast(message, type = 'success') {
    const existing = document.querySelector('.alert-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `alert-toast ${type === 'error' ? 'error' : ''}`;
    toast.innerHTML = `
        <i class="fa-solid ${type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i>
        <span>${escapeHtml(message)}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInLeft 0.3s ease-out reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ====================================================
// UTILITIES
// ====================================================

// Escape HTML untuk mencegah XSS
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Format waktu saat ini
function getCurrentTime() {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
