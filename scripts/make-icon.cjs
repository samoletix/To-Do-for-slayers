/**
 * Генератор иконки приложения: build/icon.ico и build/icon.png.
 *
 * Рисуем иконку кодом, чтобы не тащить графический редактор в проект.
 * Запуск: node scripts/make-icon.cjs
 * Свою картинку положи в build/icon.png и перезапусти скрипт —
 * размеры пересчитаются под неё.
 */

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const OUT_DIR = path.join(__dirname, '..', 'build')
const SIZES = [16, 24, 32, 48, 64, 128, 256]
const SS = 4 // сглаживание: считаем по 4x4 точкам на пиксель

const BG_TOP = [27, 36, 52]
const BG_BOTTOM = [13, 17, 23]
const CHECK = [53, 240, 160]
const CHECK_SHADOW = [16, 92, 66]

/** Закруглённый прямоугольник: расстояние от точки до фигуры, 0 — внутри. */
function sdRoundBox(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - (hw - r)
  const qy = Math.abs(py - cy) - (hh - r)
  const ax = Math.max(qx, 0)
  const ay = Math.max(qy, 0)
  return Math.sqrt(ax * ax + ay * ay) + Math.min(Math.max(qx, qy), 0) - r
}

/** Расстояние до отрезка — так рисуется и «галочка», и скруглённые концы. */
function sdSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2))
  const cx = ax + t * dx
  const cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}

/** Пиксель в координатах холста 256x256. */
function shade(x, y) {
  // Фон: скруглённый квадрат с вертикальным градиентом.
  const inside = sdRoundBox(x, y, 128, 128, 120, 120, 54) <= 0
  if (!inside) return [0, 0, 0, 0]

  const t = y / 256
  let color = [
    Math.round(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t),
    Math.round(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t),
    Math.round(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t)
  ]

  const mark = (ox, oy, w, rgb, alpha) => {
    const d = Math.min(
      sdSegment(x, y, 66 + ox, 134 + oy, 110 + ox, 178 + oy),
      sdSegment(x, y, 110 + ox, 178 + oy, 192 + ox, 84 + oy)
    )
    if (d > w) return
    // Мягкий край, чтобы линия не была лесенкой.
    const k = Math.min(1, Math.max(0, (w - d) * 1.6))
    color = [
      Math.round(color[0] * (1 - k) + rgb[0] * k),
      Math.round(color[1] * (1 - k) + rgb[1] * k),
      Math.round(color[2] * (1 - k) + rgb[2] * k)
    ]
    if (alpha) return
  }

  mark(0, 4, 15, CHECK_SHADOW, true)
  mark(0, 0, 14, CHECK, false)
  return [...color, 255]
}

/** RGBA-буфер размера size с суперсэмплингом. */
function render(size) {
  const scale = 256 / size
  const data = Buffer.alloc(size * size * 4)
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          const x = (px + (sx + 0.5) / SS) * scale
          const y = (py + (sy + 0.5) / SS) * scale
          const c = shade(x, y)
          r += c[0] * c[3]
          g += c[1] * c[3]
          b += c[2] * c[3]
          a += c[3]
        }
      }
      const n = SS * SS
      const alpha = a / n
      const i = (py * size + px) * 4
      // Непрозрачные пиксели храним без premultiply, полупрозрачные — сразу premultiply.
      if (alpha > 0) {
        const k = n / a
        data[i] = Math.round(r * k)
        data[i + 1] = Math.round(g * k)
        data[i + 2] = Math.round(b * k)
        data[i + 3] = Math.round(alpha)
      }
    }
  }
  return data
}

/** Минимальный кодировщик PNG (8 бит, RGBA, без фильтра). */
function crc32(buf) {
  let c
  const table = crc32.table || (crc32.table = (() => {
    const t = new Int32Array(256)
    for (let n = 0; n < 256; n += 1) {
      c = n
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[n] = c
    }
    return t
  })())
  let crc = -1
  for (let i = 0; i < buf.length; i += 1) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff]
  return (crc ^ -1) >>> 0
}

function chunk(type, body) {
  const head = Buffer.alloc(8)
  head.writeUInt32BE(body.length, 0)
  head.write(type, 4, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0)
  return Buffer.concat([head, body, crc])
}

function png(size, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

/** ICO с PNG-кадрами — Windows Vista и новее читают такой формат. */
function ico(frames) {
  const header = Buffer.alloc(6 + frames.length * 16)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(frames.length, 4)

  let offset = header.length
  frames.forEach((frame, index) => {
    const at = 6 + index * 16
    header[at] = frame.size >= 256 ? 0 : frame.size
    header[at + 1] = frame.size >= 256 ? 0 : frame.size
    header[at + 2] = 0
    header[at + 3] = 0
    header.writeUInt16LE(1, at + 4)
    header.writeUInt16LE(32, at + 6)
    header.writeUInt32LE(frame.data.length, at + 8)
    header.writeUInt32LE(offset, at + 12)
    offset += frame.data.length
  })

  return Buffer.concat([header, ...frames.map((frame) => frame.data)])
}

const frames = SIZES.map((size) => ({ size, data: png(size, render(size)) }))

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(path.join(OUT_DIR, 'icon.ico'), ico(frames))
fs.writeFileSync(path.join(OUT_DIR, 'icon.png'), frames[frames.length - 1].data)
console.log(`build/icon.ico (${SIZES.join(', ')}) и build/icon.png готовы`)