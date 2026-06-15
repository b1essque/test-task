const { Block } = require('../../../src/core/Block');
const { Transaction } = require('../../../src/core/Transaction');
const { meetsDifficulty } = require('../../../src/crypto/hash');
describe('Block proof of work', () => {
  test('nonce increments during mining', () => {
    const tx = Transaction.coinbase('m', 10);
    const block = new Block(1, Date.now(), [tx], 'prev', 0, 3);
    const startNonce = block.nonce;
    block.mine();
    expect(block.nonce).toBeGreaterThan(startNonce);
    expect(meetsDifficulty(block.hash, 3)).toBe(true);
  });

  test('higher difficulty takes more iterations', () => {
    const tx = Transaction.coinbase('m', 1);
    const easy = new Block(1, Date.now(), [tx], 'p', 0, 1);
    easy.mine();
    const hard = new Block(2, Date.now(), [tx], easy.hash, 0, 3);
    hard.mine();
    expect(hard.nonce).toBeGreaterThan(easy.nonce);
  });
});
