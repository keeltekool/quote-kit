// Generate simple PWA icons using Canvas API
// Run: node scripts/generate-icons.js

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#2563EB";
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();

  // "Q" letter
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${size * 0.55}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Q", size * 0.48, size * 0.48);

  // Small "K" subscript
  ctx.font = `bold ${size * 0.22}px sans-serif`;
  ctx.fillText("K", size * 0.7, size * 0.72);

  const buffer = canvas.toBuffer("image/png");
  const outPath = path.join(__dirname, "..", "public", "icons", `icon-${size}.png`);
  fs.writeFileSync(outPath, buffer);
  console.log(`Generated ${outPath}`);
}

try {
  generateIcon(192);
  generateIcon(512);
} catch (e) {
  console.error("canvas package not available, creating placeholder icons");
  // Create minimal 1x1 PNG as placeholder
  for (const size of [192, 512]) {
    const outPath = path.join(__dirname, "..", "public", "icons", `icon-${size}.png`);
    if (!fs.existsSync(outPath)) {
      // Write a minimal valid PNG (blue pixel)
      const png = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPf/PwAFGwJxB3SAOAAAAABJRU5ErkJggg==",
        "base64"
      );
      fs.writeFileSync(outPath, png);
      console.log(`Placeholder: ${outPath}`);
    }
  }
}
