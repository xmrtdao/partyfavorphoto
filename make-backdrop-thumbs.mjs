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

const curtains = fs.readdirSync(DIR).filter((f) => /\.png$/i.test(f)).sort();
let made = 0;
for (const f of curtains) {
  const slug = f.replace(/\.png$/i, '');
  const out = path.join(OUT, `${slug}.jpg`);
  try {
    await run(FFMPEG, ['-y', '-loglevel', 'error', '-i', path.join(DIR, f),
      '-vf', 'scale=240:-1', '-q:v', '6', out]);
    const kb = Math.round(fs.statSync(out).size / 1024);
    console.log(`${slug.padEnd(30)} ${kb} KB`);
    made++;
  } catch (e) {
    console.log(`${slug.padEnd(30)} FAILED: ${String(e.message).slice(0, 90)}`);
  }
}
console.log(`\n${made} plain-curtain thumbnails in ${OUT}`);
