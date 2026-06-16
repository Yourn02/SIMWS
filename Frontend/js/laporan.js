// File: js/laporan.js

document.addEventListener('DOMContentLoaded', function() {
    loadRingkasan();
    loadRiwayatTransaksi();
    inisialisasiGrafikDummy(); // Menjalankan grafik contoh
});

// Fungsi Format Rupiah
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
}

// ==========================================
// 1. MENGAMBIL DATA RINGKASAN ATAS
// ==========================================
function loadRingkasan() {
    fetch('http://127.0.0.1:8000/api/laporan/ringkasan')
        .then(response => response.json())
        .then(data => {
            // Suntikkan data dari MySQL ke dalam Kotak HTML
            document.getElementById('teks-omset').innerText = formatRupiah(data.total_pendapatan || 0);
            document.getElementById('teks-laba').innerText = formatRupiah(data.total_laba || 0);
            document.getElementById('teks-transaksi').innerText = data.total_transaksi || 0;
        })
        .catch(error => console.error('Gagal memuat ringkasan:', error));
}

// ==========================================
// 2. MENGAMBIL TABEL RIWAYAT TRANSAKSI
// ==========================================
function loadRiwayatTransaksi() {
    // 1. Ambil nilai dari komponen dropdown filter periode dan input tanggal di HTML
    const periodeSelect = document.getElementById('filter-periode');
    const tglMulaiInput = document.getElementById('tgl-mulai');
    const tglSelesaiInput = document.getElementById('tgl-selesai');

    const periode = periodeSelect ? periodeSelect.value : 'Semua';
    let tglMulai = tglMulaiInput ? tglMulaiInput.value : '';
    let tglSelesai = tglSelesaiInput ? tglSelesaiInput.value : '';

    // 2. Otomatisasi hitung tanggal jika memilih 'Hari Ini' atau 'Bulan Ini'
    const sekarang = new Date();
    const yyyy = sekarang.getFullYear();
    const mm = String(sekarang.getMonth() + 1).padStart(2, '0');
    const dd = String(sekarang.getDate()).padStart(2, '0');

    if (periode === 'HariIni') {
        tglMulai = `${yyyy}-${mm}-${dd}`;
        tglSelesai = `${yyyy}-${mm}-${dd}`;
    } else if (periode === 'BulanIni') {
        tglMulai = `${yyyy}-${mm}-01`; // Batas awal tanggal 1 bulan berjalan
        tglSelesai = `${yyyy}-${mm}-31`; // Batas akhir aman untuk MySQL
    }

    loadRingkasanLaporan(tglMulai, tglSelesai);

    // 3. Bangun URL dengan memasukkan Query Params tanggal
    // Sesuaikan dengan alamat rute API riwayat keuangan milikmu (bisa /riwayat atau /keuangan)
    const url = new URL('http://127.0.0.1:8000/api/laporan/riwayat?');
    if (tglMulai) url.searchParams.append('tgl_mulai', tglMulai);
    if (tglSelesai) url.searchParams.append('tgl_selesai', tglSelesai);

    // 4. Lakukan Fetch ke Backend Python FastAPI
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Jaringan bermasalah atau server mati');
            return response.json();
        })
.then(data => {
            const tbody = document.getElementById('tabel-riwayat');
            if (!tbody) return;
            
            tbody.innerHTML = ''; // Kosongkan baris lama

            // =========================================================
            // TAMBAHKAN BARIS INI: Ambil array transaksi yang ada di dalam object data
            // =========================================================
            const daftarTransaksi = data.data || data;

            // UBAH KONDISI: Gunakan daftarTransaksi, bukan data
            if (!daftarTransaksi || daftarTransaksi.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-slate-400 text-xs"><i class="fa-solid fa-folder-open text-base mb-1 block text-slate-300"></i>Tidak ada riwayat transaksi pada periode ini.</td></tr>';
                return;
            }

            // UBAH LOOPING: Gunakan daftarTransaksi.forEach, bukan data.forEach
            daftarTransaksi.forEach(trx => {
                // Rapikan format tanggal (Contoh hasil: 11 Jun 2026, 14.30)
                const tgl = new Date(trx.tanggal_transaksi).toLocaleString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
                tr.innerHTML = `
                    <td class="px-6 py-4 text-slate-600 text-xs font-medium">${tgl}</td>
                    <td class="px-6 py-4 text-blue-600 text-xs font-bold">${trx.no_struk}</td>
                    <td class="px-6 py-4 text-right text-xs font-bold text-slate-800">${formatRupiah(trx.total_bayar)}</td>
                    <td class="px-6 py-4 text-right text-xs font-bold text-green-600">${formatRupiah(trx.estimasi_laba)}</td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Gagal memuat riwayat:', error);
            const tbody = document.getElementById('tabel-riwayat');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-red-500 font-semibold">Gagal memuat data dari database.</td></tr>';
            }
        });
}

// ==========================================
// 3. GRAFIK CONTOH (STATIS)
// ==========================================
function inisialisasiGrafikDummy() {
    const canvas = document.getElementById('financeChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
            datasets: [
                { label: 'Pendapatan Kotor', data: [2.1, 1.9, 2.5, 2.2, 2.8, 3.5, 4.0], backgroundColor: '#94a3b8', borderRadius: 4 },
                { label: 'Laba Bersih', data: [0.4, 0.35, 0.5, 0.45, 0.6, 0.8, 0.95], backgroundColor: '#1e3a8a', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [5, 5] }, ticks: { callback: v => v + ' Jt' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// 1. Fungsi Mengatur Tampilan Input Tanggal Kustom
function aturInputTanggal() {
    const periode = document.getElementById('filter-periode').value;
    const kontainerTanggal = document.getElementById('input-tanggal-kustom');
    
    if (periode === 'Kustom') {
        kontainerTanggal.classList.remove('hidden');
    } else {
        kontainerTanggal.classList.add('hidden');
        // Kosongkan input jika tidak dipakai
        document.getElementById('tgl-mulai').value = '';
        document.getElementById('tgl-selesai').value = '';
        
        // Langsung load data karena tidak butuh input tanggal manual
        loadLaporanKeuangan();
    }
}

// 2. Fungsi Utama Fetch Data Laporan Keuangan
function loadLaporanKeuangan() {
    const periode = document.getElementById('filter-periode').value;
    let tglMulai = document.getElementById('tgl-mulai').value;
    let tglSelesai = document.getElementById('tgl-selesai').value;

    // Otomatisasi tanggal jika memilih 'Hari Ini' atau 'Bulan Ini'
    const sekarang = new Date();
    const yyyy = sekarang.getFullYear();
    const mm = String(sekarang.getMonth() + 1).padStart(2, '0');
    const dd = String(sekarang.getDate()).padStart(2, '0');

    if (periode === 'HariIni') {
        tglMulai = `${yyyy}-${mm}-${dd}`;
        tglSelesai = `${yyyy}-${mm}-${dd}`;
    } else if (periode === 'BulanIni') {
        tglMulai = `${yyyy}-${mm}-01`; // Tanggal 1 bulan berjalan
        tglSelesai = `${yyyy}-${mm}-31`; // Browser/MySQL aman menembak batas atas 31
    }

    // Bangun URL Query Params untuk dikirim ke FastAPI
    const url = new URL('http://127.0.0.1:8000/api/laporan/riwayat');
    if (tglMulai) url.searchParams.append('tgl_mulai', tglMulai);
    if (tglSelesai) url.searchParams.append('tgl_selesai', tglSelesai);

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error();
            return response.json();
        })
        .then(res => {
            // Panggil fungsi render tabel laporan keuangan milikmu di sini
            // contoh: renderTabelLaporan(res.data);
            loadRiwayatTransaksi(res.data); 
        })
        .catch(err => {
            console.error("Error:", err);
            const tbody = document.querySelector('#tabel-riwayat tbody');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Gagal memuat riwayat transaksi.</td></tr>`;
            }
        });
    }


// ====================================================================
// FUNGSI BARU: UPDATE 3 KOTAK RINGKASAN SECARA DINAMIS
// ====================================================================
function loadRingkasanLaporan(tglMulai, tglSelesai) {
    // Bangun URL string yang sama persis strukturnya dengan tabel riwayat
    let alamatUrl = `http://127.0.0.1:8000/api/laporan/ringkasan?`;
    if (tglMulai) alamatUrl += `tgl_mulai=${encodeURIComponent(tglMulai)}&`;
    if (tglSelesai) alamatUrl += `tgl_selesai=${encodeURIComponent(tglSelesai)}&`;

    fetch(alamatUrl)
        .then(response => {
            if (!response.ok) throw new Error('Gagal memuat ringkasan');
            return response.json();
        })
        .then(result => {
            // Ambil elemen teks angka di dalam kotak-kotak HTML kamu
            // Catatan: Pastikan id-id ini dipasang di file HTML kamu ya!
            const txtOmset = document.getElementById('teks-omset');
            const txtLaba = document.getElementById('teks-laba');
            const txtStruk = document.getElementById('teks-transaksi');

            if (txtOmset) txtOmset.innerText = formatRupiah(result.total_pendapatan || 0);
            if (txtLaba) txtLaba.innerText = formatRupiah(result.total_laba || 0);
            if (txtStruk) txtStruk.innerText = `${result.total_transaksi || 0} Struk`;
        })
        .catch(error => console.error('Gagal membarui ringkasan kartu:', error));
}