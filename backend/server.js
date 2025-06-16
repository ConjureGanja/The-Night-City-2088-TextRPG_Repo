import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { 
  getOrCreateUser, 
  getUserUsageToday, 
  incrementUserUsage, 
  isUserPremium 
} from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'middleware',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

const rateLimitMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({ error: 'Too many requests' });
  }
};

app.use(rateLimitMiddleware);

// Initialize Gemini AI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Freemium limits
const FREE_TIER_LIMIT = 5; // 5 requests per day for free users

// Helper function to generate browser fingerprint
const generateFingerprint = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const ip = req.ip || req.connection.remoteAddress;
  
  // Simple fingerprint - in production, use a proper fingerprinting library
  return Buffer.from(`${userAgent}${acceptLanguage}${acceptEncoding}${ip}`).toString('base64');
};

// Middleware to check usage limits
const checkUsageLimit = async (req, res, next) => {
  try {
    const fingerprint = req.body.fingerprint || generateFingerprint(req);
    const user = await getOrCreateUser(fingerprint);
    
    req.user = user;
    
    // If user is premium, allow unlimited access
    if (isUserPremium(user)) {
      return next();
    }
    
    // Check free tier usage
    const usage = getUserUsageToday(user.id);
    if (usage.total_requests >= FREE_TIER_LIMIT) {
      return res.status(402).json({
        error: 'Free tier limit exceeded',
        message: `You've used ${usage.total_requests}/${FREE_TIER_LIMIT} free requests today. Upgrade to premium for unlimited access!`,
        upgradeUrl: '/api/create-checkout-session'
      });
    }
    
    next();
  } catch (error) {
    console.error('Usage check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'Night City 2088 API' });
});

// Get user status
app.post('/api/user/status', async (req, res) => {
  try {
    const fingerprint = req.body.fingerprint || generateFingerprint(req);
    const user = await getOrCreateUser(fingerprint);
    const usage = getUserUsageToday(user.id);
    
    res.json({
      isPremium: isUserPremium(user),
      usageToday: usage.total_requests,
      limit: FREE_TIER_LIMIT,
      remaining: Math.max(0, FREE_TIER_LIMIT - usage.total_requests)
    });
  } catch (error) {
    console.error('User status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Gemini API proxy endpoints
app.post('/api/gemini/chat', checkUsageLimit, async (req, res) => {
  try {
    const { messages, systemInstruction, temperature = 0.7 } = req.body;
    
    const chat = genAI.chats.create({
      model: 'gemini-1.5-flash',
      config: {
        systemInstruction,
        temperature,
        topP: 0.8,
        topK: 40,
      },
    });
    
    const response = await chat.send(messages[messages.length - 1].content);
    
    // Log usage
    incrementUserUsage(req.user.id, 'chat', response.usage?.totalTokens || 0);
    
    res.json({
      response: response.text(),
      usage: response.usage
    });
    
  } catch (error) {
    console.error('Gemini chat error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

app.post('/api/gemini/generate-image', checkUsageLimit, async (req, res) => {
  try {
    const { prompt, model = 'gemini-1.5-flash' } = req.body;
    
    const genModel = genAI.getGenerativeModel({ model });
    const response = await genModel.generateContent([prompt]);
    
    // Log usage
    incrementUserUsage(req.user.id, 'image-generation', response.usage?.totalTokens || 0);
    
    res.json({
      response: response.response.text(),
      usage: response.usage
    });
    
  } catch (error) {
    console.error('Gemini image generation error:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

// Stripe payment integration (basic setup)
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    // This is where you'd integrate with Stripe
    // For now, return a placeholder
    res.json({
      message: 'Payment integration coming soon!',
      pricing: {
        monthly: '$9.99/month',
        yearly: '$99.99/year (2 months free!)'
      }
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Night City 2088 API running on port ${PORT}`);
  console.log(`📊 Free tier limit: ${FREE_TIER_LIMIT} requests per day`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
});
