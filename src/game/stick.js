export function drawHominid(ctx, x, groundY, opts = {}) {
  const s = opts.scale || 1;
  const walk = opts.walk || 0;
  const face = opts.facing >= 0 ? 1 : -1;
  const color = opts.color || "#1a1208";
  const kind = opts.kind || "player";
  const lean = kind === "player" ? 8 : kind === "baby" ? 14 : 10;
  const headR = (kind === "baby" ? 7 : 9) * s;
  const hipY = groundY - (kind === "baby" ? 20 : 26) * s;
  const headY = groundY - (kind === "baby" ? 38 : 48) * s - lean;
  const armSwing = Math.sin(walk) * 10 * s;
  const legSwing = Math.sin(walk) * 8 * s;

  ctx.save();
  ctx.translate(x, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  ctx.fillStyle = opts.headFill || "#f2d6b3";
  ctx.lineWidth = Math.max(2, 3 * s);

  ctx.beginPath();
  ctx.arc(0, headY, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(2 * s, headY + headR);
  ctx.lineTo(4 * s, hipY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(2 * s, headY + headR + 4 * s);
  ctx.lineTo(-14 * s * face, hipY - 2 * s + armSwing);
  ctx.moveTo(2 * s, headY + headR + 4 * s);
  ctx.lineTo(10 * s * face, hipY - 6 * s - armSwing);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(4 * s, hipY);
  ctx.lineTo(-8 * s * face + legSwing, groundY);
  ctx.moveTo(4 * s, hipY);
  ctx.lineTo(10 * s * face - legSwing, groundY);
  ctx.stroke();

  if (opts.tool) {
    ctx.fillStyle = "#666";
    ctx.beginPath();
    ctx.arc(12 * s * face, hipY - 4 * s - armSwing, 5 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawStick(ctx, x, groundY, opts = {}) {
  drawHominid(ctx, x, groundY, { ...opts, kind: opts.kind || "player" });
}

export function drawSpeech(ctx, x, y, text) {
  if (!text) return;
  ctx.save();
  ctx.font = "12px Trebuchet MS, sans-serif";
  const width = Math.min(220, ctx.measureText(text).width + 16);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect?.(x - width / 2, y - 28, width, 22, 6);
  if (!ctx.roundRect) ctx.rect(x - width / 2, y - 28, width, 22);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#111";
  ctx.textAlign = "center";
  ctx.fillText(text, x, y - 13, width - 10);
  ctx.restore();
}
