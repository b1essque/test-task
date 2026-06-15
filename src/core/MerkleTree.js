const { sha256 } = require('../crypto/hash');
/** @see tests/unit/core/MerkleTree.test.js */
class MerkleTree {
  constructor(leaves = []) {
    this.leaves = leaves.map((leaf) => sha256(leaf));
    this.levels = this.leaves.length ? [this.leaves] : [];
    
    while (this.levels.length && this.levels[this.levels.length - 1].length > 1) {
      const level = this.levels[this.levels.length - 1];
      const next = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = level[i + 1] ?? left;
        next.push(sha256(left + right));
      }
      this.levels.push(next);
    }

    this.root = this.leaves.length ? this.levels[this.levels.length - 1][0] : null;
  }

  getProof(index) {
    if (index < 0 || index >= this.leaves.length){
      return null;
    }
    const proof = [];
    let currentIndex = index;

    for (let levelIndex = 0; levelIndex < this.levels.length - 1; levelIndex++) {
      const level = this.levels[levelIndex];
      const isRight = currentIndex % 2 === 1;
      const siblIndex = isRight ? currentIndex - 1 : currentIndex + 1;
      proof.push({
        position: isRight ? 'left' : 'right',
        hash: level[siblIndex] ?? level[currentIndex],
      });
      currentIndex = Math.floor(currentIndex / 2);
    }
    return proof;
  }

  static verify(leaf, proof, root) {
    if (!Array.isArray(proof)) {
      return false;
    }

    let hash = sha256(leaf);
    for (const item of proof) {
      hash = item.position === 'left' ? sha256(item.hash + hash) : sha256(hash + item.hash);
    }
    return hash === root;
  }
}

module.exports = { MerkleTree };
