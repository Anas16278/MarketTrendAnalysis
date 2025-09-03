import OpenAI from 'openai';
import { IAISummary, IAIFlashcards, IAIQuiz } from '../types';

// Initialize OpenAI client (optional)
let openai: OpenAI | null = null;

try {
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('placeholder')) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.warn('⚠️  OpenAI client not initialized - API key missing or invalid');
}

export class AIService {
  private static instance: AIService;
  private model: string;

  private constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Generate a summary from content
   */
  async generateSummary(content: string): Promise<IAISummary> {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    
    try {
      const prompt = `
        Please analyze the following content and provide:
        1. A comprehensive summary (2-3 paragraphs)
        2. 5-7 key points as bullet points
        3. Difficulty level (beginner, intermediate, or advanced)
        4. Estimated reading time in minutes

        Content:
        ${content.substring(0, 4000)} // Limit content length

        Please respond in the following JSON format:
        {
          "summary": "comprehensive summary here",
          "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
          "difficulty": "beginner|intermediate|advanced",
          "estimatedReadingTime": 5
        }
      `;

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content analyzer. Provide clear, accurate, and educational summaries.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
        temperature: 0.3
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from AI service');
      }

      // Parse JSON response
      const parsed = JSON.parse(result);
      return {
        summary: parsed.summary,
        keyPoints: parsed.keyPoints,
        difficulty: parsed.difficulty,
        estimatedReadingTime: parsed.estimatedReadingTime
      };

    } catch (error) {
      console.error('❌ Error generating summary:', error);
      throw new Error('Failed to generate summary');
    }
  }

  /**
   * Generate flashcards from content
   */
  async generateFlashcards(content: string, count: number = 10): Promise<IAIFlashcards> {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    
    try {
      const prompt = `
        Create ${count} educational flashcards from the following content.
        Each flashcard should have:
        - A clear, specific question
        - A concise, accurate answer
        - Appropriate difficulty level (easy, medium, hard)
        - Relevant tags

        Content:
        ${content.substring(0, 4000)}

        Please respond in the following JSON format:
        {
          "flashcards": [
            {
              "question": "What is...?",
              "answer": "The answer is...",
              "difficulty": "easy|medium|hard",
              "tags": ["tag1", "tag2"]
            }
          ]
        }
      `;

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator creating effective flashcards for learning. Focus on key concepts and important details.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
        temperature: 0.4
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from AI service');
      }

      const parsed = JSON.parse(result);
      return {
        flashcards: parsed.flashcards
      };

    } catch (error) {
      console.error('❌ Error generating flashcards:', error);
      throw new Error('Failed to generate flashcards');
    }
  }

  /**
   * Generate a quiz from content
   */
  async generateQuiz(content: string, questionCount: number = 10): Promise<IAIQuiz> {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    
    try {
      const prompt = `
        Create a comprehensive quiz with ${questionCount} questions from the following content.
        
        Requirements:
        - Mix of question types: multiple-choice, true/false, short-answer
        - Each question should have clear, unambiguous answers
        - Include explanations for correct answers
        - Questions should test understanding, not just memorization
        - Appropriate difficulty distribution

        Content:
        ${content.substring(0, 4000)}

        Please respond in the following JSON format:
        {
          "title": "Quiz Title",
          "description": "Quiz description",
          "questions": [
            {
              "question": "What is...?",
              "type": "multiple-choice|true-false|short-answer",
              "options": ["option1", "option2", "option3", "option4"],
              "correctAnswer": "correct answer",
              "explanation": "Why this is correct",
              "points": 1
            }
          ],
          "timeLimit": 15,
          "passingScore": 70
        }
      `;

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator creating comprehensive quizzes. Focus on testing understanding and application of concepts.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
        temperature: 0.3
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from AI service');
      }

      const parsed = JSON.parse(result);
      return {
        title: parsed.title,
        description: parsed.description,
        questions: parsed.questions,
        timeLimit: parsed.timeLimit,
        passingScore: parsed.passingScore
      };

    } catch (error) {
      console.error('❌ Error generating quiz:', error);
      throw new Error('Failed to generate quiz');
    }
  }

  /**
   * Chat with AI about specific content
   */
  async chatWithContent(userMessage: string, content: string): Promise<string> {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    
    try {
      const prompt = `
        You are an AI tutor helping a student understand the following content.
        The student asks: "${userMessage}"
        
        Content for reference:
        ${content.substring(0, 3000)}
        
        Please provide a helpful, educational response that:
        1. Directly addresses the student's question
        2. References the content when relevant
        3. Provides clear explanations
        4. Encourages further learning
        5. Is conversational but professional
        
        Keep your response under 300 words.
      `;

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable and patient AI tutor. Help students understand concepts clearly and encourage their learning journey.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from AI service');
      }

      return result;

    } catch (error) {
      console.error('❌ Error in AI chat:', error);
      throw new Error('Failed to process chat message');
    }
  }

  /**
   * Extract key concepts from content
   */
  async extractKeyConcepts(content: string): Promise<string[]> {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    
    try {
      const prompt = `
        Extract 10-15 key concepts or topics from the following content.
        Return them as a simple list, one concept per line.
        
        Content:
        ${content.substring(0, 3000)}
      `;

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at identifying key concepts and topics in educational content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.2
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from AI service');
      }

      // Parse the list into an array
      return result
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('-') && !line.startsWith('•'))
        .slice(0, 15);

    } catch (error) {
      console.error('❌ Error extracting concepts:', error);
      throw new Error('Failed to extract key concepts');
    }
  }
}

export default AIService.getInstance();
