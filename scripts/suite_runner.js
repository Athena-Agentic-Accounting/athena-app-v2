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
        } catch (e) {}
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
    return await this.send('tools/call', { name, arguments: args });
  }

  close() {
    this.mcp.kill();
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function saveScreenshot(client, filepath) {
  try {
    const res = await client.callTool('take_screenshot', {});
    if (res.content) {
      for (const item of res.content) {
        if (item.type === 'image' && item.data) {
          fs.writeFileSync(filepath, Buffer.from(item.data, 'base64'));
          console.log(`Saved screenshot: ${filepath}`);
          return;
        }
      }
    }
  } catch (err) {
    console.error('Screenshot error:', err.message);
  }
}

async function runSuites() {
  console.log('--- Connecting to Live Normal Chrome Browser via Chrome DevTools MCP ---');
  const client = new DevToolsMCPClient();

  await sleep(1500);
  await client.send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'Athena5SuiteRunner', version: '1.0.0' },
  });

  const screenshotDir = path.join(
    process.env.USERPROFILE,
    '.gemini',
    'antigravity',
    'brain',
    'f3a57e47-3e82-41bc-be71-9d4604f47d03',
    'scratch',
    'screenshots'
  );
  fs.mkdirSync(screenshotDir, { recursive: true });

  try {
    // =========================================================================
    // TEST SUITE 1: PAYROLL BOOKING & CASH TIE-OUT
    // =========================================================================
    console.log('\n======================================================');
    console.log('STARTING SUITE 1: PAYROLL BOOKING & CASH TIE-OUT');
    console.log('======================================================');

    await client.callTool('navigate_page', { url: 'http://localhost:3000/home' });
    await sleep(2000);
    await saveScreenshot(client, path.join(screenshotDir, 'suite1_1_home.png'));

    const payrollPrompt = `Please record our July 15, 2026 semi-monthly payroll run for Forge Studios Inc.:
- Gross Salaries: $40,000.00 (Engineering $25,000.00, G&A $15,000.00)
- Employer Payroll Taxes: $3,200.00 (Employer FICA $3,060.00, FUTA/SUTA $140.00)
- Employee Tax Withholdings: $8,700.00 (Federal $5,200.00, FICA $3,060.00, State $440.00)
- Employee Benefits: $1,500.00 (401k $1,000.00, Health $500.00)
- Net Pay: $29,800.00 (Cleared SVB Operating Account 2026-07-15)
- Tax Payouts: $11,900.00 (Cleared SVB Operating Account 2026-07-16)

Requirements:
1. Balanced double-entry payroll journal entries.
2. Exact cash tie-out ($29,800 + $11,900 = $41,700 cash outlay).
3. Approval gate package for QuickBooks.`;

    await client.callTool('evaluate_script', {
      function: `() => {
        const textarea = document.querySelector('textarea, input[type="text"]');
        if (textarea) {
          textarea.focus();
          const tracker = textarea._valueTracker;
          if (tracker) tracker.setValue('');
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
          ) || Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          );
          if (setter && setter.set) {
            setter.set.call(textarea, ${JSON.stringify(payrollPrompt)});
          } else {
            textarea.value = ${JSON.stringify(payrollPrompt)};
          }
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }`,
    });
    await sleep(800);

    // Submit prompt
    await client.callTool('evaluate_script', {
      function: `() => {
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        } else {
          const btn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg') && !b.disabled);
          if (btn) btn.click();
        }
      }`,
    });

    console.log('Payroll prompt submitted. Waiting for plan stream...');
    await sleep(6000);
    await saveScreenshot(client, path.join(screenshotDir, 'suite1_2_plan_generated.png'));

    // Confirm plan & start execution
    await client.callTool('evaluate_script', {
      function: `() => {
        const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Confirm plan') || b.innerText.includes('Start now') || b.innerText.includes('Approve'));
        if (confirmBtn) confirmBtn.click();
      }`,
    });
    console.log('Plan confirmed. Executing Suite 1...');
    await sleep(7000);
    await saveScreenshot(client, path.join(screenshotDir, 'suite1_3_executed.png'));

    // =========================================================================
    // TEST SUITE 4: PREPAIDS & AUTO-REVERSING ACCRUALS
    // =========================================================================
    console.log('\n======================================================');
    console.log('STARTING SUITE 4: PREPAIDS & AUTO-REVERSING ACCRUALS');
    console.log('======================================================');

    await client.callTool('navigate_page', { url: 'http://localhost:3000/home' });
    await sleep(2000);

    const prepaidsPrompt = `Please prepare the July 31, 2026 Month-End Adjustments and Schedules for Forge Studios Inc.:
1. Prepaid Insurance Amortization: D&O Policy #DO-2026-99 $36,000.00 (12-month term, $3,000/mo to 6100 Insurance). Ending Balance $21,000.00.
2. Prepaid SaaS Amortization: Datadog #DD-8821 $48,000.00 (24-month term, $2,000/mo to 6200 Software). Ending Balance $24,000.00.
3. Month-End Auto-Reversing Expense Accruals:
   - Latham & Watkins unbilled legal counsel: $17,500.00 (Debit 6400 Legal, Credit 2050 Accrued Liabilities). Reverses 2026-08-01.
   - Equinix SV5 Data Center utilities: $4,200.00 (Debit 6500 Utilities, Credit 2050 Accrued Liabilities). Reverses 2026-08-01.
Deliverables: Amortization schedule, balanced JEs ($5,000 amort & $21,700 accruals), and Excel workpaper.`;

    await client.callTool('evaluate_script', {
      function: `() => {
        const textarea = document.querySelector('textarea, input[type="text"]');
        if (textarea) {
          textarea.focus();
          const tracker = textarea._valueTracker;
          if (tracker) tracker.setValue('');
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
          ) || Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          );
          if (setter && setter.set) {
            setter.set.call(textarea, ${JSON.stringify(prepaidsPrompt)});
          } else {
            textarea.value = ${JSON.stringify(prepaidsPrompt)};
          }
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }`,
    });
    await sleep(800);

    await client.callTool('evaluate_script', {
      function: `() => {
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        } else {
          const btn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg') && !b.disabled);
          if (btn) btn.click();
        }
      }`,
    });

    console.log('Prepaids prompt submitted. Waiting for plan stream...');
    await sleep(6000);
    await saveScreenshot(client, path.join(screenshotDir, 'suite4_1_plan.png'));

    await client.callTool('evaluate_script', {
      function: `() => {
        const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Confirm plan') || b.innerText.includes('Start now'));
        if (confirmBtn) confirmBtn.click();
      }`,
    });

    console.log('Plan confirmed. Executing Suite 4...');
    await sleep(8000);
    await saveScreenshot(client, path.join(screenshotDir, 'suite4_2_executed.png'));

    console.log('\n=== ALL SUITES EXECUTED LIVE IN NORMAL CHROME BROWSER ===');
  } catch (err) {
    console.error('Error during suite execution:', err);
  } finally {
    client.close();
  }
}

runSuites();
