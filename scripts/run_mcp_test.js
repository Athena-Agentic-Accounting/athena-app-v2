const { spawn } = require('child_process');

async function testMCP() {
  const mcp = spawn('npx', ['chrome-devtools-mcp@latest', '--autoConnect'], {
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let buffer = '';

  mcp.stdout.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep last incomplete line

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line.trim());
        console.log('MCP JSON Message received:', json);
      } catch (e) {
        console.log('MCP Output line:', line);
      }
    }
  });

  mcp.stderr.on('data', (chunk) => {
    console.log('[MCP STDERR]:', chunk.toString().trim());
  });

  // Send MCP Initialize request
  const initMsg = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'AthenaTestRunner', version: '1.0.0' },
    },
  };

  setTimeout(() => {
    console.log('Sending Initialize Request to chrome-devtools-mcp...');
    mcp.stdin.write(JSON.stringify(initMsg) + '\n');
  }, 1500);

  setTimeout(() => {
    console.log('Sending tools/list Request to chrome-devtools-mcp...');
    mcp.stdin.write(
      JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }) + '\n'
    );
  }, 3000);

  setTimeout(() => {
    console.log('Closing MCP process...');
    mcp.kill();
  }, 7000);
}

testMCP();
