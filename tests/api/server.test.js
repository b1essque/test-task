const http = require('node:http');
const { createApiServer } = require('../../src/api/server');
const { createTestBlockchain, mineBlocks } = require('../helpers/testUtils');
const { Wallet } = require('../../src/core/Wallet');
function request(server, method, path, body = null) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const req = http.request(
      { hostname: '127.0.0.1', port: addr.port, path, method, headers: { 'Content-Type': 'application/json' } },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data || '{}') }));
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe('API server', () => {
  let server;
  let blockchain;
  let wallet;

  beforeAll((done) => {
    const ctx = createTestBlockchain(1);
    blockchain = ctx.blockchain;
    wallet = ctx.miner;
    server = createApiServer(blockchain, null, wallet);
    server.listen(0, done);
  });

  afterAll(
    () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      })
  );

  test('GET /blocks returns chain', async () => {
    const res = await request(server, 'GET', '/blocks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /chain/length', async () => {
    const res = await request(server, 'GET', '/chain/length');
    expect(res.body.length).toBe(1);
  });

  test('GET /wallet returns address', async () => {
    const res = await request(server, 'GET', '/wallet');
    expect(res.body.address).toBe(wallet.address);
  });

  test('POST /mine appends block', async () => {
    const res = await request(server, 'POST', '/mine');
    expect(res.status).toBe(200);
    expect(res.body.index).toBe(1);
  });

  test('POST /transactions after funding', async () => {
    mineBlocks(blockchain, wallet, 1);
    const recipient = new Wallet();
    const res = await request(server, 'POST', '/transactions', {
      recipient: recipient.address,
      amount: 10,
    });
    expect(res.status).toBe(201);
    expect(res.body.outputs[0].address).toBe(recipient.address);
  });

  test('GET /balance', async () => {
    const res = await request(server, 'GET', `/balance?address=${wallet.address}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.balance).toBe('number');
  });
});
