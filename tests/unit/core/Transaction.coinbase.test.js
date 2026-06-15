const { Transaction } = require('../../../src/core/Transaction');
const { MINING_REWARD } = require('../../../src/config');
describe('Transaction coinbase', () => {
  test('each coinbase has a unique id', () => {
    const a = Transaction.coinbase('miner', 50, 1000);
    const b = Transaction.coinbase('miner', 50, 2000);
    expect(a.id).not.toBe(b.id);
  });

  test('verify always returns true for coinbase', () => {
    const tx = Transaction.coinbase('miner', MINING_REWARD);
    expect(tx.verify()).toBe(true);
  });

  test('has single output to miner', () => {
    const tx = Transaction.coinbase('abc123', 50);
    expect(tx.outputs).toHaveLength(1);
    expect(tx.outputs[0]).toEqual({ address: 'abc123', amount: 50 });
  });

  test('has no spendable inputs', () => {
    const tx = Transaction.coinbase('m', 1);
    expect(tx.inputs[0].txId).toBe('coinbase');
  });
});
