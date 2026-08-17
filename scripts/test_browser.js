const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const activePortPath = path.join(
      process.env.LOCALAPPDATA,
      'Google',
      'Chrome',
      'User Data',
      'DevToolsActivePort'
    );

    if (!fs.existsSync(activePortPath)) {
      console.error('DevToolsActivePort not found at ' + activePortPath);
      process.exit(1);
    }

    const lines = fs.readFileSync(activePortPath, 'utf-8').trim().split('\n');
    const port = lines[0].trim();
    const wsPath = lines[1].trim();
    const wsEndpoint = `ws://127.0.0.1:${port}${wsPath}`;
    console.log('Connecting to Chrome WebSocket:', wsEndpoint);

    const browser = await puppeteer.connect({
      browserWSEndpoint: wsEndpoint,
      defaultViewport: null,
    });

    const pages = await browser.pages();
    let page = pages.find((p) => p.url().includes('localhost:3000')) || pages[0];
    if (!page) {
      page = await browser.newPage();
    }

    console.log('Navigating to http://localhost:3000/home...');
    await page.goto('http://localhost:3000/home', { waitUntil: 'networkidle0', timeout: 30000 });

    const screenshotDir = path.join(__dirname, '..', 'scratch', 'screenshots');
    fs.mkdirSync(screenshotDir, { recursive: true });

    await page.screenshot({ path: path.join(screenshotDir, 'live_chrome_home.png') });
    console.log('Screenshot saved: scratch/screenshots/live_chrome_home.png');

    console.log('Current page title:', await page.title());
    console.log('Current URL:', page.url());

    // Inspect page elements
    const pageText = await page.evaluate(() => document.body.innerText.slice(0, 500));
    console.log('Page preview text:\n', pageText);

    browser.disconnect();
    console.log('SUCCESS: Live Chrome DevTools Connected!');
  } catch (err) {
    console.error('Error running test_browser:', err);
    process.exit(1);
  }
}

run();
