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
      effectsBus.connect(reverb);
      reverb.connect(reverbLevel).connect(master);
      master.connect(compressor).connect(context.destination);
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
    return context;
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

  function duckMusic() {
    if (!musicBus || !settings.music) return;
    const now = context.currentTime;
    musicBus.gain.cancelScheduledValues(now);
    musicBus.gain.setValueAtTime(musicBus.gain.value, now);
    musicBus.gain.linearRampToValueAtTime(.28, now + .025);
    musicBus.gain.linearRampToValueAtTime(.42, now + .18);
    musicBus.gain.linearRampToValueAtTime(MUSIC_LEVEL, now + .7);
  }

  function cardFlip() {
    duckMusic();
    paperLayer(0, .2, 520, 3100, .14, 1.08);
    paperLayer(.105, .24, 2900, 680, .12, .84);
    paperLayer(.27, .075, 1700, 920, .1, 1.45);
    voice(108, .255, .16, .055, { type:'sine', attack:.012, release:.13, cutoff:650 });
  }

  function effect(name) {
    if (!settings.effects || !ensureContext()) return;
    duckMusic();
    if (name === 'flip') cardFlip();
    else if (name === 'favorite') {
      [440, 587.33, 698.46, 880].forEach((note, index) => voice(note, index * .065, .68, .055, { type:'sine', release:.52 }));
    } else if (name === 'door') {
      voice(146.83, 0, .72, .065, { type:'triangle', attack:.02, release:.55, cutoff:1500 });
      voice(220, .055, .9, .045, { type:'sine', release:.7 });
      voice(293.66, .12, 1.05, .032, { type:'sine', release:.82 });
    } else if (name === 'pig') {
      voice(510, 0, .13, .07, { type:'triangle', release:.08 });
      voice(690, .09, .2, .065, { type:'sine', release:.14 });
      voice(570, .23, .18, .05, { type:'triangle', release:.12 });
    } else {
      paperLayer(0, .055, 1100, 1850, .045, 1.55);
      voice(293.66, .015, .11, .025, { type:'sine', release:.08 });
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

  function startMusic() {
    if (musicTimer || !settings.music || !ensureContext()) return;
    scheduleBar();
    musicTimer = window.setInterval(scheduleBar, BAR_LENGTH);
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
