const client = require('../config/twilioConfig');
const dotenv = require('dotenv');

dotenv.config();

const sendMobileOTP = async (mobile, otp) => {
  try {
    await client.messages.create({
      body: `Your OTP code is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,  // must be verified number
      to: `+91${mobile}`,                     // always add country code
    });
    console.log(`✅ OTP sent to ${mobile}: ${otp}`);
  } catch (error) {
    console.error('❌ Twilio error:', error.message);
    throw error;
  }
};

module.exports = sendMobileOTP;
