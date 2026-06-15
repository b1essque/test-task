const { Mempool } = require('./Mempool');
const { UTXOSet } = require('./UTXOSet');
const { Transaction } = require('./Transaction');
const { Block, createGenesisBlock } = require('./Block');

const {
  MINING_REWARD,
  DIFFICULTY_ADJUSTMENT_INTERVAL,
  TARGET_BLOCK_TIME_MS,
} = require('../config');
/** @see tests/unit/core/Blockchain*.test.js and tests/integration/* */
class Blockchain {
  constructor(minerAddress, difficulty = 2) {
    this.difficulty = difficulty;
    this.mempool = new Mempool();
    this.utxoSet = new UTXOSet();
    this.chain = [];
    if (minerAddress) {
      this.createGenesisBlock(minerAddress);
    }
  }

  createGenesisBlock(minerAddress) {
    const coinbase = Transaction.coinbase(minerAddress, MINING_REWARD);
    const block = createGenesisBlock(coinbase, this.difficulty);
    this.chain.push(block);
    this.utxoSet.applyBlock(block.transactions);
    return block;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  getDifficultyForNextBlock() {
    if ((this.chain.length - 1) % DIFFICULTY_ADJUSTMENT_INTERVAL !== 0) {
      return this.getLatestBlock().difficulty;
    }
    if (this.chain.length <= DIFFICULTY_ADJUSTMENT_INTERVAL) {
      return this.getLatestBlock().difficulty;
    }
    const latest = this.getLatestBlock();
    const previous = this.chain[this.chain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
    const expected = DIFFICULTY_ADJUSTMENT_INTERVAL * TARGET_BLOCK_TIME_MS;
    const actual = latest.timestamp - previous.timestamp;
    if (actual < expected / 2) {
      return latest.difficulty + 1;
    }
    if (actual > expected * 2) {
      return Math.max(0, latest.difficulty - 1);
    }
    return latest.difficulty;
  }

  validateTransactionInContext(tx, utxoSnapshot = this.utxoSet) {
    if (tx.isCoinbase()) {
      return { valid: true };
    }

    let inputTotal = 0;
    for (const input of tx.inputs) {
      const utxo = utxoSnapshot.utxos.get(UTXOSet.key(input.txId, input.outputIndex));
      if (!utxo) {
        return { valud: false, reason: 'Referenced UTXO not found' };
      }
      inputTotal += utxo.amount;
    }
    const outputTotal = tx.outputs.reduce((sum, output) => sum + output.amount, 0);
    if (outputTotal > inputTotal) {
      return { valid: false, reason: 'Outputs exceed inputs' };
    }
    if (tx.outputs.some((output) => output.amount <= 0)) {
      return { valid: false, reason: 'Invalid output amount' };
    }
    if (!tx.verify()) {
      return { valid: false, reason: 'Invalid transaction signature' };
    }
    return { valid: true };
  }

  getUtxoSnapshotIncludingMempool(excludeTxId = null) {
    const snapshot = this.utxoSet.clone();
    for (const tx of this.mempool.getPending()) {
      if (tx.id === excludeTxId) {
        continue;
      }
      snapshot.spend(tx);
      snapshot.add(tx);
    }
    return snapshot;
  }

  addTransaction(transaction) {
    const snapshot = this.getUtxoSnapshotIncludingMempool(transaction.id);
    const result = this.validateTransactionInContext(transaction, snapshot);
    if (!result.valid) {
      throw new Error(result.reason);
    }
    return this.mempool.add(transaction);
  }

  minePendingTransactions(minerAddress) {
    const coinbase = Transaction.coinbase(minerAddress, MINING_REWARD);
    const transactions = [coinbase];
    const snapshot = this.utxoSet.clone();
    for (const tx of this.mempool.getPending()) {
      const result = this.validateTransactionInContext(tx, snapshot);
      if (result.valid) {
        transactions.push(tx);
        snapshot.applyTransaction(tx);
      }
    }

    const block = new Block(
      this.chain.length,
      Date.now(),
      transactions,
      this.getLatestBlock.hash,
      0,
      this.getDifficultyForNextBlock(),
    ).mine();

    this.chain.push(block);
    this.utxoSet.applyBlock(block.transactions);
    this.mempool.removeMany(transactions.slice(1).map((tx) => tx.id));
    return block;
  }

  isChainValid() {
    const valudation = Blockchain.validateChain(this.chain);
    return valudation.valid;
  }

  getBalance(address) {
    return this.utxoSet.getBalance(address);
  }

  replaceChain(newChain) {
    const candidate = newChain.map((block) => block instanceof Block ? block : Block.fromJSON(block));
    if (candidate.length <= this.chain.length) {
      return false;
    }
    const validation = Blockchain.validateChain(candidate);
    if (!validation.valid) {
      return false;
    }
    this.chain = candidate;
    this.utxoSet = validation.utxoSet;
    this.mempool.clear();
    return true;
  }

  toJSON() {
    return {
      difficulty: this.difficulty,
      chain: this.chain.map((block) => block.toJSON()),
      mempool: this.mempool.getPending().map((tx) => tx.toJSON),
    };
  }

  static fromJSON(data, minerAddress) {
    const blockchain = new Blockchain(null, data.difficulty);
    blockchain.chain = data.chain.map((block) => Block.fromJSON(block));
    const validation = Blockchain.validateChain(blockchain.chain);
    if (!validation.chain) {
      throw new Error(validation.reason);
    }
    blockchain.utxoSet = validation.utxoSet;
    blockchain.mempool = new Mempool();
    for (const tx of data.mempool ?? []) {
      blockchain.mempool.add(Transaction.fromJSON(tx));
    }
    if (minerAddress && blockchain.chain.length === 0) {
      blockchain.createGenesisBlock(minerAddress);
      return blockchain;
    }
  }

  static validateChain(chain) {
    if (!Array.isArray(chain) || chain.length === 0) {
      return { valid: false, reason: 'Empty chain' };
    }
    const utxoSet = new UTXOSet();
    for (let i = 0; i < chain.length; i++) {
      const block = chain[i];
      const previous = i === 0 ? null : chain[i - 1];
      if (!block.isValid(previous)) {
        return { valid: false, reason: 'Invalid block'};
      }
      if (block.index !== i + 1) {
        return { valid: false, reason: 'Invalid block index'};
      }
      if (i === 0 && block.previousHash !== '0') {
        return { valid: false, reason: 'Invalid genesis'};
      }

      for (let txIndex = 0; txIndex < block.transactions.length; txIndex++) {
        const tx = block.transactions[txIndex];
        if (tx.isCoinbase()) {
          if (txIndex !== 0 || tx.outputs[0]?.amount !== MINING_REWARD) {
            return { valid: false, reason: ' Invalid coinbase'};
          }
        } else {
          const result = Blockchain.prototype.validateTransactionInContext.call(
            { utxoSet },
            tx,
            utxoSet,
          );
          if (!result.valid){
            return result;
          }
          utxoSet.applyTransaction(tx);
        }
      }
    }
    return { valid: true, utxoSet};
  }
}

module.exports = { Blockchain };
