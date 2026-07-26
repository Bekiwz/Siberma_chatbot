// Embeddable Chatbot Widget: Siberma
// Designed for PMB Universitas Majalengka (UNMA)

(function () {
    // ─── 0. Deteksi Base URL widget secara otomatis ──────────────────────────
    // Cari script tag yang memuat file ini, ambil URL-nya sebagai base path.
    // Ini memastikan semua path gambar & CSS selalu benar dari halaman manapun.
    function getWidgetBaseUrl() {
        const scripts = document.querySelectorAll('script[src]');
        for (const s of scripts) {
            if (s.src && s.src.includes('siberma-widget.js')) {
                return s.src.substring(0, s.src.lastIndexOf('/js/') + 1);
            }
        }
        // Fallback: gunakan origin server
        return window.location.origin + '/';
    }
    const BASE_URL = getWidgetBaseUrl();

    // ─── 1. Inject CSS stylesheet link ───────────────────────────────────────
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = BASE_URL + "css/siberma-widget.css";
    // Also inject fontawesome for widget icons
    const faLink = document.createElement("link");
    faLink.rel = "stylesheet";
    faLink.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";

    document.head.appendChild(link);
    document.head.appendChild(faLink);


    // 2. Create and inject Widget HTML structure
    const widgetContainer = document.createElement("div");
    widgetContainer.id = "siberma-widget";
    widgetContainer.innerHTML = `
        <!-- Floating Chat Panel -->
        <div class="siberma-panel" id="siberma-panel">
            <!-- Header -->
            <div class="siberma-header">
                <div class="siberma-header-info">
                    <div class="siberma-avatar">
                        <img 
                            src="${BASE_URL}images/siberma_official_mascot.png" 
                            class="sw-mascot-img" 
                            alt="Maskot Siberma UNMA"
                            onerror="this.style.display='none'; this.parentElement.innerHTML='🤖';">
                    </div>
                    <div class="siberma-header-text">
                        <h4>SIBERMA</h4>
                        <div class="siberma-status">
                            <span class="siberma-status-dot"></span>
                            <span>Siber PBM UNMA (Online)</span>
                        </div>
                    </div>
                </div>
                <button class="siberma-close-btn" id="siberma-close-btn">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <!-- Tab Navigation -->
            <div class="siberma-tabs">
                <button class="siberma-tab-btn active" data-tab="sw-tab-chat">
                    <i class="fa-solid fa-comments"></i> Chat Bot
                </button>
                <button class="siberma-tab-btn" data-tab="sw-tab-tracker">
                    <i class="fa-solid fa-list-check"></i> Progres
                </button>
                <button class="siberma-tab-btn" data-tab="sw-tab-downloads">
                    <i class="fa-solid fa-download"></i> Unduhan
                </button>
            </div>

            <!-- TAB 1: Chat interface -->
            <div class="siberma-body-tab active" id="sw-tab-chat">
                <div class="siberma-chat-messages" id="sw-chat-logs">
                    <div class="sw-msg received">
                        <div class="sw-bubble" id="sw-welcome-text">
                            Halo! Sampurasun! Selamat datang di Portal Penerimaan Mahasiswa Baru Universitas Majalengka.
                            <br><br>
                            Saya <strong>Siberma</strong>, asisten siber PMB Anda. Ada yang bisa saya bantu terkait pendaftaran?
                            <span class="sw-msg-time">Baru saja</span>
                        </div>
                    </div>
                </div>

                <!-- Quick Action Chips -->
                <div class="siberma-quick-actions sw-quick-chips" id="sw-quick-actions">
                    <button class="siberma-chip sw-chip" data-query="Berapa biaya pendaftaran dan kuliah di UNMA?"><i class="fa-solid fa-money-bill-wave"></i> Biaya Kuliah</button>
                    <button class="siberma-chip sw-chip" data-query="Apa saja jalur pendaftaran yang dibuka di UNMA?"><i class="fa-solid fa-route"></i> Jalur PMB</button>
                    <button class="siberma-chip sw-chip" data-query="Apa saja dokumen persyaratan untuk mendaftar maba?"><i class="fa-solid fa-file-lines"></i> Syarat Berkas</button>
                    <button class="siberma-chip sw-chip" data-query="Fakultas dan Program Studi apa saja yang ada di UNMA?"><i class="fa-solid fa-graduation-cap"></i> Pilihan Prodi</button>
                    <button class="siberma-chip sw-chip" data-query="Bagaimana cara menghubungi panitia PMB UNMA?"><i class="fa-brands fa-whatsapp"></i> WA Panitia</button>
                </div>

                <!-- Input Footer -->
                <div class="siberma-input-footer">
                    <button class="sw-voice-btn" id="sw-voice-btn" title="Bicara dengan Suara (Voice Input)">
                        <i class="fa-solid fa-microphone"></i>
                    </button>
                    <input type="text" id="sw-chat-input" placeholder="Tanya Siberma di sini...">
                    <button class="siberma-send-btn" id="sw-send-btn">
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </div>
            </div>

            <!-- TAB 2: Progress Tracker -->
            <div class="siberma-body-tab" id="sw-tab-tracker">
                <div class="siberma-tracker-container">
                    <div class="siberma-tracker-header">
                        <h5>Alur Pendaftaran Mahasiswa Baru</h5>
                        <p>Pantau kelengkapan langkah pendaftaran Anda di UNMA.</p>
                        <div class="siberma-progress-bar-container">
                            <div class="siberma-progress-bar-fill" id="sw-progress-fill"></div>
                        </div>
                        <span style="font-size: 0.75rem; font-weight: bold; color: var(--sw-blue); margin-top: 5px; display: inline-block;" id="sw-progress-txt">0% Selesai</span>
                    </div>

                    <div class="siberma-checklist" id="sw-checklist-container">
                        <!-- Checklist items will be populated by JS -->
                    </div>
                </div>
            </div>

            <!-- TAB 3: Downloads -->
            <div class="siberma-body-tab" id="sw-tab-downloads">
                <div class="siberma-downloads">

                    <!-- File 1: Buku Panduan PMB -->
                    <div class="siberma-dl-card">
                        <div class="siberma-dl-info">
                            <div class="siberma-dl-icon">
                                <i class="fa-solid fa-file-pdf"></i>
                            </div>
                            <div class="siberma-dl-details">
                                <h6>Buku Panduan PMB UNMA</h6>
                                <p>PDF &bull; Panduan pendaftaran lengkap</p>
                            </div>
                        </div>
                        <a href="${BASE_URL.replace(/\/$/, '')}/download/panduan-pmb"
                           download="Buku Panduan PMB UNMA.pdf"
                           class="siberma-dl-btn"
                           title="Unduh PDF"
                           style="display:flex;align-items:center;justify-content:center;text-decoration:none;">
                            <i class="fa-solid fa-download"></i>
                        </a>
                    </div>

                    <!-- File 2: Surat Pernyataan -->
                    <div class="siberma-dl-card">
                        <div class="siberma-dl-info">
                            <div class="siberma-dl-icon">
                                <i class="fa-solid fa-file-pdf"></i>
                            </div>
                            <div class="siberma-dl-details">
                                <h6>Surat Pernyataan Calon Maba</h6>
                                <p>PDF &bull; Surat keabsahan dokumen</p>
                            </div>
                        </div>
                        <a href="${BASE_URL.replace(/\/$/, '')}/download/surat-pernyataan"
                           download="Surat Pernyataan Calon Maba.pdf"
                           class="siberma-dl-btn"
                           title="Unduh PDF"
                           style="display:flex;align-items:center;justify-content:center;text-decoration:none;">
                            <i class="fa-solid fa-download"></i>
                        </a>
                    </div>

                    <!-- File 3: Rincian Biaya Kuliah -->
                    <div class="siberma-dl-card">
                        <div class="siberma-dl-info">
                            <div class="siberma-dl-icon">
                                <i class="fa-solid fa-file-pdf"></i>
                            </div>
                            <div class="siberma-dl-details">
                                <h6>Rincian Tarif Biaya Kuliah</h6>
                                <p>PDF &bull; Rincian biaya per prodi</p>
                            </div>
                        </div>
                        <a href="${BASE_URL.replace(/\/$/, '')}/download/biaya-kuliah"
                           download="Rincian Tarif Biaya Kuliah UNMA.pdf"
                           class="siberma-dl-btn"
                           title="Unduh PDF"
                           style="display:flex;align-items:center;justify-content:center;text-decoration:none;">
                            <i class="fa-solid fa-download"></i>
                        </a>
                    </div>

                </div>
            </div>
        </div>

        <!-- Proactive Floating Greeting Toast -->
        <div class="sw-proactive-toast" id="sw-proactive-toast" style="display: none;">
            <div class="sw-toast-avatar">
                <img 
                    src="${BASE_URL}images/siberma_official_mascot.png" 
                    class="sw-mascot-img" 
                    alt="Maskot Siberma"
                    onerror="this.style.display='none'; this.parentElement.innerHTML='🤖';">
            </div>
            <div class="sw-toast-content">
                <h5>Siberma PMB UNMA</h5>
                <p>Sampurasun! Ada yang ingin ditanyakan tentang PMB UNMA?</p>
            </div>
            <button class="sw-toast-close" id="sw-toast-close" title="Tutup">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
    `;

    document.body.appendChild(widgetContainer);

    // -----------------------------------------------------------------------
    // Inject 3D Mascot Launcher DIRECTLY into body (NOT inside #siberma-widget)
    // Critical: position:fixed inside position:fixed creates broken stacking
    // context - mascot must be a direct child of body to render correctly.
    // -----------------------------------------------------------------------
    const mascotLauncher = document.createElement('div');
    mascotLauncher.className = 'sw-mascot-launcher';
    mascotLauncher.id = 'siberma-launcher';
    mascotLauncher.innerHTML = `
        <div class="sw-mascot-bubble" id="sw-mascot-bubble">
            <span>Halo! Tanya Siberma yuk! 👋</span>
        </div>
        <div class="sw-mascot-avatar-wrap" id="sw-corner-3d-card">
            <!-- PNG Mascot — lebih andal dari 3D canvas -->
            <img 
                id="sw-mascot-png"
                src="${BASE_URL}images/siberma_official_mascot.png"
                class="sw-mascot-fallback"
                alt="Siberma - Asisten Virtual PMB UNMA"
                draggable="false"
                onerror="this.src='';this.style.display='none';document.getElementById('sw-mascot-emoji').style.display='flex';"
            >
            <!-- Fallback jika gambar benar-benar gagal load -->
            <div id="sw-mascot-emoji" style="display:none;width:120px;height:140px;font-size:5rem;align-items:center;justify-content:center;">🤖</div>
            <div class="sw-mascot-expr" id="sw-expr-pill">
                <img src="${BASE_URL}images/expressions/senyum.jfif" id="sw-expression-badge" alt="Ekspresi"
                    onerror="this.style.display='none';">
                <span id="sw-expression-name">Senyum</span>
            </div>
        </div>
    `;
    document.body.appendChild(mascotLauncher);

    // 3. State & Variables
    let open = false;
    let localFAQs = [];
    let chatHistory = []; // Conversation memory for RAG AI
    let speechRecognition = null;
    let isRecording = false;
    
    // Default steps for the student tracker
    const defaultSteps = [
        { id: "step_1", title: "Pembelian Formulir & Token", desc: "Bayar biaya pendaftaran Rp 250.000", completed: false },
        { id: "step_2", title: "Pengisian Formulir Online", desc: "Isi biodata diri & pilih Program Studi di PMB UNMA", completed: false },
        { id: "step_3", title: "Unggah Berkas Persyaratan", desc: "Unggah Scan Ijazah/SKL, KTP, KK, & Pas Foto", completed: false },
        { id: "step_4", title: "Ujian Saringan Masuk", desc: "Ikuti tes online / verifikasi berkas prestasi", completed: false },
        { id: "step_5", title: "Registrasi Ulang / Bayar SPP", desc: "Lakukan pembayaran semester awal & verifikasi akhir", completed: false }
    ];

    let checklistSteps = [];

    // 4. Element Selectors
    const launcher = document.getElementById("siberma-launcher");
    const panel = document.getElementById("siberma-panel");
    const closeBtn = document.getElementById("siberma-close-btn");
    const tabButtons = document.querySelectorAll(".siberma-tab-btn");
    const tabContents = document.querySelectorAll(".siberma-body-tab");
    const chatLogs = document.getElementById("sw-chat-logs");
    const chatInput = document.getElementById("sw-chat-input");
    const sendBtn = document.getElementById("sw-send-btn");
    const quickActions = document.getElementById("sw-quick-actions");
    const proactiveToast = document.getElementById("sw-proactive-toast");
    const toastClose = document.getElementById("sw-toast-close");
    const voiceBtn = document.getElementById("sw-voice-btn");

    // 5. Initialize Widget Logic
    initWidget();

    function initWidget() {
        loadFAQs();
        loadChecklist();
        setupVoiceRecognition();

        // 3D Mascot & Dynamic Expressions Initialization
        init3DMascot();

        // Tampilkan toast sapaan setelah 2 detik jika panel belum dibuka
        setTimeout(() => {
            if (!open && proactiveToast) {
                proactiveToast.style.display = "flex";
            }
        }, 2000);

        if (proactiveToast) {
            proactiveToast.addEventListener("click", (e) => {
                if (e.target.closest("#sw-toast-close")) {
                    proactiveToast.style.display = "none";
                    return;
                }
                proactiveToast.style.display = "none";
                if (!open) toggleWidget();
            });
        }

        if (voiceBtn) {
            voiceBtn.addEventListener("click", toggleVoiceInput);
        }
        
        // Listen to localStorage changes in real-time
        window.addEventListener('storage', () => {
            loadFAQs();
        });

        // Toggle Widget Window
        if (launcher) {
            launcher.addEventListener("click", toggleWidget);
        }
        if (closeBtn) {
            closeBtn.addEventListener("click", toggleWidget);
        }

        // ── KLIK DI LUAR PANEL → TUTUP CHAT ───────────────────────────────
        // Gunakan mousedown agar lebih responsif dari click
        document.addEventListener('mousedown', (e) => {
            if (!open) return;
            // Jika klik di dalam panel atau di atas launcher/mascot → jangan tutup
            const clickInsidePanel = panel && panel.contains(e.target);
            const clickOnLauncher = launcher && launcher.contains(e.target);
            const clickOnToast = proactiveToast && proactiveToast.contains(e.target);
            if (!clickInsidePanel && !clickOnLauncher && !clickOnToast) {
                toggleWidget();
            }
        });

        // Touchstart untuk mobile (sentuh di luar)
        document.addEventListener('touchstart', (e) => {
            if (!open) return;
            const touchInsidePanel = panel && panel.contains(e.target);
            const touchOnLauncher = launcher && launcher.contains(e.target);
            const touchOnToast = proactiveToast && proactiveToast.contains(e.target);
            if (!touchInsidePanel && !touchOnLauncher && !touchOnToast) {
                toggleWidget();
            }
        }, { passive: true });
        // ──────────────────────────────────────────────────────────────────

        // Tab Switching
        tabButtons.forEach(btn => {
            btn.addEventListener("click", function() {
                const targetTab = this.getAttribute("data-tab");
                
                tabButtons.forEach(b => b.classList.remove("active"));
                tabContents.forEach(c => c.classList.remove("active"));
                
                this.classList.add("active");
                document.getElementById(targetTab).classList.add("active");
            });
        });

        // Quick chip clicks
        quickActions.addEventListener("click", function (e) {
            const chip = e.target.closest(".siberma-chip");
            if (!chip) return;
            const query = chip.getAttribute("data-query");
            sendUserMessage(query);
        });

        // Input send listeners
        sendBtn.addEventListener("click", () => {
            const text = chatInput.value.trim();
            if (text) sendUserMessage(text);
        });

        chatInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                const text = chatInput.value.trim();
                if (text) sendUserMessage(text);
            }
        });
    }

    // Toggle Open/Close panel state
    let hasTypedWelcome = false;

    // Array of 8 mascot expressions
    const expressionList = [
        { key: "senyum", label: "Senyum" },
        { key: "kaget", label: "Kaget" },
        { key: "bingung", label: "Berpikir" },
        { key: "terharu", label: "Terharu" },
        { key: "terkejut", label: "Terkejut" },
        { key: "marah", label: "Semangat" },
        { key: "nangis", label: "Sedih" },
        { key: "takut", label: "Takut" }
    ];
    let currentExpressionIdx = 0;    // Dynamic Expression Switcher (.jfif expressions)
    function setMascotExpression(name) {
        const badge = document.getElementById("sw-expression-badge");
        const label = document.getElementById("sw-expression-name");
        const heroBadge = document.getElementById("hero-expression-badge");
        const heroLabel = document.getElementById("hero-expression-name");
        
        const found = expressionList.find(e => e.key === name);
        const textLabel = found ? found.label : name;

        if (badge) badge.src = `${BASE_URL}images/expressions/${name}.jfif`;
        if (label) label.innerText = textLabel;

        if (heroBadge) heroBadge.src = `${BASE_URL}images/expressions/${name}.jfif`;
        if (heroLabel) heroLabel.innerText = textLabel;
    }

    function cycleNextExpression() {
        currentExpressionIdx = (currentExpressionIdx + 1) % expressionList.length;
        setMascotExpression(expressionList[currentExpressionIdx].key);
    }

    // Mascot PNG Initializer — menggunakan CSS animation (lebih andal dari WebGL/Three.js)
    function init3DMascot() {
        // Tidak perlu Three.js — PNG + CSS animation sudah cukup premium
        // Mulai siklus ekspresi otomatis setiap 4 detik
        setInterval(() => {
            cycleNextExpression();
        }, 4000);

        // Klik pada mascot: ganti ekspresi + efek bounce
        const mascotImg = document.getElementById('sw-mascot-png');
        if (mascotImg) {
            mascotImg.addEventListener('click', (e) => {
                e.stopPropagation(); // Mencegah klik ganda ke launcher
                cycleNextExpression();
                mascotImg.style.transform = 'scale(1.12) rotate(-5deg)';
                setTimeout(() => {
                    mascotImg.style.transform = '';
                }, 300);
                
                // Pastikan mengklik maskot langsung membuka/menutup panel chat
                if (typeof toggleWidget === 'function') {
                    toggleWidget();
                }
            });
        }
    }

    // Bottom Floating Corner 3D Live Mascot Avatar Engine
    function renderCorner3DMascot() {
        const canvas = document.getElementById('sw-corner-3d-canvas');
        const launcherDiv = document.getElementById('siberma-launcher');
        if (!canvas) return;

        // Fixed canvas dimensions (must match HTML attribute width/height)
        const W = 140;
        const H = 160;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 1000);

        // Pass canvas directly as rendering target - no DOM manipulation needed
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setSize(W, H, false); // false = don't override CSS size
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;

        // Very bright studio lighting so original model colors show perfectly
        scene.add(new THREE.AmbientLight(0xffffff, 5.0));
        const dir1 = new THREE.DirectionalLight(0xffffff, 4.0);
        dir1.position.set(4, 8, 6);
        scene.add(dir1);
        const dir2 = new THREE.DirectionalLight(0xffeeff, 2.5);
        dir2.position.set(-4, 4, -4);
        scene.add(dir2);

        if (typeof THREE.GLTFLoader === 'undefined') {
            console.warn('GLTFLoader not available');
            return;
        }

        const loader = new THREE.GLTFLoader();
        loader.load(
            BASE_URL + 'images/siberma_mascot_3d.glb',
            (gltf) => {
                const model = gltf.scene;

                // ✅ KEY FIX: Keep original materials! Only fix sRGB texture encoding.
                // Replacing materials with MeshBasicMaterial(map:null) = black model.
                model.traverse((child) => {
                    if (child.isMesh) {
                        const mats = Array.isArray(child.material) ? child.material : [child.material];
                        mats.forEach(m => {
                            if (!m) return;
                            // Fix texture color space encoding
                            if (m.map && THREE.sRGBEncoding) {
                                m.map.encoding = THREE.sRGBEncoding;
                                m.map.needsUpdate = true;
                            }
                            if (m.emissiveMap && THREE.sRGBEncoding) {
                                m.emissiveMap.encoding = THREE.sRGBEncoding;
                            }
                            // Boost emissive slightly for vivid look
                            if (m.emissive !== undefined) {
                                m.emissive.setScalar(0.1);
                            }
                            m.side = THREE.DoubleSide;
                            m.needsUpdate = true;
                        });
                        child.castShadow = true;
                    }
                });

                // Auto-frame: center + auto-distance camera
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                model.position.sub(center);

                const maxDim = Math.max(size.x, size.y, size.z);
                const fovRad = camera.fov * Math.PI / 180;
                camera.position.set(0, 0, (maxDim / 2 / Math.tan(fovRad / 2)) * 1.35);
                camera.lookAt(0, 0, 0);

                const group = new THREE.Group();
                group.add(model);
                scene.add(group);

                let spinning = false;
                const clock = new THREE.Clock();

                // Smooth idle animation loop
                (function animate() {
                    requestAnimationFrame(animate);
                    const t = clock.getElapsedTime();
                    if (!spinning) {
                        group.position.y = Math.sin(t * 1.6) * 0.09;
                        group.rotation.y = Math.sin(t * 0.65) * 0.38;
                        group.rotation.z = Math.cos(t * 1.1) * 0.025;
                    }
                    renderer.render(scene, camera);
                })();

                // Auto expression cycle every 4 seconds
                setInterval(() => {
                    if (!document.querySelector('#siberma-widget .sw-typing-row')) {
                        cycleNextExpression();
                    }
                }, 4000);

                // ✅ Click on mascot: spin animation (toggleWidget handled by launcher-level click)
                if (canvas) {
                    canvas.style.cursor = 'pointer';
                    canvas.addEventListener('click', () => {
                        cycleNextExpression();
                        spinning = true;
                        let step = 0;
                        (function spin() {
                            if (step < 20) {
                                group.rotation.y += (Math.PI * 2) / 20;
                                step++;
                                requestAnimationFrame(spin);
                            } else {
                                spinning = false;
                            }
                        })();
                    });
                }
            },
            undefined,
            (err) => {
                console.warn('Siberma 3D GLB load error:', err);
                // Fallback: show mascot PNG image if 3D fails to load
                if (canvas) {
                    canvas.style.display = 'none';
                    const img = document.createElement('img');
                    img.src = BASE_URL + 'images/siberma_official_mascot.png';
                    img.className = 'sw-mascot-fallback';
                    img.style.cssText = 'width:140px;height:160px;object-fit:contain;cursor:pointer;filter:drop-shadow(0 8px 24px rgba(10,77,146,0.5));';
                    img.alt = 'Siberma - Klik untuk chat!';
                    canvas.parentNode.insertBefore(img, canvas);
                    img.addEventListener('click', toggleWidget);
                }
            }
        );
    }
    function renderHero3DStage() {
        const container = document.getElementById("hero-3d-canvas");
        const card = document.getElementById("hero-3d-stage-card");
        if (!container || container.children.length > 0) return;

        const width = container.clientWidth || 480;
        const height = container.clientHeight || 250;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        if (typeof THREE.sRGBEncoding !== 'undefined') {
            renderer.outputEncoding = THREE.sRGBEncoding;
        }
        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
        scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x888888, 2.5);
        hemiLight.position.set(0, 10, 0);
        scene.add(hemiLight);

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.5);
        dirLight1.position.set(5, 10, 7);
        scene.add(dirLight1);

        if (typeof THREE.GLTFLoader !== 'undefined') {
            const loader = new THREE.GLTFLoader();
            loader.load(
                'images/siberma_mascot_3d.glb',
                (gltf) => {
                    const heroModel = gltf.scene;

                    heroModel.traverse((child) => {
                        if (child.isMesh && child.material) {
                            const oldMat = child.material;
                            const hasVertexColors = !!(child.geometry && child.geometry.attributes && child.geometry.attributes.color);

                            child.material = new THREE.MeshBasicMaterial({
                                map: oldMat.map ? oldMat.map : null,
                                color: 0xffffff,
                                vertexColors: hasVertexColors,
                                side: THREE.DoubleSide
                            });

                            if (child.material.map && typeof THREE.sRGBEncoding !== 'undefined') {
                                child.material.map.encoding = THREE.sRGBEncoding;
                                child.material.map.needsUpdate = true;
                            }
                            child.material.needsUpdate = true;
                        }
                    });

                    // Box3 Auto-Framing Engine
                    const box = new THREE.Box3().setFromObject(heroModel);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());

                    heroModel.position.x = -center.x;
                    heroModel.position.y = -center.y;
                    heroModel.position.z = -center.z;

                    const maxDim = Math.max(size.x, size.y, size.z);
                    const fov = camera.fov * (Math.PI / 180);
                    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
                    cameraZ *= 1.25;

                    camera.position.set(0, 0, cameraZ);
                    camera.lookAt(0, 0, 0);

                    const modelGroup = new THREE.Group();
                    modelGroup.add(heroModel);
                    scene.add(modelGroup);

                    let isHeroSpinning = false;
                    const clock = new THREE.Clock();

                    function animateHero() {
                        requestAnimationFrame(animateHero);
                        const t = clock.getElapsedTime();

                        if (!isHeroSpinning && modelGroup) {
                            modelGroup.position.y = Math.sin(t * 1.5) * 0.08;
                            modelGroup.rotation.y = Math.sin(t * 0.6) * 0.35;
                            modelGroup.rotation.z = Math.cos(t * 1.0) * 0.03;
                        }
                        renderer.render(scene, camera);
                    }
                    animateHero();

                    if (card) {
                        card.addEventListener("click", () => {
                            cycleNextExpression();
                            if (modelGroup) {
                                isHeroSpinning = true;
                                let spinStep = 0;
                                function spin() {
                                    if (spinStep < 20) {
                                        modelGroup.rotation.y += (Math.PI * 2) / 20;
                                        spinStep++;
                                        requestAnimationFrame(spin);
                                    } else {
                                        isHeroSpinning = false;
                                    }
                                }
                                spin();
                            }
                        });
                    }
                },
                undefined,
                (err) => console.warn("Failed to load Hero 3D GLB Model:", err)
            );
        }
    }

    function runWelcomeTypewriter() {
        if (hasTypedWelcome) return;
        hasTypedWelcome = true;
        setMascotExpression('terharu');

        const welcomeBubble = document.getElementById("sw-welcome-text");
        if (!welcomeBubble) return;

        const fullText = "Halo! Sampurasun! Selamat datang di Portal PMB UNMA. Saya Siberma, asisten siber Anda. Ada yang bisa saya bantu?";
        welcomeBubble.innerHTML = "<span class='sw-typing-cursor'></span>";
        
        let index = 0;
        function typeChar() {
            if (index < fullText.length) {
                welcomeBubble.innerHTML = fullText.substring(0, index + 1) + "<span class='sw-typing-cursor'>|</span>";
                index++;
                setTimeout(typeChar, 25);
            } else {
                welcomeBubble.innerHTML = "Halo! Sampurasun! Selamat datang di Portal Penerimaan Mahasiswa Baru Universitas Majalengka.<br><br>Saya <strong>Siberma</strong>, asisten siber PMB Anda. Ada yang bisa saya bantu terkait pendaftaran?<span class=\"sw-msg-time\">Baru saja</span>";
            }
        }
        typeChar();
    }

    function toggleWidget() {
        open = !open;
        if (open) {
            panel.classList.add('active');

            // Sembunyikan toast sapaan saat panel dibuka
            if (proactiveToast) {
                proactiveToast.style.transition = 'opacity 0.2s ease';
                proactiveToast.style.opacity = '0';
                setTimeout(() => {
                    proactiveToast.style.display = 'none';
                    proactiveToast.style.opacity = '1';
                    proactiveToast.style.transition = '';
                }, 200);
            }

            // Sembunyikan bubble teks mascot saat chat terbuka
            const bubble = document.getElementById('sw-mascot-bubble');
            if (bubble) {
                bubble.style.opacity = '0';
                bubble.style.pointerEvents = 'none';
            }

            // Geser mascot launcher ke bawah saat chat terbuka
            if (launcher) {
                launcher.style.transform = 'translateY(220px)';
                launcher.style.opacity = '0';
                launcher.style.pointerEvents = 'none';
            }
            chatInput.focus();
            runWelcomeTypewriter();
        } else {
            panel.classList.remove('active');

            // Kembalikan mascot launcher
            if (launcher) {
                launcher.style.transform = '';
                launcher.style.opacity = '1';
                launcher.style.pointerEvents = 'auto';
            }

            // Tampilkan kembali bubble teks mascot
            const bubble = document.getElementById('sw-mascot-bubble');
            if (bubble) {
                bubble.style.opacity = '1';
                bubble.style.pointerEvents = 'auto';
            }

            // Jangan tampilkan toast lagi setelah ditutup
            // (cukup sekali tampil di awal)
        }
    }

    // Load FAQ database with server sync
    async function loadFAQs() {
        try {
            const res = await fetch('/api/faqs');
            if (res.ok) {
                localFAQs = await res.json();
                localStorage.setItem("siberma_faqs", JSON.stringify(localFAQs));
                return;
            }
        } catch (e) {}

        const stored = localStorage.getItem("siberma_faqs");
        if (stored) {
            localFAQs = JSON.parse(stored);
        } else {
            localFAQs = [];
        }
    }

    // Load Student checklist
    function loadChecklist() {
        const stored = localStorage.getItem("siberma_checklist");
        if (stored) {
            checklistSteps = JSON.parse(stored);
        } else {
            checklistSteps = JSON.parse(JSON.stringify(defaultSteps));
            localStorage.setItem("siberma_checklist", JSON.stringify(checklistSteps));
        }
        renderChecklist();
    }

    // Render Progress tracker list
    function renderChecklist() {
        const container = document.getElementById("sw-checklist-container");
        container.innerHTML = "";
        
        let completedCount = 0;
        
        checklistSteps.forEach((step, idx) => {
            if (step.completed) completedCount++;
            
            const checkItem = document.createElement("div");
            checkItem.className = `siberma-check-item ${step.completed ? 'completed' : ''}`;
            checkItem.innerHTML = `
                <div class="siberma-checkbox">
                    ${step.completed ? '<i class="fa-solid fa-check"></i>' : ''}
                </div>
                <div class="siberma-check-info">
                    <span class="siberma-check-title">${step.title}</span>
                    <span class="siberma-check-desc">${step.desc}</span>
                </div>
            `;
            
            checkItem.addEventListener("click", () => toggleStep(idx));
            container.appendChild(checkItem);
        });

        // Compute percent
        const percent = Math.round((completedCount / checklistSteps.length) * 100);
        document.getElementById("sw-progress-fill").style.width = percent + "%";
        document.getElementById("sw-progress-txt").innerText = percent + "% Selesai";
    }

    // Toggle checklist item status
    function toggleStep(index) {
        checklistSteps[index].completed = !checklistSteps[index].completed;
        localStorage.setItem("siberma_checklist", JSON.stringify(checklistSteps));
        renderChecklist();
    }

    // Send a user message and trigger bot response (server API with history & offline fallback)
    async function sendUserMessage(text) {
        if (!text || !text.trim()) return;
        chatInput.value = "";
        appendMessage(text, "sent");

        // Record user query in chat history memory
        chatHistory.push({ role: "user", content: text });

        // Show typing indicator
        showTypingIndicator();

        try {
            // Call the intelligent RAG API on the server with history payload
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: text, history: chatHistory.slice(0, -1) })
            });

            if (!response.ok) {
                throw new Error('Server error response: ' + response.status);
            }

            const data = await response.json();
            
            hideTypingIndicator();
            appendMessage(data.reply, "received");
            setMascotExpression('senyum');

            // Record bot response in chat history memory
            chatHistory.push({ role: "assistant", content: data.reply });
            
            // Fetch updated stats from backend to keep localStorage synced!
            try {
                const statsRes = await fetch('/api/stats');
                if (statsRes.ok) {
                    const freshStats = await statsRes.json();
                    localStorage.setItem("siberma_stats", JSON.stringify(freshStats));
                }
            } catch (err) {
                console.warn('Failed to sync statistics from server:', err);
            }

        } catch (error) {
            console.warn("RAG Server connection failed. Falling back to local search logic:", error);
            
            // Offline Fallback logic
            setTimeout(() => {
                hideTypingIndicator();
                const localResponse = processBotLogic(text);
                appendMessage(localResponse, "received");
                chatHistory.push({ role: "assistant", content: localResponse });
                
                // Update local storage stats for offline mode
                const storedStats = localStorage.getItem("siberma_stats");
                let stats = storedStats ? JSON.parse(storedStats) : { totalChats: 0, totalSolved: 0, hoursSaved: 0, reliefPercent: 0 };
                stats.totalChats = parseInt(stats.totalChats) + 1;
                localStorage.setItem("siberma_stats", JSON.stringify(stats));
                
                window.dispatchEvent(new Event('storage'));
            }, 500);
            return;
        }

        // Dispatch dynamic storage event to sync parent dashboard stats instantly!
        window.dispatchEvent(new Event('storage'));
    }

    function appendMessage(text, sender) {
        const msgRow = document.createElement("div");
        msgRow.className = `sw-msg ${sender}`;
        const formatted = text.replace(/\n/g, "<br>");
        
        const isBot = sender === "received";
        const ttsButtonHtml = isBot ? `
            <div class="sw-bubble-footer">
                <span class="sw-msg-time">Sekarang</span>
                <button class="sw-tts-btn" title="Dengarkan Jawaban Suara"><i class="fa-solid fa-volume-high"></i></button>
            </div>
        ` : `<span class="sw-msg-time">Sekarang</span>`;

        msgRow.innerHTML = `
            <div class="sw-bubble">
                ${formatted}
                ${ttsButtonHtml}
            </div>
        `;
        
        if (chatLogs) {
            chatLogs.appendChild(msgRow);
            chatLogs.scrollTop = chatLogs.scrollHeight;
        }

        const yuccaChatLogs = document.getElementById("sw-yucca-chat-logs");
        if (yuccaChatLogs) {
            const yuccaClone = msgRow.cloneNode(true);
            yuccaChatLogs.appendChild(yuccaClone);
            yuccaChatLogs.scrollTop = yuccaChatLogs.scrollHeight;

            if (isBot) {
                const ttsBtn = yuccaClone.querySelector(".sw-tts-btn");
                if (ttsBtn) {
                    ttsBtn.addEventListener("click", () => speakText(text, ttsBtn));
                }
            }
        }

        // Attach Text-To-Speech Event if Bot message
        if (isBot) {
            const ttsBtn = msgRow.querySelector(".sw-tts-btn");
            if (ttsBtn) {
                ttsBtn.addEventListener("click", () => speakText(text, ttsBtn));
            }
        }
    }

    // Text-to-Speech (TTS) using Web Speech API with natural voice selection & pitch tuning
    function speakText(text, btn) {
        if (!('speechSynthesis' in window)) {
            alert('Fitur pembaca suara (Text-to-Speech) tidak didukung pada browser Anda.');
            return;
        }

        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            btn.classList.remove("speaking");
            return;
        }

        // Clean & normalize text for smooth natural Indonesian pronunciation
        let cleanText = text
            .replace(/<[^>]*>?/gm, '')
            .replace(/[*_#~`]/g, '')
            .replace(/Rp\s*([\d.]+)/gi, '$1 rupiah')
            .replace(/s\.d\./gi, 'sampai dengan')
            .replace(/min\./gi, 'minimal')
            .replace(/max\./gi, 'maksimal');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'id-ID';
        utterance.rate = 1.08;  // Slightly faster and smoother rhythm
        utterance.pitch = 1.15; // Friendly, warm, and cheerful tone

        // Pre-select best Indonesian voice from browser engine
        if ('speechSynthesis' in window) {
            const voices = window.speechSynthesis.getVoices();
            const indonesianVoice = voices.find(v => 
                (v.lang.toLowerCase().includes('id') || v.lang.toLowerCase().includes('indonesia')) &&
                (v.name.includes('Natural') || v.name.includes('Gadis') || v.name.includes('Google') || v.name.includes('Ardi'))
            ) || voices.find(v => v.lang.toLowerCase().includes('id'));
            
            if (indonesianVoice) {
                utterance.voice = indonesianVoice;
            }
        }

        btn.classList.add("speaking");

        utterance.onend = () => {
            btn.classList.remove("speaking");
        };

        utterance.onerror = () => {
            btn.classList.remove("speaking");
        };

        window.speechSynthesis.speak(utterance);
    }

    // Voice Input (Speech-to-Text) setup using Web Speech API
    function setupVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported in this browser.");
            if (voiceBtn) voiceBtn.style.display = "none";
            return;
        }

        speechRecognition = new SpeechRecognition();
        speechRecognition.continuous = false;
        speechRecognition.interimResults = false;
        speechRecognition.lang = 'id-ID';

        speechRecognition.onstart = () => {
            isRecording = true;
            if (voiceBtn) voiceBtn.classList.add("recording");
            chatInput.placeholder = "Mendengarkan suara Anda...";
        };

        speechRecognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
            chatInput.placeholder = "Tanya Siberma di sini...";
            sendUserMessage(transcript);
        };

        speechRecognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            isRecording = false;
            if (voiceBtn) voiceBtn.classList.remove("recording");
            chatInput.placeholder = "Tanya Siberma di sini...";
        };

        speechRecognition.onend = () => {
            isRecording = false;
            if (voiceBtn) voiceBtn.classList.remove("recording");
            chatInput.placeholder = "Tanya Siberma di sini...";
        };
    }

    function toggleVoiceInput() {
        if (!speechRecognition) return;
        if (isRecording) {
            speechRecognition.stop();
            setMascotExpression('senyum');
        } else {
            speechRecognition.start();
            setMascotExpression('kaget');
        }
    }

    function showTypingIndicator() {
        setMascotExpression('bingung');
        const typingRow = document.createElement("div");
        typingRow.className = "sw-msg received sw-typing-row";
        typingRow.innerHTML = `
            <div class="sw-typing-container">
                <img src="images/siberma_official_mascot.png" class="sw-typing-avatar" alt="Siberma Typing">
                <div class="sw-bubble sw-typing-bubble">
                    <span class="sw-typing-label">Siberma sedang mengetik</span>
                    <div class="sw-typing-dots">
                        <span class="sw-typing-dot"></span>
                        <span class="sw-typing-dot"></span>
                        <span class="sw-typing-dot"></span>
                    </div>
                </div>
            </div>
        `;
        chatLogs.appendChild(typingRow);
        chatLogs.scrollTop = chatLogs.scrollHeight;
    }

    function hideTypingIndicator() {
        const row = document.querySelector("#siberma-widget .sw-typing-row");
        if (row) row.remove();
    }

    // Bot matching logic sync with app.js
    function processBotLogic(text) {
        const query = text.toLowerCase().trim();
        let bestMatch = null;
        let maxOverlap = 0;

        localFAQs.forEach(faq => {
            let overlap = 0;
            faq.keywords.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'gi');
                if (regex.test(query)) {
                    overlap++;
                }
            });

            if (overlap > maxOverlap) {
                maxOverlap = overlap;
                bestMatch = faq;
            }
        });

        if (bestMatch && maxOverlap > 0) {
            // Update counts in list
            bestMatch.count = (bestMatch.count || 0) + 1;
            localStorage.setItem("siberma_faqs", JSON.stringify(localFAQs));

            // Update stats
            const storedStats = localStorage.getItem("siberma_stats");
            let stats = storedStats ? JSON.parse(storedStats) : { totalChats: 0, totalSolved: 0, hoursSaved: 0, reliefPercent: 0 };
            stats.totalSolved = parseInt(stats.totalSolved) + 1;
            stats.hoursSaved = Math.floor(stats.totalSolved / 5);
            
            const baseRelief = 75;
            const incrementalRelief = Math.min(20, Math.floor(stats.totalSolved / 25));
            stats.reliefPercent = Math.min(96, baseRelief + incrementalRelief);
            
            localStorage.setItem("siberma_stats", JSON.stringify(stats));

            return bestMatch.answer;
        } else {
            return "Maaf, Siberma belum memiliki jawaban resmi untuk pertanyaan tersebut. Pertanyaan ini akan dicatat untuk bahan evaluasi panitia PBM UNMA.\n\nAnda dapat menghubungi WhatsApp Panitia secara langsung di **0811-2233-4455** untuk respon langsung.";
        }
    }
})();
