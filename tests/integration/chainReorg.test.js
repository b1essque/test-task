const { createTestBlockchain, mineBlocks } = require('../helpers/testUtils');
describe('Integration: chain reorganization', () => {
  test('node adopts longer valid chain from peer', () => {
    const nodeA = createTestBlockchain(1);
    const nodeB = createTestBlockchain(1);

    mineBlocks(nodeA.blockchain, nodeA.miner, 2);
    mineBlocks(nodeB.blockchain, nodeB.miner, 5);

    expect(nodeB.blockchain.chain.length).toBeGreaterThan(nodeA.blockchain.chain.length);
    nodeA.blockchain.replaceChain(nodeB.blockchain.chain);
    expect(nodeA.blockchain.chain.length).toBe(nodeB.blockchain.chain.length);
    expect(nodeA.blockchain.isChainValid()).toBe(true);
  });
});
