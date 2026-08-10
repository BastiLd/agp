import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
await mkdir(join(root, "icons"), { recursive: true });

for (const size of [16, 32, 48, 128]) {
  await writeFile(join(root, "icons", `icon${size}.png`), createPng(size));
}

console.log("Icons generated.");

function createPng(size) {
  const bytesPerPixel = 4;
  const stride = size * bytesPerPixel;
  const raw = Buffer.alloc((stride + 1) * size);

  for (let y = 0; y < size; y += 1) {
    const row = y * (stride + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const i = row + 1 + x * bytesPerPixel;
      const nx = (x + 0.5) / size;
      const ny = (y + 0.5) / size;
      const shield = inShield(nx, ny);
      if (shield) {
        raw[i] = 23;
        raw[i + 1] = 107;
        raw[i + 2] = 91;
        raw[i + 3] = 255;
      }
      const check = distanceToSegment(nx, ny, 0.32, 0.54, 0.45, 0.67) < 0.035 ||
        distanceToSegment(nx, ny, 0.45, 0.67, 0.71, 0.36) < 0.035;
      if (shield && check) {
        raw[i] = 255;
        raw[i + 1] = 255;
        raw[i + 2] = 255;
        raw[i + 3] = 255;
      }
    }
  }

  const header = Buffer.from([
    0x89, 0x50, 0x4e, 0x47,
    0x0d, 0x0a, 0x1a, 0x0a
  ]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    header,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function inShield(x, y) {
  if (y < 0.12 || y > 0.9) {
    return false;
  }
  const topWidth = 0.66;
  const center = 0.5;
  const halfWidth = y < 0.42 ? topWidth / 2 : Math.max(0.06, (0.9 - y) * 0.75);
  return Math.abs(x - center) <= halfWidth;
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const wx = px - x1;
  const wy = py - y1;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) {
    return Math.hypot(px - x1, py - y1);
  }
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) {
    return Math.hypot(px - x2, py - y2);
  }
  const b = c1 / c2;
  return Math.hypot(px - (x1 + b * vx), py - (y1 + b * vy));
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
