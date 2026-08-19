/**
 * Audio
 *
 * Synthesised blips via WebAudio — no asset loading, no decode latency, and
 * nothing to 404. Mobile browsers refuse to start an AudioContext outside a
 * user gesture, so the context is created lazily on the first `unlock()`
 * call, which main.js wires to the first tap.
 */

const SOUNDS = {
  hit:      { freq: 320, to: 60,   dur: 0.22, type: 'square',   gain: 0.26 },
  miss:     { freq: 180, to: 140,  dur: 0.07, type: 'square',   gain: 0.12 },
  friendly: { freq: 140, to: 190,  dur: 0.36, type: 'sawtooth', gain: 0.24 },
  breach:   { freq: 190, to: 55,   dur: 0.55, type: 'sawtooth', gain: 0.30 },
  ui:       { freq: 440, to: 440,  dur: 0.05, type: 'square',   gain: 0.14 },
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
