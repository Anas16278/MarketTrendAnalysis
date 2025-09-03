// User Types
export interface User {
  _id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  subjects: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  contentCount?: number;
}

// Content Types
export interface Content {
  _id: string;
  userId: string;
  title: string;
  type: 'document' | 'video' | 'article' | 'note';
  source: string;
  content: string;
  summary?: string;
  subjects: string[];
  tags: string[];
  metadata: {
    originalName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
    author?: string;
    publishedDate?: string;
    url?: string;
  };
  flashcards: Flashcard[];
  quizzes: Quiz[];
  createdAt: string;
  updatedAt: string;
}

// Flashcard Types
export interface Flashcard {
  _id: string;
  contentId: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  lastReviewed?: string;
  reviewCount: number;
  createdAt: string;
}

// Quiz Types
export interface Quiz {
  _id: string;
  contentId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  timeLimit?: number;
  passingScore: number;
  attempts: QuizAttempt[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  _id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

export interface QuizAttempt {
  _id: string;
  userId: string;
  score: number;
  answers: QuizAnswer[];
  completedAt: string;
  timeSpent: number;
}

export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
  points: number;
}

// Chat Types
export interface ChatMessage {
  _id: string;
  userId: string;
  contentId?: string;
  message: string;
  response: string;
  type: 'general' | 'content-specific';
  createdAt: string;
}

// AI Response Types
export interface AISummary {
  summary: string;
  keyPoints: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadingTime: number;
}

export interface AIFlashcards {
  flashcards: Array<{
    question: string;
    answer: string;
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];
  }>;
}

export interface AIQuiz {
  title: string;
  description: string;
  questions: Array<{
    question: string;
    type: 'multiple-choice' | 'true-false' | 'short-answer';
    options?: string[];
    correctAnswer: string | string[];
    explanation: string;
    points: number;
  }>;
  timeLimit?: number;
  passingScore: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard Types
export interface DashboardStats {
  totalContent: number;
  totalWords: number;
  documentCount: number;
  videoCount: number;
  articleCount: number;
  noteCount: number;
}

export interface LearningProgress {
  totalFlashcards: number;
  totalReviews: number;
  masteredCards: number;
}

export interface RecentQuizAttempt {
  quizTitle: string;
  score: number;
  completedAt: string;
  contentTitle: string;
}

// Search Types
export interface SearchFilters {
  subjects?: string[];
  types?: string[];
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SearchResult {
  content: Content[];
  flashcards: Flashcard[];
  quizzes: Quiz[];
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  subjects?: string[];
}

export interface ContentUploadForm {
  title?: string;
  subjects?: string;
  tags?: string;
}

export interface UrlForm {
  url: string;
  title?: string;
  subjects?: string;
}

export interface YouTubeForm {
  videoUrl: string;
  title?: string;
  subjects?: string;
}

// File Upload Types
export interface UploadedFile {
  file: File;
  preview?: string;
  progress?: number;
  error?: string;
}

// Socket Types
export interface SocketMessage {
  content: string;
  contentId?: string;
}

// Component Props Types
export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface InputProps {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  [key: string]: any;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
}

// Hook Types
export interface UseAuthReturn {
  user: User | null;
  token: string | null;
  login: (credentials: LoginForm) => Promise<void>;
  register: (userData: RegisterForm) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

export interface UseSocketReturn {
  socket: any;
  isConnected: boolean;
  sendMessage: (message: SocketMessage) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

// Context Types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginForm) => Promise<void>;
  register: (userData: RegisterForm) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
