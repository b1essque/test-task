const {
  DIFFICULTY,
  MINING_REWARD,
  MAX_MEMPOOL_SIZE,
  DIFFICULTY_ADJUSTMENT_INTERVAL,
} = require('../../src/config');
describe('config constants', () => {
  test('mining reward is positive', () => {
    expect(MINING_REWARD).toBeGreaterThan(0);
  });

  test('default difficulty is reasonable', () => {
    expect(DIFFICULTY).toBeGreaterThanOrEqual(1);
  });

  test('mempool has capacity', () => {
    expect(MAX_MEMPOOL_SIZE).toBeGreaterThan(10);
  });

  test('difficulty adjustment interval is defined', () => {
    expect(DIFFICULTY_ADJUSTMENT_INTERVAL).toBeGreaterThan(1);
  });
});
