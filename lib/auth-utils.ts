import bcrypt from 'bcryptjs';

export const AUTH_CONFIG = {
  // 10 rounds ≈ 65ms, 12 rounds ≈ 250ms, 14 rounds > 1s; 
  // 12 is enough with all the other security layers we'll have without impacting performance too much
  SALT_ROUNDS: 12,

  // Pepper - old-fashioned but adds an extra layer of security and control
  PEPPER: process.env.PASSWORD_PEPPER || 'default-pepper-change-in-production',
  
  // Claim token configuration
  CLAIM_TOKEN: {
    LENGTH: 32, // overkill but looks good in URLs 
    EXPIRY_DAYS: 1,
  },
  
  TEMP_SESSION: {
    DURATION_HOURS: 1, // for "continue without claiming"
  },
  
  PASSWORD: {
    MIN_LENGTH: 8, 
  },
} as const;


export const hashPassword = async (password: string): Promise<string> => {
  const pepperedPassword = password + AUTH_CONFIG.PEPPER;
  return bcrypt.hash(pepperedPassword, AUTH_CONFIG.SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const pepperedPassword = password + AUTH_CONFIG.PEPPER;
  return bcrypt.compare(pepperedPassword, hash);
};

export const generateClaimTokenExpiry = (): Date => {
  return new Date(Date.now() + AUTH_CONFIG.CLAIM_TOKEN.EXPIRY_DAYS * 24 * 60 * 60 * 1000);
};

export const generateTempSessionExpiry = (): Date => {
  return new Date(Date.now() + AUTH_CONFIG.TEMP_SESSION.DURATION_HOURS * 60 * 60 * 1000);
};
