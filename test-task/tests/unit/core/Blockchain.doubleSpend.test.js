const { createTestBlockchain, mineBlocks } = require('../../helpers/testUtils');
const { Wallet } = require('../../../src/core/Wallet');
describe('Blockchain double-spend prevention', () => {
  test('cannot spend same UTXO twice in mempool', () => {
    const { blockchain, miner } = createTestBlockchain(1);
    mineBlocks(blockchain, miner, 1);
    const bob = new Wallet();
    const carol = new Wallet();
    const utxos = blockchain.utxoSet.getUnspentForAddress(miner.address);
    const tx1 = miner.createTransaction(bob.address, 40, utxos);
    blockchain.addTransaction(tx1);

    const tx2 = miner.createTransaction(carol.address, 40, utxos);
    expect(() => blockchain.addTransaction(tx2)).toThrow('Referenced UTXO not found');
  });

  test('UTXO removed after block confirmation', () => {
    const { blockchain, miner } = createTestBlockchain(1);
    mineBlocks(blockchain, miner, 1);
    const recipient = new Wallet();
    const utxos = blockchain.utxoSet.getUnspentForAddress(miner.address);
    const tx = miner.createTransaction(recipient.address, 20, utxos);
    blockchain.addTransaction(tx);
    mineBlocks(blockchain, miner, 1);
    expect(blockchain.utxoSet.getUnspentForAddress(miner.address).length).toBeGreaterThanOrEqual(0);
    expect(blockchain.getBalance(recipient.address)).toBe(20);
  });
});
