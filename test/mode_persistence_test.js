const axios = require('axios');

const API = 'http://localhost:3000/api';

async function test() {
  try {
    console.log('--- TEST: Mode Persistence ---');

    // 1. Login Owner
    console.log('1. Logging in as Owner');
    // Ensure owner exists or register (using register-owner just in case)
    const ownerName = 'owner_persist_' + Date.now();
    await axios.post(`${API}/auth/register-owner`, { username: ownerName, password: 'x' })
        .catch(() => {}); // ignore if exists
    
    const loginRes = await axios.post(`${API}/auth/login`, { username: ownerName, password: 'x' });
    const token = loginRes.data.access_token;

    // 2. Setup: Create 2 Employees
    console.log('2. Creating Employees');
    const emp1 = await axios.post(`${API}/employees`, { name: 'Emp One', fingerId: 101 }, { headers: { Authorization: `Bearer ${token}` } });
    const emp2 = await axios.post(`${API}/employees`, { name: 'Emp Two', fingerId: 102 }, { headers: { Authorization: `Bearer ${token}` } });

    // 3. Set CHECK_IN Mode
    console.log('3. Setting Mode: CHECK_IN');
    // NOTE: Using new URL-based endpoint
    await axios.post(`${API}/attendance/mode/check-in`, {}, { headers: { Authorization: `Bearer ${token}` } });

    // 4. Checking Mode
    const modeRes = await axios.get(`${API}/attendance/mode`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('   Current Mode:', modeRes.data.mode); // Should be CHECK_IN

    // 5. Simulate WebSocket Scans (via internal manual test logic or by hitting a "scan" endpoint if we had one?)
    // Actually, we can't easily Simulate WS scan here without a WS client.
    // Let's us a simple WS script wrapper or just rely on the Unit Test logic?
    // User wants to see "luồng", so let's use a WS client to "scan".
    
    const WebSocket = require('ws');
    const ws = new WebSocket('ws://localhost:3000/ws');
    
    await new Promise(resolve => ws.on('open', resolve));
    console.log('   WS Connected');

    // Helper to send scan
    const sendScan = (id) => {
        ws.send(JSON.stringify({ event: 'scan', data: { fingerId: id } }));
    };

    // Listen for responses
    ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.event === 'attendance') {
            const att = msg.data;
            console.log(`   [WS] Attendance Result: ${att.employeeName} -> ${att.type} (${att.message || 'Success'})`);
        }
    });

    console.log('4. Scanning Emp 1 (Should Check-In)');
    sendScan(101);
    await new Promise(r => setTimeout(r, 1000));

    console.log('5. Scanning Emp 2 (Should ALSO Check-In)');
    sendScan(102);
    await new Promise(r => setTimeout(r, 1000));

    // 6. Set CHECK_OUT Mode
    console.log('6. Setting Mode: CHECK_OUT');
    await axios.post(`${API}/attendance/mode/check-out`, {}, { headers: { Authorization: `Bearer ${token}` } });

    console.log('7. Scanning Emp 1 (Should Check-Out)');
    sendScan(101);
    await new Promise(r => setTimeout(r, 1000));

    ws.close();
    console.log('--- TEST FINISHED ---');

  } catch (error) {
    console.error('TEST ERROR:', error.message);
    if (error.response) console.error(error.response.data);
  }
}

test();
