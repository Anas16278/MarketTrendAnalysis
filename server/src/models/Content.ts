import mongoose, { Document, Schema } from 'mongoose';
import { IContent } from '../types';

export interface IContentDocument extends IContent, Document {
  toJSON(): any;
}

const contentSchema = new Schema<IContentDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  type: {
    type: String,
    required: [true, 'Content type is required'],
    enum: ['document', 'video', 'article', 'note'],
    default: 'document'
  },
  source: {
    type: String,
    required: [true, 'Source is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [1000000, 'Content is too large'] // 1MB limit
  },
  summary: {
    type: String,
    maxlength: [5000, 'Summary cannot exceed 5000 characters']
  },
  subjects: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  metadata: {
    originalName: String,
    fileSize: Number,
    mimeType: String,
    duration: Number, // for videos
    author: String,
    publishedDate: Date,
    url: String
  },
  flashcards: [{
    type: Schema.Types.ObjectId,
    ref: 'Flashcard'
  }],
  quizzes: [{
    type: Schema.Types.ObjectId,
    ref: 'Quiz'
  }],
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

// Virtual for content length
contentSchema.virtual('contentLength').get(function() {
  return this.content.length;
});

// Virtual for word count
contentSchema.virtual('wordCount').get(function() {
  return this.content.split(/\s+/).filter(word => word.length > 0).length;
});

// Virtual for reading time (average 200 words per minute)
contentSchema.virtual('readingTime').get(function() {
  const words = this.wordCount;
  return Math.ceil(words / 200);
});

// Virtual for flashcard count
contentSchema.virtual('flashcardCount', {
  ref: 'Flashcard',
  localField: '_id',
  foreignField: 'contentId',
  count: true
});

// Virtual for quiz count
contentSchema.virtual('quizCount', {
  ref: 'Quiz',
  localField: '_id',
  foreignField: 'contentId',
  count: true
});

// Indexes for better query performance
contentSchema.index({ userId: 1, createdAt: -1 });
contentSchema.index({ userId: 1, type: 1 });
contentSchema.index({ userId: 1, subjects: 1 });
contentSchema.index({ userId: 1, tags: 1 });
contentSchema.index({ title: 'text', content: 'text' }); // Text search index

// Pre-save middleware to update updatedAt
contentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to return content without sensitive data
contentSchema.methods.toJSON = function() {
  const contentObject = this.toObject();
  return contentObject;
};

// Static method to find content by user
contentSchema.statics.findByUser = function(userId: string, options: any = {}) {
  const { page = 1, limit = 10, type, subjects, tags, search } = options;
  
  let query: any = { userId };
  
  if (type) query.type = type;
  if (subjects && subjects.length > 0) query.subjects = { $in: subjects };
  if (tags && tags.length > 0) query.tags = { $in: tags };
  if (search) {
    query.$text = { $search: search };
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('flashcards', 'question answer difficulty')
    .populate('quizzes', 'title description');
};

// Static method to get content statistics
contentSchema.statics.getStats = function(userId: string) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalContent: { $sum: 1 },
        totalWords: { $sum: { $strLenCP: '$content' } },
        byType: {
          $push: '$type'
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalContent: 1,
        totalWords: 1,
        documentCount: {
          $size: {
            $filter: {
              input: '$byType',
              cond: { $eq: ['$$this', 'document'] }
            }
          }
        },
        videoCount: {
          $size: {
            $filter: {
              input: '$byType',
              cond: { $eq: ['$$this', 'video'] }
            }
          }
        },
        articleCount: {
          $size: {
            $filter: {
              input: '$byType',
              cond: { $eq: ['$$this', 'article'] }
            }
          }
        },
        noteCount: {
          $size: {
            $filter: {
              input: '$byType',
              cond: { $eq: ['$$this', 'note'] }
            }
          }
        }
      }
    }
  ]);
};

export const Content = mongoose.model<IContentDocument>('Content', contentSchema);
