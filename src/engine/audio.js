/**
 * Audio
 *
 * Synthesised blips via WebAudio — no asset loading, no decode latency, and
 * nothing to 404. Mobile browsers refuse to start an AudioContext outside a
 * user gesture, so the context is created lazily on the first `unlock()`
 * call, which main.js wires to the first tap.
 */

const SOUNDS = {
  pickup: { freq: 660, to: 990, dur: 0.12, type: 'triangle', gain: 0.25 },
  hit:    { freq: 220, to: 90,  dur: 0.30, type: 'sawtooth', gain: 0.30 },
  ui:     { freq: 520, to: 520, dur: 0.06, type: 'square',   gain: 0.15 },
};

export class Audio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
  }

  play(name) {
    const spec = SOUNDS[name];
    if (!spec || !this.ctx || this.muted || this.ctx.state !== 'running') return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = spec.type;
    osc.frequency.setValueAtTime(spec.freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(spec.to, 1), t + spec.dur);

    gain.gain.setValueAtTime(spec.gain, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + spec.dur);

    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + spec.dur);
  }
}
