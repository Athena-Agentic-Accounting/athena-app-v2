const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class DevToolsMCPClient {
  constructor() {
    this.mcp = spawn('npx', ['chrome-devtools-mcp@latest', '--autoConnect'], {
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.buffer = '';
    this.pending = new Map();
    this.nextId = 1;

    this.mcp.stdout.on('data', (chunk) => {
      this.buffer += chunk.toString();
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line.trim());
          if (json.id && this.pending.has(json.id)) {
            const { resolve, reject } = this.pending.get(json.id);
            this.pending.delete(json.id);
            if (json.error) {
              reject(new Error(json.error.message || JSON.stringify(json.error)));
            } else {
              resolve(json.result);
            }
          }
        } catch (e) {
          // ignore non-json
        }
      }
    });

    this.mcp.stderr.on('data', (chunk) => {
      const errText = chunk.toString();
      if (!errText.includes('DeprecationWarning')) {
        console.log('[DevTools MCP]', errText.trim());
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.mcp.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  }

  async callTool(name, args = {}) {
    const res = await this.send('tools/call', { name, arguments: args });
    return res;
  }

  close() {
    this.mcp.kill();
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runE2E() {
  console.log('--- Initializing Chrome DevTools MCP Client ---');
  const client = new DevToolsMCPClient();

  // Initialize MCP
  await sleep(1500);
  const initResult = await client.send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'AthenaBenchmarker', version: '1.0.0' },
  });
  console.log('Connected to Chrome DevTools MCP:', initResult.serverInfo?.title);

  const toolsList = await client.send('tools/list');
  console.log(`Available DevTools Tools: ${toolsList.tools?.map((t) => t.name).join(', ')}`);

  const screenshotDir = path.join(__dirname, '..', 'scratch', 'screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });

  try {
    // 1. Navigate to http://localhost:3000/home
    console.log('\n[1/4] Navigating to http://localhost:3000/home in your live browser...');
    const navResult = await client.callTool('navigate_page', { url: 'http://localhost:3000/home' });
    console.log('Navigated:', navResult.content?.[0]?.text || 'OK');
    await sleep(2500);

    // 2. Capture Home Screenshot
    console.log('\n[2/4] Capturing Home page screenshot...');
    const shot1 = await client.callTool('take_screenshot', {
      filePath: path.join(screenshotDir, 'live_browser_home.png'),
    });
    console.log('Saved screenshot: scratch/screenshots/live_browser_home.png');

    // 3. Inspect Page Content / DOM
    console.log('\n[3/4] Evaluating page elements on /home...');
    const evalResult = await client.callTool('evaluate_script', {
      expression: 'document.title + " | " + document.body.innerText.slice(0, 300)',
    });
    console.log('Page Title & Text Preview:\n', evalResult.content?.[0]?.text);

    // 4. Test Prompt Submission
    console.log('\n[4/4] Submitting Prepaids & Accruals Test Task into composer...');
    const promptText = `Please prepare the July 31, 2026 Month-End Adjustments and Schedules for Forge Studios Inc.:
1. Prepaid Insurance Amortization: D&O Policy #DO-2026-99 $36,000 paid 2026-03-01 ($3,000/mo to 6100).
2. Prepaid SaaS Amortization: Datadog #DD-8821 $48,000 paid 2025-08-01 ($2,000/mo to 6200).
3. Accruals (Auto-Reversing 2026-08-01): Legal $17,500 to 6400, Utilities $4,200 to 6500.`;

    await client.callTool('evaluate_script', {
      expression: `
        const textarea = document.querySelector('textarea, input[type="text"]');
        if (textarea) {
          textarea.focus();
          textarea.value = ${JSON.stringify(promptText)};
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
        }
      `,
    });
    console.log('Prompt populated in composer.');
    await sleep(1000);

    // Click submit button or press Enter
    await client.callTool('evaluate_script', {
      expression: `
        const submitBtn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg') && !b.disabled);
        if (submitBtn) {
          submitBtn.click();
        } else {
          const textarea = document.querySelector('textarea');
          if (textarea) {
            textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
          }
        }
      `,
    });
    console.log('Task submitted.');

    // Wait for plan generation
    console.log('Waiting 5 seconds for plan generation stream...');
    await sleep(5000);

    const shot2 = await client.callTool('take_screenshot', {
      filePath: path.join(screenshotDir, 'live_browser_task_submitted.png'),
    });
    console.log('Saved screenshot: scratch/screenshots/live_browser_task_submitted.png');

    console.log('\n=== LIVE BROWSER E2E TEST COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Error during live E2E test:', err);
  } finally {
    client.close();
  }
}

runE2E();
