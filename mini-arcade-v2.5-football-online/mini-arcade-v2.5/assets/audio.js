(() => {
  const ENABLE_KEY = 'arcade_sound_enabled';
  const MUSIC_KEY = 'arcade_music_volume';
  const SFX_KEY = 'arcade_sfx_volume';

  let enabled = localStorage.getItem(ENABLE_KEY) !== '0';
  let musicVolume = Math.min(1, Math.max(0, Number(localStorage.getItem(MUSIC_KEY) ?? 0.70)));
  let sfxVolume = Math.min(1, Math.max(0, Number(localStorage.getItem(SFX_KEY) ?? 1.00)));

  let ctx = null;
  let master = null;
  let musicBus = null;
  let sfxBus = null;
  let musicTimer = null;
  let step = 0;

  const melody = [
    261.63,329.63,392.00,329.63,
    293.66,349.23,440.00,349.23,
    246.94,293.66,369.99,293.66,
    220.00,277.18,329.63,277.18
  ];

  function ensureAudio() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();

      master = ctx.createGain();
      musicBus = ctx.createGain();
      sfxBus = ctx.createGain();

      // V2.1: tăng tổng âm lượng rõ rệt so với V2.
      master.gain.value = 0.55;
      musicBus.gain.value = musicVolume;
      sfxBus.gain.value = sfxVolume;

      musicBus.connect(master);
      sfxBus.connect(master);
      master.connect(ctx.destination);
    }

    if (musicBus) musicBus.gain.value = musicVolume;
    if (sfxBus) sfxBus.gain.value = sfxVolume;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, duration = 0.1, volume = 0.08, type = 'square', when = 0, bus = 'sfx') {
    if (!enabled) return;
    const ac = ensureAudio();
    const o = ac.createOscillator();
    const g = ac.createGain();
    const t = ac.currentTime + when;

    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(Math.max(0.0001, volume), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    o.connect(g);
    g.connect(bus === 'music' ? musicBus : sfxBus);
    o.start(t);
    o.stop(t + duration + 0.02);
  }

  function musicTick() {
    if (!enabled) return;
    const root = melody[step % melody.length];
    tone(root, 0.12, 0.040, 'square', 0, 'music');
    if (step % 2 === 0) tone(root / 2, 0.18, 0.022, 'triangle', 0.02, 'music');
    if (step % 4 === 3) tone(root * 1.5, 0.07, 0.018, 'sine', 0.08, 'music');
    step++;
  }

  function startMusic() {
    if (!enabled || musicTimer) return;
    ensureAudio();
    musicTick();
    musicTimer = setInterval(musicTick, 330);
    updateUI();
  }

  function stopMusic() {
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
    updateUI();
  }

  function setEnabled(value) {
    enabled = !!value;
    localStorage.setItem(ENABLE_KEY, enabled ? '1' : '0');
    if (enabled) startMusic();
    else stopMusic();
    updateUI();
  }

  function setMusicVolume(value) {
    musicVolume = Math.min(1, Math.max(0, Number(value)));
    localStorage.setItem(MUSIC_KEY, String(musicVolume));
    if (musicBus) musicBus.gain.value = musicVolume;
    updateUI();
  }

  function setSfxVolume(value) {
    sfxVolume = Math.min(1, Math.max(0, Number(value)));
    localStorage.setItem(SFX_KEY, String(sfxVolume));
    if (sfxBus) sfxBus.gain.value = sfxVolume;
    updateUI();
  }

  function toggle() { setEnabled(!enabled); }

  function sfx(name) {
    if (!enabled) return;
    const sounds = {
      click: () => tone(520, .045, .055, 'square'),
      move: () => tone(390, .035, .045, 'triangle'),
      eat: () => { tone(620, .055, .060, 'square'); tone(820, .07, .050, 'square', .045); },
      flap: () => tone(470, .055, .055, 'triangle'),
      jump: () => { tone(330, .06, .055, 'square'); tone(480, .08, .045, 'square', .05); },
      point: () => tone(760, .055, .055, 'square'),
      line: () => { [523,659,784].forEach((f,i)=>tone(f,.08,.045,'square',i*.055)); },
      win: () => { [523,659,784,1047].forEach((f,i)=>tone(f,.11,.055,'square',i*.07)); },
      crash: () => { tone(140,.16,.080,'sawtooth'); tone(85,.22,.070,'square',.08); },
      gameover: () => { tone(220,.11,.060,'square'); tone(165,.13,.060,'square',.10); tone(110,.18,.060,'square',.20); }
    };
    (sounds[name] || sounds.click)();
  }

  function injectVolumeUI() {
    if (document.getElementById('arcadeVolumePanel')) return;

    const style = document.createElement('style');
    style.textContent = `
      .arcade-volume-btn{
        border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.06);
        color:inherit;border-radius:12px;padding:9px 11px;cursor:pointer;font:inherit
      }
      .arcade-volume-panel{
        position:fixed;right:16px;top:72px;z-index:99999;width:min(310px,calc(100vw - 32px));
        padding:14px;border-radius:16px;background:rgba(8,18,14,.96);
        border:1px solid rgba(120,255,180,.22);box-shadow:0 18px 55px rgba(0,0,0,.42);
        color:#effff7;backdrop-filter:blur(12px)
      }
      .arcade-volume-panel[hidden]{display:none}
      .arcade-volume-title{display:flex;justify-content:space-between;align-items:center;
        font-weight:800;margin-bottom:12px}
      .arcade-volume-row{display:grid;grid-template-columns:78px 1fr 46px;gap:10px;
        align-items:center;margin:10px 0;font-size:13px;color:#d8f8e6}
      .arcade-volume-row input{width:100%;accent-color:#56ef9a}
      .arcade-volume-value{text-align:right;font-variant-numeric:tabular-nums;color:#9ed9b9}
      .arcade-volume-hint{font-size:11px;line-height:1.45;color:#7fa992;margin-top:9px}
      @media(max-width:600px){.arcade-volume-panel{top:auto;bottom:16px}}
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.id = 'arcadeVolumePanel';
    panel.className = 'arcade-volume-panel';
    panel.hidden = true;
    panel.innerHTML = `
      <div class="arcade-volume-title"><span>🎚️ Âm lượng</span><span>V2.1</span></div>
      <label class="arcade-volume-row">
        <span>Nhạc nền</span>
        <input id="arcadeMusicVolume" type="range" min="0" max="100" step="5">
        <span class="arcade-volume-value" id="arcadeMusicValue"></span>
      </label>
      <label class="arcade-volume-row">
        <span>Hiệu ứng</span>
        <input id="arcadeSfxVolume" type="range" min="0" max="100" step="5">
        <span class="arcade-volume-value" id="arcadeSfxValue"></span>
      </label>
      <div class="arcade-volume-hint">Mặc định mới: nhạc 70%, hiệu ứng 100%. Bạn có thể chỉnh riêng và hệ thống sẽ nhớ trên thiết bị.</div>
    `;
    document.body.appendChild(panel);

    const musicInput = panel.querySelector('#arcadeMusicVolume');
    const sfxInput = panel.querySelector('#arcadeSfxVolume');

    musicInput.addEventListener('input', () => setMusicVolume(Number(musicInput.value) / 100));
    sfxInput.addEventListener('input', () => {
      setSfxVolume(Number(sfxInput.value) / 100);
      if (enabled) sfx('click');
    });

    document.querySelectorAll('[data-sound-toggle]').forEach(toggleBtn => {
      if (toggleBtn.nextElementSibling?.classList?.contains('arcade-volume-btn')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'arcade-volume-btn';
      btn.textContent = '🎚️';
      btn.title = 'Chỉnh âm lượng';
      btn.setAttribute('aria-label', 'Chỉnh âm lượng');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        panel.hidden = !panel.hidden;
        if (!panel.hidden) ensureAudio();
      });
      toggleBtn.insertAdjacentElement('afterend', btn);
    });

    document.addEventListener('pointerdown', e => {
      if (!panel.hidden && !panel.contains(e.target) && !e.target.classList?.contains('arcade-volume-btn')) {
        panel.hidden = true;
      }
    });

    updateUI();
  }

  function updateUI() {
    document.querySelectorAll('[data-sound-toggle]').forEach(btn => {
      btn.textContent = enabled ? '🔊 Âm thanh' : '🔇 Tắt tiếng';
      btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    });

    const musicInput = document.getElementById('arcadeMusicVolume');
    const sfxInput = document.getElementById('arcadeSfxVolume');
    const musicValue = document.getElementById('arcadeMusicValue');
    const sfxValue = document.getElementById('arcadeSfxValue');

    if (musicInput) musicInput.value = Math.round(musicVolume * 100);
    if (sfxInput) sfxInput.value = Math.round(sfxVolume * 100);
    if (musicValue) musicValue.textContent = `${Math.round(musicVolume * 100)}%`;
    if (sfxValue) sfxValue.textContent = `${Math.round(sfxVolume * 100)}%`;
  }

  function bind() {
    document.querySelectorAll('[data-sound-toggle]').forEach(btn => {
      if (btn.dataset.boundSound) return;
      btn.dataset.boundSound = '1';
      btn.addEventListener('click', e => {
        e.preventDefault();
        toggle();
      });
    });
    injectVolumeUI();
    updateUI();
  }

  window.ArcadeAudio = {
    startMusic, stopMusic, toggle, setEnabled, setMusicVolume, setSfxVolume, sfx,
    get enabled(){ return enabled; },
    get musicVolume(){ return musicVolume; },
    get sfxVolume(){ return sfxVolume; }
  };

  document.addEventListener('DOMContentLoaded', bind);
  document.addEventListener('pointerdown', () => startMusic(), { once: true });
  document.addEventListener('keydown', () => startMusic(), { once: true });
})();
