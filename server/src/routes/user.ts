import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { User } from '../models/User';
import { Content } from '../models/Content';
import { Flashcard } from '../models/Flashcard';
import { Quiz } from '../models/Quiz';

const router = express.Router();

// @route   GET /api/user/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!._id;

  // Get content statistics
  const contentStats = await Content.getStats(userId);
  
  // Get recent content
  const recentContent = await Content.find({ userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title type summary createdAt');

  // Get flashcards for review
  const reviewFlashcards = await Flashcard.aggregate([
    {
      $lookup: {
        from: 'contents',
        localField: 'contentId',
        foreignField: '_id',
        as: 'content'
      }
    },
    {
      $match: {
        'content.userId': userId,
        $or: [
          { lastReviewed: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          { lastReviewed: null }
        ]
      }
    },
    {
      $limit: 10
    }
  ]);

  // Get recent quiz attempts
  const recentQuizAttempts = await Quiz.aggregate([
    {
      $lookup: {
        from: 'contents',
        localField: 'contentId',
        foreignField: '_id',
        as: 'content'
      }
    },
    {
      $match: {
        'content.userId': userId,
        'attempts.userId': userId
      }
    },
    {
      $unwind: '$attempts'
    },
    {
      $match: {
        'attempts.userId': userId
      }
    },
    {
      $sort: {
        'attempts.completedAt': -1
      }
    },
    {
      $limit: 5
    },
    {
      $project: {
        quizTitle: '$title',
        score: '$attempts.score',
        completedAt: '$attempts.completedAt',
        contentTitle: { $arrayElemAt: ['$content.title', 0] }
      }
    }
  ]);

  // Get learning progress
  const learningProgress = await Flashcard.aggregate([
    {
      $lookup: {
        from: 'contents',
        localField: 'contentId',
        foreignField: '_id',
        as: 'content'
      }
    },
    {
      $match: {
        'content.userId': userId
      }
    },
    {
      $group: {
        _id: null,
        totalFlashcards: { $sum: 1 },
        totalReviews: { $sum: '$reviewCount' },
        masteredCards: {
          $sum: {
            $cond: [
              { $gte: [{ $multiply: ['$reviewCount', 10] }, 100] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  res.json({
    success: true,
    message: 'Dashboard data retrieved successfully',
    data: {
      stats: contentStats[0] || {},
      recentContent,
      reviewFlashcards: reviewFlashcards.length,
      recentQuizAttempts,
      learningProgress: learningProgress[0] || {
        totalFlashcards: 0,
        totalReviews: 0,
        masteredCards: 0
      }
    }
  });
}));

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const user = await User.findById(req.user!._id)
    .populate('contentCount')
    .select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
      error: 'User does not exist'
    });
  }

  res.json({
    success: true,
    message: 'Profile retrieved successfully',
    data: { user }
  });
}));

// @route   GET /api/user/subjects
// @desc    Get user's subjects
// @access  Private
router.get('/subjects', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const user = await User.findById(req.user!._id).select('subjects');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
      error: 'User does not exist'
    });
  }

  res.json({
    success: true,
    message: 'Subjects retrieved successfully',
    data: { subjects: user.subjects }
  });
}));

// @route   GET /api/user/learning-stats
// @desc    Get detailed learning statistics
// @access  Private
router.get('/learning-stats', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!._id;

  // Get content by type
  const contentByType = await Content.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalWords: { $sum: { $strLenCP: '$content' } }
      }
    }
  ]);

  // Get flashcard statistics
  const flashcardStats = await Flashcard.aggregate([
    {
      $lookup: {
        from: 'contents',
        localField: 'contentId',
        foreignField: '_id',
        as: 'content'
      }
    },
    {
      $match: {
        'content.userId': userId
      }
    },
    {
      $group: {
        _id: null,
        totalFlashcards: { $sum: 1 },
        totalReviews: { $sum: '$reviewCount' },
        byDifficulty: {
          $push: '$difficulty'
        }
      }
    }
  ]);

  // Get quiz statistics
  const quizStats = await Quiz.aggregate([
    {
      $lookup: {
        from: 'contents',
        localField: 'contentId',
        foreignField: '_id',
        as: 'content'
      }
    },
    {
      $match: {
        'content.userId': userId
      }
    },
    {
      $group: {
        _id: null,
        totalQuizzes: { $sum: 1 },
        totalAttempts: { $sum: { $size: '$attempts' } },
        avgScore: { $avg: '$averageScore' }
      }
    }
  ]);

  // Get weekly activity
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyActivity = await Content.aggregate([
    {
      $match: {
        userId,
        createdAt: { $gte: oneWeekAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt'
          }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  res.json({
    success: true,
    message: 'Learning statistics retrieved successfully',
    data: {
      contentByType,
      flashcardStats: flashcardStats[0] || {},
      quizStats: quizStats[0] || {},
      weeklyActivity
    }
  });
}));

// @route   GET /api/user/search
// @desc    Search user's content
// @access  Private
router.get('/search', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { q: query, type, subjects, tags, page = 1, limit = 10 } = req.query;
  const userId = req.user!._id;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required',
      error: 'Please provide a search term'
    });
  }

  // Build search query
  const searchQuery: any = {
    userId,
    $text: { $search: query as string }
  };

  if (type) searchQuery.type = type;
  if (subjects) searchQuery.subjects = { $in: (subjects as string).split(',') };
  if (tags) searchQuery.tags = { $in: (tags as string).split(',') };

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  // Search content
  const content = await Content.find(searchQuery)
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(parseInt(limit as string))
    .select('title type summary subjects tags createdAt');

  // Search flashcards
  const flashcards = await Flashcard.aggregate([
    {
      $lookup: {
        from: 'contents',
        localField: 'contentId',
        foreignField: '_id',
        as: 'content'
      }
    },
    {
      $match: {
        'content.userId': userId,
        $or: [
          { question: { $regex: query, $options: 'i' } },
          { answer: { $regex: query, $options: 'i' } }
        ]
      }
    },
    {
      $limit: parseInt(limit as string)
    },
    {
      $project: {
        _id: 1,
        question: 1,
        answer: 1,
        difficulty: 1,
        contentTitle: { $arrayElemAt: ['$content.title', 0] }
      }
    }
  ]);

  // Search quizzes
  const quizzes = await Quiz.aggregate([
    {
      $lookup: {
        from: 'contents',
        localField: 'contentId',
        foreignField: '_id',
        as: 'content'
      }
    },
    {
      $match: {
        'content.userId': userId,
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      }
    },
    {
      $limit: parseInt(limit as string)
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        questionCount: { $size: '$questions' },
        contentTitle: { $arrayElemAt: ['$content.title', 0] }
      }
    }
  ]);

  const total = await Content.countDocuments(searchQuery);

  res.json({
    success: true,
    message: 'Search completed successfully',
    data: {
      content,
      flashcards,
      quizzes,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    }
  });
}));

// @route   GET /api/user/export
// @desc    Export user data
// @access  Private
router.get('/export', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!._id;

  // Get user data
  const user = await User.findById(userId).select('-password');
  
  // Get all content
  const content = await Content.find({ userId }).select('-content');
  
  // Get all flashcards
  const flashcards = await Flashcard.aggregate([
    {
      $lookup: {
        from: 'contents',
        localField: 'contentId',
        foreignField: '_id',
        as: 'content'
      }
    },
    {
      $match: {
        'content.userId': userId
      }
    },
    {
      $project: {
        question: 1,
        answer: 1,
        difficulty: 1,
        tags: 1,
        reviewCount: 1,
        lastReviewed: 1,
        contentTitle: { $arrayElemAt: ['$content.title', 0] }
      }
    }
  ]);

  // Get all quizzes
  const quizzes = await Quiz.aggregate([
    {
      $lookup: {
        from: 'contents',
        localField: 'contentId',
        foreignField: '_id',
        as: 'content'
      }
    },
    {
      $match: {
        'content.userId': userId
      }
    },
    {
      $project: {
        title: 1,
        description: 1,
        questions: 1,
        attempts: 1,
        contentTitle: { $arrayElemAt: ['$content.title', 0] }
      }
    }
  ]);

  const exportData = {
    user: {
      profile: user,
      statistics: {
        totalContent: content.length,
        totalFlashcards: flashcards.length,
        totalQuizzes: quizzes.length
      }
    },
    content,
    flashcards,
    quizzes,
    exportedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'Data exported successfully',
    data: exportData
  });
}));

export default router;
