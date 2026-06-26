/**
 * Generate a synthetic two-timepoint DICOM test pair for the longitudinal
 * comparison viewer, by PATCHING a known-good cornerstone test image
 * (e2e/fixtures/multi-series/image2.dcm — a real 512×512 implicit-VR CT that the
 * WADO loader decodes). We clone it per slice and overwrite, IN PLACE and at the
 * SAME byte lengths (so no group-length fixups), the pixel data + slice geometry
 * + UIDs. Generating DICOM from scratch (dcmjs or hand-rolled) does not decode in
 * cornerstone-wado-image-loader 4.x here, so patching a working file is the
 * reliable route.
 *
 * Two axial "CT" studies share a Frame of Reference; a bright "lesion" is LARGER
 * in baseline and SMALLER in follow-up so position-synced scrolling visibly shows
 * healing. Different slice counts (24 vs 18) prove sync is by physical position.
 *
 *   node scripts/gen-compare-fixtures.mjs
 *   → e2e/fixtures/compare/{baseline,followup}/*.dcm
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dicomParser from 'dicom-parser'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(__dirname, '..', 'e2e', 'fixtures', 'multi-series', 'image2.dcm')
const OUT = path.join(__dirname, '..', 'e2e', 'fixtures', 'compare')

const DIM = 512 // image2 is 512×512
const SPACING = 3.0
const SHARED_FOR = '1.2.826.0.1.3680043.8.498.999'
// Stored values (HU = stored - 1024 per image2 rescale): air -1000, soft +40, lesion +200
const AIR = 24, SOFT = 1064, LESION = 1224

const src = new Uint8Array(fs.readFileSync(SRC))
const ds = dicomParser.parseDicom(src)
const el = (tag) => {
  const e = ds.elements[tag]
  if (!e) throw new Error(`image2 missing ${tag}`)
  return { off: e.dataOffset, len: e.length }
}
const E = {
  pixels: el('x7fe00010'),
  ipp: el('x00200032'),
  iop: el('x00200037'),
  sliceLoc: el('x00201041'),
  forUID: el('x00200052'),
  sop: el('x00080018'),
  studyUID: el('x0020000d'),
  seriesUID: el('x0020000e'),
  instNum: el('x00200013'),
  studyDate: el('x00080020'),
  seriesDesc: el('x0008103e'),
}

/** Write `str` into buf at element `e`, padded/truncated to exactly e.len. */
function patch(buf, e, str, padByte = 0x20) {
  const b = Buffer.from(String(str), 'latin1')
  for (let i = 0; i < e.len; i++) buf[e.off + i] = i < b.length ? b[i] : padByte
}
/** A valid UID padded with NUL to exactly `len` (UIDs nul-pad, not space). */
function uidPad(base, len) {
  const b = Buffer.from(base, 'latin1')
  if (b.length > len) throw new Error(`UID too long: ${base}`)
  return { str: base, padByte: 0x00 }
}

function phantom(lesionR) {
  const px = new Int16Array(DIM * DIM)
  const c = DIM / 2, a = DIM * 0.42, b = DIM * 0.34
  for (let y = 0; y < DIM; y++) for (let x = 0; x < DIM; x++) {
    const dx = x - c, dy = y - c
    let v = (dx * dx) / (a * a) + (dy * dy) / (b * b) <= 1 ? SOFT : AIR
    if (lesionR > 0 && dx * dx + dy * dy <= lesionR * lesionR) v = LESION
    px[y * DIM + x] = v
  }
  return Buffer.from(px.buffer)
}
const lesionRadiusAt = (z, zc, scale) => {
  const half = 18, d = Math.abs(z - zc)
  return d > half ? 0 : 52 * scale * (1 - d / half) // 512px → larger radius
}

function writeSlice(dir, study, i, lesionR) {
  const z = i * SPACING
  const buf = Buffer.from(src) // clone the working file
  // pixels
  const px = phantom(lesionR)
  px.copy(buf, E.pixels.off, 0, E.pixels.len)
  // geometry
  patch(buf, E.ipp, `-128\\-128\\${z}`)
  patch(buf, E.sliceLoc, `${z}`)
  patch(buf, E.iop, `1\\0\\0\\0\\1\\0`)
  // shared frame of reference; per-study + per-slice UIDs (nul-padded)
  const forU = uidPad(SHARED_FOR, E.forUID.len); patch(buf, E.forUID, forU.str, forU.padByte)
  const stU = uidPad(study.studyUID, E.studyUID.len); patch(buf, E.studyUID, stU.str, stU.padByte)
  const seU = uidPad(study.seriesUID, E.seriesUID.len); patch(buf, E.seriesUID, seU.str, seU.padByte)
  const soU = uidPad(`${study.seriesUID}.${i + 1}`, E.sop.len); patch(buf, E.sop, soU.str, soU.padByte)
  patch(buf, E.instNum, `${i + 1}`)
  patch(buf, E.studyDate, study.date)
  patch(buf, E.seriesDesc, study.seriesDesc)
  fs.writeFileSync(path.join(dir, `slice${String(i + 1).padStart(2, '0')}.dcm`), buf)
  return { z, lesionR: Math.round(lesionR) }
}

function genStudy(study) {
  const dir = path.join(OUT, study.folder)
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const zc = (study.slices * SPACING) / 2
  const rows = []
  for (let i = 0; i < study.slices; i++) rows.push({ i: i + 1, ...writeSlice(dir, study, i, lesionRadiusAt(i * SPACING, zc, study.scale)) })
  return { dir, rows }
}

const baseline = { folder: 'baseline', date: '20240101', slices: 24, scale: 1.0, studyUID: '1.2.826.0.1.3680043.8.498.1', seriesUID: '1.2.826.0.1.3680043.8.498.1.1', seriesDesc: 'AXIAL BASELINE' }
const followup = { folder: 'followup', date: '20240701', slices: 18, scale: 0.5, studyUID: '1.2.826.0.1.3680043.8.498.2', seriesUID: '1.2.826.0.1.3680043.8.498.2.1', seriesDesc: 'AXIAL FOLLOWUP' }

for (const study of [baseline, followup]) {
  const { dir, rows } = genStudy(study)
  console.log(`\n${study.folder}: ${rows.length} slices → ${dir}`)
  for (const idx of [0, Math.floor(rows.length / 2), rows.length - 1]) {
    const f = path.join(dir, `slice${String(idx + 1).padStart(2, '0')}.dcm`)
    const d = dicomParser.parseDicom(new Uint8Array(fs.readFileSync(f)))
    console.log(`  slice${idx + 1}: IPP=${d.string('x00200032')} | inst=${d.string('x00200013')} | series=${(d.string('x0020000e') || '').slice(-6)} | lesionR=${rows[idx].lesionR}`)
  }
}
console.log('\nDone.')
