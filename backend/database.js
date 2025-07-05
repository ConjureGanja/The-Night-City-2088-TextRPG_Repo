import Database from 'better-sqlite3';
import { randomUUID, randomBytes, createHash } from 'crypto'; // Added randomBytes and createHash
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DATABASE_URL || join(__dirname, 'database.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
const createTables = () => {
  // Users table for session/account management
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email_verified BOOLEAN DEFAULT FALSE,
      verification_token TEXT,
      verification_token_expires DATETIME,
      password_reset_token TEXT,
      password_reset_token_expires DATETIME,
      fingerprint TEXT UNIQUE, -- This might be deprecated or used differently now for registered users if they started as guests
      avatar_credits_remaining INTEGER DEFAULT 0, -- For registered, non-premium users
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      subscription_type TEXT DEFAULT 'free', -- Can be 'registered', 'premium'. 'guest' type is now managed by guest_sessions
      subscription_expires DATETIME,
      stripe_customer_id TEXT
    )
  `);

  // Guest Sessions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS guest_sessions (
      fingerprint_hash TEXT PRIMARY KEY, -- SHA256 hash of the raw fingerprint
      avatar_credits_remaining INTEGER DEFAULT 2,
      daily_api_requests INTEGER DEFAULT 0,
      last_api_request_date TEXT, -- YYYY-MM-DD
      game_progress_json TEXT, -- Simple JSON blob for guest's game state
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Usage tracking table (Primarily for registered users, or detailed logging)
  db.exec(`
    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      endpoint TEXT,
      tokens_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Daily usage summary for quick lookups
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      date TEXT,
      total_requests INTEGER DEFAULT 0,
      total_tokens INTEGER DEFAULT 0,
      UNIQUE(user_id, date),
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // User Progress Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_progress (
      user_progress_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE, -- Each user has one progress row
      last_level_completed INTEGER DEFAULT 0,
      current_story_point TEXT,
      total_score INTEGER DEFAULT 0,
      game_state_json TEXT, -- Store complex game state as JSON
      last_played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Achievements Definitions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS achievements (
      achievement_id INTEGER PRIMARY KEY AUTOINCREMENT,
      achievement_name TEXT UNIQUE NOT NULL,
      description TEXT,
      icon_url TEXT
    )
  `);
  // Pre-populate some achievements if table is empty (example)
  const achievementCount = db.prepare('SELECT COUNT(*) as count FROM achievements').get().count;
  if (achievementCount === 0) {
    const achievements = [
      { name: 'First Step', description: 'Completed the tutorial.', icon: 'path/to/icon1.png' },
      { name: 'Night City Novice', description: 'Reached level 5.', icon: 'path/to/icon2.png' }
    ];
    const stmt = db.prepare('INSERT INTO achievements (achievement_name, description, icon_url) VALUES (?, ?, ?)');
    achievements.forEach(ach => stmt.run(ach.name, ach.description, ach.icon));
    console.log('Pre-populated achievements table.');
  }


  // User Achievements Link Table (Many-to-Many)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_achievements (
      user_achievement_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      achievement_id INTEGER NOT NULL,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (achievement_id) REFERENCES achievements (achievement_id),
      UNIQUE (user_id, achievement_id) -- User can't get same achievement twice
    )
  `);
};

createTables();

// User management functions

const hashFingerprint = (fingerprint) => {
  return createHash('sha256').update(fingerprint).digest('hex');
};

// Guest Session Management
export const getOrCreateGuestSession = (fingerprint) => {
  const HASHED_FINGERPRINT = hashFingerprint(fingerprint);
  let session = db.prepare('SELECT * FROM guest_sessions WHERE fingerprint_hash = ?').get(HASHED_FINGERPRINT);

  if (!session) {
    const today = new Date().toISOString().split('T')[0];
    const stmt = db.prepare(`
      INSERT INTO guest_sessions (fingerprint_hash, avatar_credits_remaining, daily_api_requests, last_api_request_date, created_at, last_seen_at)
      VALUES (?, 2, 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    stmt.run(HASHED_FINGERPRINT, today);
    session = db.prepare('SELECT * FROM guest_sessions WHERE fingerprint_hash = ?').get(HASHED_FINGERPRINT);
    console.log(`Created new guest session for fingerprint hash: ${HASHED_FINGERPRINT}`);
  } else {
    // Update last_seen_at for existing session
    db.prepare('UPDATE guest_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE fingerprint_hash = ?').run(HASHED_FINGERPRINT);
  }
  session.is_guest = true; // Add a flag to easily identify guest session objects
  return session;
};

// Registered User Management
export const createUser = (username, email, passwordHash, fingerprintToMigrate = null) => {
  const userId = randomUUID();
  const verificationToken = randomBytes(32).toString('hex');
  const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const initialAvatarCredits = 2; // For registered, non-premium users

  // Start a transaction
  db.transaction(() => {
    const userStmt = db.prepare(`
      INSERT INTO users (id, username, email, password_hash, verification_token, verification_token_expires, subscription_type, avatar_credits_remaining, fingerprint)
      VALUES (?, ?, ?, ?, ?, ?, 'registered', ?, ?)
    `);
    // Fingerprint column in users table can store the last known raw fingerprint if needed for migration link
    userStmt.run(userId, username, email, passwordHash, verificationToken, verificationTokenExpires.toISOString(), initialAvatarCredits, fingerprintToMigrate);

    // If a fingerprintToMigrate is provided, attempt to migrate data from guest_sessions
    if (fingerprintToMigrate) {
      const fingerprintHash = hashFingerprint(fingerprintToMigrate);
      const guestSession = db.prepare('SELECT * FROM guest_sessions WHERE fingerprint_hash = ?').get(fingerprintHash);
      if (guestSession) {
        console.log(`Migrating data for guest ${fingerprintHash} to new user ${userId}`);
        // Example migration: transfer game_progress_json if it exists
        if (guestSession.game_progress_json) {
          // This is simplified. A real migration might parse JSON and populate UserProgress table.
          // For now, let's assume we might store it in the UserProgress.game_state_json for the new user.
          const progressStmt = db.prepare(`
            INSERT INTO user_progress (user_id, game_state_json, last_played_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
              game_state_json = excluded.game_state_json,
              last_played_at = CURRENT_TIMESTAMP
          `);
          progressStmt.run(userId, guestSession.game_progress_json);
          console.log(`Migrated game_progress_json for user ${userId}`);
        }
        // Delete the guest session after migration
        db.prepare('DELETE FROM guest_sessions WHERE fingerprint_hash = ?').run(fingerprintHash);
        console.log(`Deleted guest session ${fingerprintHash} after migration.`);
      }
    }
  })(); // Execute transaction

  return { userId, verificationToken };
};


export const findUserByEmail = (email) => {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email);
};

export const findUserByUsername = (username) => {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username);
};

export const findUserById = (userId) => {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(userId);
};

export const verifyUserEmail = (token) => {
  const stmt = db.prepare(`
    UPDATE users
    SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL
    WHERE verification_token = ? AND verification_token_expires > CURRENT_TIMESTAMP
  `);
  const result = stmt.run(token);
  return result.changes > 0;
};

// Avatar Credits Functions
export const getAvatarCredits = (identifier, isGuest) => {
  if (isGuest) {
    const HASHED_FINGERPRINT = hashFingerprint(identifier); // identifier is raw fingerprint
    const stmt = db.prepare('SELECT avatar_credits_remaining FROM guest_sessions WHERE fingerprint_hash = ?');
    const result = stmt.get(HASHED_FINGERPRINT);
    return result ? result.avatar_credits_remaining : 0;
  } else { // Registered user, identifier is userId
    const stmt = db.prepare('SELECT avatar_credits_remaining FROM users WHERE id = ?');
    const result = stmt.get(identifier);
    return result ? result.avatar_credits_remaining : 0;
  }
};

export const useAvatarCredit = (identifier, isGuest) => {
  if (isGuest) {
    const HASHED_FINGERPRINT = hashFingerprint(identifier); // identifier is raw fingerprint
    const stmt = db.prepare(`
      UPDATE guest_sessions
      SET avatar_credits_remaining = avatar_credits_remaining - 1, last_seen_at = CURRENT_TIMESTAMP
      WHERE fingerprint_hash = ? AND avatar_credits_remaining > 0
    `);
    const result = stmt.run(HASHED_FINGERPRINT);
    return result.changes > 0;
  } else { // Registered user, identifier is userId
    const stmt = db.prepare(`
      UPDATE users
      SET avatar_credits_remaining = avatar_credits_remaining - 1
      WHERE id = ? AND avatar_credits_remaining > 0
    `);
    const result = stmt.run(identifier);
    return result.changes > 0;
  }
};

export const addAvatarCredits = (userId, amount) => {
  // This function primarily applies to registered users. Guests get default on creation.
  // If guests could earn/buy credits, this would need an isGuest flag too.
  const stmt = db.prepare(`
    UPDATE users
    SET avatar_credits_remaining = avatar_credits_remaining + ?
    WHERE id = ?
  `);
  stmt.run(amount, userId);
};


// Password Reset Functions
export const setPasswordResetToken = (userId, tokenHash, expiresAt) => {
  const stmt = db.prepare(`
    UPDATE users
    SET password_reset_token = ?, password_reset_token_expires = ?
    WHERE id = ?
  `);
  stmt.run(tokenHash, expiresAt.toISOString(), userId);
};

export const findUserByValidResetToken = (tokenHash) => {
  // It's important to compare hashed tokens to prevent timing attacks.
  // The actual token is received from the user, hashed, then compared.
  const stmt = db.prepare(`
    SELECT * FROM users
    WHERE password_reset_token = ? AND password_reset_token_expires > CURRENT_TIMESTAMP
  `);
  return stmt.get(tokenHash);
};

export const updateUserPassword = (userId, newPasswordHash) => {
  const stmt = db.prepare(`
    UPDATE users
    SET password_hash = ?, password_reset_token = NULL, password_reset_token_expires = NULL
    WHERE id = ?
  `);
  stmt.run(newPasswordHash, userId);
};


// Renaming the old getOrCreateUser to avoid confusion - DEPRECATED by getOrCreateGuestSession and explicit user functions
// export { getOrCreateUserByFingerprint as getOrCreateUser }; // No longer exporting this alias. Server will call getOrCreateGuestSession.


// Usage Tracking Functions (adapted for guests and registered users)
export const getUserUsageToday = (identifier, isGuest) => {
  const today = new Date().toISOString().split('T')[0];
  if (isGuest) {
    const HASHED_FINGERPRINT = hashFingerprint(identifier); // identifier is raw fingerprint
    const guestSession = db.prepare('SELECT daily_api_requests, last_api_request_date FROM guest_sessions WHERE fingerprint_hash = ?').get(HASHED_FINGERPRINT);
    if (guestSession && guestSession.last_api_request_date === today) {
      return { total_requests: guestSession.daily_api_requests, total_tokens: 0 }; // Guest tokens not tracked in this model
    }
    return { total_requests: 0, total_tokens: 0 }; // No usage today or new guest
  } else { // Registered user, identifier is userId
    const stmt = db.prepare(`
      SELECT total_requests, total_tokens
      FROM daily_usage
      WHERE user_id = ? AND date = ?
    `);
    const result = stmt.get(identifier, today);
    return result || { total_requests: 0, total_tokens: 0 };
  }
};

export const incrementUserUsage = (identifier, isGuest, endpoint, tokensUsed = 0) => {
  const today = new Date().toISOString().split('T')[0];

  if (isGuest) {
    const HASHED_FINGERPRINT = hashFingerprint(identifier); // identifier is raw fingerprint
    // For guests, update daily_api_requests in guest_sessions table
    const guestSession = db.prepare('SELECT daily_api_requests, last_api_request_date FROM guest_sessions WHERE fingerprint_hash = ?').get(HASHED_FINGERPRINT);
    let currentRequests = 0;
    if (guestSession && guestSession.last_api_request_date === today) {
      currentRequests = guestSession.daily_api_requests;
    }

    const stmt = db.prepare(`
      UPDATE guest_sessions
      SET daily_api_requests = ?, last_api_request_date = ?, last_seen_at = CURRENT_TIMESTAMP
      WHERE fingerprint_hash = ?
    `);
    stmt.run(currentRequests + 1, today, HASHED_FINGERPRINT);
    // Guest usage_logs not implemented in this pass to keep guest data minimal.
    // If detailed logging for guests is needed, usage_logs could add a fingerprint_hash column.
  } else { // Registered user, identifier is userId
    // Log individual request for registered users
    const logStmt = db.prepare(`
      INSERT INTO usage_logs (user_id, endpoint, tokens_used)
      VALUES (?, ?, ?)
    `);
    logStmt.run(identifier, endpoint, tokensUsed);

    // Update daily summary for registered users
    const updateStmt = db.prepare(`
      INSERT INTO daily_usage (user_id, date, total_requests, total_tokens)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(user_id, date) DO UPDATE SET
        total_requests = total_requests + 1,
        total_tokens = total_tokens + ?
    `);
    updateStmt.run(identifier, today, tokensUsed, tokensUsed);
  }
};

// This function is now part of createUser and a new migrateGuestToUser if needed
// export const linkFingerprintToUser = (userId, fingerprint) => { ... }

export const migrateGuestToUser = (fingerprint, userId) => {
  // This is a simplified version; a more robust one would be in createUser or called by it.
  // For now, this function is effectively integrated into the transaction within createUser.
  // If called separately, it would need its own transaction.
  const HASHED_FINGERPRINT = hashFingerprint(fingerprint);
  const guestSession = db.prepare('SELECT * FROM guest_sessions WHERE fingerprint_hash = ?').get(HASHED_FINGERPRINT);

  if (guestSession) {
    console.log(`Attempting to migrate data for guest ${HASHED_FINGERPRINT} to user ${userId}.`);
    // Migrate game_progress_json
    if (guestSession.game_progress_json) {
      const progressStmt = db.prepare(`
        INSERT INTO user_progress (user_id, game_state_json, last_played_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
          game_state_json = excluded.game_state_json,
          last_played_at = CURRENT_TIMESTAMP
      `);
      progressStmt.run(userId, guestSession.game_progress_json);
      console.log(`Migrated game_progress_json for user ${userId} from guest.`);
    }

    // Optionally, transfer avatar credits or give standard new user credits.
    // The createUser function already gives new registered users initial credits.
    // We could add guestSession.avatar_credits_remaining to the user's credits here if desired.
    // For example: db.prepare("UPDATE users SET avatar_credits_remaining = avatar_credits_remaining + ? WHERE id = ?").run(guestSession.avatar_credits_remaining, userId);


    // Delete guest session
    db.prepare('DELETE FROM guest_sessions WHERE fingerprint_hash = ?').run(HASHED_FINGERPRINT);
    console.log(`Deleted guest session ${HASHED_FINGERPRINT} after migration to user ${userId}.`);
    return true;
  }
  return false; // No guest session found to migrate
};


export const updateUserSubscription = (userId, subscriptionType, expiresAt = null, stripeCustomerId = null) => {
  const stmt = db.prepare(`
    UPDATE users 
    SET subscription_type = ?, subscription_expires = ?, stripe_customer_id = ?
    WHERE id = ?
  `);
  stmt.run(subscriptionType, expiresAt, stripeCustomerId, userId);
};

export const isUserPremium = (user) => {
  if (user.subscription_type === 'premium') {
    if (!user.subscription_expires) return true; // Lifetime premium
    return new Date(user.subscription_expires) > new Date();
  }
  return false;
};

// Progress Tracking Functions

// UserProgress Functions
export const getOrCreateUserProgress = (userId) => {
  let progress = db.prepare('SELECT * FROM user_progress WHERE user_id = ?').get(userId);
  if (!progress) {
    const defaultGameState = JSON.stringify({ inventory: [], quests: {} }); // Example default
    const stmt = db.prepare(`
      INSERT INTO user_progress (user_id, last_level_completed, total_score, game_state_json, last_played_at)
      VALUES (?, 0, 0, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(userId, defaultGameState);
    progress = db.prepare('SELECT * FROM user_progress WHERE user_id = ?').get(userId);
    console.log(`Created default progress for user ${userId}`);
  }
  return progress;
};

export const updateUserProgress = (userId, { last_level_completed, current_story_point, total_score, game_state_json }) => {
  const fieldsToUpdate = [];
  const values = [];

  if (last_level_completed !== undefined) {
    fieldsToUpdate.push('last_level_completed = ?');
    values.push(last_level_completed);
  }
  if (current_story_point !== undefined) {
    fieldsToUpdate.push('current_story_point = ?');
    values.push(current_story_point);
  }
  if (total_score !== undefined) {
    fieldsToUpdate.push('total_score = ?');
    values.push(total_score);
  }
  if (game_state_json !== undefined) {
    fieldsToUpdate.push('game_state_json = ?');
    values.push(typeof game_state_json === 'string' ? game_state_json : JSON.stringify(game_state_json));
  }

  if (fieldsToUpdate.length === 0) {
    return { changes: 0 }; // No fields to update
  }

  fieldsToUpdate.push('last_played_at = CURRENT_TIMESTAMP');

  const stmt = db.prepare(`
    UPDATE user_progress
    SET ${fieldsToUpdate.join(', ')}
    WHERE user_id = ?
  `);
  values.push(userId);
  const result = stmt.run(...values);
  if (result.changes === 0) { // User might not have progress record yet
      getOrCreateUserProgress(userId); // Create if not exists
      return stmt.run(...values); // Try update again
  }
  return result;
};

// Achievements Definition Functions
export const addAchievementDefinition = (name, description, icon_url) => {
  try {
    const stmt = db.prepare('INSERT INTO achievements (achievement_name, description, icon_url) VALUES (?, ?, ?)');
    return stmt.run(name, description, icon_url);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      console.warn(`Achievement "${name}" already exists.`);
      return null;
    }
    throw error;
  }
};

export const getAllAchievementDefinitions = () => {
  return db.prepare('SELECT * FROM achievements').all();
};

export const getAchievementDefinitionByName = (name) => {
    return db.prepare('SELECT * FROM achievements WHERE achievement_name = ?').get(name);
};


// UserAchievements Functions
export const grantAchievementToUser = (userId, achievementIdOrName) => {
  let achievementId = achievementIdOrName;
  if(typeof achievementIdOrName === 'string') {
    const achDef = getAchievementDefinitionByName(achievementIdOrName);
    if (!achDef) throw new Error(`Achievement definition not found for name: ${achievementIdOrName}`);
    achievementId = achDef.achievement_id;
  }

  try {
    // Ensure user progress exists, as user_achievements links to users indirectly via progress sometimes
    getOrCreateUserProgress(userId); // Ensures user_id is valid and user is active in game context

    const stmt = db.prepare('INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)');
    return stmt.run(userId, achievementId);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      // User already has this achievement, not an error, just a no-op
      console.log(`User ${userId} already has achievement ${achievementId}.`);
      return { changes: 0, lastInsertRowid: db.prepare('SELECT user_achievement_id FROM user_achievements WHERE user_id = ? AND achievement_id = ?').get(userId, achievementId).user_achievement_id };
    }
    // Check for foreign key constraint if achievementId is invalid
    if (error.message.includes('FOREIGN KEY constraint failed')) {
        const achExists = db.prepare('SELECT 1 FROM achievements WHERE achievement_id = ?').get(achievementId);
        if (!achExists) {
            throw new Error(`Failed to grant achievement: Achievement ID ${achievementId} does not exist.`);
        }
        // User ID might be the issue if user_progress wasn't created or user doesn't exist.
        // The getOrCreateUserProgress call above should mitigate this for user_id.
    }
    throw error;
  }
};

export const getUserAchievements = (userId) => {
  const stmt = db.prepare(`
    SELECT a.achievement_id, a.achievement_name, a.description, a.icon_url, ua.unlocked_at
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.achievement_id
    WHERE ua.user_id = ?
    ORDER BY ua.unlocked_at DESC
  `);
  return stmt.all(userId);
};


export { db };
