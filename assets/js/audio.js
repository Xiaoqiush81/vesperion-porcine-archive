const STORAGE_KEY = 'pigdex-audio-v1';
const DEFAULTS = Object.freeze({ music:false, effects:false });
const MUSIC_LEVEL = .92;
const BAR_LENGTH = 5600;
const CHORDS = [
  [146.83, 220, 293.66, 349.23],
  [116.54, 174.61, 233.08, 293.66],
  [130.81, 196, 261.63, 392],
  [130.81, 196, 293.66, 329.63]
];

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
  let musicStarting;
  let musicStep = 0;
  let noiseBuffer;

  function makeImpulse(seconds = 2.7, decay = 3.2) {
    const length = Math.ceil(context.sampleRate * seconds);
    const impulse = context.createBuffer(2, length, context.sampleRate);
    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let index = 0; index < length; index += 1) data[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / length, decay);
    }
    return impulse;
  }

  function ensureContext() {
    if (context?.state === 'closed') {
      context = undefined;
      musicBus = undefined;
      effectsBus = undefined;
      noiseBuffer = undefined;
    }
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
      musicBus = context.createGain();
      effectsBus = context.createGain();
      const master = context.createGain();
      const compressor = context.createDynamicsCompressor();
      const reverb = context.createConvolver();
      const reverbLevel = context.createGain();
      musicBus.gain.value = MUSIC_LEVEL;
      effectsBus.gain.value = 1;
      master.gain.value = .78;
      compressor.threshold.value = -18;
      compressor.knee.value = 16;
      compressor.ratio.value = 3;
      compressor.attack.value = .012;
      compressor.release.value = .28;
      reverb.buffer = makeImpulse();
      reverbLevel.gain.value = .3;
      musicBus.connect(master);
      musicBus.connect(reverb);
      effectsBus.connect(master);
      reverb.connect(reverbLevel).connect(master);
      master.connect(compressor).connect(context.destination);
    }
    return context;
  }

  async function activateContext() {
    const audio = ensureContext();
    if (!audio) return false;
    if (audio.state !== 'running') {
      try { await audio.resume(); }
      catch { return false; }
    }
    return audio.state === 'running';
  }

  function voice(frequency, delay, duration, volume, options = {}) {
    if (!ensureContext()) return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    oscillator.type = options.type || 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.detune.value = options.detune || 0;
    filter.type = 'lowpass';
    filter.frequency.value = options.cutoff || 4800;
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + (options.attack || .035));
    gain.gain.setValueAtTime(volume, start + Math.max(options.attack || .035, duration - (options.release || .35)));
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(filter).connect(gain).connect(options.bus || effectsBus);
    oscillator.start(start);
    oscillator.stop(start + duration + .04);
  }

  function getNoiseBuffer() {
    if (noiseBuffer) return noiseBuffer;
    noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * .55), context.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    let previous = 0;
    for (let index = 0; index < channel.length; index += 1) {
      const white = Math.random() * 2 - 1;
      previous = previous * .22 + white * .78;
      channel[index] = previous;
    }
    return noiseBuffer;
  }

  function paperLayer(delay, duration, fromFrequency, toFrequency, volume, playbackRate = 1) {
    const start = context.currentTime + delay;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = getNoiseBuffer();
    source.playbackRate.value = playbackRate;
    filter.type = 'bandpass';
    filter.Q.value = .72;
    filter.frequency.setValueAtTime(fromFrequency, start);
    filter.frequency.exponentialRampToValueAtTime(toFrequency, start + duration);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + duration * .18);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(filter).connect(gain).connect(effectsBus);
    source.start(start);
    source.stop(start + duration + .02);
  }

  function uiPing(fromFrequency, toFrequency, delay, duration, volume, type = 'sine') {
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(fromFrequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(toFrequency, start + duration);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(effectsBus);
    oscillator.start(start);
    oscillator.stop(start + duration + .02);
  }

  function duckMusic(depth = .34, recovery = .55) {
    if (!musicBus || !settings.music) return;
    const now = context.currentTime;
    musicBus.gain.cancelScheduledValues(now);
    musicBus.gain.setValueAtTime(musicBus.gain.value, now);
    musicBus.gain.linearRampToValueAtTime(depth, now + .018);
    musicBus.gain.linearRampToValueAtTime(MUSIC_LEVEL, now + recovery);
  }

  function cardFlip() {
    duckMusic(.25, .72);
    paperLayer(0, .2, 520, 3100, .14, 1.08);
    paperLayer(.105, .24, 2900, 680, .12, .84);
    paperLayer(.27, .075, 1700, 920, .1, 1.45);
    voice(108, .255, .16, .055, { type:'sine', attack:.012, release:.13, cutoff:650 });
  }

  async function effect(name) {
    if (!settings.effects || !await activateContext()) return;
    if (name === 'flip') cardFlip();
    else if (name === 'favorite') {
      duckMusic(.3, .5);
      uiPing(920, 1340, 0, .13, .095, 'sine');
      uiPing(1420, 1960, .065, .17, .06, 'sine');
      paperLayer(.015, .06, 2400, 4100, .04, 1.7);
    } else if (name === 'door') {
      duckMusic(.28, .58);
      paperLayer(0, .12, 480, 2600, .085, 1.16);
      uiPing(760, 540, .045, .105, .095, 'triangle');
      uiPing(1280, 940, .065, .12, .045, 'sine');
    } else if (name === 'pig') {
      duckMusic(.32, .52);
      voice(510, 0, .13, .07, { type:'triangle', release:.08 });
      voice(690, .09, .2, .065, { type:'sine', release:.14 });
      voice(570, .23, .18, .05, { type:'triangle', release:.12 });
    } else {
      duckMusic(.46, .28);
      paperLayer(0, .038, 1750, 3600, .038, 1.8);
      uiPing(1180, 720, .004, .072, .085, 'triangle');
    }
  }

  function scheduleBar() {
    if (!settings.music || !ensureContext()) return;
    const chord = CHORDS[musicStep % CHORDS.length];
    chord.forEach((note, index) => {
      voice(note, 0, 7.2, index === 0 ? .052 : .032, { type:'triangle', detune:-5, attack:1.05, release:2.5, cutoff:1150, bus:musicBus });
      voice(note, 0, 7.2, index === 0 ? .035 : .022, { type:'sine', detune:6, attack:1.2, release:2.7, cutoff:1700, bus:musicBus });
    });
    [0, 2, 1, 3, 2, 1].forEach((noteIndex, index) => {
      const note = chord[noteIndex] * (index > 2 ? 2 : 1);
      voice(note, .38 + index * .78, 1.18, .038, { type:'sine', attack:.012, release:.94, bus:musicBus });
      voice(note * 2, .41 + index * .78, .52, .012, { type:'sine', attack:.008, release:.43, bus:musicBus });
    });
    if (musicStep % 2 === 1) voice(chord[3] * 2, 3.9, 2.2, .026, { type:'sine', attack:.025, release:1.8, bus:musicBus });
    musicStep += 1;
  }

  async function startMusic() {
    if (musicTimer || musicStarting || !settings.music || document.hidden) return;
    musicStarting = (async () => {
      if (!await activateContext() || musicTimer || !settings.music || document.hidden) return;
      scheduleBar();
      musicTimer = window.setInterval(scheduleBar, BAR_LENGTH);
    })();
    try { await musicStarting; }
    finally { musicStarting = undefined; }
  }

  function stopMusic() {
    window.clearInterval(musicTimer);
    musicTimer = undefined;
  }

  async function restoreAudio() {
    if (document.hidden || (!settings.music && !settings.effects)) return;
    const ready = await activateContext();
    if (ready && settings.music && !musicTimer) startMusic();
  }

  function pauseForBackground() {
    stopMusic();
    if (context?.state === 'running') context.suspend().catch(() => {});
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

  root.addEventListener('pointerdown', restoreAudio, { capture:true, passive:true });
  root.addEventListener('touchstart', restoreAudio, { capture:true, passive:true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseForBackground();
    else restoreAudio();
  });
  window.addEventListener('pagehide', pauseForBackground);
  window.addEventListener('pageshow', restoreAudio);
  window.addEventListener('focus', restoreAudio);
  updateControls();
}
