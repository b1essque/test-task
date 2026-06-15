const { Blockchain } = require('../../src/core/Blockchain');
const { MINING_REWARD } = require('../../src/config');
describe('Integration: genesis', () => {
  test('genesis block is valid and funds miner', () => {
    const miner = 'genesis-miner-address';
    const bc = new Blockchain(miner, 1);
    const genesis = bc.chain[0];
    expect(genesis.index).toBe(0);
    expect(genesis.previousHash).toBe('0');
    expect(genesis.isValid(null)).toBe(true);
    expect(bc.getBalance(miner)).toBeGreaterThanOrEqual(MINING_REWARD);
  });
});
