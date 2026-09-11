const MINIMOTH_BASE_URL = 'https://api.minimoth.dev/v1';

const normalizeMiniMothPhone = (mobile) => {
  const digits = String(mobile || '').replace(/\D/g, '');

  if (/^[6-9]\d{9}$/.test(digits)) {
    return `+91${digits}`;
  }

  if (/^91[6-9]\d{9}$/.test(digits)) {
    return `+${digits}`;
  }

  return '';
};

const getMiniMothApiKey = () => String(process.env.MINIMOTH_API_KEY || '').trim();

const parseMiniMothResponse = async (response) => {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: text };
  }
};

const sendMobileOTP = async (mobile) => {
  const apiKey = getMiniMothApiKey();
  const phone = normalizeMiniMothPhone(mobile);

  if (!apiKey) {
    const error = new Error('MINIMOTH_API_KEY is not configured on the server');
    error.statusCode = 503;
    throw error;
  }

  if (!phone) {
    const error = new Error('MiniMoth accepts only valid Indian mobile numbers');
    error.statusCode = 400;
    throw error;
  }

  const response = await fetch(`${MINIMOTH_BASE_URL}/otp/send`, {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone })
  });

  const payload = await parseMiniMothResponse(response);
  if (!response.ok) {
    const error = new Error(payload?.error?.message || payload?.error || payload?.message || 'MiniMoth failed to send OTP');
    error.statusCode = response.status || 500;
    throw error;
  }

  return {
    success: true,
    phone,
    otpId: payload.otp_id || payload.otpId || ''
  };
};

const verifyMobileOTP = async (mobile, otp) => {
  const apiKey = getMiniMothApiKey();
  const phone = normalizeMiniMothPhone(mobile);
  const code = String(otp || '').trim();

  if (!apiKey) {
    const error = new Error('MINIMOTH_API_KEY is not configured on the server');
    error.statusCode = 503;
    throw error;
  }

  if (!phone || !/^\d{6}$/.test(code)) {
    return {
      valid: false,
      message: 'Valid phone number and 6-digit OTP are required'
    };
  }

  const response = await fetch(`${MINIMOTH_BASE_URL}/otp/verify`, {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone, code })
  });

  const payload = await parseMiniMothResponse(response);
  const valid = Boolean(payload.valid || payload.access_token || payload.accessToken);

  return {
    valid: response.ok && valid,
    message: payload?.error?.message || payload?.error || payload?.message || payload?.code || '',
    accessToken: payload.access_token || payload.accessToken || '',
    refreshToken: payload.refresh_token || payload.refreshToken || '',
    sessionId: payload.session_id || payload.sessionId || ''
  };
};

module.exports = {
  sendMobileOTP,
  verifyMobileOTP,
  normalizeMiniMothPhone
};
