const { Blockchain } = require('../../src/core/Blockchain');
const { Wallet } = require('../../src/core/Wallet');
function createTestBlockchain(difficulty = 1) {
  const miner = new Wallet();
  const blockchain = new Blockchain(miner.address, difficulty);
  return { blockchain, miner };
}

function mineBlocks(blockchain, minerWallet, count = 1) {
  const blocks = [];
  for (let i = 0; i < count; i++) {
    blocks.push(blockchain.minePendingTransactions(minerWallet.address));
  }
  return blocks;
}

function fundWallet(blockchain, minerWallet, recipientWallet, amount) {
  mineBlocks(blockchain, minerWallet, 1);
  const utxos = blockchain.utxoSet.getUnspentForAddress(minerWallet.address);
  const tx = minerWallet.createTransaction(recipientWallet.address, amount, utxos);
  blockchain.addTransaction(tx);
  mineBlocks(blockchain, minerWallet, 1);
}

module.exports = { createTestBlockchain, mineBlocks, fundWallet };
