const client = require('../config/twilioConfig');

const sendMobileOTP = async (mobile, otp) => {
  await client.messages.create({
    body: `Your Mobile OTP code is ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `+91${mobile}` // Change if needed, depends on your country
  });
};

module.exports = sendMobileOTP;
