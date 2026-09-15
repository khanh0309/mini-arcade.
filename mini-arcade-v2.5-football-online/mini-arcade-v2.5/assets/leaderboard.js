(() => {
  const USER_KEY = 'arcade_username';
  const API = '/.netlify/functions/leaderboard';
  const PINNED = { username: 'ez noob', score: 50000, pinned: true };

  function cleanName(value) {
    return String(value || '').normalize('NFKC').replace(/[^\p{L}\p{N}_. -]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 18);
  }


  function withPinned(list, sort = 'desc') {
    const normalized = Array.isArray(list) ? list.filter(x => String(x?.username || '').toLowerCase() !== PINNED.username) : [];
    normalized.sort((a,b) => sort === 'asc' ? Number(a.score)-Number(b.score) : Number(b.score)-Number(a.score));
    return [PINNED, ...normalized].slice(0, 20);
  }

  function getUsername() {
    let name = cleanName(localStorage.getItem(USER_KEY));
    if (name.length >= 2) return name;
    while (name.length < 2) {
      name = cleanName(prompt('Nhập username để lưu điểm lên bảng xếp hạng:', '') || '');
      if (!name) name = 'Player' + Math.floor(100 + Math.random() * 900);
    }
    localStorage.setItem(USER_KEY, name);
    return name;
  }

  function setUsername(name) {
    name = cleanName(name);
    if (name.length < 2) throw new Error('Username cần ít nhất 2 ký tự.');
    localStorage.setItem(USER_KEY, name);
    updatePlayerChips();
    return name;
  }

  function updatePlayerChips() {
    const name = cleanName(localStorage.getItem(USER_KEY)) || 'Player';
    document.querySelectorAll('[data-player-chip]').forEach(el => el.textContent = `👤 ${name}`);
  }

  function localBoard(game, username, score, sort) {
    const key = `arcade_local_board_${game}`;
    let board = [];
    try { board = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
    const lower = sort === 'asc';
    const existing = board.find(x => x.username.toLowerCase() === username.toLowerCase());
    if (!existing) board.push({ username, score, updatedAt: Date.now() });
    else if ((lower && score < existing.score) || (!lower && score > existing.score)) {
      existing.score = score; existing.updatedAt = Date.now(); existing.username = username;
    }
    board = board.filter(x => String(x.username || '').toLowerCase() !== PINNED.username);
    board.sort((a,b) => lower ? a.score-b.score : b.score-a.score);
    board = [PINNED, ...board].slice(0, 20);
    localStorage.setItem(key, JSON.stringify(board.filter(x => !x.pinned)));
    const rank = username.toLowerCase() === PINNED.username ? 1 : board.findIndex(x => x.username.toLowerCase() === username.toLowerCase()) + 1;
    return { leaderboard: board, rank, local: true };
  }

  async function submit(game, score, sort) {
    const username = getUsername();
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ game, username, score: Math.round(Number(score)), sort })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Global leaderboard unavailable; using local fallback.', err);
      return localBoard(game, username, Math.round(Number(score)), sort);
    }
  }

  function ensureModal() {
    let modal = document.getElementById('leaderboardModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'leaderboardModal';
    modal.className = 'leaderboard-modal hidden';
    modal.innerHTML = `
      <div class="leaderboard-card" role="dialog" aria-modal="true" aria-labelledby="leaderboardTitle">
        <div class="leaderboard-head">
          <div><div class="leaderboard-kicker">🏆 BẢNG XẾP HẠNG</div><h2 id="leaderboardTitle">Kết quả</h2></div>
          <button class="leaderboard-close" type="button" aria-label="Đóng">×</button>
        </div>
        <div id="leaderboardStatus" class="leaderboard-status">Đang lưu điểm...</div>
        <div id="leaderboardRows" class="leaderboard-rows"></div>
        <div class="leaderboard-actions">
          <button class="small-btn" data-lb-close>Đóng</button>
          <a class="primary" href="../../">← Về Arcade</a>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const close = () => modal.classList.add('hidden');
    modal.querySelector('.leaderboard-close').onclick = close;
    modal.querySelector('[data-lb-close]').onclick = close;
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    return modal;
  }

  function escapeHtml(s) { return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

  async function show(game, score, options = {}) {
    const sort = options.sort === 'asc' ? 'asc' : 'desc';
    const title = options.title || 'Kết quả';
    const suffix = options.suffix || '';
    const earnedCoins = options.awardCoins === false ? 0 : (window.ArcadeEconomy?.awardFromGame(game, score) || 0);
    const modal = ensureModal();
    const status = modal.querySelector('#leaderboardStatus');
    const rows = modal.querySelector('#leaderboardRows');
    modal.querySelector('#leaderboardTitle').textContent = title;
    status.textContent = `Điểm của ${getUsername()}: ${Math.round(score).toLocaleString('vi-VN')}${suffix}.${options.awardCoins===false?'':` 🪙 +${earnedCoins} coin.`} Đang cập nhật...`;
    rows.innerHTML = '<div class="leaderboard-loading">Đang tải bảng xếp hạng...</div>';
    modal.classList.remove('hidden');
    const result = await submit(game, score, sort);
    const list = withPinned(result.leaderboard, sort);
    const me = getUsername().toLowerCase();
    status.textContent = result.local
      ? `${options.awardCoins===false?'':`🪙 +${earnedCoins} coin • `}Bảng xếp hạng trên thiết bị này • Hạng: #${result.rank || '—'}`
      : `${options.awardCoins===false?'':`🪙 +${earnedCoins} coin • `}Đã lưu online • Hạng: #${getUsername().toLowerCase() === PINNED.username ? 1 : (result.rank || '—')}`;
    rows.innerHTML = list.length ? list.slice(0, 10).map((item, i) => `
      <div class="leaderboard-row ${String(item.username).toLowerCase() === me ? 'me' : ''}">
        <span class="rank">${i < 3 ? ['🥇','🥈','🥉'][i] : '#' + (i+1)}</span>
        <span class="player">${escapeHtml(item.username)}</span>
        <strong>${Number(item.score).toLocaleString('vi-VN')}${suffix}</strong>
      </div>`).join('') : '<div class="leaderboard-loading">Chưa có điểm.</div>';
  }

  function bindPlayerChip() {
    updatePlayerChips();
    document.querySelectorAll('[data-player-chip]').forEach(el => {
      el.addEventListener('click', () => {
        const next = cleanName(prompt('Đổi username:', getUsername()) || '');
        if (next.length >= 2) setUsername(next);
      });
    });
  }

  window.ArcadeLeaderboard = { show, getUsername, setUsername, cleanName };
  document.addEventListener('DOMContentLoaded', bindPlayerChip);
})();
