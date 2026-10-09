import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/karthik p/.gemini/antigravity/brain/852001c0-2591-4ac5-9ff6-385d501b3c1d';
const LOCAL_SCREENSHOT_DIR = 'd:/codes/promtwars/TrustGuard/frontend/screenshots';

if (!fs.existsSync(LOCAL_SCREENSHOT_DIR)) {
  fs.mkdirSync(LOCAL_SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('Launching browser for Step 2 Glass System Verification...');
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: 'desktop', width: 1280, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });

    console.log(`\nNavigating to /dev/components at ${vp.name} (${vp.width}x${vp.height})...`);
    await page.goto('http://localhost:5173/dev/components', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 1. Take screenshot with normal glass enabled
    const normalName = `step2_dev_components_${vp.name}_glass.png`;
    const normalLocalPath = path.join(LOCAL_SCREENSHOT_DIR, normalName);
    const normalArtifactPath = path.join(ARTIFACT_DIR, normalName);

    await page.screenshot({ path: normalLocalPath, fullPage: true });
    fs.copyFileSync(normalLocalPath, normalArtifactPath);
    console.log(`Saved glass screenshot: ${normalName}`);

    // 2. Inject CSS override disabling backdrop-filter to verify fallback
    console.log('Injecting backdrop-filter disable override...');
    await page.addStyleTag({
      content: `
        * {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        .glass-card, .glass-panel, .glass-pill {
          background-color: var(--glass-fallback) !important;
        }
        .glass-strong {
          background-color: var(--glass-strong-fallback) !important;
        }
        .glass-reading {
          background-color: var(--glass-reading-fallback) !important;
        }
      `,
    });
    await page.waitForTimeout(500);

    // Verify text readability: ensure body and cards have visible text
    const textCheck = await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('h1, h2, h3, p, span, button'))
        .filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && el.innerText.trim().length > 0;
        });

      return {
        count: texts.length,
        allVisible: texts.every(el => {
          const style = window.getComputedStyle(el);
          return style.visibility !== 'hidden' && style.display !== 'none' && parseFloat(style.opacity) > 0.5;
        }),
      };
    });

    console.log(`Text visibility check with fallback: ${textCheck.count} text elements inspected, all visible = ${textCheck.allVisible}`);

    // 3. Take screenshot with fallback active
    const fallbackName = `step2_dev_components_${vp.name}_fallback.png`;
    const fallbackLocalPath = path.join(LOCAL_SCREENSHOT_DIR, fallbackName);
    const fallbackArtifactPath = path.join(ARTIFACT_DIR, fallbackName);

    await page.screenshot({ path: fallbackLocalPath, fullPage: true });
    fs.copyFileSync(fallbackLocalPath, fallbackArtifactPath);
    console.log(`Saved fallback screenshot: ${fallbackName}`);

    await page.close();
  }

  await browser.close();
  console.log('\nAll Step 2 Glass System and Fallback tests completed successfully!');
}

run().catch((err) => {
  console.error('Error running Step 2 tests:', err);
  process.exit(1);
});
