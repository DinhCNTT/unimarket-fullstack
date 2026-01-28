# 🏪 UniMarket - Full-Stack E-Commerce Platform

> **Nền tảng thương mại điện tử cho sinh viên** - Mua bán, trao đổi đồ cũ trong cộng đồng trường học

![Tech Stack](https://img.shields.io/badge/React-18.x-blue?logo=react)
![.NET](https://img.shields.io/badge/.NET-9.0-purple?logo=dotnet)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)
![SQL Server](https://img.shields.io/badge/SQL%20Server-2022-red?logo=microsoftsqlserver)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green?logo=mongodb)

---

## 📋 Mục lục

- [Tính năng chính](#-tính-năng-chính)
- [Tech Stack](#-tech-stack)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt & Chạy dự án](#-cài-đặt--chạy-dự-án)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [API Endpoints](#-api-endpoints)
- [Screenshots](#-screenshots)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Tính năng chính

- 🛒 **Marketplace**: Đăng tin mua/bán đồ cũ với hình ảnh, giá cả, mô tả chi tiết
- 💬 **Chat realtime**: Trao đổi trực tiếp giữa người mua và người bán
- 🔍 **Tìm kiếm & Lọc**: Tìm kiếm sản phẩm theo danh mục, giá, khu vực
- 👤 **Quản lý tài khoản**: Đăng ký, đăng nhập, profile cá nhân
- 📊 **Dashboard**: Quản lý tin đăng, lịch sử giao dịch
- 🔐 **Xác thực JWT**: Bảo mật với JSON Web Token

---

## 🛠 Tech Stack

### **Frontend**
- **Framework**: React 18.x + Vite
- **UI Library**: Ant Design
- **State Management**: Redux Toolkit
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Web Server**: Nginx (trong Docker)

### **Backend**
- **Framework**: ASP.NET Core 9.0
- **Architecture**: Clean Architecture + Repository Pattern
- **Authentication**: JWT Bearer Token
- **ORM**: Entity Framework Core
- **API Documentation**: Swagger/OpenAPI

### **Database**
- **SQL Server 2022**: Dữ liệu chính (Users, Products, Orders)
- **MongoDB**: Chat messages, logs

### **DevOps**
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Database Seeding**: Auto-restore từ backup

---

## 💻 Yêu cầu hệ thống

Trước khi bắt đầu, đảm bảo máy tính của bạn đã cài đặt:

| Tool | Version | Download |
|------|---------|----------|
| **Docker Desktop** | Latest | [Download](https://www.docker.com/products/docker-desktop/) |
| **Git** | 2.x+ | [Download](https://git-scm.com/downloads) |

> **Lưu ý**: Bạn **KHÔNG CẦN** cài Node.js, .NET SDK, SQL Server hay MongoDB. Mọi thứ đều chạy trong Docker! 🐳

---

## 🚀 Cài đặt & Chạy dự án

### **Bước 1: Clone repository**

```bash
git clone https://github.com/your-username/unimarket-fullstack.git
cd unimarket-fullstack
```

### **Bước 2: Khởi động Docker Desktop**

- **Windows/Mac**: Mở ứng dụng Docker Desktop
- **Linux**: `sudo systemctl start docker`

### **Bước 3: Chạy toàn bộ ứng dụng**

```bash
docker-compose up --build
```

> **Lần đầu chạy** sẽ mất khoảng 3-5 phút để tải images và build. Các lần sau chỉ mất ~30 giây.

### **Bước 4: Truy cập ứng dụng**

Sau khi thấy log `✅ Application started`, mở trình duyệt:

| Service | URL | Mô tả |
|---------|-----|-------|
| **Frontend** | http://localhost:3000 | Giao diện web chính |
| **Backend API** | http://localhost:5133 | REST API |
| **Swagger UI** | http://localhost:5133/swagger | API Documentation |
| **SQL Server** | `localhost:1433` | User: `sa` / Pass: `StrongPassword123!` |
| **MongoDB** | `localhost:27017` | No authentication |

### **Bước 5: Đăng nhập thử nghiệm**

Hệ thống đã có sẵn tài khoản demo:

```
Email: demo@unimarket.com
Password: Demo123!
```

---

## 📁 Cấu trúc dự án

```
unimarket-fullstack/
├── unimarket/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── redux/               # Redux store & slices
│   │   ├── services/            # API calls
│   │   └── App.jsx              # Root component
│   ├── Dockerfile               # Multi-stage build
│   ├── nginx.conf               # Nginx config
│   └── package.json
│
├── UniMarket-Backend/           # Backend (.NET 9.0)
│   └── UniMarket/
│       ├── Controllers/         # API Controllers
│       ├── Models/              # Entities
│       ├── Services/            # Business logic
│       ├── Data/                # DbContext
│       ├── Dockerfile           # Multi-stage build
│       └── Program.cs           # Entry point
│
├── database/                    # Database seeds
│   ├── unimarket.bak           # SQL Server backup
│   ├── mongo-dump/             # MongoDB dump
│   ├── restore.sql             # Restore script
│   └── install.sh              # Auto-seeder
│
├── docker-compose.yml          # Orchestration
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

---

## 🔌 API Endpoints

### **Authentication**
```
POST   /api/auth/register      # Đăng ký tài khoản mới
POST   /api/auth/login         # Đăng nhập
POST   /api/auth/refresh       # Refresh token
```

### **Products**
```
GET    /api/products           # Lấy danh sách sản phẩm
GET    /api/products/{id}      # Chi tiết sản phẩm
POST   /api/products           # Tạo sản phẩm mới (Auth required)
PUT    /api/products/{id}      # Cập nhật sản phẩm (Auth required)
DELETE /api/products/{id}      # Xóa sản phẩm (Auth required)
```

### **Chat**
```
GET    /api/chat/conversations  # Lấy danh sách cuộc trò chuyện
GET    /api/chat/messages/{id}  # Lấy tin nhắn
POST   /api/chat/send           # Gửi tin nhắn
```

> Xem đầy đủ API docs tại: http://localhost:5133/swagger

---

## 📸 Screenshots

*(Thêm screenshots của ứng dụng tại đây)*

---

## 🐛 Troubleshooting

### **Lỗi: Port đã bị chiếm**
```bash
Error: bind: address already in use
```
**Giải pháp**: Đổi port trong `docker-compose.yml`:
```yaml
ports:
  - "3001:80"  # Đổi 3000 → 3001
```

### **Lỗi: Database không restore được**
```bash
# Xem log của sql-seeder
docker-compose logs sql-seeder

# Restart database
docker-compose restart sqlserver
```

### **Lỗi: Frontend không kết nối được Backend**
Kiểm tra biến môi trường trong `docker-compose.yml`:
```yaml
args:
  VITE_API_URL: http://localhost:5133  # Đảm bảo đúng port
```

### **Reset toàn bộ dự án**
```bash
# Tắt và xóa tất cả containers + volumes
docker-compose down -v

# Xóa images (nếu cần)
docker-compose down --rmi all

# Chạy lại từ đầu
docker-compose up --build
```

---

## 📝 Lệnh Docker hữu ích

```bash
# Chạy ở chế độ nền (không chiếm terminal)
docker-compose up -d

# Xem logs realtime
docker-compose logs -f

# Xem logs của 1 service
docker-compose logs backend
docker-compose logs frontend

# Tắt dự án (giữ lại data)
docker-compose down

# Restart 1 service cụ thể
docker-compose restart backend

# Xem trạng thái containers
docker-compose ps

# Vào terminal của container
docker exec -it unimarket_backend bash
docker exec -it unimarket_frontend sh
```

---

## 🤝 Contributing

Nếu bạn muốn đóng góp cho dự án:

1. Fork repository này
2. Tạo branch mới: `git checkout -b feature/ten-tinh-nang`
3. Commit thay đổi: `git commit -m 'Thêm tính năng X'`
4. Push lên branch: `git push origin feature/ten-tinh-nang`
5. Tạo Pull Request

---

## 📄 License

Dự án này được phát hành dưới giấy phép **MIT License**.

---

## 👨‍💻 Author

**[Đoàn Tuệ Định]**  
📧 Email: dinhcm123321@gmail.com
🔗 GitHub: https://github.com/DinhCNTT

---

## ⭐ Support

Nếu bạn thấy dự án này hữu ích, hãy cho mình 1 ⭐ trên GitHub nhé! 🙏

---

<div align="center">
Made with ❤️ by Đoàn Tuệ Định
</div>
