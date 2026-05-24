import bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  // bcrypt adds a unique salt automatically, so the same password hashes differently each time.
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  passwordHash: string
): Promise<boolean> => {
  // Always compare with bcrypt instead of checking plain text passwords.
  return bcrypt.compare(password, passwordHash);
};
