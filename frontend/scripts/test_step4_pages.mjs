import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/karthik p/.gemini/antigravity/brain/852001c0-2591-4ac5-9ff6-385d501b3c1d';
const LOCAL_SCREENSHOT_DIR = 'd:/codes/promtwars/TrustGuard/frontend/screenshots';

if (!fs.existsSync(LOCAL_SCREENSHOT_DIR)) {
  fs.mkdirSync(LOCAL_SCREENSHOT_DIR, { recursive: true });
}

async function saveScreenshot(page, filename) {
  const localPath = path.join(LOCAL_SCREENSHOT_DIR, filename);
  const brainPath = path.join(ARTIFACT_DIR, filename);
  await page.screenshot({ path: localPath, fullPage: true });
  fs.copyFileSync(localPath, brainPath);
  console.log(`Saved screenshot: ${filename}`);
}

async function verifyPageOverflow(page, pageName) {
  const check = await page.evaluate(() => {
    const scrollW = document.documentElement.scrollWidth;
    const innerW = window.innerWidth;
    return {
      noHorizontalScroll: scrollW <= innerW + 1,
      scrollW,
      innerW,
    };
  });
  console.log(`[${pageName}] ScrollOK=${check.noHorizontalScroll} (${check.scrollW}px / ${check.innerW}px)`);
  if (!check.noHorizontalScroll) {
    throw new Error(`[${pageName}] Horizontal overflow: scrollW=${check.scrollW} > innerW=${check.innerW}`);
  }
}

async function run() {
  console.log('Starting Step 4 - Restyle All Other Pages Verification...');
  const browser = await chromium.launch({ headless: true });

  try {
    // 1. LOGIN PAGE (Desktop & Mobile)
    console.log('\n--- 1. Testing Login Page ---');
    const loginPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await loginPage.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    await loginPage.waitForTimeout(500);
    await verifyPageOverflow(loginPage, 'Login Desktop');
    await saveScreenshot(loginPage, 'step4_login_desktop.png');

    // 2. REGISTER PAGE (Desktop)
    console.log('\n--- 2. Testing Register Page ---');
    await loginPage.goto('http://localhost:5173/register', { waitUntil: 'domcontentloaded' });
    await loginPage.waitForTimeout(500);
    await verifyPageOverflow(loginPage, 'Register Desktop');
    await saveScreenshot(loginPage, 'step4_register_desktop.png');

    // 3. RESET PASSWORD PAGE (Desktop)
    console.log('\n--- 3. Testing Reset Password Page ---');
    await loginPage.goto('http://localhost:5173/reset-password', { waitUntil: 'domcontentloaded' });
    await loginPage.waitForTimeout(500);
    await verifyPageOverflow(loginPage, 'Reset Password Desktop');
    await saveScreenshot(loginPage, 'step4_reset_password_desktop.png');

    // 4. AUTHENTICATE AS GUEST
    console.log('\n--- 4. Authenticating as Guest for Protected Routes ---');
    await loginPage.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    await loginPage.waitForTimeout(500);
    const guestBtn = loginPage.locator('button:has-text("Continue as Guest")');
    if (await guestBtn.isVisible()) {
      await guestBtn.click();
      await loginPage.waitForTimeout(1000);
      console.log('Successfully signed in as Guest');
    }

    // 5. HISTORY PAGE (Desktop & Mobile)
    console.log('\n--- 5. Testing History Page ---');
    await loginPage.goto('http://localhost:5173/history', { waitUntil: 'domcontentloaded' });
    await loginPage.waitForTimeout(800);
    await verifyPageOverflow(loginPage, 'History Desktop');
    await saveScreenshot(loginPage, 'step4_history_desktop.png');

    // History Mobile
    await loginPage.setViewportSize({ width: 390, height: 844 });
    await loginPage.waitForTimeout(500);
    await verifyPageOverflow(loginPage, 'History Mobile (390px)');
    await saveScreenshot(loginPage, 'step4_history_mobile.png');

    // 6. PRIVACY PAGE (Desktop & Mobile)
    console.log('\n--- 6. Testing Privacy Page ---');
    await loginPage.setViewportSize({ width: 1280, height: 800 });
    await loginPage.goto('http://localhost:5173/privacy', { waitUntil: 'domcontentloaded' });
    await loginPage.waitForTimeout(500);
    await verifyPageOverflow(loginPage, 'Privacy Desktop');
    await saveScreenshot(loginPage, 'step4_privacy_desktop.png');

    // Privacy Mobile
    await loginPage.setViewportSize({ width: 390, height: 844 });
    await loginPage.waitForTimeout(500);
    await verifyPageOverflow(loginPage, 'Privacy Mobile (390px)');
    await saveScreenshot(loginPage, 'step4_privacy_mobile.png');

    // 7. SETTINGS PAGE (Desktop & Mobile)
    console.log('\n--- 7. Testing Settings Page ---');
    await loginPage.setViewportSize({ width: 1280, height: 800 });
    await loginPage.goto('http://localhost:5173/settings', { waitUntil: 'domcontentloaded' });
    await loginPage.waitForTimeout(500);
    await verifyPageOverflow(loginPage, 'Settings Desktop');
    await saveScreenshot(loginPage, 'step4_settings_desktop.png');

    // Settings Mobile
    await loginPage.setViewportSize({ width: 390, height: 844 });
    await loginPage.waitForTimeout(500);
    await verifyPageOverflow(loginPage, 'Settings Mobile (390px)');
    await saveScreenshot(loginPage, 'step4_settings_mobile.png');

    // 8. CHECK CONVERSATION RESULT VIEW (Desktop)
    console.log('\n--- 8. Testing Check Analysis Page & Result Container ---');
    await loginPage.setViewportSize({ width: 1280, height: 800 });
    await loginPage.goto('http://localhost:5173/check/conversation', { waitUntil: 'domcontentloaded' });
    await loginPage.waitForTimeout(500);
    await verifyPageOverflow(loginPage, 'Check Conversation Desktop');
    await saveScreenshot(loginPage, 'step4_check_conversation_desktop.png');

    console.log('\n✅ ALL STEP 4 TESTS COMPLETED SUCCESSFULLY!');
    await browser.close();
  } catch (err) {
    console.error('Test failed with error:', err);
    await browser.close();
    process.exit(1);
  }
}

run();
