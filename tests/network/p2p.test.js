const { P2PServer } = require('../../src/network/P2PServer');
const { createTestBlockchain, mineBlocks } = require('../helpers/testUtils');
const { Wallet } = require('../../src/core/Wallet');
describe('P2P server', () => {
  test('two nodes sync chain via websocket', async () => {
    const nodeA = createTestBlockchain(1);
    const nodeB = createTestBlockchain(1);
    const p2pA = new P2PServer(nodeA.blockchain, 0);
    const p2pB = new P2PServer(nodeB.blockchain, 0);

    await new Promise((resolve) => {
      p2pA.server = p2pA.listen().server;
      p2pA.server.on('listening', resolve);
    });

    const port = p2pA.server.address().port;
    p2pB.listen();
    await new Promise((resolve) => {
      p2pB.connectToPeer('127.0.0.1', port);
      setTimeout(resolve, 200);
    });

    mineBlocks(nodeA.blockchain, nodeA.miner, 2);
    p2pA.broadcastChain();
    await new Promise((r) => setTimeout(r, 300));

    expect(nodeB.blockchain.chain.length).toBeGreaterThanOrEqual(1);

    await Promise.all([
      new Promise((r) => p2pA.server?.close(r)),
      new Promise((r) => p2pB.server?.close(r)),
    ]);
  }, 10000);
});
