from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn 
from database import get_db_connection

# Import router yang sudah kita buat
from routers import barang, stok
from routers import barang, stok, kasir
from routers import barang, stok, kasir, laporan
from routers import barang, stok, kasir, laporan, dashboard
router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


app = FastAPI(
    title="SIM Warung Berkah API",
    description="Backend untuk Sistem Inventaris Warung Sembako",
    version="1.0.0"
)

# [PENTING] CORSMiddleware:
# Agar frontend (HTML/JS) di folder berbeda/port berbeda 
# bisa mengakses API FastAPI tanpa diblokir oleh browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Mengizinkan akses dari semua domain/frontend
    allow_methods=["*"],  # Mengizinkan semua metode (GET, POST, PUT, DELETE)
    allow_headers=["*"],  # Mengizinkan semua header
)

# Registrasi Router (Menambahkan API Barang dan Stok ke aplikasi utama)
app.include_router(barang.router)
app.include_router(stok.router)
app.include_router(kasir.router)
app.include_router(laporan.router)
app.include_router(dashboard.router)


# Rute pengecekan server
@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Selamat datang di API Warung Berkah!",
        "endpoints": ["/api/barang", "/api/stok"]
    }

# Menjalankan aplikasi
if __name__ == "__main__":
    # Server akan berjalan di http://127.0.0.1:8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
    
