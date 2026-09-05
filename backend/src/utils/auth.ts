import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'default-refresh';
const REFRESH_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRY }
  );
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export async function generateTwoFactorSecret(email: string): Promise<{ secret: string; qrCode: string }> {
  const secret = speakeasy.generateSecret({
    name: `BEETRONIC OS (${email})`,
    issuer: 'BEETRONIC OS',
    length: 32,
  });

  const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');

  return {
    secret: secret.base32,
    qrCode,
  };
}

export function verifyTwoFactorToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: parseInt(process.env.TOTP_WINDOW || '2'),
  });
}

export function generateRandomToken(length: number = 32): string {
  return require('crypto').randomBytes(length).toString('hex');
}
