@echo off
echo ==========================================
echo   CAP NHAT DU LIEU TU MAY CUA BAN VAO DU AN
echo ==========================================

:: 1. Nhắc nhở SQL Server
echo [BUOC 1] Voi SQL Server:
echo Ban hay tu Backup thu cong bang SSMS ra file 'unimarket.bak'
echo Roi chep de vao thu muc 'database' nhe!
echo.
pause

:: 2. Tự động cập nhật Mongo
echo [BUOC 2] Dang tu dong hut du lieu MongoDB moi nhat...
rmdir /s /q "database\mongo-dump"
docker run --rm --add-host host.docker.internal:host-gateway -v %cd%/database:/backup mongo mongodump --uri="mongodb://host.docker.internal:27017/UniMarketMongoDB" --out /backup/mongo-dump

echo.
echo ==========================================
echo   XONG! DU LIEU MOI DA SAN SANG.
echo   Hay chay 'docker-compose down -v' roi 'up' lai de ap dung.
echo ==========================================
pause