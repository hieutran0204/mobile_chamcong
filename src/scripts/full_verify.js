const mongoose = require('mongoose');
const axios = require('axios');

const MONGO_URI = 'mongodb+srv://tranminhhieu620:HieuDepZai@chamcong.knp7cdc.mongodb.net/?appName=ChamCong';
const API_URL = 'http://127.0.0.1:3000/api';

const UserSchema = new mongoose.Schema({
  username: String,
  name: String,
  role: String,
  email: String,
  hourly_rate: Number,
  fingerId: Number
});

const AttendanceSchema = new mongoose.Schema({
  employeeId: mongoose.Schema.Types.ObjectId,
  date: String,
  checkIn: Date,
  checkOut: Date,
  work_hours: Number,
  status: String
});

const PayrollSchema = new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId,
  month: Number,
  year: Number,
  total_hours: Number,
  total_salary: Number,
  status: String
});

async function run() {
  let connection;
  try {
    console.log('1. Connecting to MongoDB...');
    connection = await mongoose.connect(MONGO_URI);
    
    const User = mongoose.model('User', UserSchema);
    // Be careful with model names, usually pluralized by Mongoose
    // In NestJS schema, @Schema() generates collection name. usually 'users', 'attendances', 'payrolls'
    const Attendance = mongoose.model('Attendance', AttendanceSchema);
    const Payroll = mongoose.model('Payroll', PayrollSchema);

    // 2. Create Test User
    const email = `verify_${Date.now()}@example.com`;
    const user = await User.create({
      username: email,
      name: 'Verify User',
      role: 'employee',
      email: email,
      hourly_rate: 100000, 
      fingerId: 999
    });
    console.log(`2. Created User: ${user._id} with Rate: ${user.hourly_rate}`);

    // 3. Create Test Attendance
    // Create for Dec 2025
    await Attendance.create({
       employeeId: user._id,
       date: '2025-12-01',
       checkIn: new Date('2025-12-01T08:00:00Z'),
       checkOut: new Date('2025-12-01T17:00:00Z'),
       work_hours: 9,
       status: 'present'
    });
    // Create another
    await Attendance.create({
       employeeId: user._id,
       date: '2025-12-02',
       checkIn: new Date('2025-12-02T08:00:00Z'),
       checkOut: new Date('2025-12-02T12:00:00Z'),
       work_hours: 4,
       status: 'present'
    });
    console.log('3. Created 2 Attendance records (Total 13 hours)');

    // 4. Call API
    console.log('4. Calling Calculate API...');
    const res = await axios.post(`${API_URL}/salary/calculate`, {
      month: 12,
      year: 2025
    });
    
    console.log('API Response Status:', res.status);
    console.log('API Response Data:', JSON.stringify(res.data, null, 2));

    // 5. Verify Payroll Record
    const payroll = await Payroll.findOne({ user: user._id, month: 12, year: 2025 });
    if (payroll) {
        console.log('5. VERIFICATION SUCCESS: Payroll record found!');
        console.log(`   Total Hours: ${payroll.total_hours} (Expected: 13)`);
        console.log(`   Total Salary: ${payroll.total_salary} (Expected: 1300000)`);
        
        if (payroll.total_hours === 13 && payroll.total_salary === 1300000) {
            console.log('   >>> ALL CHECKS PASSED <<<');
        } else {
            console.log('   >>> DATA MISMATCH <<<');
        }
    } else {
        console.log('5. VERIFICATION FAILED: No payroll record found in DB.');
    }
    
    // Cleanup
    // await User.deleteOne({ _id: user._id });
    // await Attendance.deleteMany({ employeeId: user._id });
    // await Payroll.deleteOne({ _id: payroll?._id });

  } catch (err) {
    console.error('ERROR:', err.message);
    if (err.response) {
        console.error('API Error Data:', err.response.data);
    }
  } finally {
    if (connection) await mongoose.disconnect();
  }
}

run();
