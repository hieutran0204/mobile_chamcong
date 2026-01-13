const axios = require('axios');
const API_URL = 'http://localhost:3000/api';

async function run() {
    const username = `admin_test_${Date.now()}`;
    console.log(`Attempting to register: ${username}`);
    try {
        const res = await axios.post(`${API_URL}/auth/register-admin`, {
            username: username,
            password: 'password123',
            name: 'Debug Admin'
        });
        console.log('Success:', res.status, res.data);
    } catch (e) {
        if (e.response) {
            console.log('Error status:', e.response.status);
            console.log('Error data:', JSON.stringify(e.response.data));
        } else {
            console.log('Error object:', e.message);
        }
    }
}
run();
