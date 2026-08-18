export function drawStick(ctx, x, groundY, opts = {}) {
  const s = opts.scale || 1;
  const walk = opts.walk || 0;
  const face = opts.facing >= 0 ? 1 : -1;
  const color = opts.color || "#111111";
  const headR = 9 * s;
  const hipY = groundY - 26 * s;
  const headY = groundY - 50 * s;
  const armSwing = Math.sin(walk) * 11 * s;
  const legSwing = Math.sin(walk) * 9 * s;

  ctx.save();
  ctx.translate(x, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  ctx.fillStyle = opts.headFill || "#ffffff";
  ctx.lineWidth = Math.max(2, 3 * s);

  ctx.beginPath();
  ctx.arc(0, headY, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, headY + headR);
  ctx.lineTo(0, hipY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, headY + headR + 5 * s);
  ctx.lineTo(-12 * s * face, hipY - 2 * s + armSwing);
  ctx.moveTo(0, headY + headR + 5 * s);
  ctx.lineTo(12 * s * face, hipY - 2 * s - armSwing);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, hipY);
  ctx.lineTo(-7 * s * face + legSwing, groundY);
  ctx.moveTo(0, hipY);
  ctx.lineTo(8 * s * face - legSwing, groundY);
  ctx.stroke();

  if (opts.hat) {
    ctx.fillStyle = "#222";
    ctx.fillRect(-headR, headY - headR - 4 * s, headR * 2, 5 * s);
    ctx.fillRect(-2 * s, headY - headR - 12 * s, 12 * s, 8 * s);
  }

  if (opts.bat) {
    ctx.strokeStyle = "#5a3410";
    ctx.lineWidth = Math.max(2.4, 3.2 * s);
    ctx.beginPath();
    ctx.moveTo(12 * s * face, hipY - 2 * s - armSwing);
    ctx.lineTo(22 * s * face, hipY + 20 * s - armSwing);
    ctx.stroke();
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = Math.max(1.2, 1.6 * s);
    ctx.beginPath();
    ctx.moveTo(18 * s * face, hipY + 10 * s - armSwing);
    ctx.lineTo(24 * s * face, hipY + 8 * s - armSwing);
    ctx.stroke();
  }

  ctx.restore();
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
