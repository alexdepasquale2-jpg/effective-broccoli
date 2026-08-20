function voice(ctx, { frequency, duration, type = "sine", gain = 0.04, delay = 0, glide = 0 }) {
  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, frequency + glide), now + duration);
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(gain, now + Math.min(0.14, duration * 0.3));
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

  get ready() {
    return !this.muted && this.ctx;
  }

  // Something has arrived and is asking.
  arrive(loud) {
    if (!this.ready) return;
    if (loud) {
      voice(this.ctx, { frequency: 233, duration: 0.9, type: "triangle", gain: 0.03 });
      voice(this.ctx, { frequency: 349, duration: 0.7, gain: 0.018, delay: 0.06 });
    } else {
      voice(this.ctx, { frequency: 294, duration: 1.2, gain: 0.02 });
      voice(this.ctx, { frequency: 441, duration: 1.0, gain: 0.012, delay: 0.1 });
    }
  }

  // You let it go by.
  pass() {
    if (!this.ready) return;
    voice(this.ctx, { frequency: 392, duration: 1.5, gain: 0.026 });
    voice(this.ctx, { frequency: 588, duration: 1.3, gain: 0.014, delay: 0.1 });
  }

  // You looked, without touching.
  watch() {
    if (!this.ready) return;
    voice(this.ctx, { frequency: 660, duration: 0.5, gain: 0.016 });
    voice(this.ctx, { frequency: 880, duration: 0.4, gain: 0.009, delay: 0.07 });
  }

  // You put your hand in.
  reach(choice) {
    if (!this.ready) return;
    if (choice === "tend") {
      voice(this.ctx, { frequency: 262, duration: 0.7, gain: 0.028 });
      voice(this.ctx, { frequency: 330, duration: 0.6, gain: 0.016, delay: 0.08 });
    } else {
      voice(this.ctx, { frequency: 165, duration: 0.5, type: "triangle", gain: 0.04, glide: -50 });
    }
  }

  // A story has finished.
  resolve(rank) {
    if (!this.ready) return;
    if (rank === 0) {
      voice(this.ctx, { frequency: 392, duration: 1.8, gain: 0.03 });
      voice(this.ctx, { frequency: 523, duration: 1.6, gain: 0.02, delay: 0.14 });
      voice(this.ctx, { frequency: 659, duration: 1.4, gain: 0.012, delay: 0.28 });
    } else if (rank === 1) {
      voice(this.ctx, { frequency: 330, duration: 1.2, gain: 0.024 });
      voice(this.ctx, { frequency: 415, duration: 1.0, gain: 0.014, delay: 0.12 });
    } else {
      voice(this.ctx, { frequency: 196, duration: 1.6, type: "triangle", gain: 0.03, glide: -40 });
      voice(this.ctx, { frequency: 147, duration: 1.4, gain: 0.02, delay: 0.16 });
    }
  }

  dusk() {
    if (!this.ready) return;
    voice(this.ctx, { frequency: 175, duration: 2.4, gain: 0.03 });
    voice(this.ctx, { frequency: 262, duration: 2.0, gain: 0.016, delay: 0.3 });
  }

  dawn() {
    if (!this.ready) return;
    voice(this.ctx, { frequency: 349, duration: 2.0, gain: 0.024 });
    voice(this.ctx, { frequency: 523, duration: 1.8, gain: 0.014, delay: 0.22 });
  }

  collapse() {
    if (!this.ready) return;
    voice(this.ctx, { frequency: 110, duration: 1.8, type: "sawtooth", gain: 0.035, glide: -40 });
  }
}
