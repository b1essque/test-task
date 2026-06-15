const crypto = require('node:crypto');
/** @see tests/unit/crypto/hash.test.js */
function sha256(data) {
  return crypto.createHash('sha-256').update(String(data)).digest('hex');
}

function hashObject(obj) {
  return sha256(JSON.stringify(obj));
}

function meetsDifficulty(hash, difficulty) {
  return hash.startsWith('0'.repeat(Math.max(0, difficulty)));
}

module.exports = { sha256, hashObject, meetsDifficulty };
