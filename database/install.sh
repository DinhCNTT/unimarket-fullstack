#!/bin/bash
# File: database/install.sh

echo "⏳ [1/3] Dang doi SQL Server khoi dong (30s)..."
sleep 30

echo "🚀 [2/3] Bat dau ket noi va nap du lieu..."

# Chạy lệnh SQLCMD (đường dẫn chuẩn 2022)
/opt/mssql-tools18/bin/sqlcmd -S sqlserver -U sa -P StrongPassword123! -C -i /tmp/restore.sql

echo "✅ [3/3] DA NAP THANH CONG! (Kiem tra dong 'Processed' o tren)"