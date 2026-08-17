async function testPromptAPI() {
  const backendUrl = 'https://athena-engine-2yv5.onrender.com';
  console.log('Sending prompt test to Backend Engine:', backendUrl);

  const payload = {
    clientId: 'accra-biz-001',
    prompt: 'Please record our July 15, 2026 semi-monthly payroll run for Forge Studios Inc.',
    mode: 'default',
  };

  try {
    const res = await fetch(`${backendUrl}/api/activities/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Status code:', res.status);
    const data = await res.json();
    console.log('Response JSON:\n', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testPromptAPI();
