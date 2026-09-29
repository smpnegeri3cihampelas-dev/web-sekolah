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

  console.log('Navigating to landing page...');
  await page.goto('http://localhost:3000/#profil', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));

  // Click on Pimpinan tab
  console.log('Selecting Pimpinan tab...');
  const aboutButtons = await page.$$('section#profil button');
  for (const btn of aboutButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.trim() === 'Pimpinan') {
      await btn.click();
      await new Promise(r => setTimeout(r, 600));
      break;
    }
  }

  // Click on Lihat Seluruh Dewan Guru button
  console.log('Clicking Lihat Seluruh Dewan Guru...');
  const seeTeachersBtn = await page.$('section#profil button.bg-gradient-to-r');
  if (seeTeachersBtn) {
    await seeTeachersBtn.click();
    await new Promise(r => setTimeout(r, 800));
  }

  // Screenshot before scroll
  console.log('Taking screenshot at top of modal...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'modal_guru_scroll_top.png') });

  // Scroll the modal container down
  console.log('Scrolling modal container down...');
  const scrollResult = await page.evaluate(() => {
    // Find the overflow-y-auto container inside the modal
    const scrollableDiv = document.querySelector('div.overflow-y-auto');
    if (!scrollableDiv) return { found: false };

    const before = scrollableDiv.scrollTop;
    scrollableDiv.scrollTop = 350;
    const after = scrollableDiv.scrollTop;

    return { found: true, before, after, scrollHeight: scrollableDiv.scrollHeight, clientHeight: scrollableDiv.clientHeight };
  });

  console.log('Scroll result:', scrollResult);
  await new Promise(r => setTimeout(r, 500));

  // Screenshot after scroll
  console.log('Taking screenshot after scrolling down in modal...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'modal_guru_scroll_down.png') });

  // Now test closing modal and verify page scrolling
  console.log('Testing modal close...');
  const closeBtn = await page.$('div.fixed button.w-10');
  if (closeBtn) {
    await closeBtn.click();
    await new Promise(r => setTimeout(r, 500));
  }

  // Verify page can scroll
  const pageScroll = await page.evaluate(() => {
    window.scrollTo(0, 500);
    return window.scrollY;
  });
  console.log('Page scroll position after close:', pageScroll);

  console.log('Testing completed successfully!');
  await browser.close();
}

main().catch(console.error);
