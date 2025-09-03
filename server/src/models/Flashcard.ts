import mongoose, { Document, Schema } from 'mongoose';
import { IFlashcard } from '../types';

export interface IFlashcardDocument extends IFlashcard, Document {
  toJSON(): any;
}

const flashcardSchema = new Schema<IFlashcardDocument>({
  contentId: {
    type: Schema.Types.ObjectId,
    ref: 'Content',
    required: [true, 'Content ID is required'],
    index: true
  },
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    maxlength: [500, 'Question cannot exceed 500 characters']
  },
  answer: {
    type: String,
    required: [true, 'Answer is required'],
    trim: true,
    maxlength: [1000, 'Answer cannot exceed 1000 characters']
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty is required'],
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  lastReviewed: {
    type: Date,
    default: null
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: [0, 'Review count cannot be negative']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for days since last review
flashcardSchema.virtual('daysSinceReview').get(function() {
  if (!this.lastReviewed) return null;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.lastReviewed.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for mastery level (based on review count and difficulty)
flashcardSchema.virtual('masteryLevel').get(function() {
  const baseScore = this.reviewCount * 10;
  const difficultyMultiplier = {
    easy: 1,
    medium: 1.5,
    hard: 2
  };
  
  const score = baseScore * difficultyMultiplier[this.difficulty];
  
  if (score >= 100) return 'mastered';
  if (score >= 50) return 'proficient';
  if (score >= 20) return 'learning';
  return 'new';
});

// Indexes for better query performance
flashcardSchema.index({ contentId: 1, createdAt: -1 });
flashcardSchema.index({ contentId: 1, difficulty: 1 });
flashcardSchema.index({ contentId: 1, tags: 1 });
flashcardSchema.index({ lastReviewed: 1 }); // For spaced repetition

// Instance method to mark as reviewed
flashcardSchema.methods.markReviewed = function() {
  this.lastReviewed = new Date();
  this.reviewCount += 1;
  return this.save();
};

// Instance method to return flashcard without sensitive data
flashcardSchema.methods.toJSON = function() {
  const flashcardObject = this.toObject();
  return flashcardObject;
};

// Static method to find flashcards by content
flashcardSchema.statics.findByContent = function(contentId: string, options: any = {}) {
  const { difficulty, tags, limit = 50 } = options;
  
  let query: any = { contentId };
  
  if (difficulty) query.difficulty = difficulty;
  if (tags && tags.length > 0) query.tags = { $in: tags };
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get flashcards for spaced repetition
flashcardSchema.statics.getForReview = function(contentId: string, limit = 20) {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  return this.find({
    contentId,
    $or: [
      { lastReviewed: { $lt: oneDayAgo } },
      { lastReviewed: null }
    ]
  })
  .sort({ lastReviewed: 1, reviewCount: 1 })
  .limit(limit);
};

// Static method to get flashcard statistics
flashcardSchema.statics.getStats = function(contentId: string) {
  return this.aggregate([
    { $match: { contentId: new mongoose.Types.ObjectId(contentId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byDifficulty: {
          $push: '$difficulty'
        },
        totalReviews: { $sum: '$reviewCount' }
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        totalReviews: 1,
        easyCount: {
          $size: {
            $filter: {
              input: '$byDifficulty',
              cond: { $eq: ['$$this', 'easy'] }
            }
          }
        },
        mediumCount: {
          $size: {
            $filter: {
              input: '$byDifficulty',
              cond: { $eq: ['$$this', 'medium'] }
            }
          }
        },
        hardCount: {
          $size: {
            $filter: {
              input: '$byDifficulty',
              cond: { $eq: ['$$this', 'hard'] }
            }
          }
        }
      }
    }
  ]);
};

export const Flashcard = mongoose.model<IFlashcardDocument>('Flashcard', flashcardSchema);
