function voice(ctx, { frequency, duration, type = "sine", gain = 0.05, delay = 0, glide = 0 }) {
  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, frequency + glide), now + duration);
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(gain, now + Math.min(0.12, duration * 0.3));
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

export class AudioBus {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  // A thing arrived and asked for you.
  arrive() {
    if (this.muted || !this.ctx) return;
    voice(this.ctx, { frequency: 294, duration: 1.1, gain: 0.022 });
    voice(this.ctx, { frequency: 441, duration: 0.9, gain: 0.014, delay: 0.08 });
  }

  // You let it go by.
  pass() {
    if (this.muted || !this.ctx) return;
    voice(this.ctx, { frequency: 392, duration: 1.6, gain: 0.03 });
    voice(this.ctx, { frequency: 588, duration: 1.4, gain: 0.018, delay: 0.1 });
    voice(this.ctx, { frequency: 784, duration: 1.2, gain: 0.01, delay: 0.2 });
  }

  // You reached in.
  act() {
    if (this.muted || !this.ctx) return;
    voice(this.ctx, { frequency: 176, duration: 0.5, type: "triangle", gain: 0.045, glide: -60 });
  }

  // Depth crossed.
  deepen() {
    if (this.muted || !this.ctx) return;
    voice(this.ctx, { frequency: 196, duration: 2.6, gain: 0.03 });
    voice(this.ctx, { frequency: 294, duration: 2.4, gain: 0.02, delay: 0.25 });
    voice(this.ctx, { frequency: 441, duration: 2.2, gain: 0.012, delay: 0.5 });
  }

  // The button that does nothing.
  nothing() {
    if (this.muted || !this.ctx) return;
    voice(this.ctx, { frequency: 118, duration: 0.22, type: "square", gain: 0.012 });
  }
}
