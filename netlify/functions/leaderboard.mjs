import { getStore } from '@netlify/blobs';

const allowed = {
  'snake': 'desc',
  'sky-flap': 'desc',
  'dino-run': 'desc',
  'sliding-puzzle': 'asc',
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

function sortBoard(board, mode) {
  board.sort((a,b) => mode === 'asc' ? a.score - b.score : b.score - a.score);
  return board.slice(0, 50);
}

export default async (req) => {
  const url = new URL(req.url);
  const game = url.searchParams.get('game');
  const store = getStore({ name: 'mini-arcade-leaderboards', consistency: 'strong' });

  if (req.method === 'GET') {
    if (!allowed[game]) return json({ error: 'Invalid game' }, 400);
    const board = await store.get(`leaderboard/${game}`, { type: 'json', consistency: 'strong' }) || [];
    return json({ leaderboard: sortBoard(Array.isArray(board) ? board : [], allowed[game]).slice(0, 20) });
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

  for (let attempt = 0; attempt < 6; attempt++) {
    const entry = await store.getWithMetadata(key, { type: 'json', consistency: 'strong' });
    const current = entry && Array.isArray(entry.data) ? entry.data : [];
    const board = current.map(x => ({ username: cleanName(x.username), score: Math.round(Number(x.score)), updatedAt: Number(x.updatedAt || 0) }))
      .filter(x => x.username.length >= 2 && Number.isFinite(x.score));
    const index = board.findIndex(x => x.username.toLowerCase() === username.toLowerCase());
    const now = Date.now();
    if (index < 0) board.push({ username, score, updatedAt: now });
    else {
      const better = mode === 'asc' ? score < board[index].score : score > board[index].score;
      if (better) board[index] = { username, score, updatedAt: now };
      else board[index].username = username;
    }
    const next = sortBoard(board, mode);
    const options = entry ? { onlyIfMatch: entry.etag } : { onlyIfNew: true };
    const result = await store.setJSON(key, next, options);
    if (result.modified) {
      const rank = next.findIndex(x => x.username.toLowerCase() === username.toLowerCase()) + 1;
      return json({ leaderboard: next.slice(0, 20), rank });
    }
  }

  return json({ error: 'Leaderboard busy, try again' }, 409);
};
