import axios from 'axios';

const API_URL = 'http://localhost:5133/api/quickmessage';

const getAuthToken = () => localStorage.getItem('token');

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, error => Promise.reject(error));

export const quickMessageService = {
  getMyQuickMessages: async () => {
    try {
      console.log('📡 [API] Đang gọi GET list...');
      const response = await apiClient.get('/', { params: { nocache: Date.now() } });
      console.log('✅ [API] GET thành công, Data gốc:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('❌ [API] GET thất bại:', error);
      throw error;
    }
  },

  createQuickMessage: async (content, order) => {
    try {
      console.log('📡 [API] Đang gọi POST:', { content, order });
      const response = await apiClient.post('/', { content: content.trim(), order });
      console.log('✅ [API] POST thành công, Data trả về:', response.data);
      // Quan trọng: Log xem server trả về cái gì để Frontend dùng
      return response.data.data; 
    } catch (error) {
      console.error('❌ [API] POST thất bại:', error);
      throw error;
    }
  },

  updateQuickMessage: async (id, content, order) => {
    try {
      console.log(`📡 [API] Đang gọi PUT ID=${id}:`, { content, order });
      const response = await apiClient.put(`/${id}`, { id, content: content.trim(), order });
      console.log('✅ [API] PUT thành công:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ [API] PUT thất bại:', error);
      throw error;
    }
  },

  deleteQuickMessage: async (id) => {
    try {
      console.log(`📡 [API] Đang gọi DELETE ID=${id}`);
      await apiClient.delete(`/${id}`);
      console.log('✅ [API] DELETE thành công');
      return true;
    } catch (error) {
      console.error('❌ [API] DELETE thất bại:', error);
      throw error;
    }
  }
};