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

async function run() {
  const client = new DevToolsClient();
  await sleep(1500);
  await client.send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'TabSelector', version: '1.0.0' },
  });

  try {
    console.log('--- Listing open Chrome pages ---');
    const pagesRes = await client.callTool('list_pages', {});
    console.log('Open Pages:\n', pagesRes.content?.[0]?.text);

    // Look for localhost:3000 tab or navigate
    const pagesText = pagesRes.content?.[0]?.text || '';
    const match = pagesText.match(/(\d+):\s*Athena\s*\((http:\/\/localhost:3000[^\)]*)\)/);

    if (match) {
      const pageNum = parseInt(match[1], 10);
      console.log(`Selecting existing Athena tab #${pageNum}...`);
      await client.callTool('select_page', { pageIndex: pageNum });
    } else {
      console.log('Navigating current tab to http://localhost:3000/home...');
      await client.callTool('navigate_page', { url: 'http://localhost:3000/home' });
    }

    await sleep(2000);

    const check = await client.callTool('evaluate_script', {
      function: `() => ({ url: window.location.href, title: document.title, hasTextarea: !!document.querySelector('textarea') })`,
    });
    console.log('Active Tab Check:\n', check.content?.[0]?.text);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.close();
  }
}

run();
