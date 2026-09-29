import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/ICHSAN/.gemini/antigravity-ide/brain/f9af3be8-39c3-4c11-85dc-15869d2a5144';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Capture About with Pimpinan Tab clicked
  const aboutEl = await page.$('#profil');
  if (aboutEl) {
    await aboutEl.scrollIntoView();
    await new Promise(r => setTimeout(r, 500));

    // Click "Pimpinan" button
    const buttons = await page.$$('#profil button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Pimpinan')) {
        await btn.click();
        await new Promise(r => setTimeout(r, 500));
        break;
      }
    }

    await aboutEl.screenshot({ path: path.join(ARTIFACT_DIR, 'updated_about_pimpinan.png') });
    console.log('Captured updated_about_pimpinan.png');
  }

  // 2. Capture Gallery with Fasilitas Tab
  const galleryEl = await page.$('#galeri');
  if (galleryEl) {
    await galleryEl.scrollIntoView();
    await new Promise(r => setTimeout(r, 500));

    // Click "FASILITAS" category button
    const catButtons = await page.$$('#galeri button');
    for (const btn of catButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('FASILITAS')) {
        await btn.click();
        await new Promise(r => setTimeout(r, 500));
        break;
      }
    }

    await galleryEl.screenshot({ path: path.join(ARTIFACT_DIR, 'updated_gallery_fasilitas.png') });
    console.log('Captured updated_gallery_fasilitas.png');
  }

  await browser.close();
}

main().catch(console.error);
