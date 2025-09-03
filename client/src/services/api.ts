import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  User, 
  Content, 
  Flashcard, 
  Quiz, 
  ChatMessage,
  AISummary,
  AIFlashcards,
  AIQuiz,
  LoginForm,
  RegisterForm,
  ContentUploadForm,
  UrlForm,
  YouTubeForm,
  DashboardStats,
  LearningProgress,
  RecentQuizAttempt,
  SearchResult
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginForm): Promise<ApiResponse<{ user: User; token: string }>> {
    const response: AxiosResponse<ApiResponse<{ user: User; token: string }>> = 
      await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterForm): Promise<ApiResponse<{ user: User; token: string }>> {
    const response: AxiosResponse<ApiResponse<{ user: User; token: string }>> = 
      await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = 
      await this.api.get('/auth/me');
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = 
      await this.api.put('/auth/profile', data);
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = 
      await this.api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  }

  // Content endpoints
  async uploadContent(formData: FormData): Promise<ApiResponse<{ content: Content }>> {
    const response: AxiosResponse<ApiResponse<{ content: Content }>> = 
      await this.api.post('/content/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    return response.data;
  }

  async processUrl(urlData: UrlForm): Promise<ApiResponse<{ content: Content }>> {
    const response: AxiosResponse<ApiResponse<{ content: Content }>> = 
      await this.api.post('/content/url', urlData);
    return response.data;
  }

  async processYouTube(videoData: YouTubeForm): Promise<ApiResponse<{ content: Content }>> {
    const response: AxiosResponse<ApiResponse<{ content: Content }>> = 
      await this.api.post('/content/youtube', videoData);
    return response.data;
  }

  async getContent(params?: {
    page?: number;
    limit?: number;
    type?: string;
    subjects?: string;
    tags?: string;
    search?: string;
  }): Promise<ApiResponse<{ content: Content[]; pagination: any }>> {
    const response: AxiosResponse<ApiResponse<{ content: Content[]; pagination: any }>> = 
      await this.api.get('/content', { params });
    return response.data;
  }

  async getContentById(id: string): Promise<ApiResponse<{ content: Content }>> {
    const response: AxiosResponse<ApiResponse<{ content: Content }>> = 
      await this.api.get(`/content/${id}`);
    return response.data;
  }

  async updateContent(id: string, data: Partial<Content>): Promise<ApiResponse<{ content: Content }>> {
    const response: AxiosResponse<ApiResponse<{ content: Content }>> = 
      await this.api.put(`/content/${id}`, data);
    return response.data;
  }

  async deleteContent(id: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = 
      await this.api.delete(`/content/${id}`);
    return response.data;
  }

  async getContentStats(): Promise<ApiResponse<{ stats: DashboardStats }>> {
    const response: AxiosResponse<ApiResponse<{ stats: DashboardStats }>> = 
      await this.api.get('/content/stats');
    return response.data;
  }

  // AI endpoints
  async generateSummary(contentId: string): Promise<ApiResponse<{ summary: AISummary }>> {
    const response: AxiosResponse<ApiResponse<{ summary: AISummary }>> = 
      await this.api.post('/ai/summarize', { contentId });
    return response.data;
  }

  async generateFlashcards(contentId: string, count?: number): Promise<ApiResponse<{ flashcards: Flashcard[] }>> {
    const response: AxiosResponse<ApiResponse<{ flashcards: Flashcard[] }>> = 
      await this.api.post('/ai/flashcards', { contentId, count });
    return response.data;
  }

  async generateQuiz(contentId: string, questionCount?: number): Promise<ApiResponse<{ quiz: Quiz }>> {
    const response: AxiosResponse<ApiResponse<{ quiz: Quiz }>> = 
      await this.api.post('/ai/quiz', { contentId, questionCount });
    return response.data;
  }

  async chatWithAI(message: string, contentId?: string): Promise<ApiResponse<{ response: string; contentId?: string }>> {
    const response: AxiosResponse<ApiResponse<{ response: string; contentId?: string }>> = 
      await this.api.post('/ai/chat', { message, contentId });
    return response.data;
  }

  async getFlashcards(contentId: string, params?: {
    difficulty?: string;
    tags?: string;
    limit?: number;
  }): Promise<ApiResponse<{ flashcards: Flashcard[] }>> {
    const response: AxiosResponse<ApiResponse<{ flashcards: Flashcard[] }>> = 
      await this.api.get(`/ai/flashcards/${contentId}`, { params });
    return response.data;
  }

  async getReviewFlashcards(contentId: string, limit?: number): Promise<ApiResponse<{ flashcards: Flashcard[] }>> {
    const response: AxiosResponse<ApiResponse<{ flashcards: Flashcard[] }>> = 
      await this.api.get(`/ai/flashcards/${contentId}/review`, { params: { limit } });
    return response.data;
  }

  async markFlashcardReviewed(id: string): Promise<ApiResponse<{ flashcard: Flashcard }>> {
    const response: AxiosResponse<ApiResponse<{ flashcard: Flashcard }>> = 
      await this.api.post(`/ai/flashcards/${id}/review`);
    return response.data;
  }

  async getQuizzes(contentId: string, limit?: number): Promise<ApiResponse<{ quizzes: Quiz[] }>> {
    const response: AxiosResponse<ApiResponse<{ quizzes: Quiz[] }>> = 
      await this.api.get(`/ai/quiz/${contentId}`, { params: { limit } });
    return response.data;
  }

  async submitQuizAttempt(quizId: string, answers: any[], timeSpent: number): Promise<ApiResponse<{ score: number; totalAttempts: number }>> {
    const response: AxiosResponse<ApiResponse<{ score: number; totalAttempts: number }>> = 
      await this.api.post(`/ai/quiz/${quizId}/attempt`, { answers, timeSpent });
    return response.data;
  }

  // User endpoints
  async getDashboard(): Promise<ApiResponse<{
    stats: DashboardStats;
    recentContent: Content[];
    reviewFlashcards: number;
    recentQuizAttempts: RecentQuizAttempt[];
    learningProgress: LearningProgress;
  }>> {
    const response: AxiosResponse<ApiResponse<{
      stats: DashboardStats;
      recentContent: Content[];
      reviewFlashcards: number;
      recentQuizAttempts: RecentQuizAttempt[];
      learningProgress: LearningProgress;
    }>> = await this.api.get('/user/dashboard');
    return response.data;
  }

  async getUserProfile(): Promise<ApiResponse<{ user: User }>> {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = 
      await this.api.get('/user/profile');
    return response.data;
  }

  async getSubjects(): Promise<ApiResponse<{ subjects: string[] }>> {
    const response: AxiosResponse<ApiResponse<{ subjects: string[] }>> = 
      await this.api.get('/user/subjects');
    return response.data;
  }

  async getLearningStats(): Promise<ApiResponse<{
    contentByType: any[];
    flashcardStats: any;
    quizStats: any;
    weeklyActivity: any[];
  }>> {
    const response: AxiosResponse<ApiResponse<{
      contentByType: any[];
      flashcardStats: any;
      quizStats: any;
      weeklyActivity: any[];
    }>> = await this.api.get('/user/learning-stats');
    return response.data;
  }

  async searchContent(params: {
    q: string;
    type?: string;
    subjects?: string;
    tags?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<SearchResult & { pagination: any }>> {
    const response: AxiosResponse<ApiResponse<SearchResult & { pagination: any }>> = 
      await this.api.get('/user/search', { params });
    return response.data;
  }

  async exportData(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = 
      await this.api.get('/user/export');
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = 
      await this.api.get('/health');
    return response.data;
  }
}

export default new ApiService();
