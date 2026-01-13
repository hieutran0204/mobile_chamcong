const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function run() {
  try {
    console.log('--- ADMIN USERS MANAGEMENT TEST ---');

    const timestamp = Date.now();
    const adminUser = `admin_${timestamp}`;
    const ownerUser = `owner_${timestamp}`;
    const password = 'password123';

    // 1. Register new Admin for this test
    console.log(`1. Registering new Admin: ${adminUser}`);
    let adminToken;
    try {
        await axios.post(`${API_URL}/auth/register-admin`, {
            username: adminUser,
            password: password,
            name: 'Test Super Admin'
        });
        
        const login = await axios.post(`${API_URL}/auth/login`, {
            username: adminUser,
            password: password
        });
        adminToken = login.data.access_token;
        console.log('   -> Admin Registered and Logged in.');
    } catch (e) {
        console.error('   -> Admin setup failed:', JSON.stringify(e.response?.data || e.message));
        return;
    }

    const headers = { Authorization: `Bearer ${adminToken}` };

    // 2. Create New Owner
    const newOwner = {
        username: ownerUser,
        password: password,
        name: 'Test Owner',
        companyName: 'Test Company',
        email: 'test@owner.com'
    };
    
    console.log(`2. Creating Owner: ${newOwner.username}`);
    let createdId;
    try {
        const createRes = await axios.post(`${API_URL}/users`, newOwner, { headers });
        console.log('   -> Create Success:', createRes.data.username, createRes.data._id);
        createdId = createRes.data._id;
    } catch (e) {
        console.error('   -> Create Failed:', JSON.stringify(e.response?.data || e.message));
        return;
    }

    if (!createdId) return;

    // 3. List Owners
    console.log('3. Listing all Owners...');
    const listRes = await axios.get(`${API_URL}/users`, { headers });
    console.log(`   -> Found ${listRes.data.length} owners.`);
    const myOwner = listRes.data.find(u => u._id === createdId);
    if (myOwner) {
        console.log('   -> Verified newly created owner exists in list.');
    } else {
        console.error('   -> ERROR: Newly created owner NOT in list!');
    }

    // 4. Update Owner
    console.log('4. Updating Owner...');
    const updateRes = await axios.put(`${API_URL}/users/${createdId}`, {
        name: 'Updated Owner Name',
        companyName: 'Updated Company'
    }, { headers });
    console.log('   -> Update Success:', updateRes.data.name, updateRes.data.companyName);

    // 5. Delete Owner
    console.log('5. Deleting Owner...');
    await axios.delete(`${API_URL}/users/${createdId}`, { headers });
    console.log('   -> Delete Success.');

    // 6. Verify Delete
    console.log('6. Verifying Delete...');
    const listAgain = await axios.get(`${API_URL}/users`, { headers });
    const deleted = listAgain.data.find(u => u._id === createdId);
    if (!deleted) {
        console.log('   -> Owner is gone. Test PASSED.');
    } else {
        console.error('   -> Owner STILL exists. Test FAILED.');
    }

  } catch (err) {
    console.error('TEST FAILED:', err.response?.data || err.message);
  }
}

run();
