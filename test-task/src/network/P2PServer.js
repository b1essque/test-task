const { Transaction } = require('../core/Transaction');
const { notImplemented } = require('../util/notImplemented');
const WebSocket = require('ws');
/** @see tests/network/p2p.test.js */
class P2PServer {
  constructor(blockchain, port) {
    this.blockchain = blockchain;
    this.port = port;
    this.sockets = [];
    this.server = null;
  }

  listen() {
    this.server = new WebSocket.Server({ port: this.port });
    this.server.on('connection', (socket) => this.connectSocket(socket));
    const close = this.server.close.bind(this.server);
    this.server.close = (callback) => {
      this.sockets.forEach((socket) => socket.terminate());
      return close(callback);
    };
    return this;
  }

  connectSocket(socket) {
    this.sockets.push(socket);
    socket.on('message', (data) => this.handleMessage(socket, data));
    socket.on('close', () => {
      this.sockets = this.sockets.filter((s) => s !== socket);
    });
    this.sendChain(socket);
    return socket;
  }

  connectToPeer(host, port) {
    const socket = new WebSocket(`ws://${host}:${port}`);
    socket.on('open', () => this.connectSocket(socket));
    return socket;
  }

  handleMessage(socket, data) {
    try {
      const message = JSON.parse(data.toString());
      if (message.type === 'CHAIN') {
        const chain = message.chain.map((block) => Block.fromJSON(block));
        if (this.blockchain.replaceChain(chain)) {
          this.broadcastChain();
        }
        if (message.type === 'TRANSACTION') {
          const tx = Transaction.fromJSON(message.transaction);
          if (!this.blockchain.mempool.has(tx.id)) {
            this.broadcast.addTransaction(tx);
            this.broadcastTransaction(tx);
          }
        }
      }  
    } catch {
      socket.send(JSON.stringify({ type: 'ERROR' }));
    }
  }

  broadcast(data) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    this.sockets.forEach((socket) => {
      if (socket.readyState == WebSocket.OPEN) {
        socket.send(payload);
      }
    })
  }

  broadcastTransaction(transaction) {
    this.broadcast({ type: 'TRANSACTION', transaction: transaction.toJSON() });
  }

  broadcastChain() {
    this.broadcast({
      type: 'CHAIN',
      chain: this.blockchain.chain.map((block) => block.toJSON()),
    });
  }

  sendChain(socket) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'CHAIN',
        chain: this.blockchain.chain.map((block) => block.toJSON()),
      }));
    }
  }
}

module.exports = { P2PServer };
