'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const puppeteer = require('puppeteer');

const BASE_URL = process.env.DEMO_BASE_URL || 'http://127.0.0.1:5173';
const FRAME_RATE = 12;
const WIDTH = 1280;
const HEIGHT = 720;
const OUTPUT_DIR = process.env.DEMO_OUTPUT_DIR || path.resolve(__dirname, '../../obsidian-vault/Groups/ternak-monitor/Media');
const FRAME_DIR = path.join(OUTPUT_DIR, 'sapi-papi-demo-frames');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'sapi-papi-farm-demo.mp4');
const REHEARSE = process.argv.includes('--rehearse');

function resetDirectory(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

async function injectPresentationLayer(page) {
  await page.evaluate(() => {
    for (const id of ['demo-cursor', 'demo-subtitle']) document.getElementById(id)?.remove();

    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 3 19 12l-7 1-3 7L5 3Z" fill="white" stroke="#123d30" stroke-width="1.7" stroke-linejoin="round"/></svg>';
    cursor.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;width:26px;height:26px;left:18px;top:18px;filter:drop-shadow(1px 2px 2px rgba(0,0,0,.28));transition:left .09s linear,top .09s linear';

    const subtitle = document.createElement('div');
    subtitle.id = 'demo-subtitle';
    subtitle.style.cssText = 'position:fixed;z-index:2147483646;left:50%;bottom:24px;transform:translateX(-50%);max-width:78%;padding:10px 18px;border-radius:999px;background:rgba(10,31,24,.84);color:#fff;font:600 15px system-ui,-apple-system,Segoe UI,sans-serif;letter-spacing:.01em;box-shadow:0 8px 22px rgba(0,0,0,.22);opacity:0;transition:opacity .28s ease;pointer-events:none;text-align:center';
    document.body.append(cursor, subtitle);
  });
}

async function subtitle(page, text) {
  await page.evaluate((value) => {
    const el = document.getElementById('demo-subtitle');
    if (!el) return;
    el.textContent = value || '';
    el.style.opacity = value ? '1' : '0';
  }, text);
}

async function findButton(page, text) {
  await page.waitForFunction((expected) => Array.from(document.querySelectorAll('button')).some(button => button.textContent.trim() === expected), { timeout: 10000 }, text);
  for (const button of await page.$$('button')) {
    if (await button.evaluate(el => el.textContent.trim()) === text) return button;
  }
  throw new Error(`Button not found: ${text}`);
}

async function moveTo(page, locator, label) {
  const target = typeof locator === 'string' ? await page.waitForSelector(locator, { visible: true, timeout: 10000 }) : locator;
  if (!target) throw new Error(`Target not found for ${label}`);
  const box = await target.boundingBox();
  if (!box) throw new Error(`No bounding box for ${label}`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 14 });
  await page.waitForTimeout(380);
  return target;
}

async function moveAndClick(page, locator, label, postDelay = 1300) {
  const target = await moveTo(page, locator, label);
  await target.click();
  await page.waitForTimeout(postDelay);
}

async function typeNaturally(page, locator, text, label) {
  const target = await moveTo(page, locator, label);
  await target.click();
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(text, { delay: 46 });
  await page.waitForTimeout(700);
}

async function findExactText(page, text) {
  await page.waitForFunction((expected) => Array.from(document.querySelectorAll('body *')).some(el => el.children.length === 0 && el.textContent.trim() === expected), { timeout: 10000 }, text);
  for (const element of await page.$$('body *')) {
    if (await element.evaluate((el, expected) => el.children.length === 0 && el.textContent.trim() === expected, text)) return element;
  }
  throw new Error(`Text not found: ${text}`);
}

async function rehearse(page) {
  const checks = [
    ['development account filler', await findButton(page, 'Isi akun development')],
    ['login submit', await findButton(page, 'Masuk ke Dashboard')],
  ];
  for (const [label, locator] of checks) {
    const ok = Boolean(await locator.boundingBox());
    if (!ok) throw new Error(`REHEARSAL FAILED: ${label}`);
    console.log(`REHEARSAL OK: ${label}`);
  }
  console.log('REHEARSAL PASSED');
}

async function recordFrames(page, isRecording) {
  let index = 0;
  while (isRecording()) {
    await page.screenshot({ path: path.join(FRAME_DIR, `frame-${String(index++).padStart(6, '0')}.jpg`), type: 'jpeg', quality: 86 });
    await new Promise(resolve => setTimeout(resolve, Math.round(1000 / FRAME_RATE)));
  }
  return index;
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  page.waitForTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    if (REHEARSE) {
      await rehearse(page);
      return;
    }

    resetDirectory(FRAME_DIR);
    let recording = true;
    const frameTask = recordFrames(page, () => recording).catch(error => {
      console.error(`FRAME CAPTURE ERROR: ${error.message}`);
      return 0;
    });

    await injectPresentationLayer(page);
    await subtitle(page, 'Sapi Papi Farm — pencatatan kandang yang sederhana');
    await page.waitForTimeout(2200);

    await subtitle(page, 'Masuk dengan akun peternakan');
    await moveAndClick(page, await findButton(page, 'Isi akun development'), 'isi akun demo', 550);
    await typeNaturally(page, 'input[type="email"]', 'owner@ternak.local', 'email');
    await typeNaturally(page, 'input[type="password"]', 'TernakDemo2026!', 'password');
    await moveAndClick(page, await findButton(page, 'Masuk ke Dashboard'), 'masuk dashboard', 3600);

    await injectPresentationLayer(page);
    await subtitle(page, 'Pantau kondisi peternakan dari dashboard');
    for (const point of [[350, 290], [540, 290], [735, 290], [930, 290]]) {
      await page.mouse.move(point[0], point[1], { steps: 12 });
      await page.waitForTimeout(650);
    }
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.scrollTo({ top: 420, behavior: 'smooth' }));
    await page.waitForTimeout(1800);

    await subtitle(page, 'Buka data ternak dan status kesehatan');
    await moveAndClick(page, await findButton(page, 'Ternak'), 'menu ternak', 2200);
    await injectPresentationLayer(page);
    await page.evaluate(() => window.scrollTo({ top: 250, behavior: 'smooth' }));
    await page.waitForTimeout(1600);

    await moveAndClick(page, await findButton(page, 'Kesehatan'), 'menu kesehatan', 2200);
    await injectPresentationLayer(page);
    await subtitle(page, 'Prioritaskan ternak yang memerlukan perhatian');
    await page.waitForTimeout(2000);

    await moveAndClick(page, await findButton(page, 'Pakan'), 'menu pakan', 2200);
    await injectPresentationLayer(page);
    await subtitle(page, 'Kenali stok pakan yang perlu segera ditambah');
    await page.waitForTimeout(2200);

    await moveAndClick(page, await findButton(page, 'Laporan'), 'menu laporan', 2200);
    await injectPresentationLayer(page);
    await subtitle(page, 'Laporan harian siap ditinjau dalam satu tempat');
    await page.waitForTimeout(2800);
    await subtitle(page, '');
    await page.waitForTimeout(900);

    recording = false;
    const frames = await frameTask;
    if (frames < FRAME_RATE * 10) throw new Error(`Capture too short: ${frames} frames`);

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    execFileSync('ffmpeg', [
      '-y', '-framerate', String(FRAME_RATE), '-i', path.join(FRAME_DIR, 'frame-%06d.jpg'),
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUTPUT_FILE,
    ], { stdio: 'inherit' });
    console.log(`DEMO VIDEO SAVED: ${OUTPUT_FILE}`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error('DEMO FAILED:', error.stack || error.message); process.exit(1); });
