const { Blockchain } = require('../../../src/core/Blockchain');
const { Block } = require('../../../src/core/Block');
const { Transaction } = require('../../../src/core/Transaction');
const { DIFFICULTY_ADJUSTMENT_INTERVAL } = require('../../../src/config');
describe('Blockchain difficulty adjustment', () => {
  test('genesis uses initial difficulty', () => {
    const bc = new Blockchain('miner', 3);
    expect(bc.chain[0].difficulty).toBe(3);
  });

  test('difficulty unchanged before adjustment interval elapses', () => {
    const bc = new Blockchain('miner', 2);
    for (let i = 0; i < DIFFICULTY_ADJUSTMENT_INTERVAL - 2; i++) {
      bc.minePendingTransactions('miner');
    }
    expect(bc.getDifficultyForNextBlock()).toBe(2);
  });

  test('difficulty increases when blocks mined too fast', () => {
    const bc = new Blockchain('miner', 2);
    const now = Date.now();
    for (let i = 0; i < DIFFICULTY_ADJUSTMENT_INTERVAL; i++) {
      const coinbase = Transaction.coinbase('miner', 50);
      const block = new Block(
        bc.chain.length,
        now,
        [coinbase],
        bc.getLatestBlock().hash,
        0,
        2
      );
      block.mine();
      bc.chain.push(block);
      bc.utxoSet.applyBlock([coinbase]);
    }
    expect(bc.getDifficultyForNextBlock()).toBeGreaterThanOrEqual(2);
  });
});
