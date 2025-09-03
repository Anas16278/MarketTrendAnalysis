import mongoose, { Document, Schema } from 'mongoose';
import { IQuiz, IQuizQuestion, IQuizAttempt, IQuizAnswer } from '../types';

export interface IQuizDocument extends IQuiz, Document {
  toJSON(): any;
}

const quizAnswerSchema = new Schema<IQuizAnswer>({
  questionId: {
    type: String,
    required: true
  },
  answer: {
    type: Schema.Types.Mixed, // Can be string or array of strings
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  points: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const quizAttemptSchema = new Schema<IQuizAttempt>({
  _id: {
    type: Schema.Types.ObjectId,
    auto: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  answers: [quizAnswerSchema],
  completedAt: {
    type: Date,
    default: Date.now
  },
  timeSpent: {
    type: Number,
    required: true,
    min: 0
  }
});

const quizQuestionSchema = new Schema<IQuizQuestion>({
  _id: {
    type: Schema.Types.ObjectId,
    auto: true
  },
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    maxlength: [1000, 'Question cannot exceed 1000 characters']
  },
  type: {
    type: String,
    required: [true, 'Question type is required'],
    enum: ['multiple-choice', 'true-false', 'short-answer'],
    default: 'multiple-choice'
  },
  options: [{
    type: String,
    trim: true
  }],
  correctAnswer: {
    type: Schema.Types.Mixed, // Can be string or array of strings
    required: [true, 'Correct answer is required']
  },
  explanation: {
    type: String,
    trim: true,
    maxlength: [500, 'Explanation cannot exceed 500 characters']
  },
  points: {
    type: Number,
    required: true,
    min: [1, 'Points must be at least 1'],
    default: 1
  }
});

const quizSchema = new Schema<IQuizDocument>({
  contentId: {
    type: Schema.Types.ObjectId,
    ref: 'Content',
    required: [true, 'Content ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
    maxlength: [200, 'Quiz title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  questions: [quizQuestionSchema],
  timeLimit: {
    type: Number,
    min: [1, 'Time limit must be at least 1 minute'],
    max: [180, 'Time limit cannot exceed 180 minutes']
  },
  passingScore: {
    type: Number,
    required: true,
    min: [0, 'Passing score cannot be negative'],
    max: [100, 'Passing score cannot exceed 100'],
    default: 70
  },
  attempts: [quizAttemptSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total points
quizSchema.virtual('totalPoints').get(function() {
  return this.questions.reduce((total, question) => total + question.points, 0);
});

// Virtual for question count
quizSchema.virtual('questionCount').get(function() {
  return this.questions.length;
});

// Virtual for average score
quizSchema.virtual('averageScore').get(function() {
  if (this.attempts.length === 0) return null;
  const totalScore = this.attempts.reduce((sum, attempt) => sum + attempt.score, 0);
  return Math.round((totalScore / this.attempts.length) * 100) / 100;
});

// Virtual for completion rate
quizSchema.virtual('completionRate').get(function() {
  if (this.attempts.length === 0) return 0;
  const completedAttempts = this.attempts.filter(attempt => attempt.score >= this.passingScore);
  return Math.round((completedAttempts.length / this.attempts.length) * 100);
});

// Virtual for estimated time
quizSchema.virtual('estimatedTime').get(function() {
  return this.questions.length * 2; // 2 minutes per question average
});

// Indexes for better query performance
quizSchema.index({ contentId: 1, createdAt: -1 });
quizSchema.index({ 'attempts.userId': 1 });

// Pre-save middleware to update updatedAt
quizSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to add attempt
quizSchema.methods.addAttempt = function(userId: string, answers: IQuizAnswer[], timeSpent: number) {
  const score = this.calculateScore(answers);
  const attempt: IQuizAttempt = {
    _id: new mongoose.Types.ObjectId(),
    userId,
    score,
    answers,
    completedAt: new Date(),
    timeSpent
  };
  
  this.attempts.push(attempt);
  return this.save();
};

// Instance method to calculate score
quizSchema.methods.calculateScore = function(answers: IQuizAnswer[]): number {
  let totalPoints = 0;
  let earnedPoints = 0;
  
  this.questions.forEach(question => {
    totalPoints += question.points;
    const answer = answers.find(a => a.questionId === question._id.toString());
    
    if (answer && answer.isCorrect) {
      earnedPoints += question.points;
    }
  });
  
  return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
};

// Instance method to return quiz without sensitive data
quizSchema.methods.toJSON = function() {
  const quizObject = this.toObject();
  return quizObject;
};

// Static method to find quizzes by content
quizSchema.statics.findByContent = function(contentId: string, options: any = {}) {
  const { limit = 10 } = options;
  
  return this.find({ contentId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-questions.correctAnswer'); // Don't include correct answers
};

// Static method to get quiz statistics
quizSchema.statics.getStats = function(contentId: string) {
  return this.aggregate([
    { $match: { contentId: new mongoose.Types.ObjectId(contentId) } },
    {
      $group: {
        _id: null,
        totalQuizzes: { $sum: 1 },
        totalAttempts: { $sum: { $size: '$attempts' } },
        totalQuestions: { $sum: { $size: '$questions' } },
        avgScore: { $avg: '$averageScore' }
      }
    },
    {
      $project: {
        _id: 0,
        totalQuizzes: 1,
        totalAttempts: 1,
        totalQuestions: 1,
        avgScore: { $round: ['$avgScore', 2] }
      }
    }
  ]);
};

export const Quiz = mongoose.model<IQuizDocument>('Quiz', quizSchema);
