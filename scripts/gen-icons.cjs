// Pure-Node PNG icon generator (no native deps — uses built-in zlib).
// Draws the SmokyClaw mark: an orange ">_" terminal prompt on near-black.
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const BG = [10, 10, 10, 255]; // #0a0a0a
const FG = [255, 140, 0, 255]; // #ff8c00 (accent orange)

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // raw with per-row filter byte 0
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function makeCanvas(S, bg) {
  const buf = Buffer.alloc(S * S * 4);
  for (let i = 0; i < S * S; i++) {
    buf[i * 4] = bg[0];
    buf[i * 4 + 1] = bg[1];
    buf[i * 4 + 2] = bg[2];
    buf[i * 4 + 3] = bg[3];
  }
  return buf;
}
function px(buf, S, x, y, c) {
  if (x < 0 || y < 0 || x >= S || y >= S) return;
  const i = (y * S + x) * 4;
  buf[i] = c[0];
  buf[i + 1] = c[1];
  buf[i + 2] = c[2];
  buf[i + 3] = c[3];
}
// thick line via distance-to-segment
function line(buf, S, ax, ay, bx, by, t, c) {
  const minX = Math.max(0, Math.floor(Math.min(ax, bx) - t));
  const maxX = Math.min(S - 1, Math.ceil(Math.max(ax, bx) + t));
  const minY = Math.max(0, Math.floor(Math.min(ay, by) - t));
  const maxY = Math.min(S - 1, Math.ceil(Math.max(ay, by) + t));
  const dx = bx - ax,
    dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      let u = ((x - ax) * dx + (y - ay) * dy) / len2;
      u = Math.max(0, Math.min(1, u));
      const px0 = ax + u * dx,
        py0 = ay + u * dy;
      const d = Math.hypot(x - px0, y - py0);
      if (d <= t) px(buf, S, x, y, c);
    }
  }
}
function rect(buf, S, x0, y0, x1, y1, c) {
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++)
    for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) px(buf, S, x, y, c);
}

// Draw ">_" prompt. `scale` shrinks the glyph (for maskable padding).
function drawMark(buf, S, scale = 1) {
  const c = S / 2;
  const g = (v) => c + (v - 0.5) * S * scale;
  const t = S * 0.055 * scale;
  // chevron ">"
  line(buf, S, g(0.34), g(0.28), g(0.56), g(0.5), t, FG);
  line(buf, S, g(0.56), g(0.5), g(0.34), g(0.72), t, FG);
  // underscore "_"
  rect(buf, S, g(0.3), g(0.74), g(0.7), g(0.74) + t * 1.6, FG);
}

function write(name, S, opts = {}) {
  const buf = makeCanvas(S, BG);
  drawMark(buf, S, opts.scale || 1);
  const out = path.join(__dirname, "..", "public", name);
  fs.writeFileSync(out, encodePNG(S, S, buf));
  console.log("wrote", name, `${S}x${S}`);
}

write("pwa-192.png", 192);
write("pwa-512.png", 512);
write("pwa-maskable-512.png", 512, { scale: 0.72 }); // padding for mask crop
write("apple-touch-icon.png", 180);
