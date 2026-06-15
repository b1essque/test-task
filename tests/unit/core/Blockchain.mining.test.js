const { createTestBlockchain, mineBlocks } = require('../../helpers/testUtils');
const { MINING_REWARD } = require('../../../src/config');
describe('Blockchain mining', () => {
  test('miner receives reward in new block', () => {
    const { blockchain, miner } = createTestBlockchain(1);
    const before = blockchain.getBalance(miner.address);
    mineBlocks(blockchain, miner, 1);
    expect(blockchain.getBalance(miner.address)).toBeGreaterThan(before);
  });

  test('each mined block includes coinbase with MINING_REWARD', () => {
    const { blockchain, miner } = createTestBlockchain(1);
    const block = mineBlocks(blockchain, miner, 1)[0];
    const coinbase = block.transactions[0];
    expect(coinbase.isCoinbase()).toBe(true);
    expect(coinbase.outputs[0].amount).toBe(MINING_REWARD);
  });

  test('mined blocks satisfy proof of work', () => {
    const { blockchain, miner } = createTestBlockchain(2);
    const block = mineBlocks(blockchain, miner, 1)[0];
    expect(block.hash.startsWith('00')).toBe(true);
  });
});
