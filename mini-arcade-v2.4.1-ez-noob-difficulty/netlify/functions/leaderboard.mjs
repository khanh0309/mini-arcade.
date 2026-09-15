import { getStore } from '@netlify/blobs';

const OWNER = { username: 'ez noob', score: 50000, pinned: true };
const allowed = {
  'snake': 'desc',
  'sky-flap': 'desc',
  'dino-run': 'desc',
  'sliding-puzzle': 'desc',
  'block-drop': 'desc',
  'racing': 'desc',
  'chicken-crossing': 'desc'
};

function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}

function cleanName(value) {
  return String(value || '').normalize('NFKC').replace(/[^\p{L}\p{N}_. -]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 18);
}

function isOwner(name) {
  return cleanName(name).toLowerCase() === OWNER.username;
}

function sortBoard(board, mode) {
  board.sort((a,b) => mode === 'asc' ? a.score - b.score : b.score - a.score);
  return board.slice(0, 49);
}

function publicBoard(board, mode) {
  const clean = board
    .map(x => ({ username: cleanName(x.username), score: Math.round(Number(x.score)), updatedAt: Number(x.updatedAt || 0) }))
    .filter(x => x.username.length >= 2 && Number.isFinite(x.score) && !isOwner(x.username));
  return [OWNER, ...sortBoard(clean, mode)].slice(0, 50);
}

export default async (req) => {
  const url = new URL(req.url);
  const game = url.searchParams.get('game');
  const store = getStore({ name: 'mini-arcade-leaderboards', consistency: 'strong' });

  if (req.method === 'GET') {
    if (!allowed[game]) return json({ error: 'Invalid game' }, 400);
    const board = await store.get(`leaderboard/${game}`, { type: 'json', consistency: 'strong' }) || [];
    return json({ leaderboard: publicBoard(Array.isArray(board) ? board : [], allowed[game]).slice(0, 20) });
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const gameId = String(body.game || '');
  if (!allowed[gameId]) return json({ error: 'Invalid game' }, 400);
  const username = cleanName(body.username);
  const score = Math.round(Number(body.score));
  if (username.length < 2 || !Number.isFinite(score) || score < 0 || score > 100000000) {
    return json({ error: 'Invalid score or username' }, 400);
  }

  const mode = allowed[gameId];
  const key = `leaderboard/${gameId}`;

  // Tài khoản chủ được ghim cố định 50.000 điểm ở hạng #1 cho mọi game.
  if (isOwner(username)) {
    const stored = await store.get(key, { type: 'json', consistency: 'strong' }) || [];
    return json({ leaderboard: publicBoard(Array.isArray(stored) ? stored : [], mode).slice(0, 20), rank: 1 });
  }

  for (let attempt = 0; attempt < 6; attempt++) {
    const entry = await store.getWithMetadata(key, { type: 'json', consistency: 'strong' });
    const current = entry && Array.isArray(entry.data) ? entry.data : [];
    const board = current
      .map(x => ({ username: cleanName(x.username), score: Math.round(Number(x.score)), updatedAt: Number(x.updatedAt || 0) }))
      .filter(x => x.username.length >= 2 && Number.isFinite(x.score) && !isOwner(x.username));
    const index = board.findIndex(x => x.username.toLowerCase() === username.toLowerCase());
    const now = Date.now();
    if (index < 0) board.push({ username, score, updatedAt: now });
    else {
      const better = mode === 'asc' ? score < board[index].score : score > board[index].score;
      if (better) board[index] = { username, score, updatedAt: now };
      else board[index].username = username;
    }
    const nextStored = sortBoard(board, mode);
    const options = entry ? { onlyIfMatch: entry.etag } : { onlyIfNew: true };
    const result = await store.setJSON(key, nextStored, options);
    if (result.modified) {
      const visible = publicBoard(nextStored, mode);
      const rank = visible.findIndex(x => x.username.toLowerCase() === username.toLowerCase()) + 1;
      return json({ leaderboard: visible.slice(0, 20), rank });
    }
  }

  return json({ error: 'Leaderboard busy, try again' }, 409);
};
