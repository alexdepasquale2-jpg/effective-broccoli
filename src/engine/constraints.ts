import { CONSTRAINTS } from "./banks";
import { mulberry32, seedFromString } from "./forcedHand";

export function drawConstraint(seed: string, avoid: string[] = []): string {
  const rand = mulberry32(seedFromString(seed));
  const pool = CONSTRAINTS.filter((item) => !avoid.includes(item));
  const source = pool.length > 0 ? pool : CONSTRAINTS;
  return source[Math.floor(rand() * source.length)] as string;
}

export function drawConstraints(count: number, seed: string, avoid: string[] = []): string[] {
  const drawn: string[] = [];
  let nextAvoid = [...avoid];
  for (let i = 0; i < count; i += 1) {
    const item = drawConstraint(`${seed}:${i}`, nextAvoid);
    drawn.push(item);
    nextAvoid = [...nextAvoid, item];
  }
  return drawn;
}
