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
    if (!pageTarget) pageTarget = targets.find(t => t.type === 'page');

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

  async captureScreenshot(destPaths) {
    const paths = Array.isArray(destPaths) ? destPaths : [destPaths];
    const res = await this.sendSession('Page.captureScreenshot', { format: 'png', fromSurface: true });
    if (res.data) {
      const buffer = Buffer.from(res.data, 'base64');
      for (const p of paths) {
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, buffer);
        console.log(`[Screenshot] Saved -> ${p}`);
      }
    }
  }

  async sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function testDemoPages() {
  const brainDir = path.join(
    process.env.USERPROFILE,
    '.gemini',
    'antigravity',
    'brain',
    '9b78a349-d085-4ce6-97c4-7d296bece40b',
    'scratch',
    'screenshots'
  );
  const appScratchDir = path.join(__dirname, '..', 'scratch', 'screenshots');
  const getShotPaths = (name) => [
    path.join(brainDir, `${name}.png`),
    path.join(appScratchDir, `${name}.png`),
  ];

  const cdp = new ChromeCDP();
  await cdp.init();

  console.log('\n--- TEST 1: Navigating to /demo/session/plan (Plan Review) ---');
  await cdp.navigate('http://localhost:3000/demo/session/plan');
  await cdp.sleep(2000);

  const planInfo = await cdp.eval(`(() => {
    const text = document.body.innerText;
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
    const tables = Array.from(document.querySelectorAll('table')).map(t => {
      const rect = t.getBoundingClientRect();
      const parentRect = t.parentElement ? t.parentElement.getBoundingClientRect() : null;
      return {
        headers: Array.from(t.querySelectorAll('th')).map(th => th.innerText.trim()),
        rowCount: t.querySelectorAll('tbody tr').length,
        rect: { width: rect.width, height: rect.height },
        parentRect: parentRect ? { width: parentRect.width, height: parentRect.height } : null,
        isContained: parentRect ? rect.right <= parentRect.right + 2 : true
      };
    });

    return {
      title: document.title,
      buttons,
      tables,
      hasConfirmBtn: buttons.some(b => b.includes('Confirm plan & start')),
      bodySnippet: text.slice(0, 800)
    };
  })()`);
  console.log('Plan Page Info:\n', JSON.stringify(planInfo, null, 2));
  await cdp.captureScreenshot(getShotPaths('live_run_final_demo_plan_review'));

  console.log('\n--- TEST 2: Navigating to /demo/session (Active Session with GenUI Cards) ---');
  await cdp.navigate('http://localhost:3000/demo/session');
  await cdp.sleep(2500);

  const sessionInfo = await cdp.eval(`(() => {
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
    const tables = Array.from(document.querySelectorAll('table')).map(t => {
      const rect = t.getBoundingClientRect();
      const parentRect = t.parentElement ? t.parentElement.getBoundingClientRect() : null;
      const headers = Array.from(t.querySelectorAll('th')).map(th => th.innerText.trim());
      const rows = Array.from(t.querySelectorAll('tbody tr')).map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim()));
      return {
        headers,
        rows: rows.slice(0, 5),
        rect: { width: rect.width, height: rect.height },
        parentRect: parentRect ? { width: parentRect.width, height: parentRect.height } : null,
        isContained: parentRect ? rect.right <= parentRect.right + 2 : true,
        parentScroll: t.parentElement ? t.parentElement.scrollWidth > t.parentElement.clientWidth : false
      };
    });

    return {
      buttons,
      tables,
      bodySnippet: document.body.innerText.slice(0, 1000)
    };
  })()`);
  console.log('Session Info:\n', JSON.stringify(sessionInfo, null, 2));
  await cdp.captureScreenshot(getShotPaths('live_run_final_demo_session'));

  console.log('\n--- TEST 3: Navigating to /demo (All GenUI Card Previews & States) ---');
  await cdp.navigate('http://localhost:3000/demo');
  await cdp.sleep(2500);

  const demoInfo = await cdp.eval(`(() => {
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
    const tables = Array.from(document.querySelectorAll('table')).map(t => {
      const rect = t.getBoundingClientRect();
      const parentRect = t.parentElement ? t.parentElement.getBoundingClientRect() : null;
      return {
        headers: Array.from(t.querySelectorAll('th')).map(th => th.innerText.trim()),
        rowCount: t.querySelectorAll('tbody tr').length,
        rect: { width: rect.width, height: rect.height },
        parentRect: parentRect ? { width: parentRect.width, height: parentRect.height } : null,
        isContained: parentRect ? rect.right <= parentRect.right + 2 : true,
        parentScroll: t.parentElement ? t.parentElement.scrollWidth > t.parentElement.clientWidth : false
      };
    });

    const approvalGates = Array.from(document.querySelectorAll('[class*="border"]')).filter(el => /approval|approve|reject|target:/i.test(el.innerText)).map(el => el.innerText.slice(0, 200));

    return {
      buttons,
      tables,
      approvalGatesCount: approvalGates.length,
      sampleGate: approvalGates[0] || null
    };
  })()`);
  console.log('Demo Page Info:\n', JSON.stringify(demoInfo, null, 2));
  await cdp.captureScreenshot(getShotPaths('live_run_final_demo_all_cards'));

  // Test Approval Gate interaction on /demo: Click Edit, then Approve
  console.log('\n--- TEST 4: Testing Approval Gate Edit & Approve on /demo ---');
  const gateButtons = await cdp.eval(`(() => {
    const btns = Array.from(document.querySelectorAll('button')).filter(b => ['Edit', 'Approve', 'Reject'].includes(b.innerText.trim()));
    return btns.map(b => b.innerText.trim());
  })()`);
  console.log('Found Gate Buttons on /demo:', gateButtons);

  if (gateButtons.includes('Edit')) {
    console.log('Clicking "Edit"...');
    await cdp.eval(`(() => {
      const editBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Edit');
      if (editBtn) editBtn.click();
    })()`);
    await cdp.sleep(1200);
    await cdp.captureScreenshot(getShotPaths('live_run_final_demo_gate_edit_mode'));

    const editState = await cdp.eval(`(() => {
      const inputs = Array.from(document.querySelectorAll('input')).map(i => ({ value: i.value, placeholder: i.placeholder }));
      const btns = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
      return { inputs, btns };
    })()`);
    console.log('Edit Mode State:', editState);

    console.log('Clicking "Submit edit" or "Approve"...');
    await cdp.eval(`(() => {
      const submitEdit = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Submit edit');
      if (submitEdit) {
        submitEdit.click();
      } else {
        const approve = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Approve');
        if (approve) approve.click();
      }
    })()`);
    await cdp.sleep(2000);
    await cdp.captureScreenshot(getShotPaths('live_run_final_demo_gate_after_edit_submit'));
  }

  cdp.close();
}

testDemoPages();
