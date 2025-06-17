# 🚀 Freemium Model Setup Guide

The Night City 2088 Text RPG now includes a freemium model that allows users to try the game for free before upgrading to premium access.

## 📋 Overview

The freemium model provides:
- **🆓 Free Tier**: 5 messages per day using a shared API key
- **👑 Premium Tier**: Unlimited access via subscription or personal API key
- **🔄 Seamless Transition**: Easy upgrade path for users

## 🏗️ Architecture

### Frontend Components
- `ApiKeySettings.tsx` - Updated to explain freemium options
- `UsageStatusDisplay.tsx` - Shows current usage and upgrade options
- `PremiumUpgrade.tsx` - Handles premium upgrade flow
- `App.tsx` - Integrated freemium logic and UI

### Backend Services
- `services/freemiumService.ts` - Frontend API client for freemium features
- `backend/` - Express server with SQLite database and Stripe integration

### Core Services
- `services/geminiService.ts` - Enhanced with freemium API routing

## 🔧 Setup Instructions

### 1. Backend Setup

Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create your environment file:
```bash
cp .env.example .env
```

Configure your `.env` file:
```env
# Required: Your Google Gemini API key for shared usage
GEMINI_API_KEY=your_gemini_api_key_here

# Required: Stripe keys for premium upgrades
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Optional: Customize limits and pricing
DAILY_FREE_LIMIT=5
PREMIUM_PRICE_USD=2.99
```

Initialize the database and start the server:
```bash
npm run dev
```

The backend will be available at `http://localhost:3001`

### 2. Frontend Configuration

In the main project directory, update your `.env` file:
```env
# Point to your backend API
VITE_API_URL=http://localhost:3001

# Optional: Your own Gemini API key for development
VITE_GEMINI_API_KEY=your_development_api_key
```

## 🎮 User Experience Flow

### New User Journey
1. **First Visit**: User sees API key modal with freemium explanation
2. **Free Trial**: User clicks "Continue with Free Tier" to start with 5 free messages
3. **Usage Tracking**: Usage status display shows remaining messages
4. **Upgrade Prompt**: When limit reached, premium upgrade modal appears
5. **Premium Access**: After upgrade, user gets unlimited access

### Existing User Journey
1. **API Key Users**: Users with existing API keys continue with unlimited access
2. **Migration Option**: Can switch to freemium if they remove their API key

## 📊 Backend API Endpoints

### User Status
```
POST /api/user/status
{
  "fingerprint": "user_device_fingerprint"
}
```

### Send Chat Message
```
POST /api/gemini/chat
{
  "messages": [...],
  "systemInstruction": "...",
  "temperature": 0.7,
  "fingerprint": "user_device_fingerprint"
}
```

### Generate Image
```
POST /api/gemini/generate-image
{
  "prompt": "...",
  "fingerprint": "user_device_fingerprint"
}
```

### Create Checkout Session
```
POST /api/create-checkout-session
{
  "fingerprint": "user_device_fingerprint"
}
```

## 🛡️ Security Features

### User Identification
- Device fingerprinting based on browser characteristics
- No personal data collection required
- Anonymous usage tracking

### API Key Protection
- User API keys stored locally only
- Shared API key secured on backend
- No API keys exposed in frontend code

### Rate Limiting
- Daily usage limits enforced per device fingerprint
- Premium users bypass all limits
- Graceful degradation when limits exceeded

## 💰 Monetization

### Stripe Integration
- Secure payment processing
- Subscription management
- Webhook handling for real-time updates

### Pricing Model
- Free tier: 5 messages/day
- Premium: $2.99/month unlimited
- Own API key: Unlimited (user pays Google directly)

## 🔍 Monitoring & Analytics

### Usage Tracking
- Daily message counts per user
- Premium conversion rates
- API usage costs

### Database Schema
```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fingerprint TEXT UNIQUE NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Usage table
CREATE TABLE daily_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  date DATE,
  message_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 🚀 Deployment

### Backend Deployment
1. Deploy Express server to your hosting platform
2. Configure environment variables
3. Set up SSL for secure API communication
4. Configure Stripe webhook endpoints

### Frontend Deployment
1. Update `VITE_API_URL` to production backend URL
2. Build and deploy frontend
3. Ensure CORS is properly configured

## 🧪 Testing

### Running Tests
```bash
npm test
```

### Test Coverage
- Frontend components with freemium integration
- Backend API endpoints
- User flow scenarios
- Error handling

## 📈 Success Metrics

### Key Performance Indicators
- **Conversion Rate**: Free to premium user conversion
- **Daily Active Users**: Engagement metrics
- **Revenue**: Monthly recurring revenue
- **Cost Management**: API usage vs. revenue

### Optimization Opportunities
- A/B testing upgrade prompts
- Adjusting free tier limits
- Premium feature enhancements
- User onboarding improvements

## 🛠️ Development Notes

### Code Organization
- Freemium logic isolated in dedicated services
- Clean separation between free and premium features
- Backwards compatibility with existing API key users

### Scaling Considerations
- Database optimization for high user volumes
- Caching strategies for usage data
- Load balancing for backend services

## 📞 Support

### Common Issues
- Backend connection errors
- Stripe configuration problems
- Database initialization issues

### Troubleshooting
1. Check backend server status
2. Verify environment variables
3. Review browser console for errors
4. Test API endpoints directly

---

This freemium model provides a smooth path for users to discover the value of Night City 2088 while building a sustainable revenue stream for continued development.
   
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
