const API_BASE_URL = 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: any[];
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Refresh token from localStorage in case it was updated
      const currentToken = localStorage.getItem('token');
      if (currentToken && currentToken !== this.token) {
        this.token = currentToken;
      }

      console.log(`API Request: ${options.method || 'GET'} ${endpoint}`);
      console.log('Token present:', !!this.token);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();
      console.log(`API Response: ${response.status}`, data);

      if (!response.ok) {
        // Handle authentication errors specifically
        if (response.status === 401) {
          console.warn('Authentication error - clearing token');
          this.setToken(null);
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // Auth endpoints
  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { email: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async verifyEmail(token: string) {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // User endpoints
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    skills?: string[];
    location?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.location) searchParams.append('location', params.location);
    if (params?.skills?.length) {
      params.skills.forEach(skill => searchParams.append('skills', skill));
    }

    return this.request(`/users?${searchParams.toString()}`);
  }

  async getUserById(id: string) {
    return this.request(`/users/${id}`);
  }

  async getMentors(params?: {
    page?: number;
    limit?: number;
    search?: string;
    skills?: string[];
    location?: string;
    category?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.location) searchParams.append('location', params.location);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.skills?.length) {
      params.skills.forEach(skill => searchParams.append('skills', skill));
    }
    // Add filter for mentors (users with skillsOffered)
    searchParams.append('isMentor', 'true');

    return this.request(`/users?${searchParams.toString()}`);
  }

  async updateProfile(profileData: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async addOfferedSkill(skillData: {
    name: string;
    level: string;
    category: string;
    experience?: string;
  }) {
    console.log('🔗 API Service: addOfferedSkill called with:', skillData);
    console.log('🔑 Token present:', !!this.token);
    console.log('🌐 Base URL:', this.baseURL);
    
    try {
      const result = await this.request('/users/skills/offered', {
        method: 'POST',
        body: JSON.stringify(skillData),
      });
      console.log('✅ API Service: addOfferedSkill result:', result);
      return result;
    } catch (error) {
      console.error('❌ API Service: addOfferedSkill error:', error);
      throw error;
    }
  }

  async addWantedSkill(skillData: {
    name: string;
    level: string;
    category: string;
    priority?: string;
  }) {
    return this.request('/users/skills/wanted', {
      method: 'POST',
      body: JSON.stringify(skillData),
    });
  }

  async updateAvailability(availability: any) {
    return this.request('/users/availability', {
      method: 'PUT',
      body: JSON.stringify(availability),
    });
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);

    return fetch(`${this.baseURL}/users/upload-avatar`, {
      method: 'POST',
      headers: {
        'Authorization': this.token ? `Bearer ${this.token}` : '',
      },
      body: formData,
    }).then(res => res.json());
  }

  // Session endpoints
  async getSessions(params?: {
    status?: string;
    role?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    return this.request(`/sessions?${searchParams.toString()}`);
  }

  async getSessionById(id: string) {
    return this.request(`/sessions/${id}`);
  }

  async createSession(sessionData: {
    mentorId: string;
    skillId: string;
    requestedDate: string;
    duration: number;
    sessionType: string;
    message?: string;
  }) {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async testSwapRequest(swapData: any) {
    console.log('Testing swap request with data:', swapData);
    try {
      const response = await this.request('/sessions/test-swap', {
        method: 'POST',
        body: JSON.stringify(swapData),
      });
      console.log('Test swap response:', response);
      return response;
    } catch (error) {
      console.error('Test swap failed:', error);
      throw error;
    }
  }

  async createSwapRequest(swapData: {
    recipientId: string;
    skillOffered: string | string[];
    skillWanted: string;
    message?: string;
  }) {
    console.log('Creating swap request with data:', swapData);
    try {
      const response = await this.request('/sessions/swap-request', {
        method: 'POST',
        body: JSON.stringify(swapData),
      });
      console.log('Swap request response:', response);
      return response;
    } catch (error) {
      console.error('Swap request failed:', error);
      throw error;
    }
  }

  async respondToSession(id: string, response: 'accepted' | 'declined', message?: string) {
    return this.request(`/sessions/${id}/respond`, {
      method: 'PUT',
      body: JSON.stringify({ response, message }),
    });
  }

  async completeSession(id: string) {
    return this.request(`/sessions/${id}/complete`, {
      method: 'PUT',
    });
  }

  async cancelSession(id: string, reason?: string) {
    return this.request(`/sessions/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  // Review endpoints
  async getReviews(params?: { userId?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.append('userId', params.userId);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    return this.request(`/reviews?${searchParams.toString()}`);
  }

  async createReview(reviewData: {
    sessionId: string;
    rating: number;
    comment: string;
    skillRating?: number;
    communicationRating?: number;
    punctualityRating?: number;
  }) {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  async getReviewStats(userId: string) {
    return this.request(`/reviews/stats/${userId}`);
  }

  // Notification endpoints
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.unreadOnly) searchParams.append('unreadOnly', 'true');

    const response = await this.request(`/notifications?${searchParams.toString()}`);
    // Return the response with correct data structure
    return {
      ...response,
      data: response.data // Backend already returns the correct structure
    };
  }

  async getUnreadNotificationCount() {
    return this.request('/notifications/unread-count');
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  async deleteNotification(id: string) {
    return this.request(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // Message endpoints
  async getConversations(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    return this.request(`/messages/conversations?${searchParams.toString()}`);
  }

  async getMessages(userId: string, params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    return this.request(`/messages/${userId}?${searchParams.toString()}`);
  }

  async sendMessage(messageData: {
    recipientId: string;
    content: string;
    type?: string;
    sessionId?: string;
  }) {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async markMessageAsRead(id: string) {
    return this.request(`/messages/${id}/read`, {
      method: 'PUT',
    });
  }

  async getUnreadMessageCount() {
    return this.request('/messages/unread-count');
  }

  // Skill endpoints
  async getSkillCategories() {
    return this.request('/skills/categories');
  }

  async searchSkills(query: string, category?: string) {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    if (category) searchParams.append('category', category);

    return this.request(`/skills/search?${searchParams.toString()}`);
  }

  async getPopularSkills(limit?: number) {
    const searchParams = new URLSearchParams();
    if (limit) searchParams.append('limit', limit.toString());

    return this.request(`/skills/popular?${searchParams.toString()}`);
  }

  async findMentors(params: {
    skill: string;
    category?: string;
    level?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    searchParams.append('skill', params.skill);
    if (params.category) searchParams.append('category', params.category);
    if (params.level) searchParams.append('level', params.level);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    return this.request(`/skills/mentors?${searchParams.toString()}`);
  }

  async getSkillMatches() {
    return this.request('/skills/matches');
  }

  async getSkillStats() {
    return this.request('/skills/stats');
  }

  async validateSkill(skillName: string, category?: string) {
    return this.request('/skills/validate', {
      method: 'POST',
      body: JSON.stringify({ skillName, category }),
    });
  }

  // Admin API methods
  async getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  async getAdminUsers(params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string; 
    role?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.role) queryParams.append('role', params.role);

    const endpoint = queryParams.toString() 
      ? `/admin/users?${queryParams.toString()}`
      : '/admin/users';
    
    return this.request(endpoint);
  }

  async getAdminUserById(id: string) {
    return this.request(`/admin/users/${id}`);
  }

  async updateAdminUser(id: string, data: any) {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getAdminSessions(params?: { 
    page?: number; 
    limit?: number; 
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const endpoint = queryParams.toString() 
      ? `/admin/sessions?${queryParams.toString()}`
      : '/admin/sessions';
    
    return this.request(endpoint);
  }

  async getAdminAnalytics() {
    return this.request('/admin/analytics');
  }

  async sendAdminBroadcast(data: {
    title: string;
    message: string;
    type?: string;
    targetUsers?: string[];
  }) {
    return this.request('/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAdminReports(params?: {
    type?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const endpoint = queryParams.toString() 
      ? `/admin/reports?${queryParams.toString()}`
      : '/admin/reports';
    
    return this.request(endpoint);
  }

  // General HTTP methods for admin use
  async get(endpoint: string, params?: Record<string, any>) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const finalEndpoint = queryParams.toString() 
      ? `${endpoint}?${queryParams.toString()}`
      : endpoint;
    
    return this.request(finalEndpoint);
  }

  async post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create a singleton instance
const apiService = new ApiService();

export default apiService;
