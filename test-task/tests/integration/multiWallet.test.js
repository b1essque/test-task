const { createTestBlockchain, mineBlocks } = require('../helpers/testUtils');
const { Wallet } = require('../../src/core/Wallet');
describe('Integration: multi-wallet transfers', () => {
  test('three wallets exchange value correctly', () => {
    const { blockchain, miner } = createTestBlockchain(1);
    const w1 = new Wallet();
    const w2 = new Wallet();
    const w3 = new Wallet();

    mineBlocks(blockchain, miner, 2);
    let utxos = blockchain.utxoSet.getUnspentForAddress(miner.address);
    blockchain.addTransaction(miner.createTransaction(w1.address, 80, utxos));
    mineBlocks(blockchain, miner, 1);

    utxos = blockchain.utxoSet.getUnspentForAddress(w1.address);
    blockchain.addTransaction(w1.createTransaction(w2.address, 30, utxos));
    mineBlocks(blockchain, miner, 1);

    utxos = blockchain.utxoSet.getUnspentForAddress(w2.address);
    blockchain.addTransaction(w2.createTransaction(w3.address, 10, utxos));
    mineBlocks(blockchain, miner, 1);

    expect(blockchain.getBalance(w3.address)).toBe(10);
    expect(blockchain.isChainValid()).toBe(true);
  });
});
