const { sha256, hashObject, meetsDifficulty } = require('../../../src/crypto/hash');
describe('hash', () => {
  describe('sha256', () => {
    test('returns 64-char hex digest', () => {
      const hash = sha256('hello');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    test('is deterministic', () => {
      expect(sha256('blockchain')).toBe(sha256('blockchain'));
    });

    test('differs for different inputs', () => {
      expect(sha256('a')).not.toBe(sha256('b'));
    });
  });

  describe('hashObject', () => {
    test('serializes objects consistently', () => {
      const a = hashObject({ x: 1, y: 2 });
      const b = hashObject({ x: 1, y: 2 });
      expect(a).toBe(b);
    });

    test('key order affects hash', () => {
      expect(hashObject({ a: 1, b: 2 })).not.toBe(hashObject({ b: 2, a: 1 }));
    });
  });

  describe('meetsDifficulty', () => {
    test('accepts hash with leading zeros', () => {
      expect(meetsDifficulty('00abc', 2)).toBe(true);
    });

    test('rejects hash without enough leading zeros', () => {
      expect(meetsDifficulty('0abc', 2)).toBe(false);
      expect(meetsDifficulty('abc', 1)).toBe(false);
    });

    test('difficulty zero accepts any hash', () => {
      expect(meetsDifficulty('deadbeef', 0)).toBe(true);
    });
  });
});
