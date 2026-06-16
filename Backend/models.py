from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Barang(Base):
    __tablename__ = "barang"

    id_barang = Column(Integer, primary_key=True, index=True)
    barcode = Column(String(50), unique=True, index=True)
    nama_barang = Column(String(100), nullable=False)
    kategori = Column(Enum('Sembako', 'Makanan', 'Minuman', 'Kebutuhan'), nullable=False)
    harga_modal = Column(Integer, nullable=False)
    harga_jual = Column(Integer, nullable=False)
    stok = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())

class StokMasuk(Base):
    __tablename__ = "stok_masuk"

    id_masuk = Column(Integer, primary_key=True, index=True)
    id_barang = Column(Integer, ForeignKey("barang.id_barang"))
    tanggal_masuk = Column(DateTime, default=func.now())
    qty = Column(Integer, nullable=False)
    supplier = Column(String(100))

class Transaksi(Base):
    __tablename__ = "transaksi"

    id_transaksi = Column(Integer, primary_key=True, index=True)
    no_struk = Column(String(50), unique=True, nullable=False)
    tanggal_transaksi = Column(DateTime, default=func.now())
    subtotal = Column(Integer, nullable=False)
    diskon = Column(Integer, default=0)
    total_bayar = Column(Integer, nullable=False)
    estimasi_laba = Column(Integer, nullable=False)