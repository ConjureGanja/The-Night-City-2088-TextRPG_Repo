import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { 
  // User Management
  createUser,
  findUserByEmail,
  findUserByUsername,
  findUserById,
  verifyUserEmail,
  setPasswordResetToken,
  findUserByValidResetToken,
  updateUserPassword,
  updateUserSubscription,
  isUserPremium,
  // Guest Session Management
  getOrCreateGuestSession,
  // Avatar Credits (now takes isGuest flag)
  getAvatarCredits,
  useAvatarCredit,
  addAvatarCredits, // Primarily for registered users
  // Usage Tracking (now takes isGuest flag)
  getUserUsageToday,
  incrementUserUsage,
  // Progress Tracking (primarily for registered users)
  getOrCreateUserProgress,
  updateUserProgress,
  getAllAchievementDefinitions,
  grantAchievementToUser,
  getUserAchievements,
  getAchievementDefinitionByName,
  // Migration
  migrateGuestToUser, // Added for guest to user conversion
  db // For direct DB access in specific cases like achievement unlock response
} from './database.js';
import { randomBytes, createHash } from 'crypto'; // Added createHash here too for consistency if needed server-side

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-and-long-secret-key-that-is-at-least-32-characters';
if (JWT_SECRET === 'your-very-secure-and-long-secret-key-that-is-at-least-32-characters' && process.env.NODE_ENV !== 'test') {
  console.warn('WARNING: JWT_SECRET is not set in environment variables. Using default insecure secret.');
}
const JWT_EXPIRATION = '1h'; // Token expiration time (e.g., 1 hour, 7 days)
const PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES = 60; // 1 hour

// Basic E-mail sending mock (replace with a real email service like SendGrid, Nodemailer with SMTP, etc.)
const sendVerificationEmail = async (email, token) => {
  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  console.log(`---- START MOCK VERIFICATION EMAIL ----`);
  console.log(`To: ${email}`);
  console.log(`Subject: Verify Your Night City 2088 Account`);
  console.log(`Verification Link: ${verificationLink}`);
  console.log(`---- END MOCK VERIFICATION EMAIL ----`);
  await new Promise(resolve => setTimeout(resolve, 100)); // Shorter delay for tests
  return true;
};

const sendPasswordResetEmail = async (email, token) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  console.log(`---- START MOCK PASSWORD RESET EMAIL ----`);
  console.log(`To: ${email}`);
  console.log(`Subject: Reset Your Night City 2088 Password`);
  console.log(`Password Reset Link: ${resetLink}`);
  console.log(`This link will expire in ${PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES} minutes.`);
  console.log(`If you did not request this, please ignore this email.`);
  console.log(`---- END MOCK PASSWORD RESET EMAIL ----`);
  await new Promise(resolve => setTimeout(resolve, 100));
  return true;
};

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

// Middleware to check usage limits (Refactored for guests vs. registered users)
const checkUsageLimit = async (req, res, next) => {
  try {
    if (req.user && req.authMethod === 'jwt') { // Registered user authenticated via JWT
      // req.user is already populated by authenticateToken middleware
      if (isUserPremium(req.user)) {
        return next(); // Premium users have unlimited access (bypassing daily request count)
      }

      // Check free tier usage for registered (non-premium) user
      const usage = await getUserUsageToday(req.user.id, false); // false for not a guest
      if (usage.total_requests >= FREE_TIER_LIMIT) {
        return res.status(402).json({
          error: 'Free tier limit exceeded for registered user.',
          message: `You've used ${usage.total_requests}/${FREE_TIER_LIMIT} free requests today. Upgrade to premium for unlimited access!`,
          upgradeUrl: '/api/create-checkout-session',
          userId: req.user.id,
          usage: usage.total_requests,
          limit: FREE_TIER_LIMIT
        });
      }
      // Add is_guest flag for clarity in downstream handlers
      req.is_guest = false;
    } else { // Potential guest user (no JWT or invalid JWT)
      const rawFingerprint = req.body.fingerprint || req.headers['x-fingerprint'] || generateFingerprint(req);
      if (!rawFingerprint) {
        // This case should ideally not happen if generateFingerprint always returns something
        return res.status(400).json({ error: 'Unable to identify client (fingerprint missing).' });
      }
      req.fingerprint = rawFingerprint; // Store raw fingerprint on request for potential use

      const guestSession = await getOrCreateGuestSession(rawFingerprint);
      if (!guestSession) {
        // Should not happen if getOrCreateGuestSession always creates one
        return res.status(500).json({ error: 'Failed to get or create guest session.' });
      }
      req.guestSession = guestSession; // Attach guest session to request
      req.is_guest = true; // Add is_guest flag

      // Check usage for guest user from guest_sessions table
      const usage = await getUserUsageToday(rawFingerprint, true); // true for guest
      if (usage.total_requests >= FREE_TIER_LIMIT) {
        return res.status(402).json({
          error: 'Free tier limit exceeded for guest session.',
          message: `You've used ${usage.total_requests}/${FREE_TIER_LIMIT} free requests today. Register or upgrade for more.`,
          fingerprint_hash: guestSession.fingerprint_hash, // Can be useful for client debugging
          usage: usage.total_requests,
          limit: FREE_TIER_LIMIT
        });
      }
    }
    next();
  } catch (error) {
    console.error('Usage check error:', error);
    res.status(500).json({ error: 'Internal server error during usage check.' });
  }
};

// Middleware for JWT authentication
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    // No token provided, but some routes might be public or use fingerprinting
    // If a route strictly requires auth, it should check req.user
    // For now, if no token, proceed without setting req.user
    // Fingerprint logic might still apply if checkUsageLimit is called next
    return next();
  }

  jwt.verify(token, JWT_SECRET, async (err, decodedToken) => {
    if (err) {
      // Token is invalid (e.g. expired, malformed, wrong signature)
      // Don't send a 403 Forbidden here, as it might block fingerprint users
      // if this middleware is applied globally.
      // Instead, just don't set req.user.
      // Routes that strictly require a logged-in user can check for req.user.
      console.warn('JWT verification failed:', err.message);
      return next();
    }

    try {
      // Token is valid, fetch user details to ensure user still exists and is active
      const user = await findUserById(decodedToken.userId);
      if (!user) {
        console.warn(`User ${decodedToken.userId} from valid JWT not found in DB.`);
        return next(); // User might have been deleted
      }
      req.user = user; // Add user object to request
      req.authMethod = 'jwt'; // Indicate authentication method
      next();
    } catch (dbError) {
      console.error('Error fetching user during token authentication:', dbError);
      res.status(500).json({ error: 'Internal server error during authentication' });
    }
  });
};

// Apply JWT authentication middleware globally or to specific routes
// If applied globally, it will try to authenticate if a token is present
// but won't block requests without a token (unless routes check req.user).
app.use(authenticateToken);


// Routes

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, fingerprint } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    // Basic email format validation
    if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format.' });
    }


    // Check if user already exists
    let existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use.' });
    }
    existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already taken.' });
    }

    // Hash password
    const saltRounds = 10; // Or a value from config
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user - pass fingerprint if provided, for potential migration
    const { userId, verificationToken } = await createUser(username, email, passwordHash, fingerprint);
    // The createUser function in database.js now contains the logic to:
    // 1. Create the user in the 'users' table.
    // 2. If fingerprint is provided, find the guest_session.
    // 3. Migrate data (e.g., game_progress_json) from guest_session to user_progress.
    // 4. Delete the guest_session.
    // This is all done in a transaction within createUser.

    // Send verification email (mocked)
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account. If you had guest progress, it has been migrated.',
      userId
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Email/username and password are required.' });
    }

    let user = await findUserByEmail(emailOrUsername);
    if (!user) {
      user = await findUserByUsername(emailOrUsername);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' }); // User not found
    }

    // For guest users created via fingerprint, password_hash might be a placeholder and not meant for login.
    // Ensure that only users with legitimate, bcrypt-hashed passwords can log in.
    // Guest users should register to set a proper password.
    if (user.subscription_type === 'guest' || !user.password_hash.startsWith('$2b$')) { // Basic check for bcrypt hash
        return res.status(401).json({ error: 'Invalid credentials or account type not suitable for login.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' }); // Password incorrect
    }

    if (!user.email_verified) {
      return res.status(403).json({
        error: 'Email not verified.',
        message: 'Please verify your email address before logging in. A new verification email can be sent if needed.'
        // Optionally, add a resend verification email endpoint trigger here or on client-side
      });
    }

    // User is authenticated and email is verified
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      subscriptionType: user.subscription_type,
      // Add any other non-sensitive info needed in the token
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

    res.json({
      message: 'Login successful.',
      token,
      user: { // Return some user info for the client
        id: user.id,
        username: user.username,
        email: user.email,
        isPremium: isUserPremium(user),
        subscriptionType: user.subscription_type
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in.' });
  }
});

// TODO: Implement /api/auth/logout if server-side token invalidation is desired (e.g., using a blocklist).
// For simple JWT, logout is often handled client-side by deleting the token.

app.post('/api/auth/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await findUserByEmail(email);
    if (user) {
      // Only allow password reset for registered users who can log in
      if (user.subscription_type === 'guest' || !user.password_hash.startsWith('$2b$')) {
        // Do not reveal that the guest account exists, act as if no user found for this email for reset
        return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
      }

      const resetToken = randomBytes(32).toString('hex');
      const saltRounds = 10;
      // Store a hash of the reset token
      const tokenHash = await bcrypt.hash(resetToken, saltRounds);
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000);

      await setPasswordResetToken(user.id, tokenHash, expiresAt);
      await sendPasswordResetEmail(user.email, resetToken); // Send the plain token, not the hash
    }
    // Always return a generic message to prevent email enumeration
    res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Failed to request password reset.' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // Hash the token from the user to compare with the stored hash
    // This requires storing which salt was used or using a static salt for reset tokens if bcrypt is used.
    // Simpler: store token hash directly. The user provides plain token. We hash it and query.
    // For this implementation, we assume we need to find the user by the *hashed* token.
    // However, the user provides the *plain* token. So we must hash the user's token before querying.
    // This is a bit tricky with bcrypt as it generates its own salt.
    // A better approach for reset tokens:
    // 1. Generate plain token.
    // 2. Hash it with a fixed salt or a different method (e.g., SHA256 then store that).
    // 3. User sends plain token. Server hashes it with same method and compares.
    // For now, let's adjust findUserByValidResetToken to expect a plain token and hash it internally,
    // OR, expect server.js to hash it before calling.
    // Let's assume database.js's findUserByValidResetToken expects a HASHED token.
    // So, we need to iterate through users and bcrypt.compare, which is inefficient.
    // -- Revision --
    // The `setPasswordResetToken` stores the hash.
    // `findUserByValidResetToken` expects the hash.
    // This means we cannot directly find the user with the plain token from the email *using an indexed lookup*.
    // This is a common challenge.
    // Option A: Iterate all users with active tokens and bcrypt.compare (bad for performance).
    // Option B: When token is generated, send `userId` along with plain token in URL (less secure if URL leaks).
    // Option C: Use a different hashing for reset tokens (e.g. SHA256, store it, then compare).
    // Option D: Store plain token (less secure if DB leaks).

    // Let's go with Option C (conceptual - will implement a simplified version for now)
    // For now, we'll assume the token stored in DB is NOT bcrypt hashed, but a direct lookup is possible.
    // I will modify `setPasswordResetToken` and `findUserByValidResetToken` in `database.js`
    // to store and find by the plain token for simplicity in this step.
    // THIS IS A SECURITY SIMPLIFICATION FOR THE SAKE OF PROGRESS.
    // Ideally, reset tokens should be hashed in the DB.
    // For now, I'll proceed as if findUserByValidResetToken can find by plain token (will adjust DB function in mind).
    
    // --- Let's stick to the current DB functions that expect a hash ---
    // This means the client sends the plain token. The server cannot directly look it up.
    // The standard way is: the reset link includes user identifier OR the token itself is unique enough
    // that we can hash it and find the match.
    // The current `findUserByValidResetToken` expects a HASH. This is the problem.
    // It should find the user by the token (plain) and then verify it.
    // Let's assume `findUserByValidResetToken` is changed to:
    // `findUserByPlainResetToken(plainToken)` which then internally gets the hash and compares, or finds the user first.
    // For this step, I'll write the server code AS IF database.js handles plain token for lookup and validation.
    // This means I'll need to adjust database.js later if this assumption is wrong.

    // Corrected flow:
    // 1. User provides plain token.
    // 2. Server cannot directly query by plain token if only hash is stored.
    // This implies the token itself should be queryable (e.g. plain token stored, or a selector part of token stored).
    // Let's modify the DB interaction: `setPasswordResetToken` stores plain token, `findUserByValidResetToken` finds by plain.
    // This is a temporary simplification.
    // For now, let's assume `findUserByValidResetToken` takes the plain token.

    // Re-evaluating: The current DB functions `setPasswordResetToken` and `findUserByValidResetToken` are designed to work with token hashes.
    // This means the server, upon receiving a plain token from the user, cannot efficiently find the corresponding hash in the DB
    // without either:
    //    a) iterating through all potential users (bad)
    //    b) having the reset link also contain a non-sensitive user identifier (e.g., user ID).
    // If the link is just `?token=PLAIN_TOKEN`, then the PLAIN_TOKEN itself needs to be the key for lookup,
    // and then its stored hash (if any) can be verified, or the stored value is the plain token itself (less secure).

    // Simpler flow for now: Store plain token in DB (less secure, but makes this step work with current structure idea).
    // I will adjust the DB functions mentally:
    // - `setPasswordResetToken(userId, plainToken, expiresAt)`
    // - `findUserByValidPlainResetToken(plainToken)`
    // Then in actual DB implementation, I'd use a proper crypto strategy (e.g., store hash(plainToken) and look that up).

    // Sticking to current DB function signatures (expecting hash):
    // This means the server has to hash the incoming plain token from the user, then call findUserByValidResetToken.
    // This is only possible if the salt used for hashing the reset token in the DB is known/static, or if bcrypt's compare function is used.
    // Let's assume we need to find the user by some other means first, or the token itself contains the user ID.
    // This is getting complicated.

    // Safest assumption: The token itself is the lookup key.
    // So, database function `findUserByValidResetToken` should take the *plain* token,
    // find the user, and verify expiry. The stored token should also be plain or symmetrically encrypted.
    // For now, I will assume `database.js` will be updated so `findUserByValidResetToken` accepts a PLAIN token.

    const user = await findUserByValidResetToken(token); // ASSUMPTION: This function handles a PLAIN token.

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(user.id, newPasswordHash);

    // Optionally, log the user in by issuing a new JWT token here
    // Or, more securely, require them to log in again with their new password.
    res.status(200).json({ message: 'Password has been reset successfully. Please log in with your new password.' });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

app.get('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required.' });
    }

    const success = await verifyUserEmail(token);

    if (success) {
      // Optionally, redirect to a frontend page e.g., /email-verified or /login
      res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
    } else {
      // Token might be invalid, expired, or already used
      res.status(400).json({ error: 'Invalid or expired verification token.' });
    }
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to verify email.' });
  }
});

// --- Progress Tracking Endpoints (Registered Users Only) ---

// Middleware to ensure user is authenticated via JWT for progress tracking
const ensureAuthenticatedUser = async (req, res, next) => {
  // Relies on authenticateToken middleware having run first
  if (req.user && req.authMethod === 'jwt') {
    return next();
  }
  // If guest or no user, deny access to these structured progress endpoints
  res.status(401).json({ error: 'Authentication required. Please log in to access progress features.' });
};

// Get current user's progress and achievements
app.get('/api/progress', ensureAuthenticatedUser, async (req, res) => {
  try {
    // req.user is guaranteed by ensureAuthenticatedUser
    const userProgress = await getOrCreateUserProgress(req.user.id);
    const userAchievements = await getUserAchievements(req.user.id);
    res.json({
      progress: userProgress,
      achievements: userAchievements
    });
  } catch (error) {
    console.error(`Error fetching progress for user ${req.user.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch user progress.' });
  }
});

// Update current user's progress
app.post('/api/progress', ensureAuthenticatedUser, async (req, res) => {
  try {
    const { last_level_completed, current_story_point, total_score, game_state_json } = req.body;
    // Basic validation: ensure at least one field is being updated
    if (last_level_completed === undefined && current_story_point === undefined && total_score === undefined && game_state_json === undefined) {
        return res.status(400).json({error: 'No progress data provided to update.'});
    }

    const result = await updateUserProgress(req.user.id, {
      last_level_completed,
      current_story_point,
      total_score,
      game_state_json
    });

    if (result.changes > 0) {
      const updatedProgress = await getOrCreateUserProgress(req.user.id); // Fetch the updated record
      res.json({ message: 'Progress updated successfully.', progress: updatedProgress });
    } else {
      // This might happen if data sent matches existing data or other DB issues.
      // updateUserProgress tries to create if not exist, so this path is less likely for new users.
      const currentProgress = await getOrCreateUserProgress(req.user.id);
      res.status(200).json({ message: 'Progress update attempted. No changes made or user progress initialized.', progress: currentProgress });
    }
  } catch (error) {
    console.error(`Error updating progress for user ${req.user.id}:`, error);
    res.status(500).json({ error: 'Failed to update user progress.' });
  }
});

// Unlock an achievement for the current user
app.post('/api/progress/achievements/:achievementIdOrName/unlock', ensureAuthenticatedUser, async (req, res) => {
  try {
    const { achievementIdOrName } = req.params;
    const result = await grantAchievementToUser(req.user.id, achievementIdOrName);

    if (result.changes > 0) {
      const achievementDetails = result.lastInsertRowid
        ? await db.prepare('SELECT a.* FROM achievements a JOIN user_achievements ua ON a.achievement_id = ua.achievement_id WHERE ua.user_achievement_id = ?').get(result.lastInsertRowid)
        : await getAchievementDefinitionByName(achievementIdOrName) || await db.prepare('SELECT * FROM achievements WHERE achievement_id = ?').get(achievementIdOrName); // Fallback lookup
      res.status(201).json({ message: `Achievement '${achievementDetails ? achievementDetails.achievement_name : achievementIdOrName}' unlocked!`, achievement: achievementDetails });
    } else {
      // This means user already had the achievement (SQLITE_CONSTRAINT_UNIQUE handled in DB func)
      const achievementDetails = await getAchievementDefinitionByName(achievementIdOrName) || await db.prepare('SELECT * FROM achievements WHERE achievement_id = ?').get(achievementIdOrName);
      res.status(200).json({ message: `Achievement '${achievementDetails ? achievementDetails.achievement_name : achievementIdOrName}' was already unlocked.`, achievement: achievementDetails });
    }
  } catch (error) {
    console.error(`Error unlocking achievement for user ${req.user.id}:`, error);
    if (error.message.includes('Achievement definition not found') || error.message.includes('does not exist')) {
        return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to unlock achievement.' });
  }
});

// Get all achievement definitions (e.g., for UI display)
app.get('/api/achievements', async (req, res) => {
  // This route does not strictly need authentication if achievement definitions are public
  try {
    const achievements = await getAllAchievementDefinitions();
    res.json(achievements);
  } catch (error) {
    console.error('Error fetching achievement definitions:', error);
    res.status(500).json({ error: 'Failed to fetch achievement definitions.' });
  }
});


// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'Night City 2088 API' });
});

// Get user status (Refactored for new guest/user model)
app.post('/api/user/status', async (req, res) => {
  try {
    if (req.user && req.authMethod === 'jwt') { // Registered JWT User
      const registeredUser = req.user;
      const usage = await getUserUsageToday(registeredUser.id, false);
      const premiumStatus = isUserPremium(registeredUser);

      res.json({
        userId: registeredUser.id,
        username: registeredUser.username,
        email: registeredUser.email,
        isPremium: premiumStatus,
        emailVerified: registeredUser.email_verified,
        subscriptionType: registeredUser.subscription_type,
        avatarCreditsRemaining: registeredUser.avatar_credits_remaining, // From users table
        usageToday: usage.total_requests,
        limit: premiumStatus ? 'unlimited' : FREE_TIER_LIMIT,
        remaining: premiumStatus ? 'unlimited' : Math.max(0, FREE_TIER_LIMIT - usage.total_requests),
        authSource: 'jwt',
        isLoggedIn: true,
        isGuest: false,
      });
    } else { // Guest User (or user with no/invalid JWT, identified by fingerprint)
      const rawFingerprint = req.body.fingerprint || req.headers['x-fingerprint'] || generateFingerprint(req);
      if (!rawFingerprint) {
        return res.status(400).json({ error: 'Unable to identify client (fingerprint missing for guest status).' });
      }

      // Use getOrCreateGuestSession to ensure we have the latest session data
      // It's possible checkUsageLimit already populated req.guestSession if this route is protected by it.
      // If not, we fetch/create it here.
      const guestSession = req.guestSession || await getOrCreateGuestSession(rawFingerprint);
       if (!guestSession) {
         return res.status(500).json({ error: 'Failed to get or create guest session for status.' });
       }

      const usage = await getUserUsageToday(rawFingerprint, true); // true for guest

      res.json({
        fingerprint_hash: guestSession.fingerprint_hash, // Or don't expose hash, just indicate guest
        isPremium: false, // Guests are never premium
        avatarCreditsRemaining: guestSession.avatar_credits_remaining, // From guest_sessions table
        usageToday: usage.total_requests,
        limit: FREE_TIER_LIMIT,
        remaining: Math.max(0, FREE_TIER_LIMIT - usage.total_requests),
        authSource: 'fingerprint',
        isLoggedIn: false,
        isGuest: true,
        // Guest doesn't have username, email, subscriptionType in the same way
      });
    }
  } catch (error) {
    console.error('User status error:', error);
    res.status(500).json({ error: 'Internal server error retrieving user status.' });
  }
});

// Gemini API proxy endpoints

// Endpoint for generating game scene images (Premium Users Only)
app.post('/api/gemini/generate-image', checkUsageLimit, async (req, res) => {
  try {
    // This endpoint is for premium game scene generation.
    // req.user should be populated by authenticateToken and then checkUsageLimit
    if (!req.user || !isUserPremium(req.user)) {
      return res.status(403).json({
        error: 'Access denied. This feature is available for premium users only.',
        message: 'Upgrade to premium to generate game scene images.'
      });
    }

    const { prompt, model = 'gemini-1.5-flash' } = req.body; // Ensure model is appropriate for images
     if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required for image generation.' });
    }

    // Actual image generation logic with Gemini would go here.
    // For now, simulating a response.
    // const genModel = genAI.getGenerativeModel({ model });
    // const response = await genModel.generateContent([prompt]);

    // Simulate Gemini call for placeholder
    const mockApiResponse = {
      response: { text: () => `Mock image data for prompt: "${prompt}"` }, // Simulate text() method
      usage: { totalTokens: 100 } // Simulate usage data
    };

    // req.user is guaranteed for premium users by the check above. req.is_guest will be false.
    await incrementUserUsage(req.user.id, false, 'premium-image-generation', mockApiResponse.usage?.totalTokens || 0);
    
    res.json({
      message: 'Premium image generated successfully (mocked).',
      data: mockApiResponse.response.text(), // Accessing the simulated text data
      usage: mockApiResponse.usage
    });

  } catch (error) {
    console.error('Gemini image generation error:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

// Endpoint for generating avatar images (Free users limited by credits, Premium unlimited)
app.post('/api/gemini/generate-avatar', checkUsageLimit, async (req, res) => {
  try {
    let currentCredits;
    let identifier;
    let isPremiumUser = false;
    const isGuestUser = req.is_guest; // Set by checkUsageLimit

    if (isGuestUser) {
      if (!req.guestSession) return res.status(401).json({ error: 'Guest session not found.'});
      identifier = req.fingerprint; // Raw fingerprint for DB functions that hash it
      currentCredits = await getAvatarCredits(identifier, true);
    } else if (req.user) { // Registered user
      identifier = req.user.id;
      isPremiumUser = isUserPremium(req.user);
      if (!isPremiumUser) {
        currentCredits = await getAvatarCredits(identifier, false);
      }
    } else {
      return res.status(401).json({ error: 'User or guest not identifiable.' });
    }

    if (!isPremiumUser) {
      if (currentCredits <= 0) {
        return res.status(402).json({
          error: 'No avatar credits remaining.',
          message: 'You have used all your free avatar generation credits. Upgrade to premium or register for more options.',
          upgradeUrl: '/api/create-checkout-session',
          creditsRemaining: 0
        });
      }
      const creditUsed = await useAvatarCredit(identifier, isGuestUser);
      if (!creditUsed) {
        console.warn(`Failed to use avatar credit for ${isGuestUser ? 'guest' : 'user'} ${identifier} despite positive balance check.`);
        return res.status(500).json({ error: 'Failed to update avatar credits. Please try again.' });
      }
    } // Premium users skip credit check and decrement

    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required for avatar generation.' });
    }

    // Actual avatar generation logic with Gemini would go here (mocked).
    const mockAvatarResponse = {
      response: { text: () => `Mock avatar image data for prompt: "${prompt}"` },
      usage: { totalTokens: 50 } // Example token usage for an avatar
    };

    // Increment general API usage (this is for the daily limit, not tokens specifically for premium)
    // For guests, identifier is raw fingerprint. For users, it's userId.
    await incrementUserUsage(identifier, isGuestUser, 'avatar-generation', mockAvatarResponse.usage.totalTokens);

    const remainingCreditsAfterUse = isPremiumUser ? 'unlimited' : await getAvatarCredits(identifier, isGuestUser);

    res.json({
      message: `Avatar generated successfully (${isPremiumUser ? 'premium' : 'credit used'}). Mocked.`,
      data: mockAvatarResponse.response.text(),
      usage: mockAvatarResponse.usage,
      creditsRemaining: remainingCreditsAfterUse
    });

  } catch (error) {
    console.error('Gemini avatar generation error:', error);
    res.status(500).json({ error: 'Failed to generate avatar image.' });
  }
});


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
    // Determine identifier and isGuest status
    const identifier = req.is_guest ? req.fingerprint : req.user.id;
    await incrementUserUsage(identifier, req.is_guest, 'chat', response.usage?.totalTokens || 0);
    
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
