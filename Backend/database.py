# backend/database.py
import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",      # Sesuaikan user MySQL Anda
        password="",      # Sesuaikan password MySQL Anda
        database="db_warung_berkah"
    )