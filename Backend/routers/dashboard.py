from fastapi import APIRouter, HTTPException
from database import get_db_connection

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Utama"])

# 1. Mengambil data barang yang hampir habis (Stok <= 10)
@router.get("/stok-menipis")
def get_stok_menipis():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Mengambil barang yang stoknya tipis DAN hanya yang masih aktif (is_active = 1)
        query = """
            SELECT id_barang, nama_barang, kategori, stok 
            FROM barang 
            WHERE stok <= 10 AND is_active = 1
            ORDER BY stok ASC 
            LIMIT 5
        """
        
        cursor.execute(query)
        result = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return result 
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 2. Mengambil ringkasan aktivitas KHUSUS hari ini
@router.get("/ringkasan-hari-ini")
def get_ringkasan_hari_ini():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Gunakan CURDATE() di MySQL untuk memfilter hanya transaksi hari ini
        query = """
            SELECT 
                COUNT(id_transaksi) as total_transaksi,
                SUM(total_bayar) as pendapatan_hari_ini
            FROM transaksi 
            WHERE DATE(tanggal_transaksi) = CURDATE()
        """
        cursor.execute(query)
        result = cursor.fetchone()
        
        # Jika hari ini belum ada pembeli sama sekali, kembalikan nilai 0
        if result['pendapatan_hari_ini'] is None:
            result = {'total_transaksi': 0, 'pendapatan_hari_ini': 0}
            
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))