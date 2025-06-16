# Night City 2088 - Freemium Setup Guide

This guide explains how to set up the freemium model for your Night City 2088 game where users get 5 free API calls per day using your API key, then can upgrade to premium for unlimited access.

## Architecture Overview

- **Frontend**: React app (existing)
- **Backend**: Node.js/Express API that proxies Gemini requests
- **Database**: SQLite for user tracking and usage limits
- **Payment**: Stripe integration (coming soon)

## Setup Instructions

### 1. Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your actual values:
   ```env
   PORT=3001
   NODE_ENV=development
   GEMINI_API_KEY=your_actual_gemini_api_key
   JWT_SECRET=your_super_secret_jwt_key_here
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start the backend server:**
   ```bash
   npm run dev
   ```

### 2. Frontend Setup

1. **Update your frontend .env.local:**
   ```env
   # Your personal API key (optional, for fallback)
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Backend API URL
   VITE_API_URL=http://localhost:3001
   ```

2. **Start the frontend:**
   ```bash
   npm run dev
   ```

## How It Works

### Free Tier (5 requests/day)
- Users are identified by browser fingerprint
- No account creation required
- Uses your Gemini API key
- SQLite database tracks daily usage per user
- Rate limiting and abuse protection

### Premium Tier (Unlimited)
- Stripe payment integration
- JWT-based session management
- No daily limits
- Priority processing

### User Experience
1. **First-time users**: Get 5 free requests automatically
2. **Returning users**: See usage status and remaining requests
3. **Limit reached**: Clear upgrade prompt with pricing
4. **Premium users**: Unlimited access with special UI indicators

## Usage Tracking

The system tracks:
- Daily request counts per user
- Token usage (for cost analysis)
- API endpoint usage
- User progression through free → premium

## Security Features

- Rate limiting (100 requests/minute per IP)
- CORS protection
- Helmet security headers
- API key protection (never sent to frontend)
- Input validation and sanitization

## Monetization Strategy

### Pricing Suggestions
- **Free**: 5 requests/day
- **Premium Monthly**: $9.99/month
- **Premium Yearly**: $99.99/year (2 months free)

### Additional Premium Features
- Unlimited AI requests
- Priority processing
- Advanced character customization
- Exclusive storylines
- Save/load game states
- Multiple character slots

## API Endpoints

### User Management
- `POST /api/user/status` - Get user usage status
- `POST /api/create-checkout-session` - Start premium upgrade

### Gemini Proxy
- `POST /api/gemini/chat` - Send chat messages
- `POST /api/gemini/generate-image` - Generate images

### Utilities
- `GET /api/health` - Health check

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  fingerprint TEXT UNIQUE,
  email TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  subscription_type TEXT DEFAULT 'free',
  subscription_expires DATETIME,
  stripe_customer_id TEXT
);
```

### Usage Tracking
```sql
CREATE TABLE daily_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  date TEXT,
  total_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);
```

## Deployment

### Development
- Frontend: `npm run dev` (port 5173)
- Backend: `npm run dev` (port 3001)

### Production
- Frontend: Deploy to Vercel/Netlify
- Backend: Deploy to Railway/Heroku/DigitalOcean
- Database: Use PostgreSQL for production
- Environment: Set all production environment variables

## Next Steps

1. **Stripe Integration**: Complete payment processing
2. **Email System**: Welcome emails and usage notifications  
3. **Analytics**: Track conversion rates and usage patterns
4. **A/B Testing**: Test different free tier limits
5. **Advanced Features**: Premium-only game content

## Support

For questions about the freemium setup:
1. Check the backend logs for API errors
2. Verify environment variables are set correctly
3. Test the health endpoint: `http://localhost:3001/api/health`
4. Monitor the database for usage tracking

## Cost Analysis

With your current setup:
- **Free users**: 5 requests × ~1000 tokens = ~5k tokens/day per user
- **Gemini pricing**: ~$0.075 per 1k tokens
- **Cost per free user**: ~$0.375/day maximum
- **Break-even**: Need premium subscribers to offset free usage

**Example**: If 100 free users max out daily (unlikely), cost = $37.50/day
Premium subscription at $9.99/month = $0.33/day per subscriber
Need ~114 premium users to break even on 100 maxed-out free users.
