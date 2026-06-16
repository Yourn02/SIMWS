// File: js/dashboard.js

document.addEventListener('DOMContentLoaded', function () {
    tampilkanTanggal();
    loadTotalBarang();
    loadRingkasanHariIni();
    loadStokKritis();
    inisialisasiGrafikDummy();
});

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
}

// 1. Tampilkan Tanggal Hari Ini
function tampilkanTanggal() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const tanggalSekarang = new Date().toLocaleDateString('id-ID', options);
    document.getElementById('tanggal-hari-ini').innerText = tanggalSekarang;
}

// 2. Hitung Total Jenis Barang di Master Data
function loadTotalBarang() {
    fetch('http://127.0.0.1:8000/api/barang')
        .then(response => response.json())
        .then(data => {
            document.getElementById('total-semua-barang').innerText = `${data.length} Produk`;
        })
        .catch(error => console.error('Gagal memuat barang:', error));
}

// 3. Ambil Transaksi Khusus Hari Ini
function loadRingkasanHariIni() {
    fetch('http://127.0.0.1:8000/api/dashboard/ringkasan-hari-ini')
        .then(response => response.json())
        .then(data => {
            document.getElementById('teks-omset-hari-ini').innerText = formatRupiah(data.pendapatan_hari_ini || 0);
            document.getElementById('teks-transaksi-hari-ini').innerText = data.total_transaksi || 0;
        })
        .catch(error => console.error('Gagal memuat ringkasan:', error));
}

// 4. Ambil Daftar Barang Mau Habis
function loadStokKritis() {
    fetch('http://127.0.0.1:8000/api/dashboard/stok-menipis')
        .then(response => response.json())
        .then(data => {
            // Update Kotak Merah di Atas
            document.getElementById('total-stok-kritis').innerText = `${data.length} Barang`;

            // Update Tabel di Bawah
            const tbody = document.getElementById('tabel-stok-kritis');
            tbody.innerHTML = '';

            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="2" class="text-center py-6 text-green-600 font-bold"><i class="fa-solid fa-check-circle mr-1"></i> Stok aman!</td></tr>';
                return;
            }

            // Looping barang kritis
            data.forEach(barang => {
                const tr = document.createElement('tr');
                // Menambahkan border tipis antar baris agar terlihat lebih rapi dan profesional
                tr.className = "border-b border-slate-100 last:border-0"; 
                
                tr.innerHTML = `
                    <td class="py-3 font-medium text-slate-800">
                        ${barang.nama_barang} 
                        <span class="text-xs text-slate-400 block mt-0.5">${barang.kategori || '-'}</span>
                    </td>
                    <td class="py-3 text-right vertical-middle">
                        <div class="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap">
                            <span>Tersisa</span>
                            <span class="bg-red-600 text-white px-1.5 py-0.5 rounded-md text-[11px]">${barang.stok}</span>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(error => console.error('Gagal memuat stok kritis:', error));
}

// 5. Grafik Penjualan (Statis / Dummy)
function inisialisasiGrafikDummy() {
    const canvas = document.getElementById('salesChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(30, 58, 138, 0.3)');
    gradient.addColorStop(1, 'rgba(30, 58, 138, 0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
            datasets: [{
                label: 'Pendapatan (Juta Rupiah)',
                data: [1.2, 1.9, 1.5, 2.2, 1.8, 2.9, 3.1],
                borderColor: '#1e3a8a',
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#1e3a8a',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0f172a', padding: 12,
                    callbacks: { label: function (context) { return 'Rp ' + context.parsed.y + ' Juta'; } },
                },
            },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [5, 5], color: '#e2e8f0', }, ticks: { color: '#64748b' }, },
                x: { grid: { display: false }, ticks: { color: '#64748b' }, },
            },
        },
    });
}