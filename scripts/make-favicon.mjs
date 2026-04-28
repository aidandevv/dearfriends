import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const __dirname = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname))
const publicDir = path.join(__dirname, '..', 'public')

// SVG stamp — cream frame, blue inner block, italic "df" serif
const svgWithForever = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <rect x="28" y="20" width="200" height="216" rx="3" fill="#E4CE95" stroke="#d9cfb0" stroke-width="3"/>
  <rect x="40" y="32" width="176" height="192" rx="2" fill="none" stroke="#faf4e4" stroke-width="4" stroke-dasharray="8 5"/>
  <rect x="52" y="44" width="152" height="168" rx="1" fill="#3358ba"/>
  <text x="128" y="148" text-anchor="middle" dominant-baseline="alphabetic"
    font-family="Georgia, 'Times New Roman', serif"
    font-style="italic" font-weight="500" font-size="88" fill="#E4CE95">df</text>
  <text x="128" y="192" text-anchor="middle" dominant-baseline="alphabetic"
    font-family="Georgia, serif" font-size="20" letter-spacing="5" fill="#E4CE95">FOREVER</text>
</svg>`

const svgClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <rect x="28" y="20" width="200" height="216" rx="3" fill="#E4CE95" stroke="#d9cfb0" stroke-width="3"/>
  <rect x="40" y="32" width="176" height="192" rx="2" fill="none" stroke="#faf4e4" stroke-width="4" stroke-dasharray="8 5"/>
  <rect x="52" y="44" width="152" height="168" rx="1" fill="#3358ba"/>
  <text x="128" y="162" text-anchor="middle" dominant-baseline="alphabetic"
    font-family="Georgia, 'Times New Roman', serif"
    font-style="italic" font-weight="500" font-size="96" fill="#E4CE95">df</text>
</svg>`

const svg = svgClean

const sizes = [16, 32, 48, 64, 128, 256]

// Produce one PNG per size
const pngBuffers = await Promise.all(
  sizes.map(size =>
    sharp(Buffer.from(svg))
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
  )
)

// Write individual PNGs (useful for apple-touch-icon etc.)
fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), pngBuffers[1])
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngBuffers[5])
console.log('Wrote favicon-32x32.png and apple-touch-icon.png')

// Build ICO file (header + directory + PNG data)
// ICO supports embedded PNGs for sizes >= 256 and raw BMP for smaller,
// but all modern OSes/browsers accept PNG-in-ICO for every size.
function buildIco(pngs) {
  const count = pngs.length
  const headerSize = 6
  const dirEntrySize = 16
  const dirSize = count * dirEntrySize
  const dataOffset = headerSize + dirSize

  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)      // reserved
  header.writeUInt16LE(1, 2)      // type: ICO
  header.writeUInt16LE(count, 4)  // image count

  let offset = dataOffset
  const dirEntries = pngs.map((buf, i) => {
    const size = sizes[i]
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)  // width  (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)  // height (0 = 256)
    entry.writeUInt8(0, 2)                         // color count
    entry.writeUInt8(0, 3)                         // reserved
    entry.writeUInt16LE(1, 4)                      // planes
    entry.writeUInt16LE(32, 6)                     // bit count
    entry.writeUInt32LE(buf.length, 8)             // size of image data
    entry.writeUInt32LE(offset, 12)                // offset to image data
    offset += buf.length
    return entry
  })

  return Buffer.concat([header, ...dirEntries, ...pngs])
}

const ico = buildIco(pngBuffers)
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico)
console.log(`Wrote favicon.ico (${(ico.length / 1024).toFixed(1)} KB, ${sizes.join('/')}px)`)
