from fastapi import APIRouter, HTTPException
from database import get_db_connection
from datetime import date
from typing import Optional

router = APIRouter(prefix="/api/laporan", tags=["Laporan Keuangan"])

# 1. Mengambil Ringkasan (Total Pendapatan & Laba)
@router.get("/ringkasan")
def get_ringkasan(tgl_mulai: str = "", tgl_selesai: str = ""):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT 
                COUNT(id_transaksi) as total_transaksi,
                SUM(total_bayar) as total_pendapatan,
                SUM(estimasi_laba) as total_laba
            FROM transaksi
            WHERE 1=1
        """
        params = []
        
        if tgl_mulai and tgl_selesai:
            query += " AND DATE(tanggal_transaksi) BETWEEN %s AND %s"
            params.append(tgl_mulai)
            params.append(tgl_selesai)
        
        cursor.execute(query, tuple(params))
        result = cursor.fetchone()
        
        # Mencegah error jika belum ada transaksi sama sekali (hasilnya NULL)
        if result['total_pendapatan'] is None:
            result = {'total_transaksi': 0, 'total_pendapatan': 0, 'total_laba': 0}
            
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 2. Mengambil Daftar Riwayat Transaksi (Struk)
# @router.get("/riwayat")
# def get_riwayat_transaksi():
#     try:
#         conn = get_db_connection()
#         cursor = conn.cursor(dictionary=True)
        
#         query = """
#             SELECT no_struk, tanggal_transaksi, total_bayar, estimasi_laba 
#             FROM transaksi 
#             ORDER BY tanggal_transaksi DESC
#         """
#         cursor.execute(query)
#         result = cursor.fetchall()
        
#         cursor.close()
#         conn.close()
#         return result
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/riwayat")
def get_laporan_keuangan(
       tgl_mulai: str = "", tgl_selesai: str = ""
    ):
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 1. Query dasar (Asumsi nama tabel transaksi kamu adalah 'transaksi')
        query = "SELECT * FROM transaksi WHERE 1=1"
        params = []
        
        # 2. Ambil data berdasarkan rentang tanggal jika parameter dikirim dari JS
        # Menggunakan DATE() agar aman meskipun kolom di MySQL bertipe DATETIME (ada jamnya)
        if tgl_mulai and tgl_selesai:
            query += " AND DATE(tanggal_transaksi) BETWEEN %s AND %s"
            params.append(tgl_mulai)
            params.append(tgl_selesai)
            
        # Urutkan dari transaksi terbaru
        query += " ORDER BY tanggal_transaksi DESC"
        
        cursor.execute(query, tuple(params))
        data_laporan = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return data_laporan