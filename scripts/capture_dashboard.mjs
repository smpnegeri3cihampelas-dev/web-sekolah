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

  console.log('Opening http://localhost:3000/dashboard...');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Capture Overview
  console.log('Capturing Overview...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dashboard_01_overview.png') });

  // 2. Open Warta Tab
  console.log('Navigating to Warta Tab...');
  const navButtons = await page.$$('aside nav button');
  for (const btn of navButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Kelola Warta')) {
      await btn.click();
      await new Promise(r => setTimeout(r, 500));
      break;
    }
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dashboard_02_warta_cms.png') });

  // 3. Open Modal Tulis Warta
  console.log('Opening Modal Tulis Warta...');
  const addNewsBtn = await page.$('button.bg-cyan-500');
  if (addNewsBtn) {
    await addNewsBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dashboard_03_modal_tulis_warta.png') });

    // Close modal
    const closeBtn = await page.$('div.fixed button.text-stone-400');
    if (closeBtn) await closeBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  // 4. Open Agenda Tab
  console.log('Navigating to Agenda Tab...');
  for (const btn of navButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Kalender Akademik')) {
      await btn.click();
      await new Promise(r => setTimeout(r, 500));
      break;
    }
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dashboard_04_kalender_agenda.png') });

  // 5. Open Pesan Masuk Tab
  console.log('Navigating to Pesan Masuk Tab...');
  for (const btn of navButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Pesan Masuk')) {
      await btn.click();
      await new Promise(r => setTimeout(r, 500));
      break;
    }
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dashboard_05_pesan_masuk.png') });

  // 6. Open Pimpinan & Guru Tab
  console.log('Navigating to Pimpinan & GTK Tab...');
  const currentNavBtns = await page.$$('aside nav button');
  for (const btn of currentNavBtns) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Pimpinan')) {
      await btn.click();
      await new Promise(r => setTimeout(r, 700));
      break;
    }
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dashboard_06_pimpinan_guru.png') });

  // Scroll to GTK Table
  console.log('Scrolling to Teachers Table...');
  await page.evaluate(() => window.scrollTo(0, 750));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dashboard_06_gtk_table.png') });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));

  // 7. Open Edit Pimpinan Modal
  console.log('Opening Edit Pimpinan Modal...');
  const editLeaderBtns = await page.$$('button');
  for (const btn of editLeaderBtns) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Ubah Profil / Ganti Pimpinan')) {
      await btn.click();
      await new Promise(r => setTimeout(r, 600));
      break;
    }
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dashboard_07_modal_edit_pimpinan.png') });

  // Close Edit Pimpinan Modal
  const cancelBtn = await page.$('div.fixed button.text-stone-400');
  if (cancelBtn) {
    await cancelBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  // 8. Open Tambah Guru Modal
  console.log('Opening Tambah Guru Modal...');
  const addTeacherBtns = await page.$$('button');
  for (const btn of addTeacherBtns) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Tambah Guru / Pendidik')) {
      await btn.click();
      await new Promise(r => setTimeout(r, 600));
      break;
    }
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dashboard_08_modal_tambah_guru.png') });

  console.log('All dashboard screenshots captured successfully!');
  await browser.close();
}

main().catch(console.error);
