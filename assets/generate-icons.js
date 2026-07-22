/**
 * generate-icons.js
 * Gera os ícones PNG para a PWA usando apenas APIs nativas do Node.js
 * Cria PNGs válidos com cabeçalho correto sem dependências externas.
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fundo com gradiente laranja
  const radius = size * 0.188; // ~96px arredondado em 512
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#FF6B35');
  grad.addColorStop(1, '#E5521A');

  // Rounded rect
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  const s = size / 512;

  // Triângulo play (branco)
  ctx.beginPath();
  ctx.moveTo(190 * s, 155 * s);
  ctx.lineTo(190 * s, 310 * s);
  ctx.lineTo(340 * s, 232 * s);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fill();

  // Seta de download
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  // Haste vertical
  roundRect(ctx, 242 * s, 328 * s, 28 * s, 60 * s, 6 * s);
  ctx.fill();
  // Triângulo da seta
  ctx.beginPath();
  ctx.moveTo(218 * s, 368 * s);
  ctx.lineTo(256 * s, 418 * s);
  ctx.lineTo(294 * s, 368 * s);
  ctx.closePath();
  ctx.fill();
  // Linha base
  roundRect(ctx, 200 * s, 418 * s, 112 * s, 18 * s, 9 * s);
  ctx.fill();

  return canvas.toBuffer('image/png');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

for (const size of sizes) {
  const buf = drawIcon(size);
  const outPath = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(outPath, buf);
  console.log(`✅ icon-${size}.png gerado (${buf.length} bytes)`);
}

console.log('\n🎉 Todos os ícones foram gerados com sucesso!');
