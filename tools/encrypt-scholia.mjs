#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { createCipheriv, pbkdf2Sync, randomBytes } from 'node:crypto';

const [, , inputPath, outputPath = 'data/scholia.enc.json'] = process.argv;
const password = process.env.SCHOLIA_PASSWORD;
if (!inputPath || !password) {
  console.error('Usage: SCHOLIA_PASSWORD=... node tools/encrypt-scholia.mjs <plain.json> [output.json]');
  process.exit(1);
}
const plaintext = await readFile(inputPath);
JSON.parse(plaintext.toString('utf8'));
const salt = randomBytes(16);
const iv = randomBytes(12);
const iterations = 310000;
const key = pbkdf2Sync(Buffer.from(password, 'utf8'), salt, iterations, 32, 'sha256');
const cipher = createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
const tag = cipher.getAuthTag();
const payload = {
  format:'vesperion-scholia-encrypted',
  version:1,
  kdf:{ name:'PBKDF2', hash:'SHA-256', iterations, salt:salt.toString('base64') },
  cipher:{ name:'AES-GCM', iv:iv.toString('base64'), tagLength:128 },
  ciphertext:Buffer.concat([encrypted, tag]).toString('base64')
};
await writeFile(outputPath, JSON.stringify(payload, null, 2) + '\n');
console.log(`Encrypted scholia written to ${outputPath}`);
