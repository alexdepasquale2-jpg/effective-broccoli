export class Sfx {
    private ctx: AudioContext | null = null;
    muted = false;

    unlock() {
        this.ensure();
        void this.ctx?.resume();
    }

    private ensure(): AudioContext | null {
        if (this.muted) {
            return null;
        }
        if (this.ctx) {
            return this.ctx;
        }
        const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) {
            return null;
        }
        this.ctx = new Ctor();
        return this.ctx;
    }

    private tone(freq: number, dur: number, type: OscillatorType, gain = 0.045, at = 0) {
        const ctx = this.ensure();
        if (!ctx) {
            return;
        }
        const osc = ctx.createOscillator();
        const amp = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        amp.gain.value = 0.0001;
        osc.connect(amp);
        amp.connect(ctx.destination);
        const t = ctx.currentTime + at;
        amp.gain.exponentialRampToValueAtTime(gain, t + 0.01);
        amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.start(t);
        osc.stop(t + dur + 0.02);
    }

    tap() {
        this.tone(740, 0.045, 'square', 0.03);
    }

    crit() {
        this.tone(880, 0.05, 'sawtooth', 0.04);
        this.tone(1320, 0.07, 'triangle', 0.03, 0.03);
    }

    lastHit() {
        this.tone(520, 0.05, 'square', 0.035);
        this.tone(780, 0.07, 'triangle', 0.03, 0.04);
    }

    upgrade() {
        this.tone(392, 0.06, 'triangle', 0.04);
        this.tone(523, 0.08, 'triangle', 0.035, 0.05);
        this.tone(659, 0.1, 'triangle', 0.03, 0.1);
    }

    tier() {
        this.tone(261, 0.08, 'sawtooth', 0.04);
        this.tone(392, 0.1, 'triangle', 0.04, 0.08);
        this.tone(523, 0.14, 'triangle', 0.035, 0.16);
    }

    victory() {
        this.tone(523, 0.1, 'triangle', 0.045);
        this.tone(659, 0.1, 'triangle', 0.04, 0.1);
        this.tone(784, 0.16, 'triangle', 0.04, 0.2);
    }

    defeat() {
        this.tone(196, 0.18, 'sawtooth', 0.03);
        this.tone(146, 0.22, 'triangle', 0.03, 0.1);
    }

    omen() {
        this.tone(990, 0.08, 'square', 0.03);
        this.tone(1480, 0.1, 'triangle', 0.025, 0.04);
    }
}
