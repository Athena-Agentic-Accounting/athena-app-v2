const fs = require('fs');
const path = require('path');

class ChromeCDP {
  constructor() {
    this.nextId = 1;
    this.callbacks = new Map();
    this.sessionId = null;
    this.ws = null;
    this.networkErrors = [];
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
    if (!fs.existsSync(portFile)) {
      throw new Error(`DevToolsActivePort not found at ${portFile}`);
    }
    const [port, wsPath] = fs.readFileSync(portFile, 'utf8').trim().split('\n');
    const browserWsUrl = `ws://127.0.0.1:${port.trim()}${wsPath.trim()}`;
    console.log(`[CDP] Connecting to Chrome Browser at ${browserWsUrl}`);

    this.ws = new WebSocket(browserWsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = (err) => reject(new Error('WebSocket error: ' + JSON.stringify(err)));
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
          if (status >= 400) {
            this.networkErrors.push({ url, status, statusText: msg.params?.response?.statusText });
          }
        } else if (msg.method === 'Runtime.consoleAPICalled') {
          const type = msg.params?.type;
          const text = msg.params?.args?.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
          this.consoleLogs.push({ type, text });
        }
      } catch (e) {
        console.error('[CDP] Message parse error:', e);
      }
    };

    // Get list of targets
    const targetsRes = await this.send('Target.getTargets');
    const targets = targetsRes.targetInfos || [];
    console.log(`[CDP] Found ${targets.length} targets:`);
    targets.forEach((t, i) => console.log(`  [${i}] ${t.type}: "${t.title}" (${t.url})`));

    // Find tab for localhost:3000 or any page
    let pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost:3000'));
    if (!pageTarget) {
      pageTarget = targets.find(t => t.type === 'page');
    }

    if (!pageTarget) {
      // Create new target
      const created = await this.send('Target.createTarget', { url: 'http://localhost:3000/home' });
      pageTarget = { targetId: created.targetId };
    }

    console.log(`[CDP] Attaching to target ${pageTarget.targetId}...`);
    const attachRes = await this.send('Target.attachToTarget', {
      targetId: pageTarget.targetId,
      flatten: true,
    });
    this.sessionId = attachRes.sessionId;

    // Enable domains
    await this.sendSession('Page.enable');
    await this.sendSession('Runtime.enable');
    await this.sendSession('DOM.enable');
    await this.sendSession('Network.enable');
    await this.sendSession('Log.enable');

    console.log('[CDP] Attached & enabled domains successfully!');
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

  async captureScreenshot(filePath) {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    const res = await this.sendSession('Page.captureScreenshot', { format: 'png', fromSurface: true });
    if (res.data) {
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
      console.log(`[CDP] Screenshot saved -> ${filePath}`);
    }
  }

  async sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function testConnection() {
  const cdp = new ChromeCDP();
  try {
    await cdp.init();
    const info = await cdp.eval('({ title: document.title, url: window.location.href, text: document.body.innerText.slice(0, 200) })');
    console.log('Current Page Info:', info);
  } catch (err) {
    console.error('Test connection error:', err);
  } finally {
    cdp.close();
  }
}

testConnection();
