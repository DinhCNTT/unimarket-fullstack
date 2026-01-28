#!/bin/bash
# File: database/install-mongo.sh

echo "⏳ [1/2] Dang doi MongoDB khoi dong (10s)..."
sleep 10

echo "🚀 [2/2] Bat dau nap du lieu cho MongoDB..."

# Lệnh khôi phục từ thư mục dump
mongorestore --host mongodb --drop /mongo-dump

echo "✅ DA NAP THANH CONG MONGO DB!"