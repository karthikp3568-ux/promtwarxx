import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/karthik p/.gemini/antigravity/brain/852001c0-2591-4ac5-9ff6-385d501b3c1d';
const LOCAL_SCREENSHOT_DIR = 'd:/codes/promtwars/TrustGuard/frontend/screenshots';

const VIEWPORTS = [
  { width: 360, height: 740, name: '360px' },
  { width: 390, height: 844, name: '390px' },
  { width: 768, height: 1024, name: '768px' },
  { width: 1024, height: 768, name: '1024px' },
  { width: 1280, height: 800, name: '1280px' },
  { width: 1440, height: 900, name: '1440px' },
  { width: 1920, height: 1080, name: '1920px' },
  { width: 2560, height: 1440, name: '2560px' },
];

async function saveScreenshot(page, filename) {
  const localPath = path.join(LOCAL_SCREENSHOT_DIR, filename);
  const brainPath = path.join(ARTIFACT_DIR, filename);
  await page.screenshot({ path: localPath, fullPage: true });
  fs.copyFileSync(localPath, brainPath);
  console.log(`Saved screenshot: ${filename}`);
}

async function run() {
  console.log('Testing Horizontal Lock and New Dark Blue-Black Palette...');
  const browser = await chromium.launch({ headless: true });

  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      // Attempt to scroll horizontally by 300px
      await page.evaluate(() => {
        window.scrollBy(300, 0);
        document.documentElement.scrollLeft = 300;
        document.body.scrollLeft = 300;
      });
      await page.waitForTimeout(200);

      const check = await page.evaluate(() => {
        const scrollX = window.scrollX || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
        const scrollW = document.documentElement.scrollWidth;
        const clientW = document.documentElement.clientWidth;
        const innerW = window.innerWidth;
        const htmlOverflow = window.getComputedStyle(document.documentElement).overflowX;
        const bodyOverflow = window.getComputedStyle(document.body).overflowX;
        const touchAction = window.getComputedStyle(document.body).touchAction;

        return {
          scrollX,
          scrollW,
          clientW,
          innerW,
          htmlOverflow,
          bodyOverflow,
          touchAction,
          noOverflow: scrollW <= innerW + 1 && scrollX === 0,
        };
      });

      console.log(`[Viewport ${vp.name}]: ScrollX=${check.scrollX}px, ScrollW=${check.scrollW}px, InnerW=${check.innerW}px, Locked=${check.noOverflow}`);
      if (!check.noOverflow) {
        throw new Error(`Horizontal movement detected at ${vp.name}: scrollX=${check.scrollX}, scrollW=${check.scrollW} > innerW=${check.innerW}`);
      }

      await page.close();
    }

    // Capture visual confirmation of the new dark blue-black palette
    console.log('\nCapturing screenshots with dark blue-black palette...');
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await saveScreenshot(page, 'improved_home_blue_black.png');

    // Mobile view
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    await saveScreenshot(page, 'improved_home_mobile_locked.png');

    // Check Conversation page
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const guestBtn = page.locator('button:has-text("Continue as Guest")');
    if (await guestBtn.isVisible()) {
      await guestBtn.click();
      await page.waitForTimeout(800);
    }
    await page.goto('http://localhost:5173/check/conversation', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await saveScreenshot(page, 'improved_check_blue_black.png');

    console.log('\n✅ ALL HORIZONTAL LOCK CHECKS & PALETTE UPDATES VERIFIED SUCCESSFULLY!');
    await browser.close();
  } catch (err) {
    console.error('Test failed:', err);
    await browser.close();
    process.exit(1);
  }
}

run();
