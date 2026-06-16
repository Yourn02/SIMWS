// File: js/kasir.js

// === STATE MANAGEMENT ===
let semuaProduk = [];
let keranjang = [];
let kategoriAktif = 'Semua';
let kataKunci = '';

document.addEventListener('DOMContentLoaded', function () {
    mulaiJamRealtime();
    loadDataProduk();
});

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
}

function mulaiJamRealtime() {
    setInterval(() => {
        const waktu = new Date();
        const opsi = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        document.getElementById('jam-realtime').innerText = waktu.toLocaleDateString('id-ID', opsi);
    }, 1000);
}

// ==========================================
// 1. DATA, FILTER, & PENCARIAN
// ==========================================
function loadDataProduk() {
    fetch('http://127.0.0.1:8000/api/barang')
        .then(response => response.json())
        .then(data => {
            semuaProduk = data;
            renderGridProduk();
        })
        .catch(error => console.error('Gagal memuat barang:', error));
}

// Fitur Filter Kategori & Ganti Warna Tombol
function setKategori(kategori) {
    kategoriAktif = kategori;

    const semuaTombol = document.querySelectorAll('.btn-kategori');
    semuaTombol.forEach(tombol => {
        if (tombol.getAttribute('data-kat') === kategori) {
            tombol.className = 'btn-kategori px-4 py-2 bg-brand text-white rounded-full text-sm font-bold shadow-sm whitespace-nowrap focus:outline-none';
        } else {
            tombol.className = 'btn-kategori px-4 py-2 bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-full text-sm font-semibold whitespace-nowrap transition focus:outline-none';
        }
    });

    renderGridProduk();
}

// Fitur Pencarian 
function cariBarang(keyword) {
    kataKunci = keyword.toLowerCase();
    renderGridProduk();
}

// Menggambar Kartu Produk di Layar
function renderGridProduk() {
    const grid = document.getElementById('grid-produk');
    if (!grid) return;
    grid.innerHTML = '';

    const produkSaring = semuaProduk.filter(barang => {
        if (!barang.nama_barang) return false;

        const cocokKategori = kategoriAktif === 'Semua' ||
            (barang.kategori && barang.kategori.toLowerCase() === kategoriAktif.toLowerCase());

        const namaCocok = barang.nama_barang.toLowerCase().includes(kataKunci);

        return cocokKategori && namaCocok && barang.stok > 0;
    });

    if (produkSaring.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-10 text-slate-400 font-semibold"><i class="fa-solid fa-box-open text-3xl mb-3 block"></i>Barang tidak ditemukan atau stok habis.</div>';
        return;
    }

    produkSaring.forEach(barang => {
        const card = document.createElement('div');
        card.className = 'bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-brand cursor-pointer transition transform hover:-translate-y-1';
        card.onclick = () => tambahKeKeranjang(barang.id_barang);

        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <span class="bg-blue-50 text-brand text-xs font-bold px-2 py-1 rounded">${barang.kategori}</span>
                <span class="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">Stok: ${barang.stok}</span>
            </div>
            <h4 class="font-semibold text-slate-800 text-sm leading-snug mb-3 line-clamp-2">${barang.nama_barang}</h4>
            <div class="text-brand font-black text-lg">${formatRupiah(barang.harga_jual)}</div>
        `;
        grid.appendChild(card);
    });
}

// ==========================================
// 2. KERANJANG BELANJA
// ==========================================
function tambahKeKeranjang(id_barang) {
    const produk = semuaProduk.find(b => b.id_barang === id_barang);
    if (!produk) return;

    const indexAda = keranjang.findIndex(item => item.id_barang === id_barang);

    if (indexAda > -1) {
        if (keranjang[indexAda].qty < produk.stok) {
            keranjang[indexAda].qty += 1;
            keranjang[indexAda].subtotal = keranjang[indexAda].qty * produk.harga_jual;
        } else {
            alert('Stok maksimal di gudang tercapai!');
        }
    } else {
        keranjang.push({
            id_barang: produk.id_barang,
            nama_barang: produk.nama_barang,
            harga_modal: produk.harga_modal,
            harga_jual: produk.harga_jual,
            qty: 1,
            subtotal: produk.harga_jual
        });
    }
    renderKeranjang();
}

function ubahQty(index, perubahan) {
    const item = keranjang[index];
    const produkAsli = semuaProduk.find(b => b.id_barang === item.id_barang);
    let qtyBaru = item.qty + perubahan;

    if (qtyBaru <= 0) {
        keranjang.splice(index, 1);
    } else if (qtyBaru > produkAsli.stok) {
        alert('Stok maksimal di gudang tercapai!');
    } else {
        keranjang[index].qty = qtyBaru;
        keranjang[index].subtotal = qtyBaru * item.harga_jual;
    }
    renderKeranjang();
}

function kosongkanKeranjang() {
    // Ganti fungsi confirm() bawaan browser dengan memunculkan modal kustom
    const modal = document.getElementById('modal-kosongkan-keranjang');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// 2. FUNGSI UNTUK MENUTUP MODAL (Dipanggil oleh tombol Batal di HTML)
function tutupModalKosongkan() {
    const modal = document.getElementById('modal-kosongkan-keranjang');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// 3. LOGIKA KETIK TOMBOL "YA, HAPUS SEMUA" DI MODAL DIKLIK
document.getElementById('btn-ya-kosongkan').addEventListener('click', () => {
    // Jalankan logika pengosongan array keranjang bawaan tokomu sebelumnya
    keranjang = [];

    // Tutup modal kustomnya kembali
    tutupModalKosongkan();

    // Render ulang keranjang agar layar langsung bersih dan bertuliskan "Keranjang kosong"
    renderKeranjang();
});

function renderKeranjang() {
    const listKeranjang = document.getElementById('list-keranjang');
    let totalHarga = 0;
    let totalItem = 0;

    listKeranjang.innerHTML = '';

    if (keranjang.length === 0) {
        listKeranjang.innerHTML = '<div class="text-center text-slate-400 py-10 text-sm"><i class="fa-solid fa-basket-shopping text-3xl mb-2 opacity-50 block"></i>Keranjang masih kosong</div>';
    } else {
        keranjang.forEach((item, index) => {
            totalHarga += item.subtotal;
            totalItem += item.qty;

            const div = document.createElement('div');
            div.className = 'py-3 flex justify-between items-center group';
            div.innerHTML = `
                <div class="flex-1 pr-2">
                    <h5 class="text-sm font-semibold text-slate-800 leading-tight">${item.nama_barang}</h5>
                    <div class="text-brand font-bold text-sm mt-1">${formatRupiah(item.subtotal)}</div>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                    <div class="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                        <button onclick="ubahQty(${index}, -1)" class="px-2 py-1 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"><i class="fa-solid fa-minus text-xs"></i></button>
                        
                        <input 
                            type="number" 
                            value="${item.qty}" 
                            min="1" 
                            onchange="inputQtyManual(${index}, this.value)"
                            class="w-8 py-1 text-sm font-bold text-center bg-slate-50 focus:outline-none focus:bg-blue-50 focus:text-blue-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        
                        <button onclick="ubahQty(${index}, 1)" class="px-2 py-1 text-slate-500 hover:bg-green-50 hover:text-green-600 transition"><i class="fa-solid fa-plus text-xs"></i></button>
                    </div>
                </div>
            `;
            listKeranjang.appendChild(div);
        });
    }

    document.getElementById('info-item').innerText = `Subtotal (${totalItem} item)`;
    document.getElementById('teks-subtotal').innerText = formatRupiah(totalHarga);
    document.getElementById('teks-total-bayar').innerText = formatRupiah(totalHarga);
}

function inputQtyManual(index, nilaiBaru) {
    // 1. Paksa nilai inputan dari keyboard menjadi angka bulat (Integer)
    let qtyBaru = parseInt(nilaiBaru);

    // Validasi dasar: Jika kasir input kosong, huruf, atau angka di bawah 1, paksa set ke 1
    if (isNaN(qtyBaru) || qtyBaru < 1) {
        qtyBaru = 1;
    }

    // Ambil data barang di keranjang berdasarkan index array-nya
    const item = keranjang[index];

    // ====================================================================
    // KUNCI UTAMA: Cari produk asli di array gudang berdasarkan id_barang
    // ====================================================================
    const produkAsli = semuaProduk.find(b => b.id_barang === item.id_barang);

    if (item && produkAsli) {
        // Paksa sisa stok gudang menjadi angka bulat (Integer) untuk perbandingan akurat
        const stokMaksimal = parseInt(produkAsli.stok);

        // Pengecekan: Jika ketikan kasir melebihi stok yang ada di katalog/gudang
        if (qtyBaru > stokMaksimal) {
            tampilkanModalStok(`Maksimal pembelian untuk "${item.nama_barang}" adalah ${stokMaksimal} item.`);

            // Paksa jumlahnya turun mentok di sisa stok yang ada
            qtyBaru = stokMaksimal;
        }

        // 2. Update jumlah kuantiti baru yang sudah lolos sensor stok
        item.qty = qtyBaru;

        // Hitung ulang subtotal barang menggunakan harga_jual bawaan tokomu
        item.subtotal = item.qty * (item.harga_jual || (item.subtotal / item.qty));
    }

    // Render ulang seluruh isi keranjang dan totalan harga agar angka di layar berubah
    renderKeranjang();
}

function tampilkanModalStok(pesan) {
    const modal = document.getElementById('modal-stok');
    const teksPesan = document.getElementById('teks-peringatan-stok');

    if (modal && teksPesan) {
        teksPesan.innerText = pesan; // Masukkan teks pesan dinamis
        modal.classList.remove('hidden'); // Hilangkan class hidden untuk memunculkan
    }
}

// 2. Fungsi baru untuk menutup pop-up modal stok (Dipanggil oleh onclick HTML)
function tutupModalStok() {
    const modal = document.getElementById('modal-stok');
    if (modal) {
        modal.classList.add('hidden'); // Pasang kembali class hidden untuk menyembunyikan
    }
}

// ==========================================
// 3. PEMBAYARAN & CETAK STRUK (ANTI-ERROR POPUP)
// ==========================================
function prosesPembayaran() {
    if (keranjang.length === 0) return alert("Keranjang kosong!");

    // GERBANG PERTAHANAN TERAKHIR: Cek seluruh isi keranjang vs stok gudang
    // ====================================================================
    for (let i = 0; i < keranjang.length; i++) {
        const item = keranjang[i];
        // Cari data barang asli dari array semuaProduk di gudang
        const produkAsli = semuaProduk.find(b => b.id_barang === item.id_barang);

        if (produkAsli && item.qty > produkAsli.stok) {
            alert(`TRANSAKSI DITOLAK!\n\nProduk "${item.nama_barang}" dibeli sebanyak ${item.qty} item, padahal sisa stok di gudang hanya ${produkAsli.stok} item.\n\nSilakan perbaiki jumlah keranjang terlebih dahulu!`);

            // Paksa jalankan renderKeranjang agar jika ada salah ketik langsung kembali normal
            renderKeranjang();
            return; // Menghentikan fungsi secara paksa (Aman!)
        }
    }
    const totalHarga = keranjang.reduce((total, item) => total + item.subtotal, 0);

    let bayar = prompt(`Total Belanja: ${formatRupiah(totalHarga)}\nMasukkan jumlah Uang Pelanggan (Angka):`);
    if (bayar === null) return;

    bayar = parseInt(bayar);
    if (isNaN(bayar) || bayar < totalHarga) {
        return alert("Uang yang dimasukkan kurang atau tidak valid!");
    }

    const kembalian = bayar - totalHarga;

    const dataTransaksi = {
        subtotal: totalHarga,
        diskon: 0,
        total_bayar: totalHarga,
        items: keranjang.map(item => ({
            id_barang: item.id_barang,
            qty: item.qty,
            harga_modal: item.harga_modal,
            harga_jual: item.harga_jual,
            subtotal: item.subtotal
        }))
    };

    const dataKeranjangCetak = [...keranjang];

    fetch('http://127.0.0.1:8000/api/kasir/bayar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataTransaksi)
    })
        .then(response => {
            if (!response.ok) throw new Error('Gagal');
            return response.json();
        })
        .then(data => {
            // [PERBAIKAN] Tampilkan kembalian pakai alert dulu agar kasir langsung tahu
            alert(`TRANSAKSI SUKSES!\n\nNo Struk: ${data.no_struk}\nKembalian Pelanggan: ${formatRupiah(kembalian)}`);

            // Coba cetak struk
            cetakStruk(data.no_struk, dataKeranjangCetak, totalHarga, bayar, kembalian);

            // Reset Layar
            keranjang = [];
            document.getElementById('input-cari').value = '';
            cariBarang('');
            renderKeranjang();
            loadDataProduk();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat memproses pembayaran.');
        });
}

function cetakStruk(no_struk, daftarItem, total, bayar, kembali) {
    const tanggal = new Date().toLocaleString('id-ID');

    let htmlStruk = `
        <html>
        <head>
            <title>Struk Pembayaran - ${no_struk}</title>
            <style>
                body { font-family: 'Courier New', Courier, monospace; font-size: 12px; margin: 0; padding: 10px; width: 280px; color: #000; }
                h2 { text-align: center; margin: 0 0 5px 0; font-size: 16px; }
                p { text-align: center; margin: 0 0 10px 0; font-size: 11px; }
                .garis { border-bottom: 1px dashed #000; margin: 5px 0; }
                table { width: 100%; border-collapse: collapse; }
                td { padding: 2px 0; vertical-align: top; }
                .kanan { text-align: right; }
                .tengah { text-align: center; }
                .total-area { margin-top: 10px; font-weight: bold; }
            </style>
        </head>
        <body>
            <h2>WARUNG BERKAH</h2>
            <p>Jl. Contoh Alamat No. 123<br>Telp: 0812-3456-7890</p>
            <div class="garis"></div>
            <table>
                <tr><td style="width: 50px;">No</td><td>: ${no_struk}</td></tr>
                <tr><td>Tgl</td><td>: ${tanggal}</td></tr>
                <tr><td>Kasir</td><td>: Admin Utama</td></tr>
            </table>
            <div class="garis"></div>
            <table>
    `;

    daftarItem.forEach(item => {
        htmlStruk += `
            <tr><td colspan="3">${item.nama_barang}</td></tr>
            <tr>
                <td style="width: 30px;">${item.qty} x</td>
                <td>${formatRupiah(item.harga_jual)}</td>
                <td class="kanan">${formatRupiah(item.subtotal)}</td>
            </tr>
        `;
    });

    htmlStruk += `
            </table>
            <div class="garis"></div>
            <table class="total-area">
                <tr><td>Total Belanja</td><td class="kanan">${formatRupiah(total)}</td></tr>
                <tr><td>Tunai</td><td class="kanan">${formatRupiah(bayar)}</td></tr>
                <tr><td>Kembali</td><td class="kanan">${formatRupiah(kembali)}</td></tr>
            </table>
            <div class="garis"></div>
            <p style="margin-top:10px;">Terima kasih atas kunjungan Anda!<br>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
            
            <script>
                window.onload = function() {
                    // Beri sedikit jeda agar konten HTML selesai dimuat sempurna oleh browser
                    setTimeout(function() {
                        window.print();
                        // Beri jeda 500ms setelah dialog cetak muncul sebelum menutup jendela otomatis
                        setTimeout(function() { window.close(); }, 500);
                    }, 300);
                }
            </script>
        </body>
        </html>
    `;

    // Pastikan jendela dibuka dengan name '_blank' agar browser mendeteksi sebagai tab baru yang legal
    let jendelaPrint = window.open('', '_blank', 'width=400,height=600,scrollbars=yes');

    if (jendelaPrint) {
        jendelaPrint.document.write(htmlStruk);
        jendelaPrint.document.close();
    } else {
        // SOLUSI CADANGAN JIKA POP-UP TETAP DIBLOKIR BROWSER:
        // Tampilkan notifikasi ramah agar user mengizinkan akses pop-up di pojok kanan atas browser
        alert("Pencetakan gagal karena pop-up diblokir oleh browser.\\n\\nSilakan klik ikon gembok/pop-up di sebelah kolom URL alamat browser Anda dan pilih 'Selalu Izinkan/Allow Pop-ups'!");
    }
}

// ==========================================
// KODE LOGIKA JAVASCRIPT UNTUK PEMBAYARAN
// ==========================================

// 1. Fungsi untuk Membuka Modal Pembayaran
function bukaModalBayar() {
    const modal = document.getElementById('modal-pembayaran');

    // Ambil nilai total belanja dari elemen halaman keranjang/kasir kamu saat ini
    // (Sesuaikan ID 'total-belanja-halaman' dengan ID teks total rupiah di halaman kasir kamu)
    const elemenTotalHalaman = document.getElementById('teks-total-bayar');
    const totalBelanjaText = elemenTotalHalaman ? elemenTotalHalaman.innerText : "Rp 0";

    // Tampilkan total tagihan tersebut ke dalam Pop-Up Modal
    document.getElementById('total-tagihan-modal').innerText = totalBelanjaText;

    // Reset input uang dan kembalian ke posisi kosong awal
    document.getElementById('uang-dibayar').value = '';
    document.getElementById('uang-kembalian').innerText = 'Rp 0';
    document.getElementById('uang-kembalian').className = "text-xl font-bold text-slate-700";

    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        // Otomatis fokuskan kursor ke kolom input uang
        setTimeout(() => document.getElementById('uang-dibayar').focus(), 100);
    }
}

// 2. Fungsi untuk Menutup Modal Pembayaran
function tutupModalPembayaran() {
    const modal = document.getElementById('modal-pembayaran');
    if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }
}

// 3. Fungsi Menghitung Kembalian secara Live (Dinamis) saat User Mengetik Angka
function hitungKembalian() {
    // Ambil angka total tagihan (menghilangkan teks "Rp" dan tanda titik)
    const totalTagihanText = document.getElementById('total-tagihan-modal').innerText;
    const totalTagihan = parseInt(totalTagihanText.replace(/[^0-9]/g, '')) || 0;

    // Ambil nominal uang yang dimasukkan user
    const uangDibayar = parseInt(document.getElementById('uang-dibayar').value) || 0;

    const kembalian = uangDibayar - totalTagihan;
    const elemenKembalian = document.getElementById('uang-kembalian');

    if (kembalian < 0) {
        // Jika uang kurang, beri teks warna merah peringatan
        elemenKembalian.innerText = "Uang Kurang!";
        elemenKembalian.className = "text-sm font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded";
    } else {
        // Jika uang cukup/pas, format ke rupiah dan beri warna hijau sukses
        elemenKembalian.innerText = formatRupiah(kembalian);
        elemenKembalian.className = "text-xl font-bold text-green-600";
    }
}

// 4. Fungsi Eksekusi Ketika Klik Tombol Selesai & Cetak
function prosesTransaksiSelesai() {
    // 1. Ambil nominal uang dari input modal kasir
    const uangDibayar = parseInt(document.getElementById('uang-dibayar').value) || 0;

    // 2. Ambil nilai angka total belanja dari halaman utama keranjang (bersihkan simbol Rp dan titik)
    const totalTagihanText = document.getElementById('total-tagihan-modal').innerText;
    const totalTagihan = parseInt(totalTagihanText.replace(/[^0-9]/g, '')) || 0;
    const kembalian = uangDibayar - totalTagihan;

    // Validasi uang kasir
    if (uangDibayar < totalTagihan) {
        alert("Transaksi tidak dapat diproses karena pembayaran kurang!");
        return;
    }

    // =========================================================
    // PEMBENTUKAN DATA ITEM BELANJA (WAJIB SESUAI PYDANTIC PYTHON)
    // =========================================================
    const itemsBeres = keranjang.map(item => ({
        id_barang: parseInt(item.id_barang || item.id),
        qty: parseInt(item.qty),
        harga_modal: parseInt(item.harga_modal || item.harga_beli || 0), // Ambil harga modal barang
        harga_jual: parseInt(item.harga_jual || item.harga || 0),       // Ambil harga jual barang
        subtotal: parseInt(item.subtotal || (item.qty * (item.harga_jual || item.harga || 0)))
    }));

    // =========================================================
    // PROSES KIRIM KE BACKEND FASTAPI (URL: /api/kasir/bayar)
    // =========================================================
    fetch('http://127.0.0.1:8000/api/kasir/bayar', { // <-- SINKRONISASI JALUR URL FIX
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        // Mengirim data bungkusan utuh sesuai struktur class RequestBayar di Python
        body: JSON.stringify({
            subtotal: totalTagihan, // Jika tidak ada diskon sementara disamakan dengan total bayar
            diskon: 0,
            total_bayar: totalTagihan,
            items: itemsBeres
        })
    })
        .then(response => {
            if (!response.ok) throw new Error('Data tidak valid atau server bermasalah (Error 422/500).');
            return response.json();
        })
        .then(res => {
            console.log('Respons Server:', res.message);

            // Nomor struk diambil dari generate otomatis Python demi keamanan data database
            const nomorStrukAsliDariPython = res.no_struk;

            // 3. Tutup modal & luncurkan cetak struk bawaan kamu
            tutupModalPembayaran();
            cetakStruk(nomorStrukAsliDariPython, keranjang, totalTagihan, uangDibayar, kembalian);

            // 4. KODE REFRESH KERANJANG & STOK HALAMAN UTAMA
            keranjang = [];
            if (typeof renderKeranjang === 'function') renderKeranjang();
            if (typeof hitungTotal === 'function') hitungTotal();
            if (typeof loadDataBarang === 'function') loadDataBarang();
        })
        .catch(error => {
            console.error('Error Transaksi:', error);
            alert('Gagal memproses transaksi! Silakan periksa kelengkapan properti objek barang di array keranjang.');
        });
}

// 1. Fungsi untuk memicu munculnya pop-up stok dengan teks dinamis
function tampilkanModalStok(pesan) {
    const modal = document.getElementById('modal-stok');
    const teksPesan = document.getElementById('teks-peringatan-stok');

    if (modal && teksPesan) {
        teksPesan.innerText = pesan; // Masukkan teks error bawaan produknya
        modal.classList.remove('hidden'); // Munculkan pop-up
    }
}

// 2. Logika ketika tombol "Mengerti" di dalam pop-up diklik
document.getElementById('btn-mengerti-stok').addEventListener('click', () => {
    const modal = document.getElementById('modal-stok');
    if (modal) {
        modal.classList.add('hidden'); // Sembunyikan pop-up kembali
    }
});