// File: js/master-data.js

// === VARIABEL GLOBAL UNTUK PAGINATION ===
let semuaDataBarang = [];
let currentPage = 1;
const itemPerHalaman = 10;

document.addEventListener('DOMContentLoaded', function () {
  loadDataBarang();
});

function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
}

// ==========================================
// 1. MENGAMBIL DATA (GET) & MENYIMPAN KE ARRAY
// ==========================================

function gantiLimit() {
  currentPage = 1;
  loadDataBarang();
}

function loadDataBarang() {
  // 1. Ambil nilai dinamis dari komponen input pencarian dan dropdown limit di HTML
  const searchInput = document.getElementById('cari-barang');
  const limitSelect = document.getElementById('limit-data');
  const kategoriSelect = document.getElementById('filter-kategori');

  const search = searchInput ? searchInput.value : '';
  const limit = limitSelect ? limitSelect.value : '10'; // Default 10 jika element tidak ditemukan
  const kategori = (kategoriSelect && kategoriSelect.value !== 'Semua') ? kategoriSelect.value : '';

  // 2. Kirim parameter page, limit, dan search lewat Query String URL ke FastAPI
  const url = `http://127.0.0.1:8000/api/barang/data?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(search)}&kategori=${encodeURIComponent(kategori)}`;

  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error('Jaringan bermasalah atau server mati');
      return response.json();
    })
    .then((res) => {
      // Simpan data potongan ke array global jika diperlukan oleh fungsi lain (seperti fungsi edit)
      semuaDataBarang = res.data;
      semuaDataTotalAsli = res.total;

      // 3. Tampilkan potongan data barang ke tabel HTML
      renderTabel(res.data);

      // 4. Jalankan perhitungan tombol halaman berdasarkan angka total asli (77) dan batasan limit (50)
      renderPagination(res.total, limit);
      hitungNotifikasiGudang()
    })
    .catch((error) => {
      console.error('Error:', error);
      const tbody = document.querySelector('#tabel-barang tbody');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-red-500 font-semibold"><i class="fa-solid fa-triangle-exclamation mr-2"></i> Gagal memuat data dari database.</td></tr>`;
      }
    });
}

// ==========================================
// 2. MENGGAMBAR TABEL (Sesuai Halaman)
// ==========================================
// UBAH: Buat fungsi agar menerima parameter bungkusan data dari loadDataBarang()
function renderTabel(dataBarangDariServer) {
  const tbody = document.querySelector('#tabel-barang tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  // Jika data kosong (tidak ditemukan saat dicari)
  if (!dataBarangDariServer || dataBarangDariServer.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-500 font-medium">Data tidak ditemukan.</td></tr>`;
    return;
  }

  // Loop langsung isi data yang dikirim oleh FastAPI tanpa perlu di-slice lagi
  dataBarangDariServer.forEach((barang) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition group';

    tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-slate-800">${barang.nama_barang}</td>
            <td class="px-6 py-4"><span class="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-semibold">${barang.kategori}</span></td>
            <td class="px-6 py-4 text-slate-600">${formatRupiah(barang.harga_modal)}</td>
            <td class="px-6 py-4 font-semibold text-brand">${formatRupiah(barang.harga_jual)}</td>
            <td class="px-6 py-4 text-center"><span class="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">${barang.stok}</span></td>
            <td class="px-6 py-4 text-center">
                <div class="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="editBarang(${barang.id_barang})" class="text-blue-600 hover:bg-blue-50 p-2 rounded transition" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button onclick="arsipkanBarang(${barang.id_barang})" class="text-red-600 hover:bg-red-50 p-2 rounded transition" title="Hapus"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </td>
        `;
    tbody.appendChild(tr);
  });

  // PENTING: Baris renderPagination(...) di sini dihilangkan karena
  // pemanggilannya sudah dipindah ke fungsi loadDataBarang() agar lebih akurat!
}

// ==========================================
// 3. MENGGAMBAR TOMBOL PAGINATION
// ==========================================
function renderPagination(totalDariFastAPI, limitDropdown) {
  const elemenTampil = document.getElementById('info-tampil');
  const elemenTotal = document.getElementById('info-total');
  const btnContainer = document.getElementById('tombol-pagination');

  const totalData = parseInt(totalDariFastAPI) || 0;
  const itemPerHalaman = parseInt(limitDropdown) || 10;
  // Math.max agar minimal selalu ada 1 halaman, meskipun data kosong
  const totalHalaman = Math.max(Math.ceil(totalData / itemPerHalaman), 1);

  if (elemenTampil) {
    // Rumus otomatis menghitung rentang data, contoh: "1-10", "11-20", atau "1-50"
    const mulaiDari = totalData > 0 ? (currentPage - 1) * itemPerHalaman + 1 : 0;
    const sampaiDengan = Math.min(currentPage * itemPerHalaman, totalData);
    elemenTampil.innerText = `${mulaiDari}-${sampaiDengan}`;
  }
  if (elemenTotal) {
    elemenTotal.innerText = totalData; // Menampilkan total keseluruhan data asli (77)
  }

  if (!btnContainer) return;

  let htmlTombol = '';

  // Tombol Sebelumnya
  if (currentPage > 1) {
    htmlTombol += `<button onclick="gantiHalaman(${currentPage - 1})" class="px-3 py-1 border border-slate-300 rounded bg-white text-slate-600 hover:bg-slate-50 transition shadow-sm">Sebelumnya</button>`;
  } else {
    htmlTombol += `<button disabled class="px-3 py-1 border border-slate-200 rounded bg-slate-50 text-slate-400 cursor-not-allowed shadow-sm">Sebelumnya</button>`;
  }

  // Tombol Angka Halaman
  for (let i = 1; i <= totalHalaman; i++) {
    if (i === currentPage) {
      htmlTombol += `<button class="px-3 py-1 border border-brand bg-brand text-white rounded shadow-sm">${i}</button>`;
    } else {
      htmlTombol += `<button onclick="gantiHalaman(${i})" class="px-3 py-1 border border-slate-300 rounded bg-white text-slate-600 hover:bg-slate-50 transition shadow-sm">${i}</button>`;
    }
  }

  // Tombol Selanjutnya
  if (currentPage < totalHalaman) {
    htmlTombol += `<button onclick="gantiHalaman(${currentPage + 1})" class="px-3 py-1 border border-slate-300 rounded bg-white text-slate-600 hover:bg-slate-50 transition shadow-sm">Selanjutnya</button>`;
  } else {
    htmlTombol += `<button disabled class="px-3 py-1 border border-slate-200 rounded bg-slate-50 text-slate-400 cursor-not-allowed shadow-sm">Selanjutnya</button>`;
  }

  btnContainer.innerHTML = htmlTombol;
}

// Fungsi untuk mengganti halaman, menggunakan parseInt agar angka dihitung dengan benar
function gantiHalaman(halamanBaru) {
  // 1. Update halaman aktif global dengan angka yang diklik user
  currentPage = parseInt(halamanBaru);

  // 2. KUNCI SERVER-SIDE: Ambil data potongan halaman baru dari FastAPI
  loadDataBarang();

  // 3. Ambil nilai limit yang saat ini sedang dipilih di dropdown HTML
  const limitSelect = document.getElementById('limit-data');
  const limit = limitSelect ? limitSelect.value : '10';

  // 4. Panggil kembali fungsi pagination agar CSS memindahkan
  // warna biru 'bg-brand' ke angka halaman yang baru saja diklik
  if (typeof semuaDataTotalAsli !== 'undefined') {
    renderPagination(semuaDataTotalAsli, limit);
  }
}

// ==========================================
// 4. CREATE, UPDATE, DELETE
// ==========================================
// Membuka modal
function tambahBarang() {
  document.getElementById('modal-tambah').classList.remove('hidden');
  document.getElementById('modal-tambah').classList.add('flex');
}

// Menutup modal
function tutupModal() {
  document.getElementById('modal-tambah').classList.add('hidden');
  document.getElementById('modal-tambah').classList.remove('flex');
}

/// ==========================================
// FUNGSI UNTUK MENYIMPAN BARANG BARU (API POST)
// ==========================================
function simpanBarang() {
  // 1. Ambil nilai input dari form modal tambah barang
  const nama = document.getElementById('in-nama').value;
  const kategori = document.getElementById('in-kategori').value;
  const hargaModal = document.getElementById('in-modal').value;
  const hargaJual = document.getElementById('in-jual').value;
  const stok = document.getElementById('in-stok').value;

  function tampilkanToastEditSukses() {
    const toast = document.getElementById('toast-edit-sukses');
    if (!toast) return;

    // 1. Munculkan container wadah
    toast.classList.remove('hidden');
    
    // 2. Jeda mikro untuk memicu efek animasi transisi smooth Tailwind
    setTimeout(() => {
        toast.classList.remove('scale-90', 'opacity-0');
        toast.classList.add('scale-100', 'opacity-100');
    }, 10);

    // 3. Setelah 3 detik, kecilkan dan pudarkan toast otomatis
    setTimeout(() => {
        toast.classList.remove('scale-100', 'opacity-100');
        toast.classList.add('scale-90', 'opacity-0');
        
        // Sembunyikan total setelah animasi menghilang selesai (500ms)
        setTimeout(() => toast.classList.add('hidden'), 500);
    }, 3000);
}

 // 1. Fungsi kontrol untuk Pop-up Validasi Data Kosong
function tampilkanModalValidasi() {
    const modal = document.getElementById('modal-validasi-kosong');
    if (modal) modal.classList.remove('hidden');
}

const tombolMengerti = document.getElementById('btn-mengerti-validasi');
if (tombolMengerti) {
    tombolMengerti.addEventListener('click', () => {
        const modal = document.getElementById('modal-validasi-kosong');
        if (modal) {
            modal.classList.add('hidden'); // Sembunyikan modal saat diklik
        }
    });
}

// 2. PERUBAHAN PADA KODE VALIDASI FORM KAMU:
// Ganti alert() lama kamu dengan memanggil fungsi tampilkanModalValidasi()
if (!nama || !kategori || !hargaModal || !hargaJual || !stok) {
    tampilkanModalValidasi(); // <-- Memanggil pop-up kustom Tailwind
    return; // Tetap hentikan fungsi agar data kosong tidak terkirim via fetch
}

  // 2. Bungkus data ke dalam objek JSON sesuai format yang diminta FastAPI
  const dataBarang = {
    nama_barang: nama,
    kategori: kategori,
    harga_modal: parseInt(hargaModal),
    harga_jual: parseInt(hargaJual),
    stok: parseInt(stok),
  };

  // 3. Kirim data menggunakan metode POST ke API Backend Anda
  fetch('http://127.0.0.1:8000/api/barang/tambah', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dataBarang),
  })
    .then((res) => {
      if (!res.ok) throw new Error('Gagal menyimpan data ke database server.');
      return res.json();
    })
    // ... (KODE FETCH POST DI ATASNYA SUDAH BENAR) ...
    .then((result) => {
      tampilkanToastEditSukses();

      // 1. Panggil ulang data agar tabel otomatis ter-refresh menampilkan barang baru
      if (typeof loadDataBarang === 'function') {
        loadDataBarang();
      }

      // 2. Bersihkan form input agar kembali kosong secara aman
      const formTambah = document.getElementById('form-tambah-barang');
      if (formTambah) {
        formTambah.reset();
      } else {
        // Jika ID 'form-tambah-barang' tidak ditemukan di HTML, kita bersihkan inputnya manual satu per satu
        const inputNama = (document.getElementById('in-nama').value = '');
        if (inputNama) inputNama.value = '';
        const inputKategori = (document.getElementById('in-kategori').value = '');
        if (inputKategori) inputNama.value = '';
        const inputModal = (document.getElementById('in-modal').value = '');
        if (inputModal) inputModal.value = '';
        const inputJual = (document.getElementById('in-jual').value = '');
        if (inputJual) inputJual.value = '';
        const inputStok = (document.getElementById('in-stok').value = '');
        if (inputStok) inputStok.value = '';
      }

      // 3. Tutup pop-up modal secara aman (Sesuaikan dengan nama fungsi penutup modal Anda)
      if (typeof tutupSemuaModal === 'function') {
        tutupSemuaModal();
      } else if (typeof toggleModal === 'function') {
        toggleModal('modal-tambah', false); // Jika nama fungsinya toggleModal
      } else {
        // Cara alternatif langsung menyembunyikan elemen modal lewat ID-nya
        const modal = document.getElementById('modal-tambah'); // Ganti 'modal-tambah' dengan ID container modal Anda
        if (modal) modal.classList.add('hidden');
      }
    })
    .catch((err) => {
      console.error('Error saat menyimpan:', err);
      alert('Gagal menyimpan barang.');
    });
}

// A. FUNGSI UNTUK MEMBUKA POP-UP KEMBAR DI TENGAH LAYAR
function editBarang(id_barang) {
  // Cari data barang lama berdasarkan ID dari array tempat kamu menyimpan hasil fetch data barang
  const barangLama = semuaDataBarang.find((b) => b.id_barang === id_barang);
  if (!barangLama) return alert('Data barang tidak ditemukan!');

  // Tembakkan data lama ke dalam form input modal edit di atas
  document.getElementById('edit-id-barang').value = barangLama.id_barang;
  document.getElementById('edit-nama').value = barangLama.nama_barang;
  document.getElementById('edit-kategori').value = barangLama.kategori;
  document.getElementById('edit-modal').value = barangLama.harga_modal;
  document.getElementById('edit-jual').value = barangLama.harga_jual;
  document.getElementById('edit-stok').value = barangLama.stok;

  // Tampilkan modal tengah layar dengan menghapus class hidden
  const modal = document.getElementById('modal-edit-barang');
  if (modal) modal.classList.remove('hidden');
}

// B. FUNGSI UNTUK MENUTUP POP-UP MODAL EDIT
function tutupModalEditKustom() {
  const modal = document.getElementById('modal-edit-barang');
  if (modal) modal.classList.add('hidden');
}

// C. FUNGSI UNTUK PROSES FETCH PUT KE BACKEND FASTAPI
function prosesSimpanEdit() {
  const id_barang = document.getElementById('edit-id-barang').value;
  const nama = document.getElementById('edit-nama').value;
  const kategori = document.getElementById('edit-kategori').value;
  const modal = document.getElementById('edit-modal').value;
  const jual = document.getElementById('edit-jual').value;
  const stok = document.getElementById('edit-stok').value;

  const url = new URL(`http://127.0.0.1:8000/api/barang/${id_barang}`);
  url.searchParams.append('nama', nama);
  url.searchParams.append('kategori', kategori);
  url.searchParams.append('harga_modal', modal);
  url.searchParams.append('harga_jual', jual);
  url.searchParams.append('stok', stok);

  fetch(url, { method: 'PUT' })
    .then((response) => {
      if (!response.ok) throw new Error('Gagal update database');
      return response.json();
    })
    .then((data) => {
      tutupModalEditKustom(); // Tutup modal tengah
      if (typeof tampilkanToastEdit === 'function') tampilkanToastEdit(); // Munculkan toast sukses melayang
      if (typeof loadDataBarang === 'function') loadDataBarang(); // Refresh tabel data barang
    })
    .catch((err) => alert('Gagal memperbarui data barang.'));
}

// Membuka modal atau alert untuk melihat barang yang is_active = 0
// A. FUNGSI UNTUK MEMBUKA POP-UP KONFIRMASI ARSIP DI TENGAH LAYAR
function arsipkanBarang(id_barang) {
  // Simpan ID barang yang mau diarsip ke dalam input hidden di HTML
  document.getElementById('arsip-id-barang').value = id_barang;

  // Munculkan modal konfirmasi dengan menghapus class hidden
  const modal = document.getElementById('modal-konfirmasi-arsip');
  if (modal) modal.classList.remove('hidden');
}

// B. FUNGSI UNTUK MENUTUP MODAL ARSIP
function tutupModalArsipKustom() {
  const modal = document.getElementById('modal-konfirmasi-arsip');
  if (modal) modal.classList.add('hidden');
}

// C. FUNGSI EKSEKUSI JIKA USER KLIK TOMBOL "YA, ARSIPKAN"
function prosesEksekusiArsip() {
  // Ambil ID barang yang tadi disimpan sementara
  const id_barang = document.getElementById('arsip-id-barang').value;

  fetch(`http://127.0.0.1:8000/api/barang/nonaktifkan/${id_barang}`, {
    method: 'PUT'
  })
    .then((response) => {
      if (!response.ok) throw new Error('Gagal mengarsipkan barang');
      return response.json();
    })
    .then((data) => {
      tutupModalArsipKustom(); // Tutup modal tengah

      // Panggil toast sukses warna slate melayang di pojok layar
      if (typeof tampilkanToastArsip === 'function') tampilkanToastArsip();

      if (typeof loadDataBarang === 'function') loadDataBarang(); // Refresh tabel master barang
    })
    .catch((err) => {
      console.error(err);
      alert('Terjadi kesalahan saat mengarsipkan barang.');
    });
}

// Membuka modal arsip
function bukaArsip() {
  document.getElementById('modal-arsip').classList.remove('hidden');
  document.getElementById('modal-arsip').classList.add('flex');

  // Ambil data dari API
  fetch('http://127.0.0.1:8000/api/barang/nonaktif')
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.getElementById('tabel-arsip-body');
      tbody.innerHTML = '';

      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center p-4">Tidak ada barang di arsip.</td></tr>';
        return;
      }

      data.forEach((b) => {
        tbody.innerHTML += `
                    <tr>
                        <td class="p-3">${b.nama_barang}</td>
                        <td class="p-3"><span class="bg-slate-100 px-2 py-1 rounded text-xs">${b.kategori}</span></td>
                        <td class="p-3 text-center">
                            <button onclick="aktifkanBarang(${b.id_barang})" class="text-green-600 hover:text-green-800 font-bold">
                                <i class="fa-solid fa-rotate-left"></i> Aktifkan
                            </button>
                        </td>
                    </tr>
                `;
      });
    });
}

// Menutup modal arsip
function tutupArsip() {
  document.getElementById('modal-arsip').classList.add('hidden');
  document.getElementById('modal-arsip').classList.remove('flex');
}

// Fungsi untuk mengaktifkan kembali
// 1. Sediakan variabel global di paling atas untuk menampung ID barang sementara
let idBarangAkanAktif = null;

// 2. INI FUNGSI KAMU YANG BARU (Menggantikan fungsi lhamu)
function aktifkanBarang(id_barang) {
  idBarangAkanAktif = id_barang; // Simpan ID barang yang dipilih

  // Munculkan modal konfirmasi kustom kita
  const modal = document.getElementById('modal-konfirmasi');
  if (modal) {
    modal.classList.remove('hidden');
  }


  // 3. LOGIKA KETIKA TOMBOL "BATAL" DI MODAL DIKLIK
  document.getElementById('btn-batal-aktifkan').addEventListener('click', () => {
    const modal = document.getElementById('modal-konfirmasi');
    if (modal) modal.classList.add('hidden'); // Sembunyikan modal
    idBarangAkanAktif = null; // Reset ID barang
  });

  // 4. LOGIKA KETIKA TOMBOL "YA, AKTIFKAN" DI MODAL DIKLIK (Pindahan isi fetch lhamu)
  document.getElementById('btn-ya-aktifkan').addEventListener('click', () => {
    if (!idBarangAkanAktif) return;

    // Jalankan fetch dengan ID barang yang tersimpan
    fetch(`http://127.0.0.1:8000/api/barang/aktifkan/${idBarangAkanAktif}`, {
      method: 'PUT'
    })
      .then(response => {
        if (!response.ok) throw new Error('Gagal mengaktifkan');

        // Sembunyikan modal konfirmasi kustom
        document.getElementById('modal-konfirmasi').classList.add('hidden');

        // Jalankan fungsi bawaan tokomu yang ada di fungsi lhamu tadi
        tutupArsip();
        loadDataBarang(); // Refresh tabel utama katalog

        tampilkanToastAktif();

        idBarangAkanAktif = null; // Reset ID barang setelah sukses
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Gagal memproses pengaktifan barang.');
      });
  });
}

// Tambahkan fungsi ini di js/master-data.js
function filterData() {
  // 1. Setiap kali user mengetik atau mengubah kategori, reset halaman ke halaman 1
  currentPage = 1;

  // 2. Langsung panggil fungsi loadDataBarang() agar backend FastAPI mencari ke SELURUH database
  loadDataBarang();
}

// Panggil fungsi ini saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
  loadKategori();
  loadDataBarang();
});

function loadKategori() {
  fetch('http://127.0.0.1:8000/api/barang/kategori')
    .then((res) => res.json())
    .then((data) => {
      const select = document.getElementById('filter-kategori');
      // Kosongkan dulu lalu tambahkan opsi "Semua"
      select.innerHTML = '<option value="Semua">Semua Kategori</option>';

      // Loop data dari database
      data.forEach((kat) => {
        const opt = document.createElement('option');
        opt.value = kat;
        opt.innerHTML = kat;
        select.appendChild(opt);
      });
    });
}

// ==========================================
// FUNGSI ANIMASI TOAST EDIT SUKSES
// ==========================================
function tampilkanToastEdit() {
  const toast = document.getElementById('toast-barang-edit');
  if (!toast) return;

  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.remove('scale-90', 'opacity-0');
    toast.classList.add('scale-100', 'opacity-100');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('scale-100', 'opacity-100');
    toast.classList.add('scale-90', 'opacity-0');
    setTimeout(() => toast.classList.add('hidden'), 500);
  }, 3000);
}

// ==========================================
// FUNGSI ANIMASI TOAST ARSIP SUKSES
// ==========================================
function tampilkanToastArsip() {
  const toast = document.getElementById('toast-barang-arsip');
  if (!toast) return;

  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.remove('scale-90', 'opacity-0');
    toast.classList.add('scale-100', 'opacity-100');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('scale-100', 'opacity-100');
    toast.classList.add('scale-90', 'opacity-0');
    setTimeout(() => toast.classList.add('hidden'), 500);
  }, 3000);
}


function tampilkanToastAktif() {
    const toast = document.getElementById('toast-barang-aktif');
    if (!toast) return;

    // 1. Munculkan wadah (hilangkan hidden)
    toast.classList.remove('hidden');
    
    // 2. Beri jeda mikro untuk memicu efek animasi Tailwind (smooth transition)
    setTimeout(() => {
        toast.classList.remove('scale-90', 'opacity-0');
        toast.classList.add('scale-100', 'opacity-100');
    }, 10);

    // 3. Setelah 3 detik, jalankan animasi mengecil dan menghilang
    setTimeout(() => {
        toast.classList.remove('scale-100', 'opacity-100');
        toast.classList.add('scale-90', 'opacity-0');
        
        // Setelah animasi hilang selesai (500ms), sembunyikan total elemennya
        setTimeout(() => toast.classList.add('hidden'), 500);
    }, 3000);
}

// ==========================================
// LOGIKA FITUR LONCENG NOTIFIKASI DROPDOWN
// ==========================================

// 1. Fungsi Buka-Tutup (Toggle) Dropdown Lonceng
function toggleNotifikasi() {
  const dropdown = document.getElementById('dropdown-notif');
  if (!dropdown) return;

  dropdown.classList.toggle('hidden');

  // Opsional: Hilangkan badge merah saat user sudah mengklik/melihat notifikasi
  const badge = document.getElementById('badge-notif');
  if (badge) badge.classList.add('hidden');
}

// 2. Fungsi Otomatis Mengecek Kesehatan Stok Gudang
function hitungNotifikasiGudang() {
  const listKonten = document.getElementById('konten-notif-list');
  const badge = document.getElementById('badge-notif');
  const teksJumlah = document.getElementById('jumlah-notif-teks');

  if (!listKonten || !semuaDataBarang) return;

  // Filter barang aktif yang stoknya kritis (misal kurang dari atau sama dengan 10)
  const barangKritis = semuaDataBarang.filter(b => b.is_active === 1 && b.stok <= 10);

  listKonten.innerHTML = '';

  if (barangKritis.length === 0) {
    teksJumlah.innerText = "0 Baru";
    listKonten.innerHTML = `
            <div class="p-6 text-center text-slate-400">
                <i class="fa-solid fa-bell-slash text-lg mb-1 block text-slate-300"></i>
                <p class="text-xs">Gudang aman! Tidak ada stok kritis.</p>
            </div>
        `;
    if (badge) badge.classList.add('hidden');
    return;
  }

  // Update Angka Badge Jumlah Notif
  teksJumlah.innerText = `${barangKritis.length} Baru`;
  if (badge) badge.classList.remove('hidden'); // Munculkan bulatan merah berkedip

  // Render data barang kritis ke dalam baris dropdown list
  barangKritis.forEach(barang => {
    const itemDiv = document.createElement('div');
    itemDiv.className = "p-3.5 hover:bg-slate-50 flex gap-3 items-start transition";

    // Tentukan warna ikon berdasarkan tingkat keparahan stok
    const warnaIkon = barang.stok === 0 ? 'text-red-500 bg-red-50' : 'text-amber-500 bg-amber-50';
    const pesanStok = barang.stok === 0 ? 'Stok Habis Total!' : `Stok kritis sisa ${barang.stok} lagi!`;

    itemDiv.innerHTML = `
            <div class="w-8 h-8 rounded-full ${warnaIkon} flex items-center justify-center text-xs shrink-0 font-bold">
                ${barang.stok}
            </div>
            <div class="flex-1 min-w-0">
                <h5 class="text-xs font-semibold text-slate-800 truncate">${barang.nama_barang}</h5>
                <p class="text-[11px] ${barang.stok === 0 ? 'text-red-600' : 'text-amber-600'} font-medium mt-0.5">${pesanStok}</p>
                <span class="text-[9px] text-slate-400 block mt-1">Kategori: ${barang.kategori || '-'}</span>
            </div>
        `;
    listKonten.appendChild(itemDiv);
  });
}

// 3. Menutup dropdown secara otomatis jika user mengklik area di luar lonceng
window.addEventListener('click', function (e) {
  const dropdown = document.getElementById('dropdown-notif');
  const loncengButton = document.querySelector('button[onclick="toggleNotifikasi()"]');

  if (dropdown && !dropdown.contains(e.target) && loncengButton && !loncengButton.contains(e.target)) {
    dropdown.classList.add('hidden');
  }
});