import React, { useEffect, useState, useContext, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import styles from "./UserProfilePage.module.css";

// Import các Component con
import UserProfileCard from "./UserProfileCard";
import UserProfileTabs from "./UserProfileTabs";
import PostGrid from "./PostGrid";
import VideoGrid from "./VideoGrid";
import UserVideoList from "./UserVideoList";
import EditProfileModal from "./EditProfileModal";

// Import Common Components
import LoadingSpinner from "../../components/Common/LoadingSpinner/LoadingSpinner";
import EmptyState from "../../components/Common/EmptyState/EmptyState";
import TopNavbarUniMarket from "../../components/TopNavbarUniMarket";

// Import Context
import { VideoContext } from "../../context/VideoContext";
import { useTheme } from "../../context/ThemeContext";

// Icons
import { IoGridOutline, IoListOutline, IoLockClosed } from "react-icons/io5";

const UserProfilePage = () => {
  const { userId } = useParams();

  const [userInfo, setUserInfo] = useState(null);
  const [posts, setPosts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [profileTab, setProfileTab] = useState("posts");
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  // State quản lý bật/tắt Modal sửa hồ sơ
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // ===== Filter & View =====
  const [videoFilter, setVideoFilter] = useState("latest");
  const [viewMode, setViewMode] = useState("grid");

  const [followStats, setFollowStats] = useState({
    followers: 0,
    following: 0,
  });

  const { activeTab, setActiveTab } = useContext(VideoContext);
  const { effectiveTheme } = useTheme();

  // ===== Check owner & tab sync =====
  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));

    if (loggedInUser && String(loggedInUser.id) === String(userId)) {
      setIsOwner(true);
    } else {
      setIsOwner(false);
    }

    if (!loggedInUser) return;

    const isMyProfile =
      window.location.pathname.includes("/nguoi-dung") &&
      String(loggedInUser.id) === String(userId);

    const PANEL_TABS = new Set(["search", "upload", "activity", "more"]);

    if (isMyProfile) {
      if (!PANEL_TABS.has(activeTab) && activeTab !== "profile") {
        setActiveTab("profile");
      }
    } else {
      if (activeTab === "profile") setActiveTab("");
    }
  }, [userId, activeTab, setActiveTab]);

  // ===== Reset when change user =====
  useEffect(() => {
    setProfileTab("posts");
    setVideoFilter("latest");
    setViewMode("grid");
  }, [userId]);

  // ===== Fetch data =====
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Chuẩn bị Token
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const currentUserId = JSON.parse(localStorage.getItem("user"))?.id;
        const isMe = String(userId) === String(currentUserId);

        // 2. Gọi User Info cơ bản
        const userRes = await axios.get(
          `http://localhost:5133/api/userprofile/user-info/${userId}`,
          { headers }
        );

        let userData = userRes.data;

        // 3. Gọi API check status chính xác (để biết Pending hay Accepted)
        if (!isMe && token) {
            try {
                const statusRes = await axios.get(
                    `http://localhost:5133/api/Follow/is-following/${userId}`, 
                    { headers }
                );
                userData.isFollowing = statusRes.data.isFollowing; 
                userData.isPending = statusRes.data.isPending;     
            } catch (err) {
                console.error("Lỗi check status follow:", err);
            }
        }

        setUserInfo(userData);
        setFollowStats({
          followers: userData.followersCount || 0,
          following: userData.followingCount || 0,
        });

        // 4. Logic quyền xem
        const canView =
          isMe || // Là chủ
          !userData.isPrivateAccount || // Công khai
          (userData.isFollowing && !userData.isPending); // Đã follow VÀ KHÔNG PHẢI Pending

        if (canView) {
          // Gọi API lấy bài viết và video
          const [postsRes, videosRes] = await Promise.all([
            axios.get(`http://localhost:5133/api/userprofile/user-posts/${userId}`, { headers }),
            axios.get(`http://localhost:5133/api/userprofile/user-videos/${userId}`, { headers }),
          ]);

          setPosts(postsRes.data);
          setVideos(videosRes.data);
        } else {
          setPosts([]);
          setVideos([]);
        }

      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // ===== Computed =====
  const totalVideoLikes = userInfo?.totalLikes || videos.reduce((sum, v) => sum + (v.soLuongTym || 0), 0);

  const sortedVideos = useMemo(() => {
    const list = [...videos];
    switch (videoFilter) {
      case "latest":
        return list.sort(
          (a, b) =>
            new Date(b.createdAt || b.ngayDang) -
            new Date(a.createdAt || a.ngayDang)
        );
      case "popular":
        return list.sort(
          (a, b) =>
            (b.views || b.soLuongTym || 0) -
            (a.views || a.soLuongTym || 0)
        );
      case "oldest":
        return list.sort(
          (a, b) =>
            new Date(a.createdAt || a.ngayDang) -
            new Date(b.createdAt || b.ngayDang)
        );
      default:
        return list;
    }
  }, [videos, videoFilter]);

  const handleUpdateSuccess = (updatedData) => {
    setUserInfo((prev) => ({
      ...prev,
      ...updatedData,
      avatarUrl: updatedData.avatarUrl,
    }));
  };

  if (isLoading) return <LoadingSpinner message="Đang tải dữ liệu..." />;

  if (!userInfo) {
    return (
      <div className={styles.profileContainer} data-theme={effectiveTheme}>
        <TopNavbarUniMarket />
        <p className={styles.errorText}>Không tìm thấy người dùng.</p>
      </div>
    );
  }

  // Logic hiển thị nội dung:
  // Chỉ hiện nội dung thực nếu: Là chủ HOẶC (Public) HOẶC (Đã Follow VÀ Không Pending)
  const shouldShowContent = isOwner || !userInfo.isPrivateAccount || (userInfo.isFollowing && !userInfo.isPending);

  return (
    <div className={styles.profileContainer} data-theme={effectiveTheme}>
      <TopNavbarUniMarket />

      <UserProfileCard
        userInfo={userInfo}
        followersCount={followStats.followers}
        followingCount={followStats.following}
        totalLikes={totalVideoLikes}
        isOwner={isOwner}
        onEditProfileClick={() => setIsEditModalOpen(true)}
      />

      <div className={styles.contentArea}>
        
        {/* THANH ĐIỀU HƯỚNG VÀ FILTER */}
        <div className={styles.navigationBar}>
          <div className={styles.tabsWrapper}>
            <UserProfileTabs
              activeTab={profileTab}
              onTabClick={setProfileTab}
              isOwner={isOwner}
            />
          </div>

          {/* FIX: Đã loại bỏ điều kiện {shouldShowContent && ...} ở đây.
             Các nút Filter và ViewMode sẽ luôn hiển thị kể cả khi tài khoản bị khóa.
          */}
          <div className={styles.controlsRight}>
            {profileTab === "videos" && (
              <div className={styles.filterContainer}>
                <button
                  className={`${styles.filterBtn} ${videoFilter === "latest" ? styles.activeFilter : ""}`}
                  onClick={() => setVideoFilter("latest")}
                >
                  Mới nhất
                </button>
                <button
                  className={`${styles.filterBtn} ${videoFilter === "popular" ? styles.activeFilter : ""}`}
                  onClick={() => setVideoFilter("popular")}
                >
                  Thịnh hành
                </button>
                <button
                  className={`${styles.filterBtn} ${videoFilter === "oldest" ? styles.activeFilter : ""}`}
                  onClick={() => setVideoFilter("oldest")}
                >
                  Cũ nhất
                </button>
              </div>
            )}

            {profileTab === "posts" && (
              <div className={styles.viewModeContainer}>
                <button
                  className={`${styles.viewBtn} ${viewMode === "grid" ? styles.activeView : ""}`}
                  onClick={() => setViewMode("grid")}
                  title="Xem lưới"
                >
                  <IoGridOutline />
                </button>
                <button
                  className={`${styles.viewBtn} ${viewMode === "list" ? styles.activeView : ""}`}
                  onClick={() => setViewMode("list")}
                  title="Xem danh sách"
                >
                  <IoListOutline />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* NỘI DUNG CHÍNH HOẶC MÀN HÌNH KHÓA */}
        {!shouldShowContent ? (
          // 🔒 GIAO DIỆN KHÓA (Hiển thị bên dưới thanh Filter)
          <div className={styles.privateAccountContainer}>
            <div className={styles.privateContent}>
              <div className={styles.lockIconWrapper}>
                <IoLockClosed size={60} />
              </div>
              
              {userInfo.isPending ? (
                 <>
                    <h2 className={styles.privateTitle}>Yêu cầu đang chờ duyệt</h2>
                    <p className={styles.privateSubtitle}>
                      Bạn đã gửi yêu cầu theo dõi. Hãy chờ {userInfo.fullName} chấp nhận để xem nội dung.
                    </p>
                 </>
              ) : (
                 <>
                    <h2 className={styles.privateTitle}>Đây là tài khoản riêng tư</h2>
                    <p className={styles.privateSubtitle}>
                      Hãy Follow tài khoản này để xem nội dung và các lượt thích của họ
                    </p>
                 </>
              )}
            </div>
          </div>
        ) : (
          // 🔓 GIAO DIỆN NỘI DUNG THẬT
          <>
            {profileTab === "posts" && (
              <PostGrid
                posts={posts}
                isOwner={isOwner}
                viewMode={viewMode}
                userInfo={userInfo}
              />
            )}

            {profileTab === "videos" && (
              <>
                {sortedVideos.length > 0 ? (
                  <VideoGrid videos={sortedVideos} />
                ) : (
                  <div style={{ padding: "20px 0" }}>
                    <EmptyState
                      icon={<IoGridOutline />}
                      title="Chưa có video nào"
                      subtitle="Người dùng này chưa đăng video nào"
                    />
                  </div>
                )}
              </>
            )}

            {profileTab === "favorites" && isOwner && (
              <UserVideoList type="saved" userId={userId} />
            )}

            {profileTab === "liked" && (
              <UserVideoList type="liked" userId={userId} />
            )}
          </>
        )}
      </div>

      {isEditModalOpen && (
        <EditProfileModal
          userInfo={userInfo}
          onClose={() => setIsEditModalOpen(false)}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default UserProfilePage;