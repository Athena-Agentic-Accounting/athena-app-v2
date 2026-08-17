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

async function inspectCurrentActivity() {
  const cdp = new ChromeCDP();
  await cdp.init();

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

  const info = await cdp.eval(`(() => {
    const allButtons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
    const tables = Array.from(document.querySelectorAll('table')).map(t => ({
      headers: Array.from(t.querySelectorAll('th')).map(th => th.innerText.trim()),
      rows: Array.from(t.querySelectorAll('tbody tr')).map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim()))
    }));
    const cards = Array.from(document.querySelectorAll('[class*="rounded"]')).map(el => el.innerText.slice(0, 100)).filter(t => t.length > 20);

    return {
      url: window.location.href,
      title: document.title,
      buttons: allButtons,
      tables,
      bodyExcerpt: document.body.innerText.slice(0, 1500)
    };
  })()`);

  console.log('Activity Inspection Info:\n', JSON.stringify(info, null, 2));
  await cdp.captureScreenshot(getShotPaths('live_run_activity_inspected'));

  cdp.close();
}

inspectCurrentActivity();
