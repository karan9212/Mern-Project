export const EMPLOYEE_IDLE_TIMEOUT_MS = 8 * 60 * 60 * 1000;

const EMPLOYEE_ACTIVITY_KEY = 'employeeLastActivityAt';

export const getEmployeeLastActivity = () => {
  const value = Number(localStorage.getItem(EMPLOYEE_ACTIVITY_KEY));
  return Number.isNaN(value) ? 0 : value;
};

export const refreshEmployeeActivity = () => {
  if (localStorage.getItem('loginAs') !== 'employee') return 0;

  const now = Date.now();
  localStorage.setItem(EMPLOYEE_ACTIVITY_KEY, String(now));
  return now;
};

export const clearEmployeeActivity = () => {
  localStorage.removeItem(EMPLOYEE_ACTIVITY_KEY);
};

export const getEmployeeIdleRemainingMs = (referenceTime = Date.now()) => {
  if (localStorage.getItem('loginAs') !== 'employee') return 0;

  const lastActivity = getEmployeeLastActivity();
  if (!lastActivity) return 0;

  return Math.max(0, EMPLOYEE_IDLE_TIMEOUT_MS - (referenceTime - lastActivity));
};

export const formatCountdown = (remainingMs) => {
  const totalSecondsLeft = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = String(Math.floor(totalSecondsLeft / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSecondsLeft % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSecondsLeft % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export const hasEmployeeActivityExpired = () => {
  if (localStorage.getItem('loginAs') !== 'employee') return false;

  const lastActivity = getEmployeeLastActivity();
  if (!lastActivity) return true;

  return Date.now() - lastActivity > EMPLOYEE_IDLE_TIMEOUT_MS;
};
