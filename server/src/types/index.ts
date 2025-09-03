import { Request } from 'express';
import { Socket } from 'socket.io';

// User Types
export interface IUser {
  _id: string;
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  subjects: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfile {
  _id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  subjects: string[];
  createdAt: Date;
}

// Content Types
export interface IContent {
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
    publishedDate?: Date;
    url?: string;
  };
  flashcards: IFlashcard[];
  quizzes: IQuiz[];
  createdAt: Date;
  updatedAt: Date;
}

// Flashcard Types
export interface IFlashcard {
  _id: string;
  contentId: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  lastReviewed?: Date;
  reviewCount: number;
  createdAt: Date;
}

// Quiz Types
export interface IQuiz {
  _id: string;
  contentId: string;
  title: string;
  description: string;
  questions: IQuizQuestion[];
  timeLimit?: number; // in minutes
  passingScore: number;
  attempts: IQuizAttempt[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuizQuestion {
  _id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

export interface IQuizAttempt {
  _id: string;
  userId: string;
  score: number;
  answers: IQuizAnswer[];
  completedAt: Date;
  timeSpent: number; // in seconds
}

export interface IQuizAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
  points: number;
}

// Chat Types
export interface IChatMessage {
  _id: string;
  userId: string;
  contentId?: string;
  message: string;
  response: string;
  type: 'general' | 'content-specific';
  createdAt: Date;
}

// AI Response Types
export interface IAISummary {
  summary: string;
  keyPoints: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadingTime: number; // in minutes
}

export interface IAIFlashcards {
  flashcards: Array<{
    question: string;
    answer: string;
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];
  }>;
}

export interface IAIQuiz {
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

// Request Types
export interface AuthRequest extends Request {
  user?: IUser;
}

export interface FileUploadRequest extends Request {
  file?: Express.Multer.File;
  user?: IUser;
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

// Socket Types
export interface ServerToClientEvents {
  message: (message: IChatMessage) => void;
  typing: (data: { userId: string; isTyping: boolean }) => void;
  userJoined: (user: IUserProfile) => void;
  userLeft: (userId: string) => void;
}

export interface ClientToServerEvents {
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (message: { content: string; contentId?: string }) => void;
  typing: (isTyping: boolean) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  username: string;
}

// File Upload Types
export interface UploadedFile {
  originalname: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
}

// Content Processing Types
export interface ContentProcessingResult {
  content: string;
  metadata: {
    title?: string;
    author?: string;
    publishedDate?: Date;
    wordCount?: number;
    readingTime?: number;
  };
}

// YouTube Video Types
export interface YouTubeVideoInfo {
  title: string;
  description: string;
  duration: number;
  author: string;
  publishedDate: Date;
  transcript?: string;
}

// Web Article Types
export interface WebArticleInfo {
  title: string;
  content: string;
  author?: string;
  publishedDate?: Date;
  url: string;
  readingTime: number;
}

// Error Types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

// Search Types
export interface SearchFilters {
  subjects?: string[];
  types?: string[];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface SearchResult {
  content: IContent[];
  flashcards: IFlashcard[];
  quizzes: IQuiz[];
}
