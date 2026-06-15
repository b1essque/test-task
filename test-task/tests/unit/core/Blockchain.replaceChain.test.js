const { Block } = require('../../../src/core/Block');
const { createTestBlockchain, mineBlocks } = require('../../helpers/testUtils');
describe('Blockchain replaceChain', () => {
  test('rejects shorter chain', () => {
    const { blockchain, miner } = createTestBlockchain(1);
    mineBlocks(blockchain, miner, 2);
    expect(blockchain.replaceChain(blockchain.chain.slice(0, 1))).toBe(false);
  });

  test('accepts longer valid chain', () => {
    const local = createTestBlockchain(1);
    const remote = createTestBlockchain(1);
    mineBlocks(remote.blockchain, remote.miner, 4);
    expect(local.blockchain.replaceChain(remote.blockchain.chain)).toBe(true);
    expect(local.blockchain.chain.length).toBe(5);
  });

  test('rejects chain with invalid block link', () => {
    const { blockchain, miner } = createTestBlockchain(1);
    mineBlocks(blockchain, miner, 2);
    const fork = blockchain.chain.map((b) => Block.fromJSON(b.toJSON()));
    fork[1].previousHash = 'broken';
    fork[1].hash = fork[1].calculateHash();
    expect(blockchain.replaceChain(fork)).toBe(false);
  });
});
