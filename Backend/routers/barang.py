from fastapi import APIRouter, HTTPException
from database import get_db_connection
from pydantic import BaseModel
from fastapi import HTTPException

router = APIRouter(prefix="/api/barang", tags=["Master Data Barang"])

# 1. READ: Ambil semua barang dari database MySQL
@router.get("/")
def get_semua_barang():
    try:
        conn = get_db_connection()
        # dictionary=True agar output berupa JSON dengan nama kolom
        cursor = conn.cursor(dictionary=True) 
        
        # Gunakan query yang menyaring barang aktif saja
        query = "SELECT * FROM barang WHERE is_active = 1"
        cursor.execute(query)
        
        result = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return result
    except Exception as e:
        # Jika terjadi error, kirim pesan error yang jelas
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# 2. CREATE: Tambah barang baru ke MySQL
# 1. Buat Skema/Wadah Data di atas fungsi agar FastAPI bisa membaca JSON dari JS
class BarangBaru(BaseModel):
    nama_barang: str
    kategori: str
    harga_modal: int
    harga_jual: int
    stok: int

# 2. Ubah rute menjadi "/tambah" agar cocok dengan fetch('.../tambah') di JS
@router.post("/tambah")
def tambah_barang(barang: BarangBaru): # Data dimasukkan ke dalam wadah BarangBaru
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Tambahkan is_active = 1 secara otomatis agar barang langsung aktif/muncul di halaman master
        query = """
            INSERT INTO barang (nama_barang, kategori, harga_modal, harga_jual, stok, is_active) 
            VALUES (%s, %s, %s, %s, %s, 1)
        """
        
        # Mengambil data dari wadah bungkusan JSON (barang.nama_barang, dst)
        cursor.execute(query, (
            barang.nama_barang, 
            barang.kategori, 
            barang.harga_modal, 
            barang.harga_jual, 
            barang.stok
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"status": "success", "message": "Berhasil tambah barang"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# 3. UPDATE: Edit data barang (PUT)
@router.put("/{id_barang}")
def edit_barang(id_barang: int, nama: str, kategori: str, harga_modal: int, harga_jual: int, stok: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "UPDATE barang SET nama_barang=%s, kategori=%s, harga_modal=%s, harga_jual=%s, stok=%s WHERE id_barang=%s"
        cursor.execute(query, (nama, kategori, harga_modal, harga_jual, stok, id_barang))
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Berhasil update barang"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# 4. DELETE: Hapus data barang
# Ganti fungsi hapus_barang Anda dengan ini:
@router.put("/nonaktifkan/{id_barang}")
def nonaktifkan_barang(id_barang: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Mengubah is_active menjadi 0
        query = "UPDATE barang SET is_active = 0 WHERE id_barang=%s"
        cursor.execute(query, (id_barang,))
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Barang berhasil dinonaktifkan"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nonaktif")
def get_barang_nonaktif():
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        # Ambil barang yang is_active = 0
        cursor.execute("SELECT * FROM barang WHERE is_active = 0")
        result = cursor.fetchall()
        cursor.close()
        conn.close()
        return result

@router.put("/aktifkan/{id_barang}")
def aktifkan_barang(id_barang: int):
        conn = get_db_connection()
        cursor = conn.cursor()
        # Mengembalikan status aktif ke 1
        cursor.execute("UPDATE barang SET is_active = 1 WHERE id_barang=%s", (id_barang,))
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Barang berhasil diaktifkan kembali"}
    
@router.get("/kategori")
def get_kategori():
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        # DISTINCT mengambil kategori yang unik saja (tidak dobel)
        cursor.execute("SELECT DISTINCT kategori FROM barang WHERE is_active = 1")
        result = cursor.fetchall()
        cursor.close()
        conn.close()
        # Mengubah format menjadi list biasa: ['Sembako', 'Makanan', ...]
        return [item['kategori'] for item in result]
    
@router.get("/data")
def get_barang_paginated(page: int = 1, limit: int = 10, search: str = "", kategori: str = ""):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # PAKSA convert ke Integer untuk menghindari bug MySQL
    safe_limit = int(limit)
    safe_offset = int((page - 1) * safe_limit)
    
    # 1. Bangun Query SQL Dasar secara dinamis menggunakan List
    # Kita mulai dengan kondisi dasar: hanya barang aktif
    query_conditions = ["is_active = 1"]
    params_total = []

    # 2. Tambahkan kondisi pencarian NAMA jika ada input dari user
    if search:
        query_conditions.append("nama_barang LIKE %s")
        params_total.append(f"%{search}%")

    # 3. KUNCI UTAMA: Tambahkan kondisi KATEGORI jika user memilih selain "Semua"
    if kategori and kategori != "Semua":
        query_conditions.append("kategori = %s")
        params_total.append(kategori)

    # 4. Satukan semua kondisi di atas menggunakan kata kunci "AND"
    where_clause = " WHERE " + " AND ".join(query_conditions)

    # 5. Gabungkan menjadi Query Data Utuh (Lengkap dengan LIMIT & OFFSET)
    query = f"SELECT * FROM barang {where_clause} LIMIT %s OFFSET %s"
    
    # Masukkan parameter total + parameter limit & offset ke dalam query data
    params_data = params_total.copy()
    params_data.append(safe_limit)
    params_data.append(safe_offset)

    # Eksekusi Query Ambil Data Barang
    cursor.execute(query, tuple(params_data))
    data = cursor.fetchall()
    
    # 6. Gabungkan menjadi Query Hitung Total Halaman
    count_query = f"SELECT COUNT(*) as total FROM barang {where_clause}"
    
    # Eksekusi Query Hitung Total
    cursor.execute(count_query, tuple(params_total))
    total = cursor.fetchone()['total']
    
    cursor.close()
    conn.close()
    
    return {"data": data, "total": total}