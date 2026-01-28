// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";


// --- LAYOUTS ---
import AdminLayout from "../layouts/AdminLayout";


// --- AUTH & CORE PAGES ---
import Login from "../pages/Login";
import Register from "../pages/Register";
import MarketPage from "../pages/MarketPage";
import ViewHistoryPage from "../pages/ViewHistory/ViewHistoryPage";
import MarketPageElectronic from "../pages/MarketPageElectronic";
import MarketPageBatDongSan from "../pages/MarketPageNhaTro";
import ErrorBoundary from "../components/ErrorBoundary";


// --- ADMIN PAGES & COMPONENTS ---
import AdminDashboard from "../pages/AdminDashboard";
import AddEmployee from "../components/AddEmployee";
import EmployeeList from "../components/EmployeeList";
import CategoryForm from "../components/CategoryForm";
import AddParentCategory from "../components/AddParentCategory";
import ManageParentCategories from "../components/ManageParentCategories";
import ManageCategories from "../components/ManageCategories";
import ManagePosts from "../components/ManagePosts";
import QuanLyBaoCao from "../pages/Admin/QuanLyBaoCao";


// --- POST & MARKET COMPONENTS ---
import PostForm from "../components/PostForm";
import PostTinDang from "../components/PostTinDang";
import TinDangDanhChoBan from "../components/TinDangDanhChoBan";
import LocTinDang from "../components/LocTinDang/LocTinDang";
import QuanLyTin from "../components/QuanLyTin";
import TinDangDaLuu from "../components/TinDangDaLuu";
import CapNhatTin from "../components/CapNhatTin/CapNhatTin";
import ChiTietTinDang from "../components/ChiTietTinDang";
import ChiTietTinDangNhaTro from "../components/ChiTietTinDangNhaTro";
import ChiTietTinDangRouter from "../components/ChiTietTinDangRouter";


// --- USER & SETTINGS ---
import AccountSettings from "../components/AccountSettings/AccountSettings";
import UserProfilePage from "../pages/UserProfilePage";
import TrangChat from "../pages/TrangChat";


// --- VIDEO COMPONENTS ---
import VideoPage from "../pages/VideoPage";
import VideoSearchPage from "../components/VideoSearch/VideoSearchPage";
import VideoDetailViewer from "../components/VideoDetailViewer";
import LikedVideoDetailViewer from "../pages/LikedVideoDetailViewer/LikedVideoDetailViewer";
import VideoStandalonePage from "../pages/VideoStandalone/VideoStandalonePage";


// Import đúng đường dẫn
import ExplorePage from '../pages/ExplorePage/ExplorePage';


// --- ROUTE GUARDS ---
const AdminGuard = ({ children }) => {
  const { user, role } = useContext(AuthContext);
  if (user === null) return null;
  if (!user) return <Navigate to="/login" />;
  if (role !== "Admin") return <Navigate to="/" />;
  return children;
};


const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  return children;
};


// --- MAIN APP ROUTES ---
function AppRoutes() {
  return (
    <Routes>
      {/* ==============================
          1. PUBLIC ROUTES
      ============================== */}
      <Route path="/" element={<MarketPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/market" element={<MarketPage />} />
      <Route path="/market/do-dien-tu" element={<MarketPageElectronic />} />
      <Route path="/market/nha-tro" element={<MarketPageBatDongSan />} />


      {/* ==============================
          2. MARKETPLACE & POSTS
      ============================== */}
      <Route path="/tin-dang-danh-cho-ban" element={<TinDangDanhChoBan />} />
      <Route path="/loc-tin-dang" element={<LocTinDang />} />
      <Route
        path="/tin-dang/:id"
        element={
          <ChiTietTinDangRouter
            onOpenChat={(maCuocTroChuyen) => {
              window.location.href = `/chat/${maCuocTroChuyen}`;
            }}
          />
        }
      />
      <Route
        path="/chi-tiet-tin-dang-nha-tro/:id"
        element={
          <ChiTietTinDangNhaTro
            onOpenChat={(maCuocTroChuyen) => {
              window.location.href = `/chat/${maCuocTroChuyen}`;
            }}
          />
        }
      />


      {/* ==============================
          3. USER & PROTECTED ROUTES
      ============================== */}
      <Route path="/post-tin" element={<ProtectedRoute><PostTinDang /></ProtectedRoute>} />
      <Route path="/dang-tin" element={<ProtectedRoute><PostForm /></ProtectedRoute>} />
      <Route path="/dang-tin/:categorySlug" element={<ProtectedRoute><PostForm /></ProtectedRoute>} />
      <Route path="/quan-ly-tin" element={<ProtectedRoute><QuanLyTin /></ProtectedRoute>} />
      <Route path="/tin-dang-da-luu" element={<ProtectedRoute><TinDangDaLuu /></ProtectedRoute>} />
      <Route path="/cap-nhat-tin/:id" element={<ProtectedRoute><CapNhatTin /></ProtectedRoute>} />
     
      <Route path="/chat" element={<ProtectedRoute><TrangChat /></ProtectedRoute>} />
      <Route path="/chat/:maCuocTroChuyen" element={<ProtectedRoute><TrangChat /></ProtectedRoute>} />


      <Route path="/cai-dat-tai-khoan" element={<AccountSettings />} />
      <Route path="/nguoi-dung/:userId" element={<UserProfilePage />} />
      <Route path="/view-history" element={<ProtectedRoute><ViewHistoryPage /></ProtectedRoute>} />


      {/* ==============================
          4. VIDEO ROUTES
      ============================== */}
      <Route path="/market/video" element={<ErrorBoundary><VideoPage /></ErrorBoundary>} />
      <Route path="/search/:keyword" element={<VideoSearchPage />} />
      <Route path="/video-viewer/:maTinDang" element={<ErrorBoundary><LikedVideoDetailViewer /></ErrorBoundary>} />
      <Route path="/liked-videos/:maTinDang" element={<LikedVideoDetailViewer />} />
      <Route path="/video-search-detail/:maTinDang" element={<LikedVideoDetailViewer />} />
      <Route path="/video/:id" element={<VideoDetailViewer />} />
      <Route path="/video-standalone/:id" element={<VideoStandalonePage />} />


      {/* 🔥 [QUAN TRỌNG] Thêm Route này để khớp với ExplorePage đã sửa */}
      <Route path="/liked-video-detail/:maTinDang" element={<LikedVideoDetailViewer />} />


      <Route path="/explore" element={<ExplorePage />} />


      {/* ==============================
          5. ADMIN ROUTES
      ============================== */}
      <Route path="/admin" element={
        <AdminGuard>
          <AdminLayout />
        </AdminGuard>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="add-employee" element={<AddEmployee />} />
        <Route path="employees" element={<EmployeeList />} />
        <Route path="categories" element={<CategoryForm />} />
        <Route path="add-parent-category" element={<AddParentCategory />} />
        <Route path="manage-categories" element={<ManageParentCategories />} />
        <Route path="manage-subcategories" element={<ManageCategories />} />
        <Route path="manage-posts" element={<ManagePosts />} />
        <Route path="reports" element={<QuanLyBaoCao />} />
      </Route>


    </Routes>
  );
}


export default AppRoutes;

