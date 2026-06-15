const { MAX_MEMPOOL_SIZE } = require('../config');
const { notImplemented } = require('../util/notImplemented');
/** @see tests/unit/core/Mempool.test.js */
class Mempool {
  constructor() {
    this.transactions = new Map();
  }

  add(transaction) {
    if (transaction.isCoinbase()) {
      throw new Error('Coinbase transactions cannot enter mempool');
    }
    if (this.transactions.has(transaction.id)) {
      throw new Error('Transaction already in mempool');
    }
    if (this.transactions.size >= MAX_MEMPOOL_SIZE) {
      throw new Error('Mempool is full');
    }
    if (!transaction.verify()) {
      throw new Error('Invalid transaction signature');
    }
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  remove(transactionId) {
    return this.transactions.delete(transactionId);
  }

  removeMany(ids) {
    ids.forEach((id) => this.remove(id));  
  }

  getPending(limit = 100) {
    return Array.from(this.transactions.values()).slice(0, limit);
  }

  has(transactionId) {
    return this.transactions.has(transactionId);
  }

  clear() {
    this.transactions.clear();
  }

  size() {
    return this.transactions.size;
  }
}

module.exports = { Mempool };
