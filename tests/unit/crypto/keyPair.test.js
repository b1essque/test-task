const {
  generateKeyPair,
  signData,
  verifySignature,
  publicKeyFingerprint,
} = require('../../../src/crypto/keyPair');
describe('keyPair', () => {
  test('generateKeyPair returns PEM keys', () => {
    const { publicKey, privateKey } = generateKeyPair();
    expect(publicKey).toContain('BEGIN PUBLIC KEY');
    expect(privateKey).toContain('BEGIN PRIVATE KEY');
  });

  test('sign and verify round-trip', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const payload = 'transaction-payload';
    const sig = signData(privateKey, payload);
    expect(verifySignature(publicKey, payload, sig)).toBe(true);
  });

  test('verify fails with wrong payload', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const sig = signData(privateKey, 'original');
    expect(verifySignature(publicKey, 'tampered', sig)).toBe(false);
  });

  test('verify fails with wrong public key', () => {
    const a = generateKeyPair();
    const b = generateKeyPair();
    const sig = signData(a.privateKey, 'data');
    expect(verifySignature(b.publicKey, 'data', sig)).toBe(false);
  });

  test('publicKeyFingerprint is stable 16-char hex', () => {
    const { publicKey } = generateKeyPair();
    const fp = publicKeyFingerprint(publicKey);
    expect(fp).toHaveLength(16);
    expect(publicKeyFingerprint(publicKey)).toBe(fp);
  });
});
