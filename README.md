## App Watermark Remover

Aplikasi web untuk mendeteksi dan menghapus watermark, teks, logo, atau objek mengganggu pada gambar secara otomatis maupun manual. Berjalan **100% di sisi klien (Client-Side murni)** tanpa server backend, tanpa API Key pihak ketiga, dan tanpa kompresi yang merusak kualitas asli gambar (Mendukung Output Ultra-HD/PNG murni).

> 🌐 **Live Demo:** [https://123tool.github.io/watermark-remover/](https://123tool.github.io/watermark-remover/)

---

## 🔥 Fitur & Alat

*   **⚡ API & 100% Gratis:** Tidak memerlukan server backend atau API berbayar. Seluruh komputasi grafis dan rekonstruksi pixel dilakukan langsung di dalam browser pengguna memanfaatkan kekuatan hardware lokal.
*   **🤖 Otomatis Deteksi Presisi Tinggi:** Menggunakan algoritma *Sobel-Gradient Edge Detection* yang dikombinasikan dengan *High-Contrast Thresholding* untuk melacak struktur tulisan atau logo semi-transparan yang sering digunakan sebagai watermark secara instan.
*   **🖌️ Manual Inpainting Brush Engine:** Dilengkapi dengan kuas masker berbasis HTML5 Canvas yang responsif (mendukung akselerasi *Touch Screen* di smartphone). Area yang diarsir akan otomatis direstorasi.
*   **💎 Ultra-Pure Pixel Restoration:** Menggunakan metode interpolasi gradien warna sekitar (*Pixel Neighborhood Interpolation* dengan pembobotan jarak konvolusi). Algoritma ini memastikan area yang dihapus terisi kembali mengikuti tekstur warna tetangganya secara mulus tanpa efek blur atau buram.
*   **🛡️ Kualitas Gambar Tetap HD:** Sistem membaca ukuran asli gambar (*Natural Resolution*) dari buffer memori internal, sehingga hasil unduhan mempertahankan resolusi pixel, metadata, dan ketajaman warna asli 100% (Lossless PNG Export).

---

## 🛠️ Teknologi & Algoritma

Projek ini dibangun menggunakan arsitektur *Vanilla Web Stack* tanpa framework berat agar performa pemuatan halaman (*FCP - First Contentful Paint*) berada di bawah 0.5 detik:

1.  **Struktur:** HTML5 Semantik & Canvas API untuk manipulasi matriks pixel tingkat rendah.
2.  **Gaya UI:** CSS3 dengan tren *Dark Glassmorphic UI* untuk memberikan kesan premium, modern, dan fokus tinggi pada workspace editor.
3.  **Logika AI Mini:** 
    *   *Computer Vision Lokal:* Melakukan pemindaian spasial pada kanal luminansi gambar ($0.299R + 0.587G + 0.114B$) guna mendeteksi lonjakan kontras tajam (karakteristik watermark teks).
    *   *Sintesis Tekstur:* Menggunakan rumus bobot jarak invers kuadrat ($W = \frac{1}{d^2 + 1}$) untuk mentransfer warna dari pixel bersih ke area bermasalah secara gradual.

---
