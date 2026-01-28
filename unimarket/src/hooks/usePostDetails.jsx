import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getPostAndSimilar, startChat } from "../services/postService";
import axios from "axios"; 
import Swal from "sweetalert2"; 

// ✅ IMPORT MỚI
import toast, { useToasterStore } from "react-hot-toast"; // Thêm useToasterStore để đếm
import { MdMarkEmailUnread } from "react-icons/md"; // Icon đẹp từ React Icons

export const usePostDetails = (postId, onOpenChat) => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [similarPostsByCategory, setSimilarPostsByCategory] = useState([]);
  const [similarPostsBySeller, setSimilarPostsBySeller] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // 🔥 Lấy danh sách các toast đang hiển thị để kiểm soát số lượng
  const { toasts } = useToasterStore(); 
  const TOAST_LIMIT = 3; // Giới hạn tối đa 3 thông báo cùng lúc

  const getAuthToken = () => user?.token || token;

  // 1. Lấy dữ liệu tin đăng
  useEffect(() => {
    if (!postId) return;
    const fetchPost = async () => {
      try {
        setLoading(true);
        const data = await getPostAndSimilar(postId);
        setPost(data.post);
        setSimilarPostsByCategory(data.similarPostsByCategory);
        setSimilarPostsBySeller(data.similarPostsBySeller);
      } catch (error) {
        console.error("Lỗi khi lấy tin đăng:", error);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  // 2. Kiểm tra trạng thái đã lưu
  useEffect(() => {
    const checkSavedStatus = async () => {
      const authToken = getAuthToken();
      if (user && authToken && postId) {
        try {
          const res = await axios.get("http://localhost:5133/api/yeuthich/danh-sach", { 
            headers: { Authorization: `Bearer ${authToken}` } 
          });
          const savedIds = res.data.map(p => p.maTinDang);
          setIsSaved(savedIds.includes(Number(postId)));
        } catch (error) {
          setIsSaved(false);
        }
      }
    };
    checkSavedStatus();
  }, [user, token, postId]);

  // 3. 🔥 HÀM XỬ LÝ LƯU TIN (LOGIC NÂNG CẤP)
  const handleToggleSave = async () => {
    const authToken = getAuthToken();
    
    // --- CHỐNG SPAM: Nếu đang hiện quá 3 thông báo thì chặn luôn ---
    const visibleToasts = toasts.filter((t) => t.visible).length;
    if (visibleToasts >= TOAST_LIMIT) {
        return; // Không làm gì cả
    }

    // --- BƯỚC 1: KIỂM TRA ĐĂNG NHẬP ---
    if (!user || !authToken) {
      toast.error("Vui lòng đăng nhập để lưu tin!", {
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
      return;
    }

    // --- BƯỚC 2: KIỂM TRA XÁC THỰC EMAIL ---
    if (user && !user.emailConfirmed) { 
        toast((t) => (
            <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '12px',
                minWidth: '310px',
                fontFamily: 'Inter, sans-serif'
            }}>
                {/* ICON TỪ THƯ VIỆN REACT-ICONS */}
                <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: '#FEF2F2', // Màu nền đỏ nhạt
                    color: '#DC2626',       // Màu icon đỏ đậm
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '22px',       // Kích thước icon
                    boxShadow: '0 2px 5px rgba(220, 38, 38, 0.1)'
                }}>
                    <MdMarkEmailUnread /> 
                </div>

                {/* TEXT */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ 
                        fontWeight: 700, 
                        fontSize: '14px', 
                        color: '#1F2937' 
                    }}>
                        Email chưa xác thực
                    </span>
                    <span style={{ 
                        fontSize: '12px', 
                        color: '#6B7280',
                        marginTop: '2px'
                    }}>
                        Vui lòng kích hoạt để lưu tin.
                    </span>
                </div>

                {/* BUTTON */}
                <button
                    onClick={() => {
                        toast.dismiss(t.id);
                        navigate('/cai-dat-tai-khoan');
                    }}
                    style={{
                        border: 'none',
                        background: '#2563EB', // Xanh dương hiện đại
                        color: '#fff',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)',
                        transition: 'all 0.2s'
                    }}
                >
                    Xác thực
                </button>
            </div>
        ), {
            duration: 4000,
            position: 'top-center',
            style: {
                background: '#fff',
                border: '1px solid #F3F4F6',
                padding: '12px',
                borderRadius: '16px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            }
        });

        return; // Dừng hàm
    }
    
    // --- BƯỚC 3: XỬ LÝ LƯU (Logic cũ) ---
    const previousState = isSaved;
    setIsSaved(!previousState); 

    if (!previousState) {
        toast.success("Đã thêm vào yêu thích!", {
            icon: '❤️',
            style: { borderRadius: '20px', fontWeight: 500 }
        });
    } else {
        toast("Đã bỏ lưu tin", { 
            icon: '🗑️',
            style: { borderRadius: '20px', fontWeight: 500 }
        });
    }

    try {
      if (previousState) {
        await axios.delete(`http://localhost:5133/api/yeuthich/xoa/${postId}`, { 
          headers: { Authorization: `Bearer ${authToken}` } 
        });
      } else {
        await axios.post(`http://localhost:5133/api/yeuthich/luu/${postId}`, {}, { 
          headers: { Authorization: `Bearer ${authToken}` } 
        });
      }
    } catch (err) {
      setIsSaved(previousState);
      console.error("Lỗi lưu tin:", err);
      toast.error("Lỗi kết nối server!");
    }
  };

  // 4. Xử lý Chat
  const handleChatWithSeller = async () => {
    if (!post || !user) {
        toast.error("Vui lòng đăng nhập để chat!");
        return;
    }
    try {
      const chatData = { MaNguoiDung1: user.id, MaNguoiDung2: post.maNguoiBan, MaTinDang: post.maTinDang };
      const data = await startChat(chatData);
      const maCuocTroChuyen = data?.maCuocTroChuyen || data?.MaCuocTroChuyen;
      
      if (maCuocTroChuyen) {
        if (typeof onOpenChat === "function") onOpenChat(maCuocTroChuyen);
        else navigate(`/chat/${maCuocTroChuyen}`);
      } else {
        Swal.fire({ icon: "error", title: "Lỗi", text: "Không thể tạo cuộc trò chuyện." });
      }
    } catch (err) {
       console.error(err);
       Swal.fire({ icon: "error", title: "Lỗi", text: "Lỗi kết nối server." });
    }
  };

  return {
    post,
    similarPostsByCategory,
    similarPostsBySeller,
    loading,
    handleChatWithSeller,
    isSaved,
    handleToggleSave
  };
};