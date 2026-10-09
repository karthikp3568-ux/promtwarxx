import { chromium } from 'playwright';

async function testWhatIf() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to http://localhost:5173/check/whatif ...');
  await page.goto('http://localhost:5173/check/whatif', { waitUntil: 'networkidle' });

  // If redirected to login, click Continue as Guest
  const guestBtn = page.locator('button:has-text("Continue as Guest")');
  if (await guestBtn.isVisible()) {
    console.log('On login page, clicking Continue as Guest...');
    await guestBtn.click();
    await page.waitForURL('**/check/whatif', { timeout: 10000 });
  }

  // Check title
  const heading = await page.locator('h1').textContent();
  console.log('Page Title:', heading);

  // Type a scenario
  const textarea = page.locator('textarea');
  await textarea.fill('A caller claimed to be from my bank fraud squad asking to verify an OTP to cancel a transaction.');
  
  const analyzeBtn = page.locator('button:has-text("Analyze")');
  await analyzeBtn.click();
  console.log('Clicked Analyze for What-If scenario...');

  // Wait for simulation to finish
  await page.waitForSelector('text=Attack Progression', { timeout: 60000 });
  console.log('Successfully rendered Attack Progression!');

  const hasYouAreHere = await page.locator('text=YOU ARE HERE').count();
  console.log('Stage indicators present (YOU ARE HERE):', hasYouAreHere > 0);

  const screenshotPath = 'screenshots/whatif_simulation_verified.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved verification screenshot to ${screenshotPath}`);

  await browser.close();
}

testWhatIf().catch((err) => {
  console.error('What-If UI test failed:', err);
  process.exit(1);
});
