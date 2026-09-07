import { MiniMoth } from '@minimoth/sdk-node'

const mm = new MiniMoth({
  apiKey: process.env.MINIMOTH_API_KEY,  // mm_live_...
})

// 1. Send OTP — delivered via WhatsApp first, falls back to SMS automatically
const { otpId } = await mm.otp.send({ phone: '+919876543210' })

// 2. Verify the code — never throws, always returns a result
const result = await mm.otp.verify({ phone: '+919876543210', otp: '123456' })
if (!result.valid) {
  // result.code: 'INVALID_OTP' | 'OTP_NOT_FOUND' | 'VERIFY_RATE_LIMITED' | ...
} else {
  // Phone is verified — result.accessToken, result.refreshToken, result.sessionId
}