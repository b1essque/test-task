const { createTestBlockchain, mineBlocks, fundWallet } = require('../helpers/testUtils');
const { Wallet } = require('../../src/core/Wallet');
describe('Integration: full blockchain flow', () => {
  test('mine → send → mine → verify balances', () => {
    const { blockchain, miner } = createTestBlockchain(1);
    const alice = new Wallet();
    const bob = new Wallet();

    fundWallet(blockchain, miner, alice, 100);
    expect(blockchain.getBalance(alice.address)).toBe(100);

    const aliceUtxos = blockchain.utxoSet.getUnspentForAddress(alice.address);
    blockchain.addTransaction(alice.createTransaction(bob.address, 40, aliceUtxos));
    mineBlocks(blockchain, miner, 1);

    expect(blockchain.getBalance(bob.address)).toBe(40);
    expect(blockchain.isChainValid()).toBe(true);
  });
});
