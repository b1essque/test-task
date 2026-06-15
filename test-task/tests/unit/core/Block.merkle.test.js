const { Block } = require('../../../src/core/Block');
const { Transaction } = require('../../../src/core/Transaction');
describe('Block merkle integration', () => {
  test('merkle root updates when transactions change', () => {
    const tx1 = Transaction.coinbase('a', 10);
    const block = new Block(1, Date.now(), [tx1], '0', 0, 1);
    const root1 = block.merkleRoot;
    const tx2 = Transaction.coinbase('b', 20);
    block.transactions.push(tx2);
    block.merkleRoot = block.computeMerkleRoot();
    expect(block.merkleRoot).not.toBe(root1);
  });

  test('invalid block fails if transaction list modified after mine', () => {
    const tx = Transaction.coinbase('miner', 50);
    const block = new Block(1, Date.now(), [tx], 'prev', 0, 1);
    block.mine();
    block.transactions.push(Transaction.coinbase('other', 1));
    expect(block.isValid(null)).toBe(false);
  });
});
