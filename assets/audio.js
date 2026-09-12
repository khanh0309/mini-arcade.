(() => {
  const ENABLE_KEY = 'arcade_sound_enabled';
  let enabled = localStorage.getItem(ENABLE_KEY) !== '0';
  let ctx = null;
  let master = null;
  let musicTimer = null;
  let step = 0;
  const melody = [261.63,329.63,392.00,329.63,293.66,349.23,440.00,349.23,246.94,293.66,369.99,293.66,220.00,277.18,329.63,277.18];

  function ensureAudio() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.16;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, duration = 0.1, volume = 0.08, type = 'square', when = 0) {
    if (!enabled) return;
    const ac = ensureAudio();
    const o = ac.createOscillator();
    const g = ac.createGain();
    const t = ac.currentTime + when;
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(Math.max(0.0001, volume), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + duration + 0.02);
  }

  function musicTick() {
    if (!enabled) return;
    const root = melody[step % melody.length];
    tone(root, 0.12, 0.035, 'square');
    if (step % 2 === 0) tone(root / 2, 0.18, 0.018, 'triangle', 0.02);
    if (step % 4 === 3) tone(root * 1.5, 0.07, 0.015, 'sine', 0.08);
    step++;
  }

  function startMusic() {
    if (!enabled || musicTimer) return;
    ensureAudio();
    musicTick();
    musicTimer = setInterval(musicTick, 330);
    updateButtons();
  }

  function stopMusic() {
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
    updateButtons();
  }

  function setEnabled(value) {
    enabled = !!value;
    localStorage.setItem(ENABLE_KEY, enabled ? '1' : '0');
    if (enabled) startMusic(); else stopMusic();
    updateButtons();
  }

  function toggle() { setEnabled(!enabled); }

  function sfx(name) {
    if (!enabled) return;
    const sounds = {
      click: () => tone(520, .045, .045, 'square'),
      move: () => tone(390, .035, .035, 'triangle'),
      eat: () => { tone(620, .055, .05, 'square'); tone(820, .07, .04, 'square', .045); },
      flap: () => tone(470, .055, .045, 'triangle'),
      jump: () => { tone(330, .06, .045, 'square'); tone(480, .08, .035, 'square', .05); },
      point: () => tone(760, .055, .045, 'square'),
      line: () => { [523,659,784].forEach((f,i)=>tone(f,.08,.035,'square',i*.055)); },
      win: () => { [523,659,784,1047].forEach((f,i)=>tone(f,.11,.045,'square',i*.07)); },
      crash: () => { tone(140,.16,.065,'sawtooth'); tone(85,.22,.055,'square',.08); },
      gameover: () => { tone(220,.11,.05,'square'); tone(165,.13,.05,'square',.10); tone(110,.18,.05,'square',.20); }
    };
    (sounds[name] || sounds.click)();
  }

  function updateButtons() {
    document.querySelectorAll('[data-sound-toggle]').forEach(btn => {
      btn.textContent = enabled ? '🔊 Âm thanh' : '🔇 Tắt tiếng';
      btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    });
  }

  function bind() {
    document.querySelectorAll('[data-sound-toggle]').forEach(btn => {
      if (btn.dataset.boundSound) return;
      btn.dataset.boundSound = '1';
      btn.addEventListener('click', (e) => { e.preventDefault(); toggle(); });
    });
    updateButtons();
  }

  window.ArcadeAudio = { startMusic, stopMusic, toggle, setEnabled, sfx, get enabled(){ return enabled; } };
  document.addEventListener('DOMContentLoaded', bind);
  document.addEventListener('pointerdown', () => startMusic(), { once: true });
  document.addEventListener('keydown', () => startMusic(), { once: true });
})();
