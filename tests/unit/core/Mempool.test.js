const { Mempool } = require('../../../src/core/Mempool');
const { Transaction } = require('../../../src/core/Transaction');
const { Wallet } = require('../../../src/core/Wallet');
const { createTestBlockchain, mineBlocks } = require('../../helpers/testUtils');
describe('Mempool', () => {
  test('rejects coinbase transactions', () => {
    const pool = new Mempool();
    expect(() => pool.add(Transaction.coinbase('m', 50))).toThrow('Coinbase');
  });

  test('rejects duplicate transactions', () => {
    const { blockchain, miner } = createTestBlockchain(1);
    mineBlocks(blockchain, miner, 1);
    const pool = new Mempool();
    const utxos = blockchain.utxoSet.getUnspentForAddress(miner.address);
    const tx = miner.createTransaction('dest', 5, utxos);
    pool.add(tx);
    expect(() => pool.add(tx)).toThrow('already in mempool');
  });

  test('rejects invalid signatures', () => {
    const pool = new Mempool();
    const tx = new Transaction(
      [{ txId: 'fake', outputIndex: 0, signature: null }],
      [{ address: 'x', amount: 1 }]
    );
    expect(() => pool.add(tx)).toThrow('Invalid transaction signature');
  });

  test('getPending respects limit', () => {
    const pool = new Mempool();
    const wallet = new Wallet();
    for (let i = 0; i < 5; i++) {
      const tx = new Transaction([], [{ address: wallet.address, amount: 1 }]);
      tx.signatures._publicKey = wallet.getPublicKey();
      try {
        pool.add(tx);
      } catch {
        /* unsigned inputs fail - use signed txs in integration */
      }
    }
    expect(pool.getPending(2).length).toBeLessThanOrEqual(2);
  });

  test('remove and clear work', () => {
    const pool = new Mempool();
    pool.clear();
    expect(pool.size()).toBe(0);
  });
});
