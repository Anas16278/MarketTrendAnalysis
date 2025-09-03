import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ContentProcessingResult, YouTubeVideoInfo, WebArticleInfo } from '../types';

export class ContentService {
  private static instance: ContentService;

  private constructor() {}

  public static getInstance(): ContentService {
    if (!ContentService.instance) {
      ContentService.instance = new ContentService();
    }
    return ContentService.instance;
  }

  /**
   * Process uploaded file and extract text content
   */
  async processFile(filePath: string, mimeType: string): Promise<ContentProcessingResult> {
    try {
      let content = '';
      let metadata: any = {};

      switch (mimeType) {
        case 'application/pdf':
          const result = await this.processPDF(filePath);
          content = result.content;
          metadata = result.metadata;
          break;

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          const docResult = await this.processWordDocument(filePath);
          content = docResult.content;
          metadata = docResult.metadata;
          break;

        case 'text/plain':
        case 'text/markdown':
          content = await this.processTextFile(filePath);
          break;

        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }

      return {
        content: content.trim(),
        metadata: {
          ...metadata,
          wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
          readingTime: Math.ceil(content.split(/\s+/).filter(word => word.length > 0).length / 200)
        }
      };

    } catch (error) {
      console.error('❌ Error processing file:', error);
      throw new Error('Failed to process file');
    }
  }

  /**
   * Process PDF file
   */
  private async processPDF(filePath: string): Promise<ContentProcessingResult> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      
      return {
        content: data.text,
        metadata: {
          title: data.info?.Title || '',
          author: data.info?.Author || '',
          pages: data.numpages,
          wordCount: data.text.split(/\s+/).filter(word => word.length > 0).length
        }
      };
    } catch (error) {
      console.error('❌ Error processing PDF:', error);
      throw new Error('Failed to process PDF file');
    }
  }

  /**
   * Process Word document
   */
  private async processWordDocument(filePath: string): Promise<ContentProcessingResult> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      
      return {
        content: result.value,
        metadata: {
          wordCount: result.value.split(/\s+/).filter(word => word.length > 0).length
        }
      };
    } catch (error) {
      console.error('❌ Error processing Word document:', error);
      throw new Error('Failed to process Word document');
    }
  }

  /**
   * Process text file
   */
  private async processTextFile(filePath: string): Promise<string> {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.error('❌ Error processing text file:', error);
      throw new Error('Failed to process text file');
    }
  }

  /**
   * Extract content from web article
   */
  async processWebArticle(url: string): Promise<WebArticleInfo> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Remove script and style elements
      $('script, style, nav, header, footer, .ad, .advertisement').remove();

      // Extract title
      const title = $('title').text().trim() || 
                   $('h1').first().text().trim() || 
                   $('meta[property="og:title"]').attr('content') || 
                   'Untitled Article';

      // Extract main content
      let content = '';
      
      // Try to find main content area
      const mainSelectors = [
        'article',
        '.content',
        '.post-content',
        '.entry-content',
        '.article-content',
        'main',
        '.main-content'
      ];

      for (const selector of mainSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text().trim();
          break;
        }
      }

      // If no main content found, use body text
      if (!content) {
        content = $('body').text().trim();
      }

      // Clean up content
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

      // Extract author
      const author = $('meta[name="author"]').attr('content') ||
                    $('.author').text().trim() ||
                    $('[rel="author"]').text().trim() ||
                    'Unknown Author';

      // Extract published date
      const publishedDate = $('meta[property="article:published_time"]').attr('content') ||
                           $('meta[name="date"]').attr('content') ||
                           $('.date').text().trim() ||
                           new Date().toISOString();

      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      const readingTime = Math.ceil(wordCount / 200);

      return {
        title,
        content,
        author,
        publishedDate: new Date(publishedDate),
        url,
        readingTime
      };

    } catch (error) {
      console.error('❌ Error processing web article:', error);
      throw new Error('Failed to process web article');
    }
  }

  /**
   * Process YouTube video (placeholder - implement with YouTube API)
   */
  async processYouTubeVideo(videoUrl: string): Promise<YouTubeVideoInfo> {
    try {
      // This is a placeholder implementation
      // You should integrate with YouTube Data API v3
      // For now, return mock data
      
      const videoId = this.extractYouTubeVideoId(videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // TODO: Implement actual YouTube API integration
      // const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${process.env.YOUTUBE_API_KEY}&part=snippet,contentDetails`);
      
      return {
        title: 'YouTube Video Title',
        description: 'Video description will be extracted here',
        duration: 600, // in seconds
        author: 'Video Author',
        publishedDate: new Date(),
        transcript: 'Video transcript will be extracted here'
      };

    } catch (error) {
      console.error('❌ Error processing YouTube video:', error);
      throw new Error('Failed to process YouTube video');
    }
  }

  /**
   * Extract YouTube video ID from URL
   */
  private extractYouTubeVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Clean and normalize content
   */
  cleanContent(content: string): string {
    return content
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .replace(/[^\w\s\n.,!?;:()[\]{}"'`~@#$%^&*+=|\\<>/]/g, '') // Remove special characters
      .trim();
  }

  /**
   * Extract key concepts from content
   */
  extractConcepts(content: string): string[] {
    // Simple concept extraction - you can enhance this with NLP libraries
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Validate file type
   */
  isValidFileType(mimeType: string): boolean {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown'
    ];
    return allowedTypes.includes(mimeType);
  }

  /**
   * Get file size in MB
   */
  getFileSizeInMB(filePath: string): number {
    const stats = fs.statSync(filePath);
    return stats.size / (1024 * 1024);
  }
}

export default ContentService.getInstance();
