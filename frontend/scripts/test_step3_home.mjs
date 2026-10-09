import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/karthik p/.gemini/antigravity/brain/852001c0-2591-4ac5-9ff6-385d501b3c1d';
const LOCAL_SCREENSHOT_DIR = 'd:/codes/promtwars/TrustGuard/frontend/screenshots';

if (!fs.existsSync(LOCAL_SCREENSHOT_DIR)) {
  fs.mkdirSync(LOCAL_SCREENSHOT_DIR, { recursive: true });
}

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

async function run() {
  console.log('Starting Step 3 Home Page ("Scam Radar") Verification...');
  const browser = await chromium.launch({ headless: true });

  // 1. Viewport & layout checks across all 8 viewports
  console.log('\n--- 1. Testing Home Page across 8 Viewports ---');
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const check = await page.evaluate(() => {
      const scrollW = document.documentElement.scrollWidth;
      const innerW = window.innerWidth;
      const noHorizontalScroll = scrollW <= innerW;

      const bodyTextElements = Array.from(document.querySelectorAll('p, span, li, button, a'))
        .filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && el.innerText.trim().length > 0;
        });

      const smallTexts = bodyTextElements.filter(el => {
        const size = parseFloat(window.getComputedStyle(el).fontSize);
        return size < 11;
      });

      return {
        noHorizontalScroll,
        scrollW,
        innerW,
        smallCount: smallTexts.length,
      };
    });

    console.log(`Viewport ${vp.name}: ScrollOK=${check.noHorizontalScroll} (${check.scrollW}px / ${check.innerW}px), SmallTexts=${check.smallCount}`);
    if (!check.noHorizontalScroll) {
      throw new Error(`Horizontal overflow at ${vp.name}: scrollW=${check.scrollW} > innerW=${check.innerW}`);
    }

    const shotName = `step3_home_${vp.name}.png`;
    const localShot = path.join(LOCAL_SCREENSHOT_DIR, shotName);
    const artShot = path.join(ARTIFACT_DIR, shotName);

    await page.screenshot({ path: localShot, fullPage: true });
    fs.copyFileSync(localShot, artShot);

    await page.close();
  }

  // 2. Interactive Feature & Filter Tests on Desktop
  console.log('\n--- 2. Testing Interactive Radar Filters & Sample Navigation ---');
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // Log in as guest first to ensure full access to check routes
  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  const guestBtn = page.locator('button:has-text("Continue as Guest")');
  if (await guestBtn.isVisible()) {
    await guestBtn.click();
    await page.waitForTimeout(1000);
  }

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);

  // Filter testing
  const filters = [
    { label: 'Messages & Chats', minCards: 4 },
    { label: 'Calls', minCards: 4 },
    { label: 'Payments & QR', minCards: 3 },
    { label: 'Documents & Email', minCards: 2 },
    { label: 'All Channels', minCards: 12 },
  ];

  for (const f of filters) {
    await page.click(`button:has-text("${f.label}")`);
    await page.waitForTimeout(300);
    const cards = await page.$$eval('#scam-radar [id^="scam-"]', els => els.length);
    console.log(`Filter "${f.label}": visible scam cards = ${cards} (expected >= ${f.minCards})`);
    if (cards < f.minCards) throw new Error(`Filter "${f.label}" failed, card count ${cards}`);
  }

  // 3. Testing Check Hub navigation buttons
  console.log('\n--- 3. Testing Check Hub Buttons ---');
  const hubFeatures = [
    { name: 'Conversation', route: '/check/conversation' },
    { name: 'QR & Payment', route: '/check/payment' },
    { name: 'Document', route: '/check/document' },
    { name: 'Voice', route: '/check/voice' },
    { name: 'What-If', route: '/check/whatif' },
  ];

  for (const feat of hubFeatures) {
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    const link = page.locator(`a[href="${feat.route}"]`).first();
    await link.click();
    await page.waitForURL(`**${feat.route}`, { timeout: 5000 });
    console.log(`Check Hub Button "${feat.name}" navigated correctly to ${feat.route}`);
  }

  // 4. Testing "Try an Example" button from a Scam Card
  console.log('\n--- 4. Testing "Try an Example" Sample Pre-fill Flow ---');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  const tryExampleBtn = page.locator('button:has-text("Try an Example")').first();
  await tryExampleBtn.click();
  await page.waitForURL('**/check/conversation', { timeout: 5000 });
  await page.waitForTimeout(1000);
  console.log(`Current URL after "Try an Example": ${page.url()}`);

  const shotName = `step3_sample_prefill_verified.png`;
  const localShot = path.join(LOCAL_SCREENSHOT_DIR, shotName);
  const artShot = path.join(ARTIFACT_DIR, shotName);
  await page.screenshot({ path: localShot });
  fs.copyFileSync(localShot, artShot);
  console.log(`Saved sample prefill screenshot: ${shotName}`);

  await browser.close();
  console.log('\nAll Step 3 checks passed successfully!');
}

run().catch((err) => {
  console.error('Step 3 verification failed:', err);
  process.exit(1);
});
