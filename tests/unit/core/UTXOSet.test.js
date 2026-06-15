const { UTXOSet } = require('../../../src/core/UTXOSet');
const { Transaction } = require('../../../src/core/Transaction');
describe('UTXOSet', () => {
  test('add creates spendable outputs', () => {
    const set = new UTXOSet();
    const tx = Transaction.coinbase('alice', 100);
    set.add(tx);
    expect(set.has(tx.id, 0)).toBe(true);
    expect(set.getBalance('alice')).toBe(100);
  });

  test('spend removes consumed UTXOs', () => {
    const set = new UTXOSet();
    const funding = Transaction.coinbase('alice', 100);
    set.applyTransaction(funding);

    const spend = new Transaction(
      [{ txId: funding.id, outputIndex: 0, signature: null }],
      [{ address: 'bob', amount: 60 }, { address: 'alice', amount: 40 }]
    );
    set.spend(spend);
    expect(set.has(funding.id, 0)).toBe(false);
    set.add(spend);
    expect(set.getBalance('bob')).toBe(60);
    expect(set.getBalance('alice')).toBe(40);
  });

  test('getUnspentForAddress filters correctly', () => {
    const set = new UTXOSet();
    set.add(Transaction.coinbase('a', 10));
    set.add(Transaction.coinbase('b', 20));
    expect(set.getUnspentForAddress('a')).toHaveLength(1);
  });

  test('clone is independent', () => {
    const set = new UTXOSet();
    set.add(Transaction.coinbase('x', 5));
    const copy = set.clone();
    copy.utxos.clear();
    expect(set.getBalance('x')).toBe(5);
  });

  test('toJSON and fromJSON round-trip', () => {
    const set = new UTXOSet();
    set.add(Transaction.coinbase('z', 99));
    const restored = UTXOSet.fromJSON(set.toJSON());
    expect(restored.getBalance('z')).toBe(99);
  });
});
