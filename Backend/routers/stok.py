from fastapi import APIRouter, HTTPException
from database import get_db_connection

router = APIRouter(prefix="/api/stok", tags=["Stok Masuk"])

# 1. READ: Ambil Riwayat Stok Masuk (JOIN dengan tabel barang agar nama barang muncul)
@router.get("/")
def get_riwayat_stok():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        # Mengambil 50 riwayat terbaru
        query = """
            SELECT s.id_masuk, s.tanggal_masuk, s.qty, s.supplier, b.nama_barang 
            FROM stok_masuk s 
            JOIN barang b ON s.id_barang = b.id_barang 
            ORDER BY s.tanggal_masuk DESC 
            LIMIT 50
        """
        cursor.execute(query)
        result = cursor.fetchall()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# 2. CREATE: Catat Stok Masuk & Tambah Stok di Master Data
@router.post("/")
def catat_stok(id_barang: int, jumlah: int, supplier: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Catat ke tabel stok_masuk
        query_insert = "INSERT INTO stok_masuk (id_barang, tanggal_masuk, qty, supplier) VALUES (%s, NOW(), %s, %s)"
        cursor.execute(query_insert, (id_barang, jumlah, supplier))
        
        # 2. Update stok di tabel barang
        query_update = "UPDATE barang SET stok = stok + %s WHERE id_barang = %s"
        cursor.execute(query_update, (jumlah, id_barang))
        
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Stok berhasil ditambah"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))