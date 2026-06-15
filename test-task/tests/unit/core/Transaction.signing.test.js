const { Transaction } = require('../../../src/core/Transaction');
const { Wallet } = require('../../../src/core/Wallet');
const { createTestBlockchain, mineBlocks } = require('../../helpers/testUtils');
describe('Transaction signing', () => {
  test('signed transaction verifies', () => {
    const { blockchain, miner } = createTestBlockchain(1);
    mineBlocks(blockchain, miner, 1);

    const recipient = new Wallet();
    const utxos = blockchain.utxoSet.getUnspentForAddress(miner.address);
    const tx = miner.createTransaction(recipient.address, 10, utxos);
    expect(tx.verify()).toBe(true);
  });

  test('tampered signature fails verification', () => {
    const { blockchain, miner } = createTestBlockchain(1);
    mineBlocks(blockchain, miner, 1);
    const utxos = blockchain.utxoSet.getUnspentForAddress(miner.address);
    const tx = miner.createTransaction('other', 5, utxos);
    tx.signatures[0] = 'deadbeef';
    expect(tx.verify()).toBe(false);
  });

  test('cannot sign coinbase', () => {
    const tx = Transaction.coinbase('addr', 50);
    const wallet = new Wallet();
    expect(() => tx.sign(wallet.keyPair.privateKey, wallet.keyPair.publicKey)).toThrow(
      'Cannot sign coinbase'
    );
  });
});
