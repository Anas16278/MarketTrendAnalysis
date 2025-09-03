import express from 'express';
import multer from 'multer';
import path from 'path';
import { body, validationResult } from 'express-validator';
import { Content } from '../models/Content';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, FileUploadRequest } from '../types';
import ContentService from '../services/contentService';
import AIService from '../services/aiService';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const contentService = ContentService.getInstance();
    if (contentService.isValidFileType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word documents, and text files are allowed.'));
    }
  }
});

// @route   POST /api/content/upload
// @desc    Upload and process a document
// @access  Private
router.post('/upload', authenticateToken, upload.single('file'), asyncHandler(async (req: FileUploadRequest, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
      error: 'Please select a file to upload'
    });
  }

  const { title, subjects, tags } = req.body;
  const contentService = ContentService.getInstance();
  const aiService = AIService.getInstance();

  try {
    // Process the uploaded file
    const processedContent = await contentService.processFile(req.file.path, req.file.mimetype);
    
    // Generate summary using AI
    const summary = await aiService.generateSummary(processedContent.content);
    
    // Extract concepts for tags if not provided
    const extractedTags = tags ? tags.split(',').map((tag: string) => tag.trim()) : 
                               contentService.extractConcepts(processedContent.content);

    // Create content record
    const content = new Content({
      userId: req.user!._id,
      title: title || req.file.originalname,
      type: 'document',
      source: req.file.originalname,
      content: processedContent.content,
      summary: summary.summary,
      subjects: subjects ? subjects.split(',').map((subject: string) => subject.trim()) : [],
      tags: extractedTags,
      metadata: {
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        ...processedContent.metadata
      }
    });

    await content.save();

    res.status(201).json({
      success: true,
      message: 'Document uploaded and processed successfully',
      data: {
        content: {
          _id: content._id,
          title: content.title,
          type: content.type,
          summary: content.summary,
          subjects: content.subjects,
          tags: content.tags,
          metadata: content.metadata,
          createdAt: content.createdAt
        }
      }
    });

  } catch (error) {
    // Clean up uploaded file if processing fails
    if (req.file) {
      const fs = require('fs');
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
}));

// @route   POST /api/content/url
// @desc    Process content from URL
// @access  Private
router.post('/url', authenticateToken, [
  body('url')
    .isURL()
    .withMessage('Please provide a valid URL'),
  body('title')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('subjects')
    .optional()
    .isArray()
    .withMessage('Subjects must be an array')
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

  const { url, title, subjects } = req.body;
  const contentService = ContentService.getInstance();
  const aiService = AIService.getInstance();

  // Process the web article
  const articleInfo = await contentService.processWebArticle(url);
  
  // Generate summary using AI
  const summary = await aiService.generateSummary(articleInfo.content);
  
  // Extract concepts for tags
  const extractedTags = contentService.extractConcepts(articleInfo.content);

  // Create content record
  const content = new Content({
    userId: req.user!._id,
    title: title || articleInfo.title,
    type: 'article',
    source: url,
    content: articleInfo.content,
    summary: summary.summary,
    subjects: subjects || [],
    tags: extractedTags,
    metadata: {
      author: articleInfo.author,
      publishedDate: articleInfo.publishedDate,
      url: articleInfo.url,
      readingTime: articleInfo.readingTime
    }
  });

  await content.save();

  res.status(201).json({
    success: true,
    message: 'Article processed successfully',
    data: {
      content: {
        _id: content._id,
        title: content.title,
        type: content.type,
        summary: content.summary,
        subjects: content.subjects,
        tags: content.tags,
        metadata: content.metadata,
        createdAt: content.createdAt
      }
    }
  });
}));

// @route   POST /api/content/youtube
// @desc    Process YouTube video
// @access  Private
router.post('/youtube', authenticateToken, [
  body('videoUrl')
    .isURL()
    .withMessage('Please provide a valid YouTube URL'),
  body('title')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('subjects')
    .optional()
    .isArray()
    .withMessage('Subjects must be an array')
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

  const { videoUrl, title, subjects } = req.body;
  const contentService = ContentService.getInstance();
  const aiService = AIService.getInstance();

  // Process the YouTube video
  const videoInfo = await contentService.processYouTubeVideo(videoUrl);
  
  // Generate summary using AI
  const summary = await aiService.generateSummary(videoInfo.description);
  
  // Extract concepts for tags
  const extractedTags = contentService.extractConcepts(videoInfo.description);

  // Create content record
  const content = new Content({
    userId: req.user!._id,
    title: title || videoInfo.title,
    type: 'video',
    source: videoUrl,
    content: videoInfo.description,
    summary: summary.summary,
    subjects: subjects || [],
    tags: extractedTags,
    metadata: {
      author: videoInfo.author,
      publishedDate: videoInfo.publishedDate,
      url: videoUrl,
      duration: videoInfo.duration
    }
  });

  await content.save();

  res.status(201).json({
    success: true,
    message: 'YouTube video processed successfully',
    data: {
      content: {
        _id: content._id,
        title: content.title,
        type: content.type,
        summary: content.summary,
        subjects: content.subjects,
        tags: content.tags,
        metadata: content.metadata,
        createdAt: content.createdAt
      }
    }
  });
}));

// @route   GET /api/content
// @desc    Get user's content with pagination and filters
// @access  Private
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const type = req.query.type as string;
  const subjects = req.query.subjects as string;
  const tags = req.query.tags as string;
  const search = req.query.search as string;

  const options: any = {
    page,
    limit,
    type,
    subjects: subjects ? subjects.split(',') : undefined,
    tags: tags ? tags.split(',') : undefined,
    search
  };

  const content = await Content.findByUser(req.user!._id, options);
  const total = await Content.countDocuments({ userId: req.user!._id });

  res.json({
    success: true,
    message: 'Content retrieved successfully',
    data: {
      content,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
}));

// @route   GET /api/content/:id
// @desc    Get specific content by ID
// @access  Private
router.get('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const content = await Content.findOne({
    _id: req.params.id,
    userId: req.user!._id
  }).populate('flashcards').populate('quizzes');

  if (!content) {
    return res.status(404).json({
      success: false,
      message: 'Content not found',
      error: 'Content does not exist or you do not have access to it'
    });
  }

  res.json({
    success: true,
    message: 'Content retrieved successfully',
    data: { content }
  });
}));

// @route   PUT /api/content/:id
// @desc    Update content
// @access  Private
router.put('/:id', authenticateToken, [
  body('title')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('subjects')
    .optional()
    .isArray()
    .withMessage('Subjects must be an array'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
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

  const { title, subjects, tags } = req.body;

  const content = await Content.findOne({
    _id: req.params.id,
    userId: req.user!._id
  });

  if (!content) {
    return res.status(404).json({
      success: false,
      message: 'Content not found',
      error: 'Content does not exist or you do not have access to it'
    });
  }

  // Update fields
  if (title !== undefined) content.title = title;
  if (subjects !== undefined) content.subjects = subjects;
  if (tags !== undefined) content.tags = tags;

  await content.save();

  res.json({
    success: true,
    message: 'Content updated successfully',
    data: { content }
  });
}));

// @route   DELETE /api/content/:id
// @desc    Delete content
// @access  Private
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const content = await Content.findOne({
    _id: req.params.id,
    userId: req.user!._id
  });

  if (!content) {
    return res.status(404).json({
      success: false,
      message: 'Content not found',
      error: 'Content does not exist or you do not have access to it'
    });
  }

  await content.deleteOne();

  res.json({
    success: true,
    message: 'Content deleted successfully'
  });
}));

// @route   GET /api/content/stats
// @desc    Get content statistics
// @access  Private
router.get('/stats', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const stats = await Content.getStats(req.user!._id);

  res.json({
    success: true,
    message: 'Statistics retrieved successfully',
    data: { stats: stats[0] || {} }
  });
}));

export default router;
