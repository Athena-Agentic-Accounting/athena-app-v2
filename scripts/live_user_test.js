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

async function saveScreenshot(client, filename) {
  const dir = path.join(
    process.env.USERPROFILE,
    '.gemini',
    'antigravity',
    'brain',
    'f3a57e47-3e82-41bc-be71-9d4604f47d03',
    'scratch',
    'screenshots'
  );
  fs.mkdirSync(dir, { recursive: true });
  const fullPath = path.join(dir, filename);

  try {
    const res = await client.callTool('take_screenshot', {});
    if (res.content) {
      for (const item of res.content) {
        if (item.type === 'image' && item.data) {
          fs.writeFileSync(fullPath, Buffer.from(item.data, 'base64'));
          console.log(`[Screenshot Saved] -> ${filename}`);
          return;
        }
      }
    }
  } catch (err) {
    console.error('Failed to capture screenshot:', err.message);
  }
}

async function runLiveAudit() {
  console.log('=== Initializing Chrome DevTools Connection ===');
  const client = new DevToolsClient();

  await sleep(1500);
  await client.send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'AthenaLiveAuditor', version: '1.0.0' },
  });

  try {
    console.log('\n[1/4] Capturing Initial Browser State...');
    await saveScreenshot(client, 'live_audit_initial.png');

    const promptText = `Please record our July 15, 2026 semi-monthly payroll run for Forge Studios Inc.:
- Gross Salaries: $40,000.00 (Engineering $25,000.00, G&A $15,000.00)
- Employer Taxes: $3,200.00 (FICA $3,060, FUTA/SUTA $140)
- Employee Withholdings: $8,700.00 (FIT $5,200, FICA $3,060, SIT $440)
- Benefits: $1,500.00 (401k $1,000, Health $500)
- Net Pay: $29,800.00 (Cleared SVB Operating Account 2026-07-15)
- Tax Payouts: $11,900.00 (Cleared SVB Operating Account 2026-07-16)

Requirements:
1. Balanced double-entry payroll journal entries.
2. Exact cash tie-out ($29,800 + $11,900 = $41,700 cash outlay).
3. Approval gate package for QuickBooks.`;

    console.log('\n[2/4] Entering Payroll Prompt into Composer...');
    const fillRes = await client.callTool('evaluate_script', {
      function: `() => {
        const textarea = document.querySelector('textarea');
        if (!textarea) return 'no textarea';
        textarea.focus();
        
        // Native React setter
        const proto = window.HTMLTextAreaElement.prototype;
        const setVal = Object.getOwnPropertyDescriptor(proto, 'value').set;
        setVal.call(textarea, ${JSON.stringify(promptText)});
        
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        return 'filled';
      }`,
    });
    console.log('Fill status:', fillRes.content?.[0]?.text);
    await sleep(500);

    console.log('\n[3/4] Clicking Send message...');
    const clickRes = await client.callTool('evaluate_script', {
      function: `() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const sendBtn = btns.find(b => b.getAttribute('aria-label') === 'Send message' || b.querySelector('svg'));
        if (sendBtn) {
          sendBtn.click();
          return 'clicked send button';
        }
        return 'no send button';
      }`,
    });
    console.log('Click status:', clickRes.content?.[0]?.text);

    console.log('Waiting 5s for plan stream...');
    await sleep(5000);
    await saveScreenshot(client, 'live_audit_after_submit.png');

    console.log('\n[4/4] Checking for Plan Confirmation Button...');
    const confirmRes = await client.callTool('evaluate_script', {
      function: `() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const confirmBtn = btns.find(b => 
          b.innerText.includes('Confirm plan') || 
          b.innerText.includes('Start now') || 
          b.innerText.includes('Approve')
        );
        if (confirmBtn) {
          confirmBtn.click();
          return 'Clicked confirm: ' + confirmBtn.innerText;
        }
        return 'No confirm button found. Found buttons: ' + btns.map(b => b.innerText.trim()).filter(Boolean).slice(0, 8).join(' | ');
      }`,
    });
    console.log('Confirm action:', confirmRes.content?.[0]?.text);

    console.log('Waiting 6s for live execution stream...');
    await sleep(6000);
    await saveScreenshot(client, 'live_audit_final_stream.png');

    console.log('\n=== REAL BROWSER AUDIT COMPLETED ===');
  } catch (err) {
    console.error('Audit encountered error:', err);
  } finally {
    client.close();
  }
}

runLiveAudit();
