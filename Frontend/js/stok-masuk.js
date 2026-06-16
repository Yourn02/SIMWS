// File: js/stok-masuk.js

document.addEventListener('DOMContentLoaded', function() {
    loadDropdownBarang();
    loadRiwayatStok();
});

// ==========================================
// 1. MENGISI DROPDOWN BARANG
// ==========================================
function loadDropdownBarang() {
    fetch('http://127.0.0.1:8000/api/barang')
        .then(response => response.json())
        .then(data => {
            // Pastikan HTML Anda punya <select id="pilih-barang">
            const select = document.getElementById('pilih-barang');
            if (!select) return;

            select.innerHTML = '<option value="">-- Pilih Barang --</option>';
            data.forEach(barang => {
                select.innerHTML += `<option value="${barang.id_barang}">${barang.nama_barang} (Sisa Stok: ${barang.stok})</option>`;
            });
        })
        .catch(error => console.error('Gagal memuat barang:', error));
}

// ==========================================
// 2. MENAMPILKAN RIWAYAT STOK MASUK
// ==========================================
function loadRiwayatStok() {
    fetch('http://127.0.0.1:8000/api/stok')
        .then(response => response.json())
        .then(data => {
            // Pastikan tabel Anda punya <tbody id="tabel-riwayat">
            const tbody = document.getElementById('tabel-riwayat');
            if (!tbody) return;

            tbody.innerHTML = '';
            data.forEach((stok, index) => {
                // Memotong format tanggal dari database agar lebih rapi (YYYY-MM-DD)
                const tanggal = new Date(stok.tanggal_masuk).toLocaleDateString('id-ID');
                
                tbody.innerHTML += `
                    <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td class="px-4 py-3 text-slate-500 text-center">${index + 1}</td>
                        <td class="px-4 py-3 font-medium text-slate-800">${tanggal}</td>
                        <td class="px-4 py-3 font-medium text-slate-800">${stok.nama_barang}</td>
                        <td class="px-4 py-3 text-slate-600">${stok.supplier || '-'}</td>
                        <td class="px-4 py-3 font-bold text-green-600 text-center">+${stok.qty}</td>
                    </tr>
                `;
            });
        })
        .catch(error => console.error('Gagal memuat riwayat:', error));
}

// ==========================================
// 3. MENYIMPAN STOK MASUK (Fungsi ini dipanggil oleh tombol Submit/Simpan)
// ==========================================
function simpanStok() {
    const idBarang = document.getElementById('pilih-barang').value;
    const jumlah = document.getElementById('jumlah-masuk').value;
    const supplier = document.getElementById('nama-supplier').value;

    if (!idBarang || !jumlah || jumlah <= 0) {
        tampilkanToastPeringatan("Pilih barang dan masukkan jumlah yang valid (minimal 1)!");
        return;
    }

    const url = new URL('http://127.0.0.1:8000/api/stok');
    url.searchParams.append('id_barang', idBarang);
    url.searchParams.append('jumlah', jumlah);
    url.searchParams.append('supplier', supplier || '-');

    fetch(url, { method: 'POST' })
        .then(response => {
            if (!response.ok) throw new Error('Gagal menambah stok');
            return response.json();
        })
        .then(data => {
            // =========================================================
            // SOLUSI UTAMA: GANTI ALERT LAMA DENGAN TOAST ELEGAN
            // =========================================================
            tampilkanToastSukses();
            
            // Kosongkan form
            document.getElementById('jumlah-masuk').value = '';
            document.getElementById('nama-supplier').value = '';
            
            // Refresh data di layar
            loadDropdownBarang(); 
            loadRiwayatStok();
        })
        .catch(error => {
            console.error(error);
            tampilkanToastPeringatan("Terjadi kesalahan sistem saat menyimpan stok.");
        });
}

// ==========================================
// FUNGSI ANIMASI POP-UP STOK MASUK SUKSES
// ==========================================
function tampilkanToastSukses() {
    const toast = document.getElementById('toast-stok-sukses');
    if (!toast) return;

    // 1. Lepas class hidden agar elemen tercipta di browser
    toast.classList.remove('hidden');
    
    // 2. Beri jeda 10ms agar efek transisi CSS (fade-in & scale) berjalan mulus
    setTimeout(() => {
        toast.classList.remove('scale-90', 'opacity-0');
        toast.classList.add('scale-100', 'opacity-100');
    }, 10);

    // 3. Otomatis kunci dan sembunyikan kembali setelah 3 detik
    setTimeout(() => {
        toast.classList.remove('scale-100', 'opacity-100');
        toast.classList.add('scale-90', 'opacity-0');
        
        // Sembunyikan total setelah animasi menghilang selesai (500ms)
        setTimeout(() => {
            toast.add('hidden');
        }, 500);
    }, 3000);
}

// ==========================================
// FUNGSI ANIMASI POP-UP PERINGATAN INPUT
// ==========================================
function tampilkanToastPeringatan(pesan) {
    const toast = document.getElementById('toast-stok-peringatan');
    const teks = document.getElementById('teks-peringatan');
    if (!toast || !teks) return;

    // Set pesan teks secara dinamis
    teks.innerText = pesan;

    // Munculkan toast
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.remove('scale-90', 'opacity-0');
        toast.classList.add('scale-100', 'opacity-100');
    }, 10);

    // Otomatis hilang dalam 3 detik
    setTimeout(() => {
        toast.classList.remove('scale-100', 'opacity-100');
        toast.classList.add('scale-90', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 500);
    }, 3000);
}