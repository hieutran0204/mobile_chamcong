const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    otp: { type: String, select: true }, // Force select
    isTwoFactorEnabled: Boolean
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to Mongo');
    
    // Find all users
    const users = await User.find({});
    console.log('Found users:', users.length);
    users.forEach(u => {
        console.log(`- Username: '${u.username}' | Email: ${u.email} | 2FA: ${u.isTwoFactorEnabled} | OTP: ${u.otp}`);
    });

    await mongoose.disconnect();
}

run().catch(console.error);
