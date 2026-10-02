/** Tiny WebAudio blips. No assets; silent until the first user gesture. */
let ctx: AudioContext | null = null;

export function unlockAudio() {
    try {
        ctx ??= new AudioContext();
        void ctx.resume();
    } catch {
        ctx = null;
    }
}

export function blip(freq: number, ms = 80, type: OscillatorType = 'square', gain = 0.05, delayMs = 0) {
    if (!ctx || ctx.state !== 'running') {
        return;
    }
    const t = ctx.currentTime + delayMs / 1000;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + ms / 1000);
}

export const sfx = {
    tap: () => blip(180, 40, 'square', 0.03),
    kill: () => blip(660, 90, 'triangle'),
    summon: () => blip(520, 70, 'triangle'),
    /** Pitch rises with tier so big merges sound big. */
    merge: (tier: number) => blip(220 * 1.12 ** tier, 160, 'sawtooth', 0.04),
    fanfare: () => [523, 659, 784, 1047].forEach((f, i) => blip(f, 160, 'triangle', 0.05, i * 90)),
    deny: () => blip(110, 120, 'square', 0.03),
};
