import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const VIEWPORT_WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920, 2560];
const SCREENSHOT_WIDTHS = [360, 768, 1280, 1920, 2560];

const PAGES = [
  { name: 'home', route: '/' },
  { name: 'check_conv', route: '/check/conversation' },
  { name: 'check_whatif', route: '/check/whatif' },
  { name: 'result_gallery', route: '/dev/components' },
  { name: 'history', route: '/history' },
];

const screenshotsDir = path.resolve(__dirname, '..', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function runAudit() {
  console.log(`Starting responsive audit against ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const auditResults = {
    overflowPassed: true,
    fontSizePassed: true,
    overflowFailures: [],
    fontSizeFailures: [],
    screenshotsCaptured: [],
  };

  for (const p of PAGES) {
    const fullUrl = `${BASE_URL}${p.route}`;
    console.log(`\nTesting page: ${p.name} (${fullUrl})`);

    for (const width of VIEWPORT_WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(fullUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);

      // 1. Check document.documentElement.scrollWidth <= window.innerWidth
      const overflow = await page.evaluate(() => {
        const docEl = document.documentElement;
        const scrollWidth = docEl.scrollWidth;
        const innerWidth = window.innerWidth;
        const hasOverflow = scrollWidth > innerWidth + 1; // 1px threshold for fractional pixels
        return {
          scrollWidth,
          innerWidth,
          hasOverflow,
        };
      });

      if (overflow.hasOverflow) {
        auditResults.overflowPassed = false;
        auditResults.overflowFailures.push({
          page: p.name,
          width,
          scrollWidth: overflow.scrollWidth,
          innerWidth: overflow.innerWidth,
        });
        console.error(`❌ Overflow at ${width}px on ${p.name}: scrollWidth=${overflow.scrollWidth} > innerWidth=${overflow.innerWidth}`);
      } else {
        process.stdout.write(`  [${width}px: overflow OK]`);
      }

      // 2. Check no text under 14px on body text elements
      const fontViolations = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('p, span, a, button, h1, h2, h3, h4, h5, h6, input, label, li, td, th, blockquote'));
        const violations = [];

        for (const el of elements) {
          // Check if element has visible text
          const text = (el.textContent || '').trim();
          if (!text) continue;
          if (el.offsetParent === null) continue; // element not visible

          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

          const size = parseFloat(style.fontSize);
          // 13.9px allows floating point precision around 14px
          if (size < 13.9) {
            violations.push({
              tag: el.tagName.toLowerCase(),
              className: el.className || '',
              fontSize: size,
              textSnippet: text.slice(0, 40),
            });
            if (violations.length >= 5) break;
          }
        }
        return violations;
      });

      if (fontViolations.length > 0) {
        auditResults.fontSizePassed = false;
        auditResults.fontSizeFailures.push({
          page: p.name,
          width,
          violations: fontViolations,
        });
        console.error(`\n❌ Text < 14px at ${width}px on ${p.name}:`, fontViolations[0]);
      } else {
        process.stdout.write(` [font >= 14px OK]`);
      }

      // 3. Take screenshots at specified screenshot widths
      if (SCREENSHOT_WIDTHS.includes(width)) {
        const screenshotPath = path.join(screenshotsDir, `step1_${p.name}_${width}px.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        auditResults.screenshotsCaptured.push(screenshotPath);
      }
    }
    console.log('');
  }

  await browser.close();

  console.log('\n========================================');
  console.log('RESPONSIVE AUDIT RESULTS');
  console.log('========================================');
  console.log(`ScrollWidth <= InnerWidth (No Horizontal Scroll): ${auditResults.overflowPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`No text under 14px (Body Text >= 14px):           ${auditResults.fontSizePassed ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`Screenshots Captured: ${auditResults.screenshotsCaptured.length} images in ${screenshotsDir}`);

  if (auditResults.overflowFailures.length > 0) {
    console.log('\nOverflow details:');
    console.log(JSON.stringify(auditResults.overflowFailures, null, 2));
  }
  if (auditResults.fontSizeFailures.length > 0) {
    console.log('\nFont size details:');
    console.log(JSON.stringify(auditResults.fontSizeFailures, null, 2));
  }

  if (!auditResults.overflowPassed || !auditResults.fontSizePassed) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
