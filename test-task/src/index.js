const { Blockchain } = require('./core/Blockchain');
const { Wallet } = require('./core/Wallet');
const { DEFAULT_PORT, DEFAULT_P2P_PORT } = require('./config');
const { createApiServer } = require('./api/server');
const { P2PServer } = require('./network/P2PServer');
const httpPort = Number(process.env.PORT) || DEFAULT_PORT;
const p2pPort = Number(process.env.P2P_PORT) || DEFAULT_P2P_PORT;
const difficulty = Number(process.env.DIFFICULTY) || 2;

const wallet = new Wallet();
const blockchain = new Blockchain(wallet.address, difficulty);
const p2p = new P2PServer(blockchain, p2pPort).listen();
const api = createApiServer(blockchain, p2p, wallet);

api.listen(httpPort, () => {
  console.log(`API http://localhost:${httpPort}`);
  console.log(`P2P ws://localhost:${p2pPort}`);
  console.log(`Miner wallet: ${wallet.address}`);
});

if (process.env.PEER_HOST && process.env.PEER_PORT) {
  p2p.connectToPeer(process.env.PEER_HOST, process.env.PEER_PORT);
}
