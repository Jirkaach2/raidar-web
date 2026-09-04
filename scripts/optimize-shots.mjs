/**
 * Builds the website's product imagery from the four genuine 1920x1080
 * captures of the shipping desktop client.
 *
 * Two kinds of output:
 *   1. FULL screens  — the whole app window, at 1920/1440/960 so the hero can
 *      render large on wide displays without upscaling.
 *   2. DETAIL crops  — tight regions of those same captures (a sidebar panel,
 *      the raid-cost table, the market table...). These are real pixels from
 *      real screens, just framed on one feature, which is how we get many
 *      images out of four files without fabricating anything.
 *
 * Crop rects were derived by inspecting each capture. They are expressed in
 * source pixels against the 1920x1080 originals.
 *
 * Run: node scripts/optimize-shots.mjs
 */
import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SRC = path.resolve('../branding/mockups');
const OUT = path.resolve('public/shots');

/** Full screens — LIVE captures taken from the running v1.1.0 client while
 *  connected to a real server (SURVIVORS.GG, 171/200 players), so every number
 *  on screen is genuine game state rather than mock data.
 *
 *  Superseded the old `raidar_actual_app_screen_*` mockups, which had ~2% ink
 *  density, an untextured map, overlapping teammate tooltips and a raid-cost
 *  total that contradicted its own table. The live client computes it correctly
 *  (4x C4 = 8,800 sulfur across six ranked methods).
 *
 *  `raidar_hud_screen_*` and the 11 `mockup_slide_*` / `pitch_slide1` files stay
 *  excluded: the former render as empty black frames, the latter are investor
 *  deck pages carrying marketing headlines, a CONFIDENTIAL marking, a
 *  fundraising ask and an unverified NVIDIA partnership claim. */
const FULL = [
  ['live_map.png', 'map'],
  ['live_raidcost.png', 'raidcost'],
  ['live_loadout.png', 'loadout'],
  ['live_recycler.png', 'recycler'],
];

/** Detail crops: [outSlug, sourceFile, {left, top, width, height}]
 *
 *  DISABLED. The zoomed panel crops were removed from the site: eleven images
 *  in the hero meant the visitor scanned a mosaic of unreadable fragments
 *  instead of the product. The full screens carry the proof on their own, shown
 *  large in a framed app window. The crop rects and the ink-density guard below
 *  are kept so the set can be reinstated for docs pages if ever needed — just
 *  repopulate this array. */
const DETAILS = [];

const FULL_WIDTHS = [1920, 1440, 960];
/* Descending steps down to 220 so even a narrow rect (a 230px sidebar column)
   still emits a file. Each crop only renders the steps that fit within its own
   width — a rect narrower than every step would silently produce nothing, which
   is why the smallest step has to be genuinely small. */
const DETAIL_WIDTHS = [900, 600, 440, 220];

await mkdir(OUT, { recursive: true });

const manifest = {};
let failed = 0;

async function lqip(pipeline) {
  const buf = await pipeline.clone().resize({ width: 24 }).blur(1.1).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${buf.toString('base64')}`;
}

/* ── Full screens ── */
for (const [file, slug] of FULL) {
  const src = path.join(SRC, file);
  if (!existsSync(src)) { console.error(`MISSING ${src}`); failed++; continue; }
  const buf = await readFile(src);
  const meta = await sharp(buf).metadata();

  /* Native first, un-resized — the captures are 1438-1456px wide, so the 1440
     step was being skipped as "too large" and the sharpest version never
     shipped. Display DPI scaling means these are all the real pixels there are. */
  const nativeW = meta.width || 0;
  const fullNative = await sharp(buf)
    .webp({ quality: 88, effort: 6 })
    .toFile(path.join(OUT, `${slug}-${nativeW}.webp`));
  console.log(`${slug}-${nativeW}.webp`.padEnd(28), `${(fullNative.size / 1024).toFixed(0)} KB`, `${fullNative.width}x${fullNative.height}`, '(native)');

  for (const w of FULL_WIDTHS) {
    if (w >= nativeW) continue; // never upscale, never duplicate native
    const info = await sharp(buf)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 84, effort: 6 })
      .toFile(path.join(OUT, `${slug}-${w}.webp`));
    console.log(`${slug}-${w}.webp`.padEnd(28), `${(info.size / 1024).toFixed(0)} KB`, `${info.width}x${info.height}`);
  }

  manifest[slug] = {
    w: meta.width, h: meta.height,
    widths: [...FULL_WIDTHS.filter((w) => w < nativeW), nativeW].sort((a, b) => a - b),
    lqip: await lqip(sharp(buf)),
  };
}

/* ── Detail crops ── */
for (const [slug, file, rect] of DETAILS) {
  const src = path.join(SRC, file);
  if (!existsSync(src)) { console.error(`MISSING ${src}`); failed++; continue; }
  const buf = await readFile(src);
  const meta = await sharp(buf).metadata();

  // Clamp the rect so an off-by-a-few spec can never throw.
  const left = Math.max(0, Math.min(rect.left, (meta.width || 0) - 10));
  const top = Math.max(0, Math.min(rect.top, (meta.height || 0) - 10));
  const width = Math.min(rect.width, (meta.width || 0) - left);
  const height = Math.min(rect.height, (meta.height || 0) - top);

  const cropped = sharp(buf).extract({ left, top, width, height });

  /* Guard: measure ink density and refuse to emit a crop that is mostly flat
     background. Two earlier rects landed in dead space and shipped as ~75%
     empty images that looked broken on the page. */
  const grey = await cropped.clone().greyscale().raw().toBuffer({ resolveWithObject: true });
  let ink = 0;
  for (let i = 0; i < grey.data.length; i++) if (grey.data[i] > 55) ink++;
  const density = (ink / grey.data.length) * 100;
  if (density < 0.8) {
    console.error(`SKIP ${slug}: ink density ${density.toFixed(2)}% — rect is in dead space`);
    failed++;
    continue;
  }
  console.log(`  (${slug} density ${density.toFixed(2)}%)`);

  /* Emit the crop at its NATIVE width first, un-resized. Downscaling every crop
     to a fixed step was what made the map-body text soft and unreadable — a
     520px region rendered at 440px throws away 15% of the pixels for no reason.
     The display is DPI-scaled (1920 physical -> 1440 logical), so these native
     pixels are all the detail that exists; resampling only loses it. */
  let emitted = 0;
  const nativeInfo = await cropped
    .clone()
    .webp({ quality: 90, effort: 6 })
    .toFile(path.join(OUT, `${slug}-${width}.webp`));
  emitted++;
  console.log(`${slug}-${width}.webp`.padEnd(28), `${(nativeInfo.size / 1024).toFixed(0)} KB`, `${nativeInfo.width}x${nativeInfo.height}`, '(native)');

  for (const w of DETAIL_WIDTHS) {
    if (w >= width) continue;
    const info = await cropped
      .clone()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 86, effort: 6 })
      .toFile(path.join(OUT, `${slug}-${w}.webp`));
    emitted++;
    console.log(`${slug}-${w}.webp`.padEnd(28), `${(info.size / 1024).toFixed(0)} KB`, `${info.width}x${info.height}`);
  }

  if (!emitted) {
    console.error(`SKIP ${slug}: crop is ${width}px wide, narrower than every DETAIL_WIDTHS step`);
    failed++;
    continue;
  }

  manifest[slug] = {
    w: width, h: height,
    // Native width included so srcSet can offer the sharpest variant.
    widths: [...DETAIL_WIDTHS.filter((w) => w < width), width].sort((a, b) => a - b),
    lqip: await lqip(cropped),
  };
}

await writeFile(
  path.resolve('src/lib/shots.ts'),
  `// AUTO-GENERATED by scripts/optimize-shots.mjs — do not edit by hand.\n` +
    `export interface ShotMeta { w: number; h: number; widths: number[]; lqip: string }\n` +
    `export const SHOTS: Record<string, ShotMeta> = ${JSON.stringify(manifest, null, 2)};\n`,
  'utf8',
);

console.log(`\nWrote src/lib/shots.ts — ${Object.keys(manifest).length} entries, ${failed} failures.`);
if (failed) process.exitCode = 1;
