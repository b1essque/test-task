const { Blockchain } = require('../../../src/core/Blockchain');
const { createTestBlockchain, mineBlocks } = require('../../helpers/testUtils');
const { Wallet } = require('../../../src/core/Wallet');
describe("Blockchain", () => {
  test("starts with genesis block", () => {
    const { blockchain } = createTestBlockchain(1);
    expect(blockchain.chain).toHaveLength(1);
    expect(blockchain.chain[0].index).toBe(0);
  });

  test("mining appends block and clears mempool txs", () => {
    const { blockchain, miner } = createTestBlockchain(1);
    const recipient = new Wallet();
    mineBlocks(blockchain, miner, 1);
    const utxos = blockchain.utxoSet.getUnspentForAddress(miner.address);
    const tx = miner.createTransaction(recipient.address, 5, utxos);
    blockchain.addTransaction(tx);
    expect(blockchain.mempool.size()).toBe(1);
    mineBlocks(blockchain, miner, 1);
    expect(blockchain.chain).toHaveLength(3);
    expect(blockchain.mempool.has(tx.id)).toBe(false);
  });

  test("getBalance reflects mined and transferred funds", () => {
    const { blockchain, miner } = createTestBlockchain(1);
    const alice = new Wallet();
    mineBlocks(blockchain, miner, 1);
    const utxos = blockchain.utxoSet.getUnspentForAddress(miner.address);
    blockchain.addTransaction(
      miner.createTransaction(alice.address, 30, utxos),
    );
    mineBlocks(blockchain, miner, 1);
    expect(blockchain.getBalance(alice.address)).toBe(30);
  });

  test("isChainValid returns true for honest chain", () => {
    const { blockchain, miner } = createTestBlockchain(1);
    mineBlocks(blockchain, miner, 3);
    expect(blockchain.isChainValid()).toBe(true);
  });
});
