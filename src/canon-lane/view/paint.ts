import type { GameObjects } from 'phaser';
import type { Era } from './era.ts';
import { parseSheet, type Sheet } from './sprites.ts';

export interface Spark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    max: number;
    color: number;
    size: number;
}

export function blit(
    g: GameObjects.Graphics,
    sheet: Sheet,
    cx: number,
    cy: number,
    era: Era,
    palette: number[],
    facing = 1,
    bob = 0,
) {
    const grid = parseSheet(sheet);
    const scale = era.pixel;
    const h = grid.length * scale;
    const w = (grid[0]?.length ?? 0) * scale;
    const ox = Math.round(cx - w / 2);
    const oy = Math.round(cy - h / 2 + bob);
    if (era.shadows) {
        g.fillStyle(0x000000, 0.28);
        g.fillRect(ox + 2, oy + h - 2, w - 2, 3);
    }
    for (let y = 0; y < grid.length; y += 1) {
        const row = grid[y];
        for (let x = 0; x < row.length; x += 1) {
            const cell = row[x];
            if (!cell) {
                continue;
            }
            const color = palette[cell] ?? palette[1];
            const px = facing >= 0 ? ox + x * scale : ox + (row.length - 1 - x) * scale;
            g.fillStyle(color, 1);
            g.fillRect(px, oy + y * scale, scale, scale);
        }
    }
}

export function paletteFor(era: Era, body: number, accent: number): number[] {
    return [0, 0x101018, body, accent, era.gold];
}

export function spawnBurst(sparks: Spark[], x: number, y: number, color: number, count: number, speed: number) {
    for (let i = 0; i < count; i += 1) {
        const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        sparks.push({
            x,
            y,
            vx: Math.cos(a) * speed * (0.6 + Math.random()),
            vy: Math.sin(a) * speed * (0.6 + Math.random()) - 20,
            life: 0.35 + Math.random() * 0.25,
            max: 0.55,
            color,
            size: 2 + Math.floor(Math.random() * 2),
        });
    }
}

export function stepSparks(g: GameObjects.Graphics, sparks: Spark[], dt: number) {
    const keep: Spark[] = [];
    for (const spark of sparks) {
        spark.life -= dt;
        spark.x += spark.vx * dt;
        spark.y += spark.vy * dt;
        spark.vy += 80 * dt;
        if (spark.life <= 0) {
            continue;
        }
        g.fillStyle(spark.color, spark.life / spark.max);
        g.fillRect(spark.x, spark.y, spark.size, spark.size);
        keep.push(spark);
    }
    sparks.length = 0;
    sparks.push(...keep);
}

export function scanlines(g: GameObjects.Graphics, x: number, y: number, w: number, h: number, alpha: number) {
    if (alpha <= 0) {
        return;
    }
    g.fillStyle(0x000000, alpha);
    for (let row = y; row < y + h; row += 4) {
        g.fillRect(x, row, w, 1);
    }
}

export function roundRect(g: GameObjects.Graphics, x: number, y: number, w: number, h: number, r: number, fill: number, alpha = 1) {
    g.fillStyle(fill, alpha);
    if (r <= 0) {
        g.fillRect(x, y, w, h);
        return;
    }
    g.fillRoundedRect(x, y, w, h, r);
}

export function strokeRect(g: GameObjects.Graphics, x: number, y: number, w: number, h: number, r: number, color: number, alpha: number) {
    g.lineStyle(eraLine(r), color, alpha);
    if (r <= 0) {
        g.strokeRect(x, y, w, h);
        return;
    }
    g.strokeRoundedRect(x, y, w, h, r);
}

function eraLine(r: number): number {
    return r >= 16 ? 2 : 1;
}
