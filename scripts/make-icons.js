'use strict';

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const BIT_DEPTH = 8;
const COLOUR_TYPE_RGBA = 6;
const DESIGN_GRID = 32;

let crcTable = null;

function crc32(buffer) {
  if (!crcTable) {
    crcTable = new Int32Array(256);
    for (let index = 0; index < 256; index += 1) {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) {
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      }
      crcTable[index] = value;
    }
  }

  let value = -1;
  for (let index = 0; index < buffer.length; index += 1) {
    value = crcTable[(value ^ buffer[index]) & 0xff] ^ (value >>> 8);
  }
  return (value ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBytes = Buffer.from(type, 'ascii');
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);

  return Buffer.concat([length, typeBytes, data, checksum]);
}

function toPng(width, height, pixels) {
  const stride = width * 4 + 1;
  const scanlines = Buffer.alloc(stride * height);

  for (let y = 0; y < height; y += 1) {
    scanlines[y * stride] = 0;
    pixels.copy(scanlines, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = BIT_DEPTH;
  header[9] = COLOUR_TYPE_RGBA;

  return Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(scanlines, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const PALETTES = {
  macTemplate: { accent: [0, 0, 0, 255], bar: [0, 0, 0, 150] }
};

const BARS = [
  { y: 6, fromX: 5, toX: 27, colour: 'accent' },
  { y: 14, fromX: 5, toX: 27, colour: 'bar' },
  { y: 22, fromX: 5, toX: 21, colour: 'bar' }
];

const BAR_HEIGHT = 4;

function draw(size, paletteName) {
  const palette = PALETTES[paletteName];
  const pixels = Buffer.alloc(size * size * 4, 0);
  const scale = size / DESIGN_GRID;

  BARS.forEach((bar) => {
    const colour = palette[bar.colour];
    const top = Math.round(bar.y * scale);
    const bottom = Math.round((bar.y + BAR_HEIGHT) * scale);
    const left = Math.round(bar.fromX * scale);
    const right = Math.round(bar.toX * scale);

    for (let y = top; y < bottom; y += 1) {
      for (let x = left; x < right; x += 1) {
        const offset = (y * size + x) * 4;
        pixels[offset] = colour[0];
        pixels[offset + 1] = colour[1];
        pixels[offset + 2] = colour[2];
        pixels[offset + 3] = colour[3];
      }
    }
  });

  return toPng(size, size, pixels);
}

const OUTPUTS = [
  ['trayTemplate.png', 16, 'macTemplate'],
  ['trayTemplate@2x.png', 32, 'macTemplate']
];

fs.mkdirSync(ASSETS, { recursive: true });
OUTPUTS.forEach(([name, size, palette]) => {
  fs.writeFileSync(path.join(ASSETS, name), draw(size, palette));
  console.log(`wrote assets/${name}`);
});
