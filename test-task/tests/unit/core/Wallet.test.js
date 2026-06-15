const { Wallet } = require('../../../src/core/Wallet');
const { createTestBlockchain, mineBlocks } = require('../../helpers/testUtils');
describe('Wallet', () => {
  test('generates unique addresses', () => {
    const a = new Wallet();
    const b = new Wallet();
    expect(a.address).not.toBe(b.address);
  });

  test('createTransaction signs all inputs', () => {
    const { blockchain, miner } = createTestBlockchain(1);
    mineBlocks(blockchain, miner, 1);
    const recipient = new Wallet();
    const utxos = blockchain.utxoSet.getUnspentForAddress(miner.address);
    const tx = miner.createTransaction(recipient.address, 10, utxos);
    expect(tx.verify()).toBe(true);
    expect(tx.signatures._publicKey).toBe(miner.getPublicKey());
  });
});
