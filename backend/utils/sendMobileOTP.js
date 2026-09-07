const { MiniMoth } = require('@minimoth/sdk-node');

const sendMobileOTP = async (mobile, otp) => {
    // 1. Initialize with your API Key
    const mm = new MiniMoth(process.env.MINIMOTH_API_KEY);

    try {
        // 2. Clean the number (Ensure no '+' sign, just 91xxxxxxxxxx)
        const cleanMobile = mobile.startsWith('+') ? mobile.substring(1) : mobile;

        // 3. Send using the official SDK
        const response = await mm.sendOtp({
            mobile: cleanMobile,
            otp: otp,
            brand: "Rentist" // This appears in the WhatsApp/SMS message
        });

        // 4. MiniMoth returns a success boolean
        if (response.success) {
            console.log(`✅ OTP sent successfully to ${cleanMobile}`);
            return true;
        } else {
            console.error('❌ MiniMoth Delivery Failed:', response.message);
            return false;
        }
    } catch (error) {
        console.error('❌ MiniMoth SDK Error:', error.message);
        return false;
    }
};

module.exports = sendMobileOTP;