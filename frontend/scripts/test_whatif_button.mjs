import { chromium } from 'playwright';

async function testWhatIfFlow() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('1. Navigating to http://localhost:5173/check/conversation ...');
  await page.goto('http://localhost:5173/check/conversation', { waitUntil: 'networkidle' });

  // Handle guest sign-in if needed
  const guestBtn = page.locator('button:has-text("Continue as Guest")');
  if (await guestBtn.isVisible()) {
    console.log('2. Signing in as guest...');
    await guestBtn.click();
    await page.waitForURL('**/check/conversation', { timeout: 10000 });
  }

  // Click Try a sample
  console.log('3. Clicking "Try a sample"...');
  const sampleBtn = page.locator('button:has-text("Try a sample")');
  await sampleBtn.waitFor({ state: 'visible', timeout: 5000 });
  await sampleBtn.click();

  // Wait for analysis result to appear
  console.log('4. Waiting for analysis result (Risk Score / Evidence)...');
  await page.waitForSelector('text=What could happen next?', { timeout: 60000 });
  console.log('5. "What could happen next?" button is visible!');

  // Click "What could happen next?" button
  const whatIfBtn = page.locator('a:has-text("What could happen next?")');
  await whatIfBtn.click();
  console.log('6. Clicked "What could happen next?" button!');

  // Verify navigation to /check/whatif
  await page.waitForURL('**/check/whatif', { timeout: 10000 });
  console.log('7. Successfully navigated to /check/whatif with analysis context!');

  // Verify AttackPath renders or simulation timeline starts
  await page.waitForSelector('text=What-If Attack Simulation', { timeout: 10000 });
  console.log('8. Page header "What-If Attack Simulation" loaded.');

  // Take screenshot of the What-If simulation page
  await page.waitForTimeout(2000);
  const screenshotPath = 'screenshots/step1_whatif_button_verified.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`9. Saved screenshot to ${screenshotPath}`);

  await browser.close();
  console.log('What-If button flow test SUCCESSFUL! ✅');
}

testWhatIfFlow().catch((err) => {
  console.error('What-If flow test failed:', err);
  process.exit(1);
});
