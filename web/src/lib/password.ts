import bcryptjs from "bcryptjs";

const SALT_ROUNDS = 12;

export function hashPassword(password: string) {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcryptjs.compare(password, passwordHash);
}
