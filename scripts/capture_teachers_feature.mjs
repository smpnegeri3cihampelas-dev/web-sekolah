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

  // 1. Landing page - Open Pimpinan Tab
  console.log('Opening Landing Page...');
  await page.goto('http://localhost:3000/#profil', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));

  // Click on "Pimpinan" tab inside About
  console.log('Clicking Pimpinan tab in About section...');
  const aboutButtons = await page.$$('section#profil button');
  for (const btn of aboutButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.trim() === 'Pimpinan') {
      await btn.click();
      await new Promise(r => setTimeout(r, 600));
      break;
    }
  }

  // Scroll to Profil section
  await page.evaluate(() => {
    const el = document.getElementById('profil');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'landing_pimpinan_tab_with_photos.png') });

  // 2. Open Teacher Directory Modal on Landing Page
  console.log('Opening Teacher Directory Modal on Landing Page...');
  const seeTeachersBtn = await page.$('section#profil button.bg-gradient-to-r');
  if (seeTeachersBtn) {
    await seeTeachersBtn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'landing_modal_direktori_guru.png') });
  }

  // 3. Open Dashboard - Pimpinan & GTK Tab
  console.log('Opening Dashboard Pimpinan Tab...');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));

  const navBtns = await page.$$('aside nav button');
  for (const btn of navBtns) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Pimpinan')) {
      await btn.click();
      await new Promise(r => setTimeout(r, 700));
      break;
    }
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dashboard_pimpinan_with_photos.png') });

  // Scroll to GTK Table on dashboard
  await page.evaluate(() => window.scrollTo(0, 750));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dashboard_gtk_table_with_photos.png') });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));

  // 4. Open Edit Pimpinan Modal (check photo selector)
  console.log('Opening Edit Pimpinan Modal in Dashboard...');
  const editLeaderBtns = await page.$$('button');
  for (const btn of editLeaderBtns) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Ubah Profil / Ganti Pimpinan')) {
      await btn.click();
      await new Promise(r => setTimeout(r, 600));
      break;
    }
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dashboard_edit_pimpinan_photo_modal.png') });

  // Close Leader Modal
  const closeLeaderBtn = await page.$('div.fixed button.text-stone-400');
  if (closeLeaderBtn) {
    await closeLeaderBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  // 5. Open Edit Guru Modal (check photo selector)
  console.log('Opening Edit Guru Modal in Dashboard...');
  const editTeacherBtn = await page.$('button[title="Ubah Data & Foto Guru"]');
  if (editTeacherBtn) {
    await editTeacherBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dashboard_edit_guru_photo_modal.png') });
  }

  console.log('All feature screenshots captured successfully!');
  await browser.close();
}

main().catch(console.error);
