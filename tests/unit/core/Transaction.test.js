const { Transaction } = require('../../../src/core/Transaction');
const { Wallet } = require('../../../src/core/Wallet');
const { COINBASE_TX_ID } = require('../../../src/config');
describe('Transaction', () => {
  test('coinbase is marked via input reference', () => {
    const tx = Transaction.coinbase('addr', 50);
    expect(tx.inputs[0].txId).toBe(COINBASE_TX_ID);
    expect(tx.isCoinbase()).toBe(true);
    expect(tx.id).toBeTruthy();
  });

  test('create throws on insufficient balance', () => {
    const sender = new Wallet();
    expect(() =>
      Transaction.create(sender.address, 'recipient', 100, [], sender.address)
    ).toThrow('Insufficient balance');
  });

  test('toJSON and fromJSON preserve id and outputs', () => {
    const tx = Transaction.coinbase('x', 25);
    const restored = Transaction.fromJSON(tx.toJSON());
    expect(restored.outputs).toEqual(tx.outputs);
    expect(restored.id).toBe(tx.id);
  });

  test('calculateId changes when outputs change', () => {
    const tx = new Transaction(
      [{ txId: 'a', outputIndex: 0, signature: null }],
      [{ address: 'r', amount: 5 }]
    );
    const id1 = tx.id;
    tx.outputs[0].amount = 6;
    tx.id = tx.calculateId();
    expect(tx.id).not.toBe(id1);
  });
});
