const fs = require('fs');
const path = require('path');

class ChromeCDP {
  constructor() {
    this.nextId = 1;
    this.callbacks = new Map();
    this.sessionId = null;
    this.ws = null;
    this.networkLogs = [];
    this.consoleLogs = [];
  }

  async init() {
    const portFile = path.join(
      process.env.LOCALAPPDATA,
      'Google',
      'Chrome',
      'User Data',
      'DevToolsActivePort'
    );
    const [port, wsPath] = fs.readFileSync(portFile, 'utf8').trim().split('\n');
    const browserWsUrl = `ws://127.0.0.1:${port.trim()}${wsPath.trim()}`;

    this.ws = new WebSocket(browserWsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) {
            reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          } else {
            resolve(msg.result);
          }
        } else if (msg.method === 'Target.attachedToTarget') {
          this.sessionId = msg.params.sessionId;
        } else if (msg.method === 'Network.responseReceived') {
          const status = msg.params?.response?.status;
          const url = msg.params?.response?.url;
          this.networkLogs.push({ url, status, statusText: msg.params?.response?.statusText });
        } else if (msg.method === 'Runtime.consoleAPICalled') {
          const type = msg.params?.type;
          const text = msg.params?.args?.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
          this.consoleLogs.push({ type, text });
        }
      } catch (e) {}
    };

    const targetsRes = await this.send('Target.getTargets');
    const targets = targetsRes.targetInfos || [];
    let pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost:3000'));
    if (!pageTarget) {
      pageTarget = targets.find(t => t.type === 'page');
    }

    const attachRes = await this.send('Target.attachToTarget', {
      targetId: pageTarget.targetId,
      flatten: true,
    });
    this.sessionId = attachRes.sessionId;

    await this.sendSession('Page.enable');
    await this.sendSession('Runtime.enable');
    await this.sendSession('DOM.enable');
    await this.sendSession('Network.enable');
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  sendSession(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, sessionId: this.sessionId, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.sendSession('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval exception: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  async navigate(url) {
    await this.sendSession('Page.navigate', { url });
    await this.sleep(2500);
  }

  async sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function testPrompt() {
  const cdp = new ChromeCDP();
  await cdp.init();

  const promptText = `Please prepare the July 31, 2026 Month-End Adjustments and Schedules for Forge Studios Inc.:
1. Prepaid Insurance Amortization: D&O Policy #DO-2026-99 $36,000.00 (12-month term, $3,000/mo to 6100 Insurance). Ending Balance $21,000.00.
2. Prepaid SaaS Amortization: Datadog #DD-8821 $48,000.00 (24-month term, $2,000/mo to 6200 Software). Ending Balance $24,000.00.
3. Month-End Auto-Reversing Expense Accruals:
   - Latham & Watkins unbilled legal counsel: $17,500.00 (Debit 6400 Legal, Credit 2050 Accrued Liabilities). Reverses 2026-08-01.
   - Equinix SV5 Data Center utilities: $4,200.00 (Debit 6500 Utilities, Credit 2050 Accrued Liabilities). Reverses 2026-08-01.
Deliverables: Amortization schedule, balanced JEs ($5,000 amort & $21,700 accruals), and Excel workpaper.`;

  console.log('Navigating to http://localhost:3000/home...');
  await cdp.navigate('http://localhost:3000/home');
  await cdp.sleep(2000);

  console.log('Setting prompt value with React valueTracker handling...');
  const res = await cdp.eval(`(() => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return { error: 'No textarea' };
    textarea.focus();
    const tracker = textarea._valueTracker;
    if (tracker) tracker.setValue('');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    if (setter) {
      setter.call(textarea, ${JSON.stringify(promptText)});
    } else {
      textarea.value = ${JSON.stringify(promptText)};
    }
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));

    const sendBtn = document.querySelector('button[aria-label="Send message"]');
    return {
      hasSendBtn: !!sendBtn,
      sendBtnDisabled: sendBtn ? sendBtn.disabled : null,
      valLength: textarea.value.length
    };
  })()`);
  console.log('Prompt setup result:', res);

  await cdp.sleep(500);

  console.log('Clicking Send button...');
  const clickRes = await cdp.eval(`(() => {
    const sendBtn = document.querySelector('button[aria-label="Send message"]');
    if (sendBtn) {
      sendBtn.click();
      return { ok: true };
    }
    return { error: 'No send button' };
  })()`);
  console.log('Click result:', clickRes);

  console.log('Polling URL and page state for 10s...');
  for (let i = 0; i < 5; i++) {
    await cdp.sleep(2000);
    const state = await cdp.eval(`(() => ({
      url: window.location.href,
      title: document.title,
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean),
      bodySnippet: document.body.innerText.slice(0, 400)
    }))()`);
    console.log(`[T+${(i+1)*2}s] Page State:`, state);
  }

  cdp.close();
}

testPrompt();
