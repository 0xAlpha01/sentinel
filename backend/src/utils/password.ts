import argon2 from 'argon2';

const options = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };

export const hashPassword = (password: string) => argon2.hash(password, options);
export const verifyPassword = (hash: string, password: string) => argon2.verify(hash, password);

// Used when the email doesn't exist, so response time doesn't reveal which emails are registered.
let dummyHash: string | undefined;
export async function dummyVerify(password: string) {
  dummyHash ??= await argon2.hash('dummy-password-for-timing', options);
  await argon2.verify(dummyHash, password).catch(() => false);
}
