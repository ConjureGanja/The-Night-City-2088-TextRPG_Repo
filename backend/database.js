import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
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
      fingerprint TEXT UNIQUE,
      email TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      subscription_type TEXT DEFAULT 'free',
      subscription_expires DATETIME,
      stripe_customer_id TEXT
    )
  `);

  // Usage tracking table
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
};

createTables();

// User management functions
export const getOrCreateUser = (fingerprint, email = null) => {
  const selectStmt = db.prepare('SELECT * FROM users WHERE fingerprint = ?');
  let user = selectStmt.get(fingerprint);
    if (!user) {
    const userId = randomUUID();
    const insertStmt = db.prepare(`
      INSERT INTO users (id, fingerprint, email) 
      VALUES (?, ?, ?)
    `);
    insertStmt.run(userId, fingerprint, email);
    user = { id: userId, fingerprint, email, subscription_type: 'free' };
  }
  
  return user;
};

export const getUserUsageToday = (userId) => {
  const today = new Date().toISOString().split('T')[0];
  const stmt = db.prepare(`
    SELECT total_requests, total_tokens 
    FROM daily_usage 
    WHERE user_id = ? AND date = ?
  `);
  const result = stmt.get(userId, today);
  return result || { total_requests: 0, total_tokens: 0 };
};

export const incrementUserUsage = (userId, endpoint, tokensUsed = 0) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Log individual request
  const logStmt = db.prepare(`
    INSERT INTO usage_logs (user_id, endpoint, tokens_used) 
    VALUES (?, ?, ?)
  `);
  logStmt.run(userId, endpoint, tokensUsed);
  
  // Update daily summary
  const updateStmt = db.prepare(`
    INSERT INTO daily_usage (user_id, date, total_requests, total_tokens)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET
      total_requests = total_requests + 1,
      total_tokens = total_tokens + ?
  `);
  updateStmt.run(userId, today, tokensUsed, tokensUsed);
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

export { db };
