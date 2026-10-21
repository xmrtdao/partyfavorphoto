#!/usr/bin/env node
/**
 * Make small thumbnails of the PLAIN curtains.
 *
 * The picker shows the curtain on its own - the colour and the texture, with
 * nobody standing in it - because that is what the client is choosing. The
 * full curtain is a 1,200-pixel PNG, more than a megabyte each, and a row of
 * eleven of them would pull down fifteen megabytes to show eleven swatches.
 *
 * The shots with people in front of them are the OTHER file: those are what
 * the print shows, behind the windows, and they are already small.
 *
 *   node make-backdrop-thumbs.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, 'assets', 'backdrops');
const OUT = path.join(DIR, 'thumbs');
const FFMPEG = process.env.PFP_FFMPEG || 'C:\\tools\\ffmpeg.exe';

fs.mkdirSync(OUT, { recursive: true });

// A few curtains need a CROP, because the whole picture is not what the
// client is choosing.
//
// The gold curtain hangs from a bright header band and pools on the floor.
// Scaled whole, that band is most of what is left in a 44-pixel tile, and
// what it says is "a bright stripe" rather than "the gold sequin curtain".
// The middle of it - the dense field of sequins - is the curtain.
const CROPS = {
  'gold-sequin': 'crop=iw:ih*0.78:0:ih*0.10',
};

const curtains = fs.readdirSync(DIR).filter((f) => /\.png$/i.test(f)).sort();
let made = 0;
for (const f of curtains) {
  const slug = f.replace(/\.png$/i, '');
  const out = path.join(OUT, `${slug}.jpg`);
  const crop = CROPS[slug];
  const filter = crop
    ? `${crop},scale=240:-1`
    : 'scale=240:-1';
  try {
    await run(FFMPEG, ['-y', '-loglevel', 'error', '-i', path.join(DIR, f),
      '-vf', filter, '-q:v', '6', out]);
    const kb = Math.round(fs.statSync(out).size / 1024);
    console.log(`${slug.padEnd(30)} ${String(kb).padStart(3)} KB${crop ? '  (cropped)' : ''}`);
    made++;
  } catch (e) {
    console.log(`${slug.padEnd(30)} FAILED: ${String(e.message).slice(0, 90)}`);
  }
}
console.log(`\n${made} plain-curtain thumbnails in ${OUT}`);
