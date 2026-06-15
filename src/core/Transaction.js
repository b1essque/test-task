const { COINBASE_TX_ID } = require('../config');
const { hashObject } = require('../crypto/hash');
const { signData, verifySignature } = require('../crypto/keyPair');
/** @see tests/unit/core/Transaction*.test.js */
class Transaction {
  constructor(inputs = [], outputs = [], timestamp = Date.now()) {
    this.inputs = inputs;
    this.outputs = outputs;
    this.timestamp = timestamp;
    this.signatures = {};
    this.id = this.calculateId();
  }

  static coinbase(recipientAddress, amount, timestamp = Date.now()) {
    const tx = new Transaction(
      [{ txId: COINBASE_TX_ID, outputIndex: 0, nonce: `${timestamp}:${Math.random()}` }],
      [{ address: recipientAddress, amount}],
      timestamp
    );
    tx.id = tx.calculateId();
    return tx;
  }

  static create(senderAddress, recipientAddress, amount, utxos, changeAddress) {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    const selected = [];
    let total = 0;
    for (const utxo of utxos) {
      if (utxo.address !== senderAddress) {
        continue;
      }
      selected.push(utxo);
      total += utxo.amount;
      if (total >= amount) {
        break;
      }
    }

      if (total < amount) {
        throw new Error('Insufficient balance');
      }

      const inputs = selected.map((utxo) => ({
        txId: utxo.txId,
        outputIndex: utxo.outputIndex,
        address: utxo.address,
        amount: utxo.amount,
        signature: null,
      }));

      const outputs = [{ address: recipientAddress, amount }];
      const change = total - amount;
      if (change > 0) {
        outputs.push({ address: changeAddress ?? senderAddress, amount: change });
        return new Transaction(inputs, outputs);
      }
    
    return new Transaction(inputs, outputs);
  }

  calculateId() {
    return hashObject({
      inputs: this.inputs.map(({ txId, outputIndex, nonce }) => ({ txId, outputIndex, nonce })),
      outputs: this.outputs,
      timestamp: this.timestamp,
    });
  }

  getSigningPayload(inputIndex) {
    return JSON.stringify({
      id: this.id,
      inputIndex,
      inputs: this.inputs.map(({ txId, outputIndex }) => ({ txId, outputIndex })),
      outputs: this.outputs,
      timestamp: this.timestamp,
    });
  }

  sign(privateKey, publicKey) {
    if (this.isCoinbase()) {
      throw new Error('Cannot sign coinbase');
    }
    this.signatures._publicKey = publicKey;
    this.inputs.forEach((input, index) => {
      const signature = signData(privateKey, this.getSigningPayload(index));
      this.signatures[index] = signature;
      input.signature = signature;
    });
    return this;
  }

  verify() {
    if (this.isCoinbase()) {
      return true;
    }
    const publicKey = this.signatures._publicKey;
    if (!publicKey) {
      return false;
    }
    return this.inputs.every((input, index) => {
      const signature = this.signatures[index]?? input.signature;
      return Boolean(signature) && verifySignature(publicKey, this.getSigningPayload(index), signature);
    })
  }

  isCoinbase() {
    return this.inputs.length === 1 && this.inputs[0].txId === COINBASE_TX_ID;
  }

  spendFromSnapshot(utxoSnapshot) {
    for (const input of this.inputs) {
      const key = `${input.txId}:${input.outputIndex}`;
      utxoSnapshot.utxos.delete(key);
    }
    return utxoSnapshot;
  }

  toJSON() {
    return {
      id: this.id,
      inputs: this.inputs,
      outputs: this.outputs,
      timestamp: this.timestamp,
      signatures: this.signatures,
    };
  }

  static fromJSON(data) {
    const tx = new Transaction(data.inputs, data.outputs, data.timestamp);
    tx.signatures = data.signatures ?? {}; 
    tx.id = data.id ?? tx.calculateId(); 
    return tx;
  }
}

module.exports = { Transaction };
