// const axios = require('axios');
// const mongoose = require('mongoose');

// const API_URL = 'http://127.0.0.1:3000/api';
// // You can set these env vars when running the script:
// // set MAIL_USER=... && set MAIL_PASS=... && node src/scripts/test_email_flow.js

// async function run() {
//   try {
//     console.log('1. Fetching a Payroll record to test...');
//     // We need a payroll ID. Let's calculate for 12/2025 again to get one.
//     const resCalc = await axios.post(`${API_URL}/salary/calculate`, {
//       month: 12,
//       year: 2025
//     });
    
//     const payrolls = resCalc.data;
//     if (!payrolls || payrolls.length === 0) {
//         console.error('No payroll records found. Please ensure you have employees and attendance data.');
//         return;
//     }

//     const targetPayroll = payrolls[0];
//     const payrollId = targetPayroll._id;
//     const employeeName = targetPayroll.user.name; // Populated
    
//     console.log(`   Target Payroll ID: ${payrollId} (Employee: ${employeeName})`);

//     console.log('2. Sending Payslip Email...');
//     console.log('   Note: This will fail if MAIL_USER and MAIL_PASS are not set in the server environment.');
    
//     try {
//         const resSend = await axios.post(`${API_URL}/salary/send-payslip/${payrollId}`);
//         console.log('   Response:', resSend.data);
//         if (resSend.data.success) {
//             console.log('   SUCCESS: Email sent successfully!');
//         } else {
//             console.log('   FAILED:', resSend.data.message);
//         }
//     } catch (apiErr) {
//         console.error('   API Error:', apiErr.response ? apiErr.response.data : apiErr.message);
//     }

//   } catch (err) {
//     console.error('ERROR:', err.message);
//   }
// }

// run();
