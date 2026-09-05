declare module 'speakeasy' {
  interface SecretOptions {
    name: string;
    issuer: string;
    length?: number;
  }

  interface Secret {
    base32: string;
    otpauth_url?: string;
  }

  interface VerifyOptions {
    secret: string;
    encoding: 'base32' | 'ascii' | 'hex';
    token: string;
    window?: number;
  }

  export function generateSecret(options: SecretOptions): Secret;

  export const totp: {
    verify(options: VerifyOptions): boolean;
  };
}
