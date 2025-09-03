# TurboLearn AI

An AI-powered learning assistant for students and professionals that helps organize, summarize, and create interactive learning materials from various content sources.

## Features

- 📚 **Document Upload**: Support for PDFs, text files, and lecture notes
- 🎥 **Video Integration**: YouTube video processing and summarization
- 🌐 **Web Content**: Article extraction and processing
- 🤖 **AI-Powered Analysis**: Automatic generation of summaries, flashcards, and quizzes
- 💬 **AI Tutor**: Interactive chatbot for Q&A about uploaded content
- 📊 **Dashboard**: Personal learning dashboard with organized materials
- 🔐 **Authentication**: Secure user registration and login
- 📱 **Responsive Design**: Modern, mobile-friendly interface

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- React Query for state management
- Socket.io-client for real-time chat

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT for authentication
- Multer for file uploads
- Socket.io for real-time features
- OpenAI API integration

### AI & Processing
- OpenAI GPT-4 for content analysis
- pdf-parse for PDF processing
- youtube-dl for video processing
- cheerio for web scraping

## Project Structure

```
TurboLearnAI/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions
│   └── public/
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   └── uploads/           # File upload directory
├── shared/                 # Shared types and utilities
└── docs/                  # Documentation
```

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- OpenAI API key
- YouTube Data API key (optional)

### Installation

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd TurboLearnAI
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd server
   npm install
   
   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend environment variables
   cd server
   cp .env.example .env
   # Edit .env with your API keys and database URL
   
   # Frontend environment variables
   cd ../client
   cp .env.example .env
   # Edit .env with your backend API URL
   ```

4. **Start the application**
   ```bash
   # Start backend (from server directory)
   npm run dev
   
   # Start frontend (from client directory)
   npm start
   ```

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/turbolearn
JWT_SECRET=your-super-secret-jwt-key
OPENAI_API_KEY=your-openai-api-key
YOUTUBE_API_KEY=your-youtube-api-key
NODE_ENV=development
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Content Management
- `POST /api/content/upload` - Upload documents
- `POST /api/content/url` - Process web content
- `POST /api/content/youtube` - Process YouTube videos
- `GET /api/content` - Get user's content
- `DELETE /api/content/:id` - Delete content

### AI Features
- `POST /api/ai/summarize` - Generate summaries
- `POST /api/ai/flashcards` - Generate flashcards
- `POST /api/ai/quiz` - Generate quizzes
- `POST /api/ai/chat` - AI tutor chat

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
