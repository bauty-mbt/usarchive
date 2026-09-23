import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// ----- Password / passcode hashing -----
// bcrypt con cost factor 12: balance razonable entre seguridad y latencia.
const SALT_ROUNDS = 12;

export async function hashSecret(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifySecret(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ----- JWT (access de vida corta + refresh persistido/rotable) -----
export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: jwt.SignOptions = { expiresIn: env.accessTokenTtl as jwt.SignOptions["expiresIn"] };
  return jwt.sign(payload, env.jwtAccessSecret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;
}

export function signRefreshToken(userId: string): string {
  const options: jwt.SignOptions = {
    expiresIn: `${env.refreshTokenTtlDays}d` as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign({ sub: userId, type: "refresh" }, env.jwtRefreshSecret, options);
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, env.jwtRefreshSecret) as { sub: string };
}
