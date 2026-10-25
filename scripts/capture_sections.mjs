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

  console.log('Opening http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Hero Viewport
  console.log('Capturing Hero...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'section_01_hero.png') });

  // List of sections to capture
  const targets = [
    { name: 'section_02_logo_carousel.png', selector: '#kemitraan' },
    { name: 'section_03_bento_warta.png', selector: '#berita' },
    { name: 'section_04_profil_about.png', selector: '#profil' },
    { name: 'section_05_kalender_agenda.png', selector: '#kalender' },
    { name: 'section_06_kurikulum.png', selector: '#kurikulum' },
    { name: 'section_07_organisasi_pimpinan.png', selector: '#organisasi' },
    { name: 'section_08_galeri.png', selector: '#galeri' },
    { name: 'section_09_fasilitas.png', selector: '#fasilitas' },
    { name: 'section_10_ekstrakurikuler.png', selector: '#ekstrakurikuler' },
    { name: 'section_11_kontak_peta.png', selector: '#kontak' },
    { name: 'section_12_footer.png', selector: 'footer' }
  ];

  for (const item of targets) {
    console.log(`Processing ${item.name}...`);
    try {
      const el = await page.$(item.selector);
      if (el) {
        await el.scrollIntoView();
        await new Promise(r => setTimeout(r, 800)); // wait for transitions/images
        await el.screenshot({ path: path.join(ARTIFACT_DIR, item.name) });
        console.log(`Successfully captured ${item.name}`);
      } else {
        console.warn(`Selector ${item.selector} not found!`);
      }
    } catch (e) {
      console.error(`Failed to capture ${item.name}:`, e.message);
    }
  }



  console.log('All sections captured!');
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
