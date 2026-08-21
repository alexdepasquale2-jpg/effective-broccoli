import { CASTES } from '../game/castes.js';
import { vessel } from '../core/storage.js';

/**
 * THE VOICE.
 *
 * Nothing here is sampled. Every sound the vessel makes is computed while you
 * are listening to it, which the Vel consider the only honest way to make a
 * noise. The three tongues have three timbres — struck, sung, held — and a
 * braid is the moment all three land on the same chord.
 *
 * Tuning is just intonation on a drone of 54 Hz. Equal temperament was
 * described by the Kor as "a rounding error you have agreed to live inside".
 */

const ROOT = 54; // Hz — felt more than heard, on a phone speaker
const JUST = { unison: 1, third: 6 / 5, fourth: 4 / 3, fifth: 3 / 2, seventh: 9 / 5, octave: 2 };

let ctx = null;
let master = null;
let space = null; // the reverb send
let drone = null;
let ready = false;

export function isMuted() {
  return Boolean(vessel.get('muted'));
}

export function setMuted(muted) {
  vessel.set('muted', muted);
  if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.08);
  return muted;
}

/** Must be called from inside a real gesture; mobile audio is a walled garden. */
export function wake() {
  if (ready) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = isMuted() ? 0 : 0.9;
  master.connect(ctx.destination);

  space = ctx.createConvolver();
  space.buffer = makeSpace(ctx, 2.6, 2.4);
  const spaceGain = ctx.createGain();
  spaceGain.gain.value = 0.5;
  space.connect(spaceGain).connect(master);

  ready = true;
}

/** A hall that does not exist, built out of decaying noise. */
function makeSpace(context, seconds, decay) {
  const len = Math.floor(context.sampleRate * seconds);
  const buf = context.createBuffer(2, len, context.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

function voice({
  freq,
  wave = 'sine',
  gain = 0.2,
  attack = 0.01,
  decay = 1,
  send = 0.4,
  detune = 0,
}) {
  if (!ready) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = wave;
  osc.frequency.value = freq;
  osc.detune.value = detune;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = Math.min(9000, freq * 8);
  filter.Q.value = 0.6;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);

  osc.connect(filter).connect(env);
  env.connect(master);
  if (space && send > 0) {
    const s = ctx.createGain();
    s.gain.value = send;
    env.connect(s).connect(space);
  }
  osc.start(t);
  osc.stop(t + attack + decay + 0.05);
}

/** The bed. Three near-unisons that beat against each other very slowly. */
export function startDrone() {
  if (!ready || drone) return;
  const g = ctx.createGain();
  g.gain.value = 0.0001;
  g.gain.setTargetAtTime(0.075, ctx.currentTime, 3);
  g.connect(master);
  const send = ctx.createGain();
  send.gain.value = 0.6;
  g.connect(send).connect(space);

  const oscs = [
    { f: ROOT, type: 'sine', det: 0 },
    { f: ROOT * JUST.fifth, type: 'sine', det: -6 },
    { f: ROOT * JUST.octave, type: 'triangle', det: 5 },
  ].map(({ f, type, det }) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.detune.value = det;
    o.connect(g);
    o.start();
    return o;
  });

  // A breath in the drone itself, far slower than yours.
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.045;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.03;
  lfo.connect(lfoGain).connect(g.gain);
  lfo.start();

  drone = { g, oscs, lfo };
}

export function stopDrone() {
  if (!drone) return;
  drone.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.6);
  const d = drone;
  drone = null;
  setTimeout(() => {
    d.oscs.forEach((o) => o.stop());
    d.lfo.stop();
  }, 2400);
}

const CASTE_INTERVAL = { vel: JUST.fifth, kor: JUST.unison, sha: JUST.third };

export function castTone(casteId) {
  const c = CASTES[casteId];
  if (!c) return;
  const { wave, base, decay, bite } = c.timbre;
  voice({ freq: base, wave, gain: 0.16, attack: 0.006, decay, send: 0.35 });
  voice({
    freq: base * JUST.octave,
    wave: 'sine',
    gain: 0.06 * (1 + bite),
    attack: 0.004,
    decay: decay * 0.5,
  });
}

/** Each breath, a soft edge of sound so the rhythm can be felt eyes-closed. */
export function pulseTick(pulse) {
  const step = [JUST.unison, JUST.third, JUST.fourth, JUST.fifth][pulse % 4];
  voice({
    freq: ROOT * 4 * step,
    wave: 'sine',
    gain: 0.035,
    attack: 0.004,
    decay: 0.28,
    send: 0.5,
  });
}

export function chimeTone(castes) {
  const f = ROOT * 6 * (CASTE_INTERVAL[castes[0]] ?? 1);
  voice({ freq: f, wave: 'triangle', gain: 0.07, attack: 0.005, decay: 0.9, send: 0.6 });
  voice({
    freq: f * (CASTE_INTERVAL[castes[1]] ?? 1.5),
    wave: 'sine',
    gain: 0.05,
    attack: 0.02,
    decay: 1.1,
    send: 0.6,
  });
}

/** All three, together, once. This is the sound the whole vessel is built to make. */
export function braidChord() {
  const base = ROOT * 4;
  [JUST.unison, JUST.third, JUST.fifth, JUST.octave].forEach((ratio, i) => {
    setTimeout(
      () =>
        voice({
          freq: base * ratio,
          wave: i === 3 ? 'triangle' : 'sine',
          gain: 0.11,
          attack: 0.01,
          decay: 2.4,
          send: 0.75,
        }),
      i * 52,
    );
  });
}

export function wovenChord() {
  const base = ROOT * 2;
  [
    JUST.unison,
    JUST.third,
    JUST.fifth,
    JUST.seventh,
    JUST.octave,
    JUST.octave * JUST.third,
  ].forEach((ratio, i) => {
    setTimeout(
      () =>
        voice({
          freq: base * ratio,
          wave: 'sine',
          gain: 0.1,
          attack: 0.03,
          decay: 4.5,
          send: 0.85,
        }),
      i * 140,
    );
  });
}

export function stilledTone() {
  voice({ freq: ROOT * 2, wave: 'sine', gain: 0.1, attack: 0.05, decay: 3.2, send: 0.7 });
  voice({ freq: ROOT * 2 * (8 / 9), wave: 'sine', gain: 0.07, attack: 0.4, decay: 3.4, send: 0.7 });
}

export function uiTap(bright = false) {
  voice({
    freq: ROOT * (bright ? 8 : 6),
    wave: 'sine',
    gain: 0.045,
    attack: 0.003,
    decay: 0.16,
    send: 0.25,
  });
}

/** The rite's own voice: one tone per phase, following the body. */
export function breathTone(phaseId) {
  const map = { in: JUST.fourth, full: JUST.fifth, out: JUST.unison, empty: JUST.third };
  voice({
    freq: ROOT * 3 * (map[phaseId] ?? 1),
    wave: 'sine',
    gain: 0.075,
    attack: 0.35,
    decay: 2.2,
    send: 0.8,
  });
}

/** A word, spoken as pitch. Used when the Codex shows you a glyph. */
export function speakWord(word) {
  if (!ready) return;
  const ratios = [JUST.unison, JUST.third, JUST.fourth, JUST.fifth, JUST.seventh, JUST.octave];
  [...word].slice(0, 5).forEach((ch, i) => {
    const ratio = ratios[ch.charCodeAt(0) % ratios.length];
    setTimeout(
      () =>
        voice({
          freq: ROOT * 6 * ratio,
          wave: 'triangle',
          gain: 0.05,
          attack: 0.01,
          decay: 0.5,
          send: 0.6,
        }),
      i * 110,
    );
  });
}
