import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from '../types';

export const setupSocket = (io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.data.userId = decoded.userId;
      socket.data.username = decoded.username;
      
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.data.username} (${socket.data.userId})`);

    // Join user to their personal room
    socket.join(`user:${socket.data.userId}`);

    // Handle joining content-specific rooms
    socket.on('joinRoom', (roomId: string) => {
      socket.join(`content:${roomId}`);
      console.log(`👥 User ${socket.data.username} joined room: ${roomId}`);
      
      // Notify other users in the room
      socket.to(`content:${roomId}`).emit('userJoined', {
        _id: socket.data.userId,
        username: socket.data.username
      });
    });

    // Handle leaving rooms
    socket.on('leaveRoom', (roomId: string) => {
      socket.leave(`content:${roomId}`);
      console.log(`👋 User ${socket.data.username} left room: ${roomId}`);
      
      // Notify other users in the room
      socket.to(`content:${roomId}`).emit('userLeft', socket.data.userId);
    });

    // Handle chat messages
    socket.on('sendMessage', async (message) => {
      try {
        const { content, contentId } = message;
        
        // Process message with AI (you can implement this later)
        const aiResponse = await processMessageWithAI(content, contentId, socket.data.userId);
        
        const chatMessage = {
          _id: Date.now().toString(), // Simple ID for demo
          userId: socket.data.userId,
          contentId,
          message: content,
          response: aiResponse,
          type: contentId ? 'content-specific' : 'general',
          createdAt: new Date()
        };

        // Emit message to sender
        socket.emit('message', chatMessage);

        // If it's a content-specific message, emit to the content room
        if (contentId) {
          socket.to(`content:${contentId}`).emit('message', chatMessage);
        }

        console.log(`💬 Message from ${socket.data.username}: ${content.substring(0, 50)}...`);
        
      } catch (error) {
        console.error('❌ Error processing message:', error);
        socket.emit('message', {
          _id: Date.now().toString(),
          userId: 'system',
          message: 'Sorry, I encountered an error processing your message.',
          response: 'Please try again later.',
          type: 'general',
          createdAt: new Date()
        });
      }
    });

    // Handle typing indicators
    socket.on('typing', (isTyping: boolean) => {
      socket.broadcast.emit('typing', {
        userId: socket.data.userId,
        isTyping
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.data.username} (${socket.data.userId})`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  });

  console.log('✅ Socket.io setup complete');
};

// AI message processing function (placeholder - implement with your AI service)
const processMessageWithAI = async (message: string, contentId?: string, userId?: string): Promise<string> => {
  // This is a placeholder implementation
  // You should integrate with your AI service here (OpenAI, etc.)
  
  const responses = [
    "That's an interesting question! Let me help you understand this better.",
    "Great question! Based on the content, here's what I can tell you...",
    "I'd be happy to explain this concept further.",
    "This is a common point of confusion. Let me clarify...",
    "Excellent question! Here's what you need to know..."
  ];
  
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  return responses[Math.floor(Math.random() * responses.length)] + 
         " (This is a placeholder response. Replace with actual AI integration.)";
};

export default setupSocket;
