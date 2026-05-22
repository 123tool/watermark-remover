// Smart Watermark Remover Pro - Core Logic
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const editorZone = document.getElementById('editorZone');
    const mainCanvas = document.getElementById('mainCanvas');
    const maskCanvas = document.getElementById('maskCanvas');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    
    // Controls
    const btnAutoMode = document.getElementById('btnAutoMode');
    const btnManualMode = document.getElementById('btnManualMode');
    const autoControls = document.getElementById('autoControls');
    const manualControls = document.getElementById('manualControls');
    const sensitivityRange = document.getElementById('sensitivityRange');
    const sensitivityVal = document.getElementById('sensitivityVal');
    const brushSize = document.getElementById('brushSize');
    const brushVal = document.getElementById('brushVal');
    
    // Action Buttons
    const btnRunAuto = document.getElementById('btnRunAuto');
    const btnClearMask = document.getElementById('btnClearMask');
    const btnReset = document.getElementById('btnReset');
    const btnDownload = document.getElementById('btnDownload');

    // Contexts & State
    const ctx = mainCanvas.getContext('2d', { willReadFrequently: true });
    const maskCtx = maskCanvas.getContext('2d');
    let originalImage = new Image();
    let currentMode = 'auto'; // 'auto' atau 'manual'
    let isDrawing = false;
    let originalWidth = 0;
    let originalHeight = 0;

    // --- 1. HANDLING UPLOAD & SETUP ---
    uploadZone.addEventListener('click', () => fileInput.click());
    
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '#3b82f6';
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.style.borderColor = '#475569';
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Format file harus berupa gambar!');
            return;
        }

        showLoading('Membaca file gambar...');
        const reader = new FileReader();
        reader.onload = (e) => {
            originalImage.onload = () => {
                setupWorkspace();
                hideLoading();
            };
            originalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function setupWorkspace() {
        // Simpan dimensi asli agar output tidak rusak kualitasnya (Tetap HD)
        originalWidth = originalImage.naturalWidth;
        originalHeight = originalImage.naturalHeight;

        // Atur ukuran canvas sesuai gambar asli
        mainCanvas.width = originalWidth;
        mainCanvas.height = originalHeight;
        maskCanvas.width = originalWidth;
        maskCanvas.height = originalHeight;

        // Render gambar pertama kali
        ctx.drawImage(originalImage, 0, 0);
        clearMask();

        // Tampilkan editor workspace
        uploadZone.classList.add('hidden');
        editorZone.classList.remove('hidden');
    }

    function clearMask() {
        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    }

    // --- 2. SWITCHING MODES & INPUTS ---
    btnAutoMode.addEventListener('click', () => {
        currentMode = 'auto';
        btnAutoMode.classList.add('active');
        btnManualMode.classList.remove('active');
        autoControls.classList.remove('hidden');
        manualControls.classList.add('hidden');
        clearMask();
    });

    btnManualMode.addEventListener('click', () => {
        currentMode = 'manual';
        btnManualMode.classList.add('active');
        btnAutoMode.classList.remove('active');
        manualControls.classList.remove('hidden');
        autoControls.classList.add('hidden');
        clearMask();
    });

    sensitivityRange.addEventListener('input', (e) => {
        sensitivityVal.textContent = e.target.value + '%';
    });

    brushSize.addEventListener('input', (e) => {
        brushVal.textContent = e.target.value + 'px';
    });

    btnClearMask.addEventListener('click', clearMask);
    btnReset.addEventListener('click', () => {
        uploadZone.classList.remove('hidden');
        editorZone.classList.add('hidden');
        fileInput.value = '';
    });

    // --- 3. MANUAL BRUSH PAINTING ENGINE ---
    function getCanvasCoordinates(e) {
        const rect = maskCanvas.getBoundingClientRect();
        // Kalkulasi rasio antara resolusi canvas asli dengan display CSS-nya
        const scaleX = maskCanvas.width / rect.width;
        const scaleY = maskCanvas.height / rect.height;

        let clientX = e.clientX;
        let clientY = e.clientY;

        // Handle Touch Screen jika dibuka lewat HP
        if (e.touches && e.touches[0]) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    function startDrawing(e) {
        if (currentMode !== 'manual') return;
        isDrawing = true;
        draw(e);
    }

    function draw(e) {
        if (!isDrawing || currentMode !== 'manual') return;
        e.preventDefault();

        const coords = getCanvasCoordinates(e);

        maskCtx.lineWidth = parseInt(brushSize.value);
        maskCtx.lineCap = 'round';
        maskCtx.lineJoin = 'round';
        maskCtx.strokeStyle = 'rgba(239, 68, 68, 1)'; // Warna merah solid di buffer internal

        if (e.type === 'mousedown' || e.type === 'touchstart') {
            maskCtx.beginPath();
            maskCtx.moveTo(coords.x, coords.y);
        }
        
        maskCtx.lineTo(coords.x, coords.y);
        maskCtx.stroke();
    }

    function stopDrawing() {
        if (isDrawing) {
            isDrawing = false;
            maskCtx.closePath();
            // Langsung eksekusi inpainting setelah angkat kuas (Sistem Pro Pintar)
            processInpainting();
        }
    }

    // Event listeners untuk menggambar mask
    maskCanvas.addEventListener('mousedown', startDrawing);
    maskCanvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDrawing);

    maskCanvas.addEventListener('touchstart', startDrawing, { passive: false });
    maskCanvas.addEventListener('touchmove', draw, { passive: false });
    window.addEventListener('touchend', stopDrawing);


    // --- 4. ALGORITMA OTOMATIS DETEKSI WATERMARK ---
    btnRunAuto.addEventListener('click', () => {
        showLoading('Menganalisis area watermark...');
        
        // Timeout sedikit agar UI benang loading berputar dulu
        setTimeout(() => {
            const imgData = ctx.getImageData(0, 0, originalWidth, originalHeight);
            const pixels = imgData.data;
            
            // Buat buffer mask data kosong
            const maskImgData = maskCtx.createImageData(originalWidth, originalHeight);
            const maskPixels = maskImgData.data;

            const threshold = (100 - parseInt(sensitivityRange.value)) * 2.55;

            // Algoritma Edge-Contrast Scanning (Deteksi Watermark Transparan/Teks)
            for (let y = 1; y < originalHeight - 1; y++) {
                for (let x = 1; x < originalWidth - 1; x++) {
                    const idx = (y * originalWidth + x) * 4;

                    // Hitung gradien kontras Sobel sederhana untuk kanal luminansi
                    const idxUp = ((y - 1) * originalWidth + x) * 4;
                    const idxDown = ((y + 1) * originalWidth + x) * 4;
                    const idxLeft = (y * originalWidth + (x - 1)) * 4;
                    const idxRight = (y * originalWidth + (x + 1)) * 4;

                    // Luminance formula: 0.299R + 0.587G + 0.114B
                    const lumUp = 0.299 * pixels[idxUp] + 0.587 * pixels[idxUp+1] + 0.114 * pixels[idxUp+2];
                    const lumDown = 0.299 * pixels[idxDown] + 0.587 * pixels[idxDown+1] + 0.114 * pixels[idxDown+2];
                    const lumLeft = 0.299 * pixels[idxLeft] + 0.587 * pixels[idxLeft+1] + 0.114 * pixels[idxLeft+2];
                    const lumRight = 0.299 * pixels[idxRight] + 0.587 * pixels[idxRight+1] + 0.114 * pixels[idxRight+2];

                    const gradX = lumRight - lumLeft;
                    const gradY = lumDown - lumUp;
                    const gradient = Math.sqrt(gradX * gradX + gradY * gradY);

                    // Jika perubahan kontras tajam (karakteristik watermark tipis) di atas ambang batas sensitivitas
                    if (gradient > threshold) {
                        // Tandai sebagai area terdeteksi dengan warna merah di maskCanvas
                        maskPixels[idx] = 239;     // R
                        maskPixels[idx + 1] = 68;  // G
                        maskPixels[idx + 2] = 68;  // B
                        maskPixels[idx + 3] = 255; // A (Solid)
                    }
                }
            }

            maskCtx.putImageData(maskImgData, 0, 0);
            hideLoading();
            
            // Lanjut rekonstruksi area yang ditandai otomatis
            showLoading('Mengekstrak dan merestorasi pixel...');
            setTimeout(() => {
                processInpainting();
            }, 100);

        }, 100);
    });


    // --- 5. ULTRA-PURE INPAINTING ENGINE (RESTORASI TANPA MERUSAK KUALITAS) ---
    function processInpainting() {
        const imgData = ctx.getImageData(0, 0, originalWidth, originalHeight);
        const maskData = maskCtx.getImageData(0, 0, originalWidth, originalHeight);
        
        const pixels = imgData.data;
        const maskPixels = maskData.data;

        // Salin data gambar asli ke buffer untuk referensi pencarian warna tetangga
        const refPixels = new Uint8ClampedArray(pixels);

        const radius = 4; // Radius jangkauan interpolasi pixel sekitar

        // Loop melintasi pixel yang ditandai masker merah untuk direstorasi
        for (let y = 0; y < originalHeight; y++) {
            for (let x = 0; x < originalWidth; x++) {
                const idx = (y * originalWidth + x) * 4;

                // Cek apakah pixel ini ditandai merah di masker
                if (maskPixels[idx + 3] > 0) { 
                    let totalR = 0, totalG = 0, totalB = 0, count = 0;

                    // Mengambil data gradien warna dari lingkungan pixel tetangga yang bersih
                    for (let ky = -radius; ky <= radius; ky++) {
                        for (let kx = -radius; kx <= radius; kx++) {
                            const nx = x + kx;
                            const ny = y + ky;

                            if (nx >= 0 && nx < originalWidth && ny >= 0 && ny < originalHeight) {
                                const nIdx = (ny * originalWidth + nx) * 4;
                                
                                // Pastikan pixel tetangga yang diambil adalah pixel murni (tidak terkena masker merah)
                                if (maskPixels[nIdx + 3] === 0) {
                                    // Hitung pembobotan jarak (semakin dekat jarak pixel tetangga, bobotnya semakin besar)
                                    const weight = 1 / (kx * kx + ky * ky + 1);
                                    totalR += refPixels[nIdx] * weight;
                                    totalG += refPixels[nIdx + 1] * weight;
                                    totalB += refPixels[nIdx + 2] * weight;
                                    count += weight;
                                }
                            }
                        }
                    }

                    // Jika ditemukan pixel tetangga yang bersih, suntikkan warnanya secara halus
                    if (count > 0) {
                        pixels[idx]     = totalR / count;
                        pixels[idx + 1] = totalG / count;
                        pixels[idx + 2] = totalB / count;
                        
                        // Hapus tanda masker merah secara bertahap pada pixel yang sudah selesai direstorasi
                        maskPixels[idx + 3] = 0; 
                    }
                }
            }
        }

        // Terapkan hasil kalkulasi pixel baru ke canvas utama
        ctx.putImageData(imgData, 0, 0);
        // Perbarui tampilan masker (masker merah yang sukses diproses akan hilang)
        maskCtx.putImageData(maskData, 0, 0);
        
        hideLoading();
    }

    // --- 6. UTILITIES & DOWNLOAD ---
    function showLoading(text) {
        loadingText.textContent = text;
        loadingOverlay.classList.remove('hidden');
    }

    function hideLoading() {
        loadingOverlay.classList.add('hidden');
    }

    btnDownload.addEventListener('click', () => {
        // Konversi canvas utama menjadi blob image berkualitas HD penuh (1.0 = Max quality)
        mainCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cleaned_${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png', 1.0);
    });
});
