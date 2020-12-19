const Web3 = require('web3');
const utils = require('ethereumjs-util');

const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

const prefixedHash = ({ contractAddr, destination, value, data, nonce }) => {
  const hash = web3.utils.soliditySha3(contractAddr, destination, value, data, nonce);
  return web3.utils.soliditySha3('\x19Ethereum Signed Message:\n32', hash);
}

// Recover address
const recover = ({ hashBuffer, r, s, v }) => {
  const pub = utils.ecrecover(hashBuffer, v, r, s);
  return '0x' + utils.pubToAddress(pub).toString('hex');
}

const sign = ({ contractAddr, destination, value, data, nonce, prKeyBuffer }) => {
  let hash = prefixedHash({ contractAddr, destination, value, data, nonce });
  hash = hash.slice(2, hash.length);
  const hashBuffer = Buffer.from(hash, 'hex');
  const { r, s, v } = utils.ecsign(hashBuffer, prKeyBuffer);

  return { r: '0x' + r.toString('hex'), s: '0x' + s.toString('hex'), v: parseInt(v) };
};

module.exports = {
  sign,
  recover,
  web3,
};
