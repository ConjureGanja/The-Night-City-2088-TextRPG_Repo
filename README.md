# Night City 2088 - A Cyberpunk Text RPG

A cyberpunk text-based role-playing game set in Night City 2088, powered by Google's Gemini AI.

## Features

- Interactive cyberpunk narrative
- AI-powered storytelling with Google Gemini
- Character creation and progression
- Inventory management
- Visual cortex display system
- Audio controls and immersive experience

## Run Locally

**Prerequisites:** Node.js 16+

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd The-Night-City-2088-TextRPG_Repo
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` and add your Gemini API key:

   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

   Get your API key from: <https://aistudio.google.com/app/apikey>

4. **Run the development server:**

   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:5173`

## Alternative Setup (No API Key Required)

If you don't want to set up environment variables, you can:

1. Run the app without a `.env.local` file
2. Enter your Gemini API key directly in the app's settings panel
3. The key will be stored locally in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Freemium Model (Optional)

This game supports a freemium model where users get 5 free AI requests per day using your API key, then can upgrade to premium for unlimited access.

**To enable freemium mode:**

1. Set up the backend API (see [FREEMIUM_SETUP.md](FREEMIUM_SETUP.md))
2. Users automatically get 5 free requests per day
3. After limit is reached, they see an upgrade prompt
4. Premium users get unlimited access

**Benefits:**
- No barrier to entry for new users
- Your API key powers the free tier
- Built-in monetization and upgrade path
- Usage tracking and analytics

See [FREEMIUM_SETUP.md](FREEMIUM_SETUP.md) for detailed setup instructions.

## Production Deployment

Ready to deploy Night City 2088 to your website? We've got you covered:

### 📦 **[Complete Deployment Guide](DEPLOYMENT.md)**
Comprehensive guide for deploying to gpt-hq.com or any production server with:
- Step-by-step server setup
- Nginx configuration
- SSL certificate setup  
- Process management with PM2
- Security considerations
- Monitoring and maintenance

### 🐳 **[Docker Deployment](DOCKER_DEPLOYMENT.md)**
Containerized deployment using Docker and Docker Compose:
- Quick start with containers
- Production-ready configuration
- SSL support with Let's Encrypt
- Easy scaling and management

### 🚀 **Quick Deploy Script**
For automated deployment to gpt-hq.com:

```bash
# Download and run the deployment script
curl -sSL https://raw.githubusercontent.com/ConjureGanja/The-Night-City-2088-TextRPG_Repo/main/deploy-gpt-hq.sh | bash
```

Choose the deployment method that best fits your infrastructure and requirements!
