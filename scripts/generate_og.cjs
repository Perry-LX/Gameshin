/**
 * Generate a minimal 1200x630 PNG OG image for Gameshin
 * No external dependencies - writes raw PNG binary
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const W = 1200;
const H = 630;

// Simple pixel color palette
const BG = [26, 26, 46]; // #1a1a2e
const WHITE = [255, 255, 255];
const GREEN = [74, 222, 128]; // #4ade80
const YELLOW = [245, 158, 11]; // #f59e0b
const GOLD = [212, 160, 23]; // #d4a017
const BLUE = [59, 130, 246]; // #3b82f6
const RED = [239, 68, 68]; // #ef4444
const PURPLE = [168, 85, 247]; // #a855f7
const GRAY = [136, 136, 170];
const DIM_GRAY = [120, 120, 150];

// Create raw pixel data (RGBA)
const pixels = Buffer.alloc(W * H * 4, 255);

function setPixel(x, y, [r, g, b]) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 4;
  pixels[i] = r;
  pixels[i + 1] = g;
  pixels[i + 2] = b;
  pixels[i + 3] = 255;
}

function fillRect(x1, y1, x2, y2, color) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      setPixel(x, y, color);
    }
  }
}

// Fill background
fillRect(0, 0, W - 1, H - 1, BG);

// Draw pixel art game icons
const iconColors = [GREEN, YELLOW, GOLD, BLUE, RED, PURPLE];
const iconPatterns = [
  // Snake-like (pixel pattern 1)
  [[0,0],[1,0],[2,0],[0,1],[0,2],[1,2],[2,2],[2,1]],
  // Block-like (pixel pattern 2)
  [[0,0],[1,0],[0,1],[1,1],[2,2],[2,3],[3,2],[3,3]],
  // Chess-like (pixel pattern 3)
  [[0,0],[0,1],[1,0],[2,0],[1,2],[2,2],[0,3],[1,3]],
  // Star-like (pixel pattern 4)
  [[1,0],[0,1],[1,1],[2,1],[1,2],[3,0],[3,2],[0,3],[2,3]],
  // Cross-like (pixel pattern 5)
  [[1,0],[0,1],[1,1],[2,1],[1,2],[1,3],[1,4],[0,3],[2,3]],
  // Diamond-like (pixel pattern 6)
  [[1,0],[0,1],[1,1],[2,1],[1,2],[2,2],[1,3],[0,2],[2,0]],
];

for (let i = 0; i < 6; i++) {
  const cx = 80 + i * 210;
  const cy = 250;
  for (const [dx, dy] of iconPatterns[i]) {
    fillRect(cx + dx * 10, cy + dy * 10, cx + dx * 10 + 8, cy + dy * 10 + 8, iconColors[i]);
  }
  // Bottom row
  const cy2 = 420;
  for (const [dx, dy] of iconPatterns[5 - i]) {
    fillRect(cx + dx * 10, cy2 + dy * 10, cx + dx * 10 + 8, cy2 + dy * 10 + 8, iconColors[i]);
  }
}

// Simple horizontal bar at bottom
for (let x = 0; x < W; x++) {
  setPixel(x, H - 3, DIM_GRAY);
  setPixel(x, H - 2, DIM_GRAY);
  setPixel(x, H - 1, DIM_GRAY);
}

// Helper: create a 1bpp font bitmap - very basic 5x7 font
// We'll skip the font rendering and just draw simple text blocks
// For a real OG image, we'll create colored sections instead

// Add colored bars to indicate features
const barY = 120;
const barH = 4;
const barColors = [GREEN, YELLOW, GOLD, BLUE, RED, PURPLE];
for (let i = 0; i < 6; i++) {
  const bx = 150 + i * 160;
  fillRect(bx, barY, bx + 100, barY + barH, barColors[i]);
}

// Feature badges
const badges = [
  ["7+ GAMES", GREEN],
  ["FREE", YELLOW],
  ["BROWSER", GOLD],
];
for (let i = 0; i < 3; i++) {
  const bx = 300 + i * 240;
  const by = 520;
  // Badge background
  fillRect(bx, by, bx + 160, by + 36, [40, 40, 70]);
  // Badge border
  const bc = badges[i][1];
  for (let x = bx; x <= bx + 160; x++) {
    setPixel(x, by, bc);
    setPixel(x, by + 36, bc);
  }
  for (let y = by; y <= by + 36; y++) {
    setPixel(bx, y, bc);
    setPixel(bx + 160, y, bc);
  }
}

// URL bar at bottom
const urlY = 580;
const urlX = 400;
fillRect(urlX, urlY, urlX + 400, urlY + 32, [30, 30, 55]);
for (let x = urlX; x <= urlX + 400; x++) {
  setPixel(x, urlY, YELLOW);
  setPixel(x, urlY + 32, YELLOW);
}
for (let y = urlY; y <= urlY + 32; y++) {
  setPixel(urlX, y, YELLOW);
  setPixel(urlX + 400, y, YELLOW);
}

// ---- Write PNG ----

function crc32(buf) {
  let crc = 0xffffffff;
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngPack() {
  // Convert RGBA pixels to filtered rows (filter byte 0 = None)
  const rawData = Buffer.alloc(H * (1 + W * 4));
  for (let y = 0; y < H; y++) {
    rawData[y * (1 + W * 4)] = 0; // filter None
    pixels.copy(rawData, y * (1 + W * 4) + 1, y * W * 4, y * W * 4 + W * 4);
  }

  const deflated = zlib.deflateSync(rawData, { level: 9 });

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type, "ascii");
    const crcData = Buffer.concat([typeB, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData));
    return Buffer.concat([len, typeB, data, crc]);
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT
  const idat = deflated;

  // IEND
  const iend = Buffer.alloc(0);

  const parts = [
    signature,
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", idat),
    makeChunk("IEND", iend),
  ];

  return Buffer.concat(parts);
}

const outPath = "D:/ai/agent_workplace/games/ai_games_workplace/Gameshin/public/og-image.png";
const png = pngPack();
fs.writeFileSync(outPath, png);
console.log("OG image created:", outPath);
console.log("Size:", png.length, "bytes");
console.log("Dimensions: 1200x630");
