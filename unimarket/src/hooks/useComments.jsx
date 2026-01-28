import { useState, useEffect, useCallback, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { VideoHubContext } from "../context/VideoHubContext";
import { AuthContext } from "../context/AuthContext";

export const useComments = (maTinDang) => {
  const { videoConnection } = useContext(VideoHubContext);
  const { user, token } = useContext(AuthContext);
  const currentUserId = user?.userId || localStorage.getItem("userId");

  const [comments, setComments] = useState([]);
  const [totalCommentCount, setTotalCommentCount] = useState(0);

  // ==========================================================
  // 1️⃣ LẤY COMMENT BAN ĐẦU
  // ==========================================================
  const fetchComments = useCallback(async () => {
    if (!maTinDang) return;
    try {
      const res = await axios.get(
        `http://localhost:5133/api/video/${maTinDang}/comments`
      );
      const data = res.data || [];
      setComments(data);
      setTotalCommentCount(countAllComments(data));
    } catch (err) {
      console.error("Fetch comments error", err);
    }
  }, [maTinDang]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // ==========================================================
  // 2️⃣ LẮNG NGHE SIGNALR (đã fix dependency và kiểm tra kết nối)
  // ==========================================================
  useEffect(() => {
    if (!videoConnection || !maTinDang) return;

    // ✅ Kiểm tra trạng thái kết nối
    if (videoConnection.state !== "Connected") {
      console.warn(
        `(Comments) VideoHub chưa kết nối (state: ${videoConnection.state}). Bỏ qua đăng ký listener.`
      );
      return; // Sẽ chạy lại khi videoConnection hoặc maTinDang thay đổi
    }

    console.log(`(Comments) ✅ Đăng ký SignalR listeners cho video ${maTinDang}`);

    // --- Nhận comment mới ---
    const handleReceiveComment = (newComment, parentId) => {
      console.log("SignalR: Nhận comment", newComment);
      setComments((prevComments) => {
        // Nếu là reply
        if (parentId) {
          const addReplyRecursive = (list) => {
            return list.map((comment) => {
              if (comment.id === parentId) {
                const existingReply = comment.replies?.find(
                  (r) => r.id === newComment.id
                );
                return {
                  ...comment,
                  replies: existingReply
                    ? comment.replies
                    : [newComment, ...(comment.replies || [])],
                };
              }
              if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: addReplyRecursive(comment.replies),
                };
              }
              return comment;
            });
          };
          return addReplyRecursive(prevComments);
        }

        // Nếu là comment gốc
        const existingComment = prevComments.find(
          (c) => c.id === newComment.id
        );
        return existingComment
          ? prevComments
          : [newComment, ...prevComments];
      });
      setTotalCommentCount((prev) => prev + 1);
    };

    // --- Nhận sự kiện xóa ---
    const handleCommentDeleted = (commentId) => {
      console.log("SignalR: Xóa comment", commentId);
      setComments((prevComments) => {
        const removeRecursive = (list) =>
          list
            .filter((c) => c.id !== commentId)
            .map((c) => ({
              ...c,
              replies: c.replies ? removeRecursive(c.replies) : [],
            }));
        return removeRecursive(prevComments);
      });
      setTotalCommentCount((prev) => Math.max(0, prev - 1));
    };

    // Đăng ký listener
    videoConnection.on("ReceiveComment", handleReceiveComment);
    videoConnection.on("CommentDeleted", handleCommentDeleted);

    // Cleanup
    return () => {
      console.log(`(Comments) 🧹 Dọn dẹp listeners cho video ${maTinDang}`);
      videoConnection.off("ReceiveComment", handleReceiveComment);
      videoConnection.off("CommentDeleted", handleCommentDeleted);
    };
  }, [videoConnection, maTinDang]); // ✅ Thêm maTinDang để lắng nghe đúng video

  // ==========================================================
  // 3️⃣ HÀM GỬI / XÓA COMMENT (axios + toast)
  // ==========================================================
  const submitComment = async (content, parentId = null) => {
    if (!token || !content.trim() || !maTinDang) {
      toast.error("Không thể gửi bình luận.");
      return false;
    }

    const commentData = {
      content: content.trim(),
      parentCommentId: parentId,
    };

    try {
      await axios.post(
        `http://localhost:5133/api/video/${maTinDang}/comment`,
        commentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return true; // server broadcast, FE tự nhận qua SignalR
    } catch (err) {
      console.error("Comment error (axios)", err);
      toast.error("Gửi bình luận thất bại.");
      return false;
    }
  };

  const deleteComment = async (commentId) => {
    const confirmed = await showDeleteConfirm();
    if (!confirmed) return;

    if (!token) {
      toast.error("Lỗi xác thực, không thể xoá.");
      return;
    }

    try {
      await axios.delete(
        `http://localhost:5133/api/video/comment/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Đã xoá bình luận!");
      // FE sẽ nhận cập nhật từ SignalR
    } catch (err) {
      console.error("Delete error (axios)", err);
      toast.error("Xoá thất bại, vui lòng thử lại.");
    }
  };

  return {
    comments,
    totalCommentCount,
    currentUserId,
    submitComment,
    deleteComment,
  };
};

// ==========================================================
// ⚙️ Helper: Đếm tổng comment (bao gồm replies)
// ==========================================================
const countAllComments = (list) => {
  let total = 0;
  for (const comment of list) {
    total += 1;
    if (comment.replies && comment.replies.length > 0) {
      total += countAllComments(comment.replies);
    }
  }
  return total;
};

// ==========================================================
// ⚙️ Helper: Hộp xác nhận xoá (với toast UI)
// ==========================================================
const showDeleteConfirm = () => {
  return new Promise((resolve) => {
    toast(
      (t) => (
        <div style={{ fontSize: "14px", color: "white" }}>
          <div style={{ marginBottom: "12px" }}>
            Bạn có chắc muốn xoá bình luận này?
          </div>
          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
          >
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                border: "1px solid #888",
                borderRadius: "6px",
                backgroundColor: "transparent",
                color: "#ddd",
                cursor: "pointer",
              }}
            >
              Huỷ
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                border: "1px solid #f44",
                borderRadius: "6px",
                backgroundColor: "transparent",
                color: "#f77",
                cursor: "pointer",
              }}
            >
              Xoá
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: {
          background: "#1c1c1e",
          color: "#fff",
          borderRadius: "12px",
          padding: "12px 16px",
        },
      }
    );
  });
};
