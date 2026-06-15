function notImplemented(feature) {
  throw new Error(`Not implemented: ${feature}`);
}

module.exports = { notImplemented };
