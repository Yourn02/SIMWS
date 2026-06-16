from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from database import get_db_connection
import datetime

router = APIRouter(prefix="/api/kasir", tags=["Modul Kasir"])

# Menyiapkan kerangka data (Model) yang akan dikirim dari JavaScript
class ItemBelanja(BaseModel):
    id_barang: int
    qty: int
    harga_modal: int
    harga_jual: int
    subtotal: int

class RequestBayar(BaseModel):
    subtotal: int
    diskon: int
    total_bayar: int
    items: List[ItemBelanja]

@router.post("/bayar")
def proses_pembayaran(data: RequestBayar):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Hitung Estimasi Laba secara otomatis di Backend
        estimasi_laba = 0
        for item in data.items:
            laba_per_item = (item.harga_jual - item.harga_modal) * item.qty
            estimasi_laba += laba_per_item
        
        # Buat nomor struk otomatis berdasarkan waktu saat ini
        waktu_sekarang = datetime.datetime.now()
        no_struk = "TRX-" + waktu_sekarang.strftime("%Y%m%d-%H%M%S")
        
        # 2. Simpan ke tabel Induk (transaksi)
        query_transaksi = """
            INSERT INTO transaksi (no_struk, tanggal_transaksi, subtotal, diskon, total_bayar, estimasi_laba)
            VALUES (%s, NOW(), %s, %s, %s, %s)
        """
        cursor.execute(query_transaksi, (no_struk, data.subtotal, data.diskon, data.total_bayar, estimasi_laba))
        
        # Dapatkan ID Transaksi yang baru saja dibuat oleh MySQL
        id_transaksi = cursor.lastrowid 
        
        # 3. Looping: Simpan ke detail_transaksi & Potong Stok Master
        query_detail = """
            INSERT INTO detail_transaksi (id_transaksi, id_barang, qty, harga_modal_satuan, harga_jual_satuan, subtotal)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        query_potong_stok = "UPDATE barang SET stok = stok - %s WHERE id_barang = %s"
        
        for item in data.items:
            # Insert setiap barang ke detail
            cursor.execute(query_detail, (id_transaksi, item.id_barang, item.qty, item.harga_modal, item.harga_jual, item.subtotal))
            # Kurangi fisik stok barang di gudang
            cursor.execute(query_potong_stok, (item.qty, item.id_barang))
        
        # 4. Kunci transaksi (Commit) jika semuanya sukses tanpa error
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"message": "Pembayaran berhasil diproses!", "no_struk": no_struk}
        
    except Exception as e:
        # Jika terjadi error di tengah jalan, database tidak akan menyimpan data yang setengah-setengah
        raise HTTPException(status_code=500, detail=str(e))