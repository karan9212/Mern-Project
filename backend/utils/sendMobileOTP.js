const client = require('../config/twilioConfig');

const sendMobileOTP = async (mobile, otp) => {
  try {
    debugger;
    const { TWILIO_SID, TWILIO_AUTH_TOKEN } = process.env;

    if (!TWILIO_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('❌ Missing Twilio credentials (TWILIO_SID, TWILIO_AUTH_TOKEN) in .env');
    }

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
