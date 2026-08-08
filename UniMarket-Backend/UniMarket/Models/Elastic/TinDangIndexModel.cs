using System;
using System.Collections.Generic;

namespace UniMarket.Models.Elastic
{
    public class TinDangIndexModel
    {
        public int MaTinDang { get; set; }
        public string MaNguoiBan { get; set; } = string.Empty;
        public string TenNguoiBan { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public int MaDanhMuc { get; set; }
        public string TenDanhMuc { get; set; } = string.Empty;
        public string TenDanhMucCha { get; set; } = string.Empty;
        public string TieuDe { get; set; } = string.Empty;
        public string? MoTa { get; set; }
        public decimal Gia { get; set; }
        public bool CoTheThoaThuan { get; set; }
        public string TinhTrang { get; set; } = string.Empty;
        public string DiaChi { get; set; } = string.Empty;
        public int? MaTinhThanh { get; set; }
        public string TenTinhThanh { get; set; } = string.Empty;
        public int? MaQuanHuyen { get; set; }
        public string TenQuanHuyen { get; set; } = string.Empty;
        public DateTime NgayDang { get; set; }
        public DateTime? NgayCapNhat { get; set; }
        public int TrangThai { get; set; }
        public string? VideoUrl { get; set; }
        public int SoLuotXem { get; set; }
        public bool IsDeleted { get; set; }
        public List<string> AnhTinDangs { get; set; } = new();
        public Dictionary<string, object>? ChiTietObj { get; set; }
    }
}
