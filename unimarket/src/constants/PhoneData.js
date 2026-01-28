// ============================================================================
// DỮ LIỆU CẤU HÌNH ĐIỆN THOẠI DÙNG CHUNG (CHO CẢ FILTER VÀ FORM ĐĂNG TIN)
// ============================================================================

export const PHONE_DATA = {
  "Apple": {
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
    models: [
      "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
      "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
      "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
      "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13 mini", "iPhone 13",
      "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12 mini", "iPhone 12",
      "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
      "iPhone XS Max", "iPhone XS", "iPhone XR", "iPhone X",
      "iPhone SE 2022 (Gen 3)", "iPhone SE 2020 (Gen 2)",
      "Khác"
    ]
  },
  "Samsung": {
    logo: "https://cdn.chotot.com/admincentre/5010_samsung.png", // <--- Đã thay link mới
    models: [
      "Galaxy S24 Ultra", "Galaxy S24 Plus", "Galaxy S24", "Galaxy S23 FE",
      "Galaxy S23 Ultra", "Galaxy S23 Plus", "Galaxy S23",
      "Galaxy S22 Ultra", "Galaxy S22 Plus", "Galaxy S22",
      "Galaxy S21 Ultra", "Galaxy S21 Plus", "Galaxy S21", "Galaxy S21 FE",
      "Galaxy S20 Ultra", "Galaxy S20 Plus", "Galaxy S20", "Galaxy S20 FE",
      "Galaxy Z Fold6", "Galaxy Z Flip6",
      "Galaxy Z Fold5", "Galaxy Z Flip5",
      "Galaxy Z Fold4", "Galaxy Z Flip4",
      "Galaxy Z Fold3", "Galaxy Z Flip3",
      "Galaxy A55 5G", "Galaxy A35 5G", "Galaxy A25 5G", "Galaxy A15",
      "Galaxy A54 5G", "Galaxy A34 5G", "Galaxy A24", "Galaxy A14",
      "Galaxy A73 5G", "Galaxy A53 5G", "Galaxy A33 5G", "Galaxy A23", "Galaxy A13",
      "Galaxy A72", "Galaxy A52s 5G", "Galaxy A52", "Galaxy A32",
      "Galaxy M55", "Galaxy M35", "Galaxy M15",
      "Galaxy M54", "Galaxy M34", "Galaxy M14",
      "Galaxy M53", "Galaxy M33", "Galaxy M23",
      "Khác"
    ]
  },
  "Xiaomi": {
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Xiaomi_logo_%282021-%29.svg",
    models: [
      "Xiaomi 14 Ultra", "Xiaomi 14 Pro", "Xiaomi 14",
      "Xiaomi 13 Ultra", "Xiaomi 13 Pro", "Xiaomi 13", "Xiaomi 13 Lite",
      "Xiaomi 12T Pro", "Xiaomi 12T", "Xiaomi 12 Pro", "Xiaomi 12", "Xiaomi 12X",
      "Xiaomi 11T Pro", "Xiaomi 11T", "Mi 11 Ultra", "Mi 11", "Mi 11 Lite",
      "Redmi Note 13 Pro+ 5G", "Redmi Note 13 Pro 5G", "Redmi Note 13 Pro", "Redmi Note 13",
      "Redmi Note 12 Pro+ 5G", "Redmi Note 12 Pro 5G", "Redmi Note 12", "Redmi Note 12 Turbo",
      "Redmi Note 11 Pro+ 5G", "Redmi Note 11 Pro", "Redmi Note 11S", "Redmi Note 11",
      "Poco F6 Pro", "Poco F6", "Poco X6 Pro", "Poco X6", "Poco M6 Pro",
      "Poco F5 Pro", "Poco F5", "Poco X5 Pro", "Poco X5",
      "Poco F4 GT", "Poco F4", "Poco X4 Pro",
      "Khác"
    ]
  },
  "Oppo": {
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/b8/OPPO_Logo.svg",
    models: [
      "Find X7 Ultra", "Find X7",
      "Find N3", "Find N3 Flip",
      "Find X6 Pro", "Find X6",
      "Find N2", "Find N2 Flip",
      "Find X5 Pro", "Find X5",
      "Reno11 Pro 5G", "Reno11 5G", "Reno11 F 5G",
      "Reno10 Pro+ 5G", "Reno10 Pro 5G", "Reno10 5G",
      "Reno8 Pro 5G", "Reno8 5G", "Reno8 Z 5G", "Reno8 T 5G",
      "Reno7 Pro 5G", "Reno7 5G", "Reno7 Z 5G",
      "Reno6 Pro 5G", "Reno6 5G", "Reno6 Z 5G",
      "Oppo A79 5G", "Oppo A78", "Oppo A60", "Oppo A58", "Oppo A38", "Oppo A18",
      "Oppo A98 5G", "Oppo A77s", "Oppo A57", "Oppo A17",
      "Khác"
    ]
  },
  "Vivo": {
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e5/Vivo_mobile_logo.png",
    models: [
      "Vivo X100 Pro", "Vivo X100",
      "Vivo X90 Pro", "Vivo X90",
      "Vivo X80 Pro", "Vivo X80",
      "Vivo X70 Pro",
      "Vivo V30 Pro", "Vivo V30", "Vivo V30e",
      "Vivo V29 Pro", "Vivo V29", "Vivo V29e",
      "Vivo V27 Pro", "Vivo V27", "Vivo V27e",
      "Vivo V25 Pro", "Vivo V25", "Vivo V25e",
      "Vivo V23 Pro", "Vivo V23", "Vivo V23e",
      "Vivo Y100", "Vivo Y36", "Vivo Y27", "Vivo Y17s", "Vivo Y03",
      "Vivo Y35", "Vivo Y22s", "Vivo Y16", "Vivo Y02s",
      "Khác"
    ]
  },
  "Huawei": {
    logo: "https://cdn.chotot.com/admincentre/5010_huawei.png", // <--- Đã thay link mới
    models: [
      "Huawei Pura 70 Ultra", "Huawei Pura 70 Pro", "Huawei Pura 70",
      "Huawei P60 Pro", "Huawei P60 Art", "Huawei P60",
      "Huawei P50 Pro", "Huawei P50", "Huawei P50 Pocket",
      "Huawei Mate 60 Pro+", "Huawei Mate 60 Pro", "Huawei Mate 60",
      "Huawei Mate 50 Pro", "Huawei Mate 50",
      "Huawei Mate X5", "Huawei Mate X3",
      "Huawei Nova 12s", "Huawei Nova 12i", "Huawei Nova 12 SE",
      "Huawei Nova 11 Pro", "Huawei Nova 11",
      "Huawei Nova 10 Pro", "Huawei Nova 10",
      "Khác"
    ]
  },
  "Nokia": {
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/02/Nokia_wordmark.svg",
    models: [
      "Nokia G42 5G", "Nokia G22", "Nokia C32", "Nokia C22",
      "Nokia X30 5G", "Nokia G60 5G", "Nokia C31",
      "Nokia G21", "Nokia G11 Plus", "Nokia C21 Plus",
      "Nokia XR20", "Nokia G50", "Nokia X20", "Nokia X10",
      "Nokia 8.3 5G", "Nokia 5.4", "Nokia 3.4",
      "Khác"
    ]
  },
  "Sony": {
    logo: "https://brasol.vn/wp-content/uploads/2022/09/logo-sony.jpg", // <--- Đã thay link mới
    models: [
      "Xperia 1 VI", "Xperia 10 VI",
      "Xperia 1 V", "Xperia 5 V", "Xperia 10 V",
      "Xperia 1 IV", "Xperia 5 IV", "Xperia 10 IV",
      "Xperia PRO-I",
      "Xperia 1 III", "Xperia 5 III", "Xperia 10 III",
      "Xperia 1 II", "Xperia 5 II", "Xperia 10 II",
      "Khác"
    ]
  },
  "Khác": {
    logo: "https://static.chotot.com/storage/c2cCategories/5010.svg",
    models: ["Khác"]
  }
};

export const PHONE_COLORS = [
  "Đen", "Trắng", "Đỏ", "Xanh dương", "Xanh lá", 
  "Vàng", "Bạc", "Xám", "Hồng", "Tím", "Titan", "Kem", "Xanh Mint"
];

export const PHONE_STORAGES = [
  "< 64GB", "64GB", "128GB", "256GB", "512GB", "1TB", "> 1TB"
];

export const PHONE_WARRANTIES = [
  "Hết bảo hành", "Còn bảo hành", "Bảo hành chính hãng", "Bảo hành cửa hàng"
];