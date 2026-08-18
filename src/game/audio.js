function tone(ctx, { frequency, duration, type = "sine", gain = 0.08, slide = 0, delay = 0 }) {
  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  if (slide) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, frequency + slide), now + duration);
  }
  amp.gain.setValueAtTime(gain, now);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
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
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  collect(combo) {
    if (this.muted || !this.ctx) return;
    const pitch = 520 + Math.min(combo, 12) * 42;
    tone(this.ctx, { frequency: pitch, duration: 0.12, type: "triangle", gain: 0.06 });
    tone(this.ctx, {
      frequency: pitch * 1.5,
      duration: 0.16,
      type: "sine",
      gain: 0.04,
      delay: 0.03,
    });
  }

  start() {
    if (this.muted || !this.ctx) return;
    tone(this.ctx, { frequency: 220, duration: 0.18, type: "sine", gain: 0.05, slide: 180 });
  }

  hit() {
    if (this.muted || !this.ctx) return;
    tone(this.ctx, { frequency: 180, duration: 0.28, type: "sawtooth", gain: 0.05, slide: -120 });
    tone(this.ctx, { frequency: 90, duration: 0.4, type: "triangle", gain: 0.07 });
  }

  fold() {
    if (this.muted || !this.ctx) return;
    tone(this.ctx, { frequency: 140, duration: 0.22, type: "sine", gain: 0.05, slide: 420 });
    tone(this.ctx, { frequency: 880, duration: 0.12, type: "triangle", gain: 0.03, delay: 0.04 });
  }

  draft() {
    if (this.muted || !this.ctx) return;
    tone(this.ctx, { frequency: 330, duration: 0.16, type: "square", gain: 0.03 });
    tone(this.ctx, { frequency: 495, duration: 0.2, type: "sine", gain: 0.04, delay: 0.05 });
  }

  boon() {
    if (this.muted || !this.ctx) return;
    tone(this.ctx, { frequency: 523, duration: 0.12, type: "triangle", gain: 0.05 });
    tone(this.ctx, { frequency: 784, duration: 0.18, type: "sine", gain: 0.04, delay: 0.06 });
  }

  jackpot() {
    if (this.muted || !this.ctx) return;
    tone(this.ctx, { frequency: 392, duration: 0.12, type: "square", gain: 0.04 });
    tone(this.ctx, { frequency: 587, duration: 0.14, type: "triangle", gain: 0.05, delay: 0.05 });
    tone(this.ctx, { frequency: 784, duration: 0.2, type: "sine", gain: 0.05, delay: 0.1 });
  }
}
