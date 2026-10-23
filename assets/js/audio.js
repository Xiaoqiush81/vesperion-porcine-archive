const STORAGE_KEY = 'pigdex-audio-v1';
const DEFAULTS = Object.freeze({ music:false, effects:false });
const MELODY = [293.66, 349.23, 440, 392, 329.63, 293.66, 261.63, 329.63, 349.23, 440, 392, 329.63];

function loadSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return { ...DEFAULTS }; }
}

function saveSettings(settings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); }
  catch { /* Sound remains usable when private browsing blocks storage. */ }
}

export function createSoundscape(root = document) {
  const controls = root.querySelector('#soundscape');
  if (!controls || controls.dataset.ready === 'true') return;
  controls.dataset.ready = 'true';

  const settings = loadSettings();
  const musicButton = controls.querySelector('[data-audio="music"]');
  const effectsButton = controls.querySelector('[data-audio="effects"]');
  let context;
  let musicBus;
  let effectsBus;
  let musicTimer;
  let musicStep = 0;
  let noiseBuffer;

  function ensureContext() {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
      musicBus = context.createGain();
      effectsBus = context.createGain();
      musicBus.gain.value = .72;
      effectsBus.gain.value = .82;
      musicBus.connect(context.destination);
      effectsBus.connect(context.destination);
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
    return context;
  }

  function tone(frequency, delay, duration, volume, type = 'sine', bus = effectsBus) {
    if (!ensureContext()) return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(.035, duration / 3));
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(bus || effectsBus);
    oscillator.start(start);
    oscillator.stop(start + duration + .03);
  }

  function softNoise() {
    if (!ensureContext()) return;
    if (!noiseBuffer) {
      noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * .13), context.sampleRate);
      const channel = noiseBuffer.getChannelData(0);
      for (let index = 0; index < channel.length; index += 1) channel[index] = (Math.random() * 2 - 1) * (1 - index / channel.length);
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = 1350;
    gain.gain.value = .035;
    source.buffer = noiseBuffer;
    source.connect(filter).connect(gain).connect(effectsBus);
    source.start();
  }

  function effect(name) {
    if (!settings.effects || !ensureContext()) return;
    if (name === 'flip') {
      softNoise();
      tone(587.33, .055, .16, .025, 'sine');
    } else if (name === 'favorite') {
      [523.25, 659.25, 783.99].forEach((note, index) => tone(note, index * .055, .24, .035, 'sine'));
    } else if (name === 'door') {
      tone(293.66, 0, .22, .025, 'triangle');
      tone(440, .08, .3, .022, 'sine');
    } else if (name === 'pig') {
      tone(520, 0, .1, .035, 'sine');
      tone(680, .08, .15, .03, 'sine');
    } else {
      tone(480, 0, .07, .018, 'sine');
    }
  }

  function musicBeat() {
    if (!settings.music || !ensureContext()) return;
    const note = MELODY[musicStep % MELODY.length];
    tone(note, 0, 1.65, .026, 'sine', musicBus);
    tone(note * 2, .08, .72, .009, 'sine', musicBus);
    if (musicStep % 4 === 0) tone(note / 2, 0, 2.35, .013, 'triangle', musicBus);
    musicStep += 1;
  }

  function startMusic() {
    if (musicTimer || !settings.music || !ensureContext()) return;
    musicBeat();
    musicTimer = window.setInterval(musicBeat, 1450);
  }

  function stopMusic() {
    window.clearInterval(musicTimer);
    musicTimer = undefined;
  }

  function updateControls() {
    [[musicButton, settings.music], [effectsButton, settings.effects]].forEach(([button, active]) => {
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-active', active);
    });
  }

  controls.addEventListener('click', event => {
    const button = event.target.closest('[data-audio]');
    if (!button) return;
    const key = button.dataset.audio;
    settings[key] = !settings[key];
    saveSettings(settings);
    updateControls();
    if (key === 'music') settings.music ? startMusic() : stopMusic();
    if (key === 'effects' && settings.effects) effect('favorite');
  });

  root.addEventListener('click', event => {
    if (event.target.closest('#soundscape')) return;
    if (event.target.closest('.tarot-card, .draw-card')) effect('flip');
    else if (event.target.closest('.favorite-toggle')) effect('favorite');
    else if (event.target.closest('[data-room-target]')) effect('door');
    else if (event.target.closest('#callPig')) effect('pig');
    else if (event.target.closest('button')) effect('tap');
  });

  root.addEventListener('pointerdown', () => { if (settings.music) startMusic(); }, { once:true, passive:true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopMusic();
    else if (settings.music) startMusic();
  });
  updateControls();
}
