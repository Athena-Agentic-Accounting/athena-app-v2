const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class DevToolsClient {
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

async function runBenchmark() {
  console.log('=== Initializing Live Chrome DevTools Connection ===');
  const client = new DevToolsClient();

  await sleep(1500);
  await client.send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'AthenaAuditor', version: '1.0.0' },
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
    console.log('\n[1/5] Taking page snapshot of current Chrome tab...');
    const snapshotRes = await client.callTool('take_snapshot', {});
    const snapshotText = snapshotRes.content?.[0]?.text || '';
    console.log('Snapshot excerpt:\n', snapshotText.slice(0, 800));

    // Find textarea or input
    console.log('\n[2/5] Entering test prompt using direct script evaluation...');
    const payrollPrompt = `Please record our July 15, 2026 semi-monthly payroll run for Forge Studios Inc.:
- Gross Salaries: $40,000.00 (Engineering $25,000.00, G&A $15,000.00)
- Employer Taxes: $3,200.00
- Employee Withholdings: $8,700.00
- Benefits: $1,500.00
- Net Pay: $29,800.00 (Cleared SVB 2026-07-15)
- Tax Payout: $11,900.00 (Cleared SVB 2026-07-16)`;

    const submitRes = await client.callTool('evaluate_script', {
      function: `() => {
        const textarea = document.querySelector('textarea');
        if (!textarea) return 'No textarea';
        textarea.focus();
        
        // Native React setter
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(textarea, ${JSON.stringify(payrollPrompt)});
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Find send button
        const buttons = Array.from(document.querySelectorAll('button'));
        const sendBtn = buttons.find(b => b.getAttribute('aria-label') === 'Send message' || b.querySelector('svg'));
        if (sendBtn) {
          sendBtn.click();
          return 'Clicked send button';
        }
        return 'Could not find button';
      }`,
    });
    console.log('Submission result:', submitRes.content?.[0]?.text);

    console.log('\n[3/5] Waiting 5 seconds for plan generation...');
    await sleep(5000);
    await saveScreenshot(client, path.join(screenshotDir, 'benchmark_plan_view.png'));

    const planSnapshot = await client.callTool('take_snapshot', {});
    console.log('Plan Snapshot excerpt:\n', (planSnapshot.content?.[0]?.text || '').slice(0, 1000));

    console.log('\n[4/5] Clicking Confirm plan & start...');
    const confirmRes = await client.callTool('evaluate_script', {
      function: `() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const confirmBtn = buttons.find(b => b.innerText.includes('Confirm plan') || b.innerText.includes('Start now') || b.innerText.includes('Approve'));
        if (confirmBtn) {
          confirmBtn.click();
          return 'Clicked confirm: ' + confirmBtn.innerText;
        }
        return 'No confirm button found';
      }`,
    });
    console.log('Confirm action:', confirmRes.content?.[0]?.text);

    console.log('\n[5/5] Waiting 7 seconds for live execution stream...');
    await sleep(7000);
    await saveScreenshot(client, path.join(screenshotDir, 'benchmark_executed_view.png'));

    const finalSnapshot = await client.callTool('take_snapshot', {});
    console.log('Final Execution Snapshot:\n', (finalSnapshot.content?.[0]?.text || '').slice(0, 1500));

    console.log('\n=== BENCHMARK EXECUTION COMPLETE ===');
  } catch (err) {
    console.error('Benchmark error:', err);
  } finally {
    client.close();
  }
}

runBenchmark();
