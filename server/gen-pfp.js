// Generate a 512x512 crab profile picture for the TG bot
// Uses Canvas API via node — outputs PNG

const { createCanvas } = require('canvas');
const fs = require('fs');

const SIZE = 512;
const c = createCanvas(SIZE, SIZE);
const ctx = c.getContext('2d');

// Background — dark ocean gradient
const bg = ctx.createRadialGradient(256, 256, 0, 256, 256, 300);
bg.addColorStop(0, '#0a1428');
bg.addColorStop(1, '#060614');
ctx.fillStyle = bg;
ctx.fillRect(0, 0, SIZE, SIZE);

// Subtle caustic rings
ctx.globalAlpha = 0.06;
for (let i = 0; i < 5; i++) {
  ctx.strokeStyle = '#2266aa';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(256 + Math.sin(i * 1.3) * 40, 256 + Math.cos(i * 0.9) * 30, 80 + i * 35, 0, Math.PI * 2);
  ctx.stroke();
}
ctx.globalAlpha = 1;

// === CRAB ===
const cx = 256, cy = 270;
const s = 120; // crab scale

// Shadow
ctx.globalAlpha = 0.3;
ctx.fillStyle = '#000';
ctx.beginPath();
ctx.ellipse(cx, cy + s * 0.8, s * 0.7, s * 0.15, 0, 0, Math.PI * 2);
ctx.fill();
ctx.globalAlpha = 1;

// Legs (3 per side)
ctx.strokeStyle = '#00cc66';
ctx.lineWidth = 6;
ctx.lineCap = 'round';
for (let side = -1; side <= 1; side += 2) {
  for (let leg = 0; leg < 3; leg++) {
    const bx = cx + side * s * 0.35;
    const by = cy + (leg - 1) * s * 0.28;
    const mx = bx + side * s * 0.55;
    const my = by + (leg === 1 ? -8 : 8);
    const tx = mx + side * s * 0.3;
    const ty = my + s * 0.22;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(mx, my, tx, ty);
    ctx.stroke();
  }
}

// Left claw
ctx.fillStyle = '#00dd77';
ctx.beginPath();
ctx.arc(cx - s * 0.82, cy - s * 0.2, s * 0.26, 0, Math.PI * 2);
ctx.fill();
// Claw pincers
ctx.fillStyle = '#009955';
ctx.beginPath();
ctx.arc(cx - s * 0.92, cy - s * 0.38, s * 0.12, 0, Math.PI * 2);
ctx.fill();
ctx.beginPath();
ctx.arc(cx - s * 0.72, cy - s * 0.02, s * 0.12, 0, Math.PI * 2);
ctx.fill();

// Right claw (bigger — asymmetric like real crabs)
ctx.fillStyle = '#00dd77';
ctx.beginPath();
ctx.arc(cx + s * 0.82, cy - s * 0.18, s * 0.3, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = '#009955';
ctx.beginPath();
ctx.arc(cx + s * 0.95, cy - s * 0.4, s * 0.14, 0, Math.PI * 2);
ctx.fill();
ctx.beginPath();
ctx.arc(cx + s * 0.72, cy + 0.02 * s, s * 0.14, 0, Math.PI * 2);
ctx.fill();

// Body shell — gradient
const bodyGrad = ctx.createRadialGradient(cx - 10, cy - 15, 0, cx, cy, s * 0.55);
bodyGrad.addColorStop(0, '#33ffaa');
bodyGrad.addColorStop(0.5, '#00dd77');
bodyGrad.addColorStop(1, '#008844');
ctx.fillStyle = bodyGrad;
ctx.beginPath();
ctx.ellipse(cx, cy, s * 0.55, s * 0.42, 0, 0, Math.PI * 2);
ctx.fill();

// Shell pattern
ctx.strokeStyle = '#006633';
ctx.lineWidth = 2;
ctx.globalAlpha = 0.4;
for (let i = 1; i <= 3; i++) {
  ctx.beginPath();
  ctx.arc(cx, cy - 5, s * 0.12 * i, Math.PI * 0.7, Math.PI * 2.3);
  ctx.stroke();
}
ctx.globalAlpha = 1;

// Shell highlight
ctx.globalAlpha = 0.15;
ctx.fillStyle = '#fff';
ctx.beginPath();
ctx.ellipse(cx - s * 0.15, cy - s * 0.15, s * 0.25, s * 0.15, -0.3, 0, Math.PI * 2);
ctx.fill();
ctx.globalAlpha = 1;

// Eye stalks
ctx.strokeStyle = '#00cc66';
ctx.lineWidth = 5;
const eyeY = cy - s * 0.5;
ctx.beginPath(); ctx.moveTo(cx - s * 0.18, cy - s * 0.32); ctx.lineTo(cx - s * 0.24, eyeY); ctx.stroke();
ctx.beginPath(); ctx.moveTo(cx + s * 0.18, cy - s * 0.32); ctx.lineTo(cx + s * 0.24, eyeY); ctx.stroke();

// Eyes
ctx.fillStyle = '#fff';
ctx.beginPath();
ctx.arc(cx - s * 0.24, eyeY, s * 0.11, 0, Math.PI * 2);
ctx.arc(cx + s * 0.24, eyeY, s * 0.11, 0, Math.PI * 2);
ctx.fill();
// Pupils
ctx.fillStyle = '#111';
ctx.beginPath();
ctx.arc(cx - s * 0.22, eyeY + 2, s * 0.055, 0, Math.PI * 2);
ctx.arc(cx + s * 0.22, eyeY + 2, s * 0.055, 0, Math.PI * 2);
ctx.fill();
// Eye shine
ctx.fillStyle = '#fff';
ctx.beginPath();
ctx.arc(cx - s * 0.26, eyeY - 3, s * 0.03, 0, Math.PI * 2);
ctx.arc(cx + s * 0.26, eyeY - 3, s * 0.03, 0, Math.PI * 2);
ctx.fill();

// === TEXT ===
// "CLAWRISK" above crab
ctx.fillStyle = '#ffdd00';
ctx.font = 'bold 52px monospace';
ctx.textAlign = 'center';
ctx.shadowColor = '#ffdd00';
ctx.shadowBlur = 15;
ctx.fillText('CLAWRISK', cx, 100);
ctx.shadowBlur = 0;

// "ARENA" below
ctx.fillStyle = '#00ff88';
ctx.font = 'bold 40px monospace';
ctx.shadowColor = '#00ff88';
ctx.shadowBlur = 12;
ctx.fillText('ARENA', cx, 148);
ctx.shadowBlur = 0;

// Tagline at bottom
ctx.fillStyle = '#556';
ctx.font = '18px monospace';
ctx.fillText('Territory Warfare', cx, 460);

// Border ring
ctx.strokeStyle = '#00ff8844';
ctx.lineWidth = 3;
ctx.beginPath();
ctx.arc(256, 256, 248, 0, Math.PI * 2);
ctx.stroke();

// Save
const out = fs.createWriteStream('web/bot-pfp.png');
const stream = c.createPNGStream();
stream.pipe(out);
out.on('finish', () => console.log('Generated web/bot-pfp.png'));
