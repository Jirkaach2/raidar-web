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

/** Full screens. `raidar_hud_screen_*` files are excluded: they render as
 *  near-empty black frames with only a header bar. */
const FULL = [
  ['raidar_actual_app_screen_map.png', 'map'],
  ['raidar_actual_app_screen_devices.png', 'devices'],
  ['raidar_actual_app_screen_raidcost.png', 'raidcost'],
  ['raidar_actual_app_screen_vending.png', 'vending'],
];

/** Detail crops: [outSlug, sourceFile, {left, top, width, height}]
 *
 *  IMPORTANT: these rects are measured, not guessed. An ink-density scan of the
 *  four captures (see git history for scripts/_probe.mjs) showed every screen is
 *  content-dense only in the TOP HALF — row bands below y≈675 carry ~0% ink, and
 *  on the map/vending screens the middle column bands are near-empty too. Earlier
 *  hand-picked rects landed in that dead space and produced crops that were 75%
 *  flat background. Keep every rect inside y < 660, and prefer the dense column
 *  bands: x<480 (nav/sidebar) and x>1440 (right status column). */
const DETAILS = [
  // Map screen: right status column is the densest region (bands 1440-1920 ≈ 2.0-2.3%)
  ['detail-compound', 'raidar_actual_app_screen_map.png', { left: 1470, top: 80, width: 450, height: 470 }],
  ['detail-events',   'raidar_actual_app_screen_map.png', { left: 1030, top: 105, width: 520, height: 210 }],

  // Devices: dense bands are 0-240 (rail+nav) and 1680-1920; rows 0-270 and 540-675
  ['detail-devices',  'raidar_actual_app_screen_devices.png', { left: 260, top: 120, width: 940, height: 300 }],

  // Raid cost: the richest screen overall (rows 0-540, cols 240-720 at 4.2%)
  ['detail-raidcost', 'raidar_actual_app_screen_raidcost.png', { left: 300, top: 150, width: 1120, height: 330 }],
  ['detail-raidtable','raidar_actual_app_screen_raidcost.png', { left: 300, top: 440, width: 1120, height: 230 }],

  // Vending / market intel: rows 270-405 are the table body (4.2%)
  ['detail-market',   'raidar_actual_app_screen_vending.png', { left: 260, top: 200, width: 1180, height: 340 }],
];

const FULL_WIDTHS = [1920, 1440, 960];
/* 900/600 for wide crops, plus 440 so NARROW crops (e.g. the map's 450px-wide
   right status column) still emit at least one file. Without the small step a
   narrow rect silently produced nothing, because every width exceeded it. */
const DETAIL_WIDTHS = [900, 600, 440];

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

  for (const w of FULL_WIDTHS) {
    if (w > (meta.width || 0)) continue; // never upscale
    const info = await sharp(buf)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 84, effort: 6 })
      .toFile(path.join(OUT, `${slug}-${w}.webp`));
    console.log(`${slug}-${w}.webp`.padEnd(28), `${(info.size / 1024).toFixed(0)} KB`, `${info.width}x${info.height}`);
  }

  manifest[slug] = {
    w: meta.width, h: meta.height,
    widths: FULL_WIDTHS.filter((w) => w <= (meta.width || 0)),
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

  let emitted = 0;
  for (const w of DETAIL_WIDTHS) {
    if (w > width) continue;
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
    widths: DETAIL_WIDTHS.filter((w) => w <= width),
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
