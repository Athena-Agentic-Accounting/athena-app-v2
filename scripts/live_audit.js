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

async function runLiveAudit() {
  console.log('--- Connecting to Live Normal Chrome Browser ---');
  const client = new DevToolsMCPClient();

  await sleep(1500);
  await client.send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'LiveAuditor', version: '1.0.0' },
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
    const urlCheck = await client.callTool('evaluate_script', {
      function: `() => window.location.href`,
    });
    console.log('Current URL in active Chrome tab:', urlCheck.content?.[0]?.text);

    const testPrompt = `Please record our July 15, 2026 semi-monthly payroll run for Forge Studios Inc.:
- Gross Salaries: $40,000.00 (Engineering $25,000.00, G&A $15,000.00)
- Employer Taxes: $3,200.00
- Employee Withholdings: $8,700.00
- Benefits: $1,500.00
- Net Pay: $29,800.00 (Cleared SVB 2026-07-15)
- Tax Payout: $11,900.00 (Cleared SVB 2026-07-16)

Requirements:
1. Balanced double-entry payroll journal entries.
2. Exact cash tie-out ($29,800 + $11,900 = $41,700 cash outlay).
3. Approval gate package for QuickBooks.`;

    console.log('\n[1/3] Typing into prompt bar and submitting...');
    const submitRes = await client.callTool('evaluate_script', {
      function: `() => {
        const textarea = document.querySelector('textarea');
        if (!textarea) return 'no textarea found on page';
        
        textarea.focus();
        const proto = window.HTMLTextAreaElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value').set;
        nativeSetter.call(textarea, ${JSON.stringify(testPrompt)});
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Find send button or click submit
        const btns = Array.from(document.querySelectorAll('button'));
        const sendBtn = btns.find(b => b.getAttribute('aria-label') === 'Send message' || b.querySelector('svg') && !b.disabled);
        if (sendBtn) {
          sendBtn.removeAttribute('disabled');
          sendBtn.click();
          return 'Clicked send button successfully!';
        }
        return 'Could not find send button';
      }`,
    });
    console.log('Action result:', submitRes.content?.[0]?.text);

    console.log('Waiting 5s for navigation and plan generation stream...');
    await sleep(5000);

    const postSubmitUrl = await client.callTool('evaluate_script', {
      function: `() => window.location.href + ' | Title: ' + document.title`,
    });
    console.log('Page state after submit:', postSubmitUrl.content?.[0]?.text);

    await saveScreenshot(client, path.join(screenshotDir, 'live_audit_after_submit.png'));

    // Check for Proposed plan & click confirm
    console.log('\n[2/3] Checking for Plan and Confirm Button...');
    const confirmRes = await client.callTool('evaluate_script', {
      function: `() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const confirmBtn = btns.find(b => b.innerText.includes('Confirm plan') || b.innerText.includes('Start now') || b.innerText.includes('Approve'));
        if (confirmBtn) {
          confirmBtn.click();
          return 'Found & Clicked button: ' + confirmBtn.innerText;
        }
        return 'No confirm button. Found buttons: ' + btns.map(b => b.innerText.trim()).filter(Boolean).join(' | ');
      }`,
    });
    console.log('Confirm result:', confirmRes.content?.[0]?.text);

    console.log('Waiting 6s for live execution...');
    await sleep(6000);

    await saveScreenshot(client, path.join(screenshotDir, 'live_audit_executed.png'));

    // Extract table and approval gate contents from DOM
    console.log('\n[3/3] Inspecting live DOM elements & accounting outputs...');
    const domInspect = await client.callTool('evaluate_script', {
      function: `() => {
        const text = document.body.innerText;
        const tables = Array.from(document.querySelectorAll('table')).map(t => t.innerText);
        return {
          tablesCount: tables.length,
          tablesPreview: tables.slice(0, 3),
          bodyExcerpt: text.slice(0, 1000)
        };
      }`,
    });
    console.log('DOM Inspection Result:\n', domInspect.content?.[0]?.text);

    console.log('\n=== LIVE AUDIT RUN COMPLETE ===');
  } catch (err) {
    console.error('Audit error:', err);
  } finally {
    client.close();
  }
}

runLiveAudit();
