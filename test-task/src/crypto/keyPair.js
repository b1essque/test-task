const crypto = require('node:crypto');
const { sha256 } = require('./hash');
/** @see tests/unit/crypto/keyPair.test.js */
function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'secp256k1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKey, privateKey };
}

function signData(privateKey, data) {
  return crypto.sign('SHA256', Buffer.from(String(data)), privateKey).toString('hex');
}

function verifySignature(publicKey, data, signature) {
  try {
    return crypto.verify('SHA256', Buffer.from(String(data)), publicKey, Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

function publicKeyFingerprint(publicKey) {
  return sha256(publicKey).slice(0, 16);
}

module.exports = { generateKeyPair, signData, verifySignature, publicKeyFingerprint };
