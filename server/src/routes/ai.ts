import express from 'express';
import { body, validationResult } from 'express-validator';
import { Content } from '../models/Content';
import { Flashcard } from '../models/Flashcard';
import { Quiz } from '../models/Quiz';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import AIService from '../services/aiService';

const router = express.Router();

// @route   POST /api/ai/summarize
// @desc    Generate summary for content
// @access  Private
router.post('/summarize', authenticateToken, [
  body('contentId')
    .isMongoId()
    .withMessage('Valid content ID is required')
], asyncHandler(async (req: AuthRequest, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { contentId } = req.body;

  // Get content
  const content = await Content.findOne({
    _id: contentId,
    userId: req.user!._id
  });

  if (!content) {
    return res.status(404).json({
      success: false,
      message: 'Content not found',
      error: 'Content does not exist or you do not have access to it'
    });
  }

  const aiService = AIService.getInstance();
  const summary = await aiService.generateSummary(content.content);

  // Update content with new summary
  content.summary = summary.summary;
  await content.save();

  res.json({
    success: true,
    message: 'Summary generated successfully',
    data: { summary }
  });
}));

// @route   POST /api/ai/flashcards
// @desc    Generate flashcards for content
// @access  Private
router.post('/flashcards', authenticateToken, [
  body('contentId')
    .isMongoId()
    .withMessage('Valid content ID is required'),
  body('count')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Count must be between 1 and 50')
], asyncHandler(async (req: AuthRequest, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { contentId, count = 10 } = req.body;

  // Get content
  const content = await Content.findOne({
    _id: contentId,
    userId: req.user!._id
  });

  if (!content) {
    return res.status(404).json({
      success: false,
      message: 'Content not found',
      error: 'Content does not exist or you do not have access to it'
    });
  }

  const aiService = AIService.getInstance();
  const aiFlashcards = await aiService.generateFlashcards(content.content, count);

  // Create flashcard records
  const flashcards = [];
  for (const flashcardData of aiFlashcards.flashcards) {
    const flashcard = new Flashcard({
      contentId: content._id,
      question: flashcardData.question,
      answer: flashcardData.answer,
      difficulty: flashcardData.difficulty,
      tags: flashcardData.tags
    });
    
    await flashcard.save();
    flashcards.push(flashcard);
  }

  // Update content with flashcard references
  content.flashcards.push(...flashcards.map(f => f._id));
  await content.save();

  res.json({
    success: true,
    message: 'Flashcards generated successfully',
    data: {
      flashcards: flashcards.map(f => ({
        _id: f._id,
        question: f.question,
        answer: f.answer,
        difficulty: f.difficulty,
        tags: f.tags
      }))
    }
  });
}));

// @route   POST /api/ai/quiz
// @desc    Generate quiz for content
// @access  Private
router.post('/quiz', authenticateToken, [
  body('contentId')
    .isMongoId()
    .withMessage('Valid content ID is required'),
  body('questionCount')
    .optional()
    .isInt({ min: 5, max: 50 })
    .withMessage('Question count must be between 5 and 50')
], asyncHandler(async (req: AuthRequest, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { contentId, questionCount = 10 } = req.body;

  // Get content
  const content = await Content.findOne({
    _id: contentId,
    userId: req.user!._id
  });

  if (!content) {
    return res.status(404).json({
      success: false,
      message: 'Content not found',
      error: 'Content does not exist or you do not have access to it'
    });
  }

  const aiService = AIService.getInstance();
  const aiQuiz = await aiService.generateQuiz(content.content, questionCount);

  // Create quiz record
  const quiz = new Quiz({
    contentId: content._id,
    title: aiQuiz.title,
    description: aiQuiz.description,
    questions: aiQuiz.questions,
    timeLimit: aiQuiz.timeLimit,
    passingScore: aiQuiz.passingScore
  });

  await quiz.save();

  // Update content with quiz reference
  content.quizzes.push(quiz._id);
  await content.save();

  res.json({
    success: true,
    message: 'Quiz generated successfully',
    data: {
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        questionCount: quiz.questions.length,
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore
      }
    }
  });
}));

// @route   POST /api/ai/chat
// @desc    Chat with AI about content
// @access  Private
router.post('/chat', authenticateToken, [
  body('message')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('contentId')
    .optional()
    .isMongoId()
    .withMessage('Valid content ID is required if provided')
], asyncHandler(async (req: AuthRequest, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { message, contentId } = req.body;

  let content = null;
  if (contentId) {
    content = await Content.findOne({
      _id: contentId,
      userId: req.user!._id
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
        error: 'Content does not exist or you do not have access to it'
      });
    }
  }

  const aiService = AIService.getInstance();
  const response = content 
    ? await aiService.chatWithContent(message, content.content)
    : await aiService.chatWithContent(message, '');

  res.json({
    success: true,
    message: 'Chat response generated successfully',
    data: {
      response,
      contentId: content?._id || null
    }
  });
}));

// @route   GET /api/ai/flashcards/:contentId
// @desc    Get flashcards for content
// @access  Private
router.get('/flashcards/:contentId', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { contentId } = req.params;
  const { difficulty, tags, limit = 50 } = req.query;

  // Verify content ownership
  const content = await Content.findOne({
    _id: contentId,
    userId: req.user!._id
  });

  if (!content) {
    return res.status(404).json({
      success: false,
      message: 'Content not found',
      error: 'Content does not exist or you do not have access to it'
    });
  }

  const options: any = {
    limit: parseInt(limit as string)
  };

  if (difficulty) options.difficulty = difficulty;
  if (tags) options.tags = (tags as string).split(',');

  const flashcards = await Flashcard.findByContent(contentId, options);

  res.json({
    success: true,
    message: 'Flashcards retrieved successfully',
    data: { flashcards }
  });
}));

// @route   GET /api/ai/flashcards/:contentId/review
// @desc    Get flashcards for spaced repetition review
// @access  Private
router.get('/flashcards/:contentId/review', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { contentId } = req.params;
  const { limit = 20 } = req.query;

  // Verify content ownership
  const content = await Content.findOne({
    _id: contentId,
    userId: req.user!._id
  });

  if (!content) {
    return res.status(404).json({
      success: false,
      message: 'Content not found',
      error: 'Content does not exist or you do not have access to it'
    });
  }

  const flashcards = await Flashcard.getForReview(contentId, parseInt(limit as string));

  res.json({
    success: true,
    message: 'Review flashcards retrieved successfully',
    data: { flashcards }
  });
}));

// @route   POST /api/ai/flashcards/:id/review
// @desc    Mark flashcard as reviewed
// @access  Private
router.post('/flashcards/:id/review', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const flashcard = await Flashcard.findById(id);
  if (!flashcard) {
    return res.status(404).json({
      success: false,
      message: 'Flashcard not found',
      error: 'Flashcard does not exist'
    });
  }

  // Verify content ownership
  const content = await Content.findOne({
    _id: flashcard.contentId,
    userId: req.user!._id
  });

  if (!content) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
      error: 'You do not have access to this flashcard'
    });
  }

  await flashcard.markReviewed();

  res.json({
    success: true,
    message: 'Flashcard marked as reviewed',
    data: {
      flashcard: {
        _id: flashcard._id,
        reviewCount: flashcard.reviewCount,
        lastReviewed: flashcard.lastReviewed,
        masteryLevel: flashcard.masteryLevel
      }
    }
  });
}));

// @route   GET /api/ai/quiz/:contentId
// @desc    Get quizzes for content
// @access  Private
router.get('/quiz/:contentId', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { contentId } = req.params;
  const { limit = 10 } = req.query;

  // Verify content ownership
  const content = await Content.findOne({
    _id: contentId,
    userId: req.user!._id
  });

  if (!content) {
    return res.status(404).json({
      success: false,
      message: 'Content not found',
      error: 'Content does not exist or you do not have access to it'
    });
  }

  const quizzes = await Quiz.findByContent(contentId, { limit: parseInt(limit as string) });

  res.json({
    success: true,
    message: 'Quizzes retrieved successfully',
    data: { quizzes }
  });
}));

// @route   POST /api/ai/quiz/:id/attempt
// @desc    Submit quiz attempt
// @access  Private
router.post('/quiz/:id/attempt', authenticateToken, [
  body('answers')
    .isArray()
    .withMessage('Answers must be an array'),
  body('timeSpent')
    .isInt({ min: 0 })
    .withMessage('Time spent must be a positive integer')
], asyncHandler(async (req: AuthRequest, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const { answers, timeSpent } = req.body;

  const quiz = await Quiz.findById(id);
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found',
      error: 'Quiz does not exist'
    });
  }

  // Verify content ownership
  const content = await Content.findOne({
    _id: quiz.contentId,
    userId: req.user!._id
  });

  if (!content) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
      error: 'You do not have access to this quiz'
    });
  }

  // Add attempt to quiz
  await quiz.addAttempt(req.user!._id, answers, timeSpent);

  res.json({
    success: true,
    message: 'Quiz attempt submitted successfully',
    data: {
      score: quiz.attempts[quiz.attempts.length - 1].score,
      totalAttempts: quiz.attempts.length
    }
  });
}));

export default router;
