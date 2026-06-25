#!/usr/bin/env node
/**
 * export-mp4.js — Records the partnership-reveal animation as an MP4.
 *
 * Usage:
 *   node scripts/export-mp4.js
 *   node scripts/export-mp4.js --out outputs/custom-name.mp4
 *   node scripts/export-mp4.js --html animations/my-variant.html --out outputs/my-variant.mp4
 *
 * Requires: @playwright/test  (npm install)
 * Chromium: pre-installed at /opt/pw-browsers/chromium
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');

/* ── CLI args ─────────────────────────────────────────────────────────────── */
const args = process.argv.slice(2);
const get  = (flag, def) => { const i = args.indexOf(flag); return i !== -1 ? args[i+1] : def; };

const ROOT    = path.resolve(__dirname, '..');
const htmlFile = get('--html', 'animations/partnership-reveal.html');
const outFile  = get('--out',  'outputs/partnership-minor-hotels.mp4');

const htmlPath = path.join(ROOT, htmlFile);
const outPath  = path.join(ROOT, outFile);

if (!fs.existsSync(htmlPath)) {
  console.error(`HTML not found: ${htmlPath}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });

const CANVAS_W = 1200;
const CANVAS_H = 960;
const FPS      = 30;
const TIMEOUT  = 15_000; // max ms to wait for animation-done signal

/* ── Record ───────────────────────────────────────────────────────────────── */
(async () => {
  console.log('Launching Chromium…');
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: CANVAS_W, height: CANVAS_H },
    deviceScaleFactor: 1,
    recordVideo: {
      dir:  path.dirname(outPath),
      size: { width: CANVAS_W, height: CANVAS_H },
    },
  });

  const page = await context.newPage();

  console.log(`Loading: ${htmlPath}`);
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });

  /* Wait for the animation to signal completion */
  console.log('Waiting for animation to complete…');
  await page.waitForFunction(
    () => document.documentElement.dataset.animationDone === 'true',
    { timeout: TIMEOUT }
  ).catch(() => console.warn('Timeout waiting for animation — capturing anyway.'));

  /* Extra buffer: hold on end frame */
  await page.waitForTimeout(500);

  await context.close();
  await browser.close();

  /* Playwright names the video with a random uuid — find and rename it */
  const dir   = path.dirname(outPath);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.webm'));
  if (files.length === 0) {
    console.error('No video file found. Recording may have failed.');
    process.exit(1);
  }

  /* Pick the most recent webm */
  const latest = files
    .map(f => ({ f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)[0].f;

  const webmPath = path.join(dir, latest);

  /* Resolve ffmpeg: prefer @ffmpeg-installer/ffmpeg, fall back to system ffmpeg */
  const { execSync } = require('child_process');
  let ffmpegBin = 'ffmpeg';
  try {
    ffmpegBin = require('@ffmpeg-installer/ffmpeg').path;
  } catch { /* use system ffmpeg */ }

  const mp4Cmd = `"${ffmpegBin}" -y -i "${webmPath}" -vcodec libx264 -crf 18 -pix_fmt yuv420p "${outPath}"`;
  console.log('Converting to MP4…');
  try {
    execSync(mp4Cmd, { stdio: 'inherit' });
    fs.unlinkSync(webmPath);
    console.log(`\nDone! Output: ${outPath}`);
  } catch {
    /* conversion failed — keep the webm */
    const webmOut = outPath.replace('.mp4', '.webm');
    fs.renameSync(webmPath, webmOut);
    console.log(`MP4 conversion failed — saved as WebM: ${webmOut}`);
    console.log('Convert manually: ffmpeg -i input.webm -vcodec libx264 -crf 18 -pix_fmt yuv420p output.mp4');
  }
})();
