const { Block, createGenesisBlock } = require('../../../src/core/Block');
const { Transaction } = require('../../../src/core/Transaction');
describe('Block', () => {
  const coinbase = Transaction.coinbase('miner-addr', 100);

  test('calculateHash is deterministic', () => {
    const block = new Block(1, 1000, [coinbase], 'prev', 0, 1);
    expect(block.calculateHash()).toBe(block.hash);
  });

  test('mine finds hash meeting difficulty', () => {
    const block = new Block(1, Date.now(), [coinbase], '00', 0, 2);
    block.mine();
    expect(block.hash.startsWith('00')).toBe(true);
  });

  test('isValid rejects tampered merkle root', () => {
    const block = new Block(1, Date.now(), [coinbase], '00', 0, 1);
    block.mine();
    block.merkleRoot = 'tampered';
    expect(block.isValid(null)).toBe(false);
  });

  test('isValid checks previous hash link', () => {
    const genesis = createGenesisBlock(coinbase, 1);
    genesis.mine();
    const next = new Block(1, Date.now(), [coinbase], genesis.hash, 0, 1);
    next.mine();
    next.previousHash = 'wrong';
    expect(next.isValid(genesis)).toBe(false);
  });

  test('toJSON and fromJSON round-trip', () => {
    const block = new Block(2, 12345, [coinbase], 'abc', 7, 1);
    block.mine();
    const restored = Block.fromJSON(block.toJSON());
    expect(restored.hash).toBe(block.hash);
    expect(restored.transactions[0].id).toBe(coinbase.id);
  });
});
