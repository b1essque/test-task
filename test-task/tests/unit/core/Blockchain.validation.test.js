const { Transaction } = require('../../../src/core/Transaction');
const { createTestBlockchain, mineBlocks } = require('../../helpers/testUtils');
const { Wallet } = require('../../../src/core/Wallet');
describe('Blockchain validation', () => {
  test('rejects transaction spending missing UTXO', () => {
    const { blockchain } = createTestBlockchain(1);
    const wallet = new Wallet();
    const fake = wallet.createTransaction('x', 1, [
      { txId: 'missing', outputIndex: 0, address: wallet.address, amount: 100 },
    ]);
    expect(() => blockchain.addTransaction(fake)).toThrow('Referenced UTXO not found');
  });

  test('isChainValid false when block hash tampered', () => {
    const { blockchain, miner } = createTestBlockchain(1);
    mineBlocks(blockchain, miner, 2);
    blockchain.chain[1].hash = 'tampered';
    expect(blockchain.isChainValid()).toBe(false);
  });

  test('validateTransactionInContext rejects outputs exceeding inputs', () => {
    const { blockchain, miner } = createTestBlockchain(1);
    mineBlocks(blockchain, miner, 1);
    const utxos = blockchain.utxoSet.getUnspentForAddress(miner.address);
    const tx = miner.createTransaction('dest', 5, utxos);
    tx.outputs[0].amount = 99999;
    const result = blockchain.validateTransactionInContext(tx);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Outputs exceed inputs');
  });
});
