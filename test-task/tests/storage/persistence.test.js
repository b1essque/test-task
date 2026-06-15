const { mkdtemp, rm } = require('node:fs/promises');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { saveChain, loadChain } = require('../../src/storage/persistence');
const { createTestBlockchain, mineBlocks } = require('../helpers/testUtils');
describe('persistence', () => {
  let dir;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'chain-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test('save and load preserves chain length and balance', async () => {
    const { blockchain, miner } = createTestBlockchain(1);
    mineBlocks(blockchain, miner, 2);
    const path = join(dir, 'chain.json');
    await saveChain(path, blockchain);
    const loaded = await loadChain(path, miner.address);
    expect(loaded.chain.length).toBe(blockchain.chain.length);
    expect(loaded.getBalance(miner.address)).toBe(blockchain.getBalance(miner.address));
  });
});
