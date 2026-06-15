const http = require('node:http');
const { Transaction } = require('../core/Transaction');
function createApiServer(blockchain, p2p, wallet) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    res.setHeader('Content-Type', 'application/json');

    try {
      if (req.method === 'GET' && url.pathname === '/blocks') {
        res.end(JSON.stringify(blockchain.chain.map((b) => b.toJSON())));
        return;
      }

      if (req.method === 'GET' && url.pathname === '/chain/length') {
        res.end(JSON.stringify({ length: blockchain.chain.length }));
        return;
      }

      if (req.method === 'GET' && url.pathname === '/balance') {
        const address = url.searchParams.get('address') ?? wallet.address;
        res.end(JSON.stringify({ address, balance: blockchain.getBalance(address) }));
        return;
      }

      if (req.method === 'GET' && url.pathname === '/mempool') {
        res.end(
          JSON.stringify(blockchain.mempool.getPending().map((tx) => tx.toJSON()))
        );
        return;
      }

      if (req.method === 'POST' && url.pathname === '/mine') {
        const block = blockchain.minePendingTransactions(wallet.address);
        p2p?.broadcastChain();
        res.end(JSON.stringify(block.toJSON()));
        return;
      }

      if (req.method === 'POST' && url.pathname === '/transactions') {
        const body = await readBody(req);
        const data = JSON.parse(body);
        let tx;

        if (data.raw) {
          tx = Transaction.fromJSON(data.raw);
        } else {
          const recipient = data.recipient;
          const amount = Number(data.amount);
          const utxos = blockchain.utxoSet.getUnspentForAddress(wallet.address);
          tx = wallet.createTransaction(recipient, amount, utxos);
        }

        blockchain.addTransaction(tx);
        p2p?.broadcastTransaction(tx);
        res.statusCode = 201;
        res.end(JSON.stringify(tx.toJSON()));
        return;
      }

      if (req.method === 'GET' && url.pathname === '/wallet') {
        res.end(JSON.stringify({ address: wallet.address }));
        return;
      }

      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Not found' }));
    } catch (err) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

module.exports = { createApiServer };
