const { createTestBlockchain, mineBlocks } = require('../../helpers/testUtils');
const { Wallet } = require('../../../src/core/Wallet');
describe('Blockchain mempool integration', () => {
  test('mempool tx cannot double-spend pending UTXO', () => {
    const { blockchain, miner } = createTestBlockchain(1);
    mineBlocks(blockchain, miner, 1);
    const bob = new Wallet();
    const carol = new Wallet();
    const utxos = blockchain.utxoSet.getUnspentForAddress(miner.address);
    blockchain.addTransaction(miner.createTransaction(bob.address, 50, utxos));
    expect(() =>
      blockchain.addTransaction(miner.createTransaction(carol.address, 50, utxos))
    ).toThrow('Referenced UTXO not found');
  });

  test('GET mempool size via internal state', () => {
    const { blockchain, miner } = createTestBlockchain(1);
    mineBlocks(blockchain, miner, 1);
    const utxos = blockchain.utxoSet.getUnspentForAddress(miner.address);
    blockchain.addTransaction(miner.createTransaction('addr', 1, utxos));
    expect(blockchain.mempool.size()).toBe(1);
  });
});
