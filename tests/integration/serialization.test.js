const { createTestBlockchain, mineBlocks } = require('../helpers/testUtils');
const { Blockchain } = require('../../src/core/Blockchain');
describe('Integration: serialization', () => {
  test('toJSON and fromJSON restore full chain state', () => {
    const { blockchain, miner } = createTestBlockchain(1);
    mineBlocks(blockchain, miner, 3);
    const json = blockchain.toJSON();
    const restored = Blockchain.fromJSON(json, miner.address);
    expect(restored.chain.length).toBe(4);
    expect(restored.getBalance(miner.address)).toBe(blockchain.getBalance(miner.address));
    expect(restored.isChainValid()).toBe(true);
  });
});
