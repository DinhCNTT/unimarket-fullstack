USE master;
GO

-- 1. Ngắt kết nối để tránh lỗi "Database in use"
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'UniMarket5')
BEGIN
    ALTER DATABASE UniMarket5 SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE UniMarket5;
END

-- 2. Khôi phục từ file backup
RESTORE DATABASE UniMarket5
FROM DISK = '/tmp/unimarket.bak'
WITH 
    -- 👇 QUAN TRỌNG: Hai dòng dưới này định nghĩa tên file trong ruột SQL
    -- Mình giữ nguyên mặc định, 90% sẽ chạy đúng
    MOVE 'UniMarket5' TO '/var/opt/mssql/data/UniMarket5.mdf',
    MOVE 'UniMarket5_log' TO '/var/opt/mssql/data/UniMarket5_log.ldf',
    REPLACE;
GO