import toast from 'react-hot-toast';

// 1. Cấu hình Style chung: Nền trắng, đổ bóng mềm, bo góc vừa phải
const baseToastStyle = {
  fontSize: '14px',       // Chữ nhỏ gọn, tinh tế
  fontWeight: '500',      // Độ đậm vừa phải
  padding: '12px 16px',
  borderRadius: '8px',    // Bo góc hiện đại
  background: '#ffffff',  // Nền trắng
  color: '#1f2937',       // Màu chữ xám đậm dễ đọc
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)', // Đổ bóng tạo chiều sâu
  border: '1px solid #f3f4f6', // Viền mờ tách biệt nền
  maxWidth: '400px',
};

// 2. Hàm thông báo Success (Đơn giản)
export const notifySuccess = (message) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-center',
    style: baseToastStyle,
    iconTheme: {
      primary: '#10b981', // Màu xanh Emerald
      secondary: '#ffffff',
    },
  });
};

// 3. Hàm thông báo Error (Đơn giản)
export const notifyError = (message) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-center',
    style: baseToastStyle,
    iconTheme: {
      primary: '#ef4444', // Màu đỏ Red-500
      secondary: '#ffffff',
    },
  });
};

// 4. Hàm thông báo cho Promise (Nâng cao - Hỗ trợ options custom)
export const notifyPromise = (promise, options = {}) => {
  return toast.promise(
    promise,
    {
      // --- Xử lý Loading ---
      // Nếu có truyền text loading riêng thì dùng, không thì dùng mặc định
      loading: options.loading || 'Đang xử lý...',

      // --- Xử lý Success ---
      success: (data) => {
        // A. Nếu người dùng truyền hàm success vào options (VD: để mở Popup) -> Chạy hàm đó
        let userResult = null;
        if (options.success) {
            if (typeof options.success === 'function') {
                userResult = options.success(data); // Chạy side-effect (mở popup, update state...)
            } else {
                userResult = options.success; // Trường hợp truyền thẳng string
            }
        }

        // B. Xác định nội dung hiển thị lên Toast
        // 1. Nếu hàm success của user trả về string -> Hiển thị string đó
        if (typeof userResult === 'string') return userResult;
        
        // 2. Nếu server trả về string -> Hiển thị string đó
        if (typeof data === 'string') return data;
        
        // 3. Mặc định: Lấy message từ object data hoặc hiển thị "Thành công!"
        return data?.message || 'Thành công!';
      },

      // --- Xử lý Error ---
      error: (err) => {
        // A. Nếu người dùng muốn custom error (ít dùng nhưng vẫn hỗ trợ)
        if (options.error) {
            if (typeof options.error === 'function') return options.error(err);
            return options.error;
        }

        // B. Mặc định: Lấy message lỗi chuẩn từ API (axios response)
        return err?.response?.data?.message || err?.message || 'Đã có lỗi xảy ra';
      },
    },
    // Config giao diện cho Toast Promise
    {
      style: baseToastStyle,
      loading: {
        iconTheme: {
          primary: '#3b82f6', // Màu xanh dương loading
          secondary: '#e0f2fe',
        },
      },
      success: {
        iconTheme: {
          primary: '#10b981', // Màu xanh thành công
          secondary: '#ffffff',
        },
      },
      error: {
        iconTheme: {
          primary: '#ef4444', // Màu đỏ lỗi
          secondary: '#ffffff',
        },
      },
    }
  );
};