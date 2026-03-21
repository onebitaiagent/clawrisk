import { Router, Request, Response } from 'express';
import { verifyTelegramAuth } from '../services/telegram';
import { findPlayerByTelegramId, findPlayerById, findPlayerByUsername, createPlayer } from '../services/db';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'clawrisk_salt_2026').digest('hex');
}

export const authRouter = Router();

// Telegram Mini App auth
authRouter.post('/telegram', async (req: Request, res: Response) => {
  try {
    const { initData } = req.body;
    if (!initData) return res.status(400).json({ error: 'Missing initData' });

    const botToken = process.env.TG_BOT_TOKEN;
    if (!botToken) return res.status(500).json({ error: 'Bot token not configured' });

    const { valid, user } = verifyTelegramAuth(initData, botToken);
    if (!valid || !user) return res.status(401).json({ error: 'Invalid Telegram auth' });

    // Find or create player
    let player = await findPlayerByTelegramId(user.id);
    if (!player) {
      player = await createPlayer({
        telegram_id: user.id,
        username: user.username || user.first_name || 'Crab_' + user.id,
      });
    }

    // Generate session token
    const token = crypto.randomBytes(32).toString('hex');
    // In prod, store token → playerId mapping in Redis/DB
    // For now, we'll use a simple in-memory map
    sessions.set(token, player.id);

    res.json({
      token,
      player: {
        id: player.id,
        username: player.username,
        balance_eth: player.balance_eth,
        balance_shells: player.balance_shells,
        wins: player.wins,
        level: player.level,
      },
    });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Auth failed' });
  }
});

// Guest auth (no Telegram, no deposits)
authRouter.post('/guest', async (_req: Request, res: Response) => {
  try {
    const player = await createPlayer({
      username: 'Guest_' + Math.random().toString(36).slice(2, 8),
    });

    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, player.id);

    res.json({
      token,
      player: {
        id: player.id,
        username: player.username,
        balance_eth: 0,
        balance_shells: 0,
        wins: 0,
        level: 1,
      },
    });
  } catch (err) {
    console.error('Guest auth error:', err);
    res.status(500).json({ error: 'Failed to create guest' });
  }
});

// Sign up with username + password
authRouter.post('/signup', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || username.length < 2 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 2-20 characters' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }
    const clean = username.replace(/[^a-zA-Z0-9_]/g, '');
    if (clean.length < 2) return res.status(400).json({ error: 'Invalid characters in username' });

    // Check if username taken
    const existing = await findPlayerByUsername(clean);
    if (existing) return res.status(400).json({ error: 'Username already taken' });

    const player = await createPlayer({
      username: clean,
      password_hash: hashPassword(password),
    });
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, player.id);

    res.json({
      token,
      player: {
        id: player.id,
        username: player.username,
        balance_eth: player.balance_eth,
        balance_shells: player.balance_shells,
        wins: player.wins,
        level: player.level,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login with username + password
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const player = await findPlayerByUsername(username);
    if (!player) return res.status(401).json({ error: 'User not found' });
    if (!player.password_hash) return res.status(401).json({ error: 'Account has no password (use Telegram)' });
    if (player.password_hash !== hashPassword(password)) return res.status(401).json({ error: 'Wrong password' });

    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, player.id);

    res.json({
      token,
      player: {
        id: player.id,
        username: player.username,
        balance_eth: player.balance_eth,
        balance_shells: player.balance_shells,
        wins: player.wins,
        level: player.level,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
authRouter.post('/logout', (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    sessions.delete(auth.slice(7));
  }
  res.json({ ok: true });
});

// Get current player info
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const playerId = getPlayerFromToken(req);
    if (!playerId) return res.status(401).json({ error: 'Not authenticated' });

    const player = await findPlayerById(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    res.json({
      id: player.id,
      username: player.username,
      balance_eth: player.balance_eth,
      balance_shells: player.balance_shells,
      wins: player.wins,
      losses: player.losses,
      total_earned: player.total_earned,
      xp: player.xp,
      level: player.level,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get player' });
  }
});

// === Session management ===
const sessions = new Map<string, string>(); // token → playerId

export function getPlayerFromToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  return sessions.get(token) || null;
}

export function getPlayerFromTokenString(token: string): string | null {
  return sessions.get(token) || null;
}
