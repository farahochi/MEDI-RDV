const crypto = require('crypto');

function hashPassword(password, saltHex = crypto.randomBytes(16).toString('hex')) {
  const hashed = crypto.scryptSync(password, saltHex, 64).toString('hex');
  return `${saltHex}:${hashed}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }

  const [saltHex, hashHex] = storedHash.split(':');
  const candidate = crypto.scryptSync(password, saltHex, 64);

  return crypto.timingSafeEqual(candidate, Buffer.from(hashHex, 'hex'));
}

module.exports = {
  hashPassword,
  verifyPassword
};
