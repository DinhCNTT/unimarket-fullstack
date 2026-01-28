import api from './api';

export const viewHistoryService = {
  // Track when a user views a post
  trackView: async (maTinDang, watchedSeconds = 0, isCompleted = false) => {
    try {
      const token = localStorage.getItem('token');
      console.log(`[trackView] Token exists: ${!!token}, maTinDang: ${maTinDang}`);

      if (!token) {
        console.log("[trackView] ⚠️ No token found, skipping tracking");
        return; // Not logged in, skip tracking
      }

      const response = await api.post('/viewhistory/track', {
        maTinDang,
        watchedSeconds,
        isCompleted,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      console.log(`[trackView] ✅ View tracked successfully for ${maTinDang}`);
      return response.data;
    } catch (error) {
      console.error('Error tracking view:', error);
      // Silently fail - don't break the app
    }
  },

  // Get user's view history
  getViewHistory: async (limit = 30) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return [];

      const response = await api.get(`/viewhistory/history?limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      // Handle response structure: { success, data: [...] }
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching view history:', error);
      return [];
    }
  },

  // Get paginated view history
  getViewHistoryPaged: async (pageNumber = 1, pageSize = 12) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { items: [], totalCount: 0 };

      const response = await api.get(
        `/viewhistory/history-paged?page=${pageNumber}&pageSize=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      // Handle the response structure from ViewHistoryMongoController
      const data = response.data;
      return {
        items: data.data || [],
        totalCount: data.pagination?.totalCount || 0,
      };
    } catch (error) {
      console.error('Error fetching paged view history:', error);
      return { items: [], totalCount: 0 };
    }
  },

  // Get trending keywords
  getTrendingKeywords: async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      } : {};

      const response = await api.get('/trendingkeyword/trending-simple', config);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching trending keywords:', error);
      return [];
    }
  },

  // Track search keyword
  trackSearch: async (keyword, deviceName = null, ipAddress = null) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return; // Not logged in, skip tracking

      const response = await api.post('/trendingkeyword/save-search', {
        keyword,
        deviceName,
        ipAddress,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error('Error tracking search:', error);
      // Silently fail - don't break the app
    }
  },

  // Delete single item from view history
  deleteViewHistory: async (viewHistoryId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.delete(`/viewhistory/${viewHistoryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting view history item:', error);
      throw error;
    }
  },

  // Clear user's view history
  clearViewHistory: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await api.delete('/viewhistory/clear-history', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
    } catch (error) {
      console.error('Error clearing view history:', error);
      throw error;
    }
  },
};