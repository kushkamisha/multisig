const Web3 = require('web3');
const utils = require('ethereumjs-util');

const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

const prefixedHash = ({ contractAddr, destination, value, nonce }) => {
  const hash = web3.utils.soliditySha3(contractAddr, destination, value, nonce);
  return web3.utils.soliditySha3('\x19Ethereum Signed Message:\n32', hash);
}

const recover = ({ hashBuffer, r, s, v }) => {
  const pub = utils.ecrecover(hashBuffer, v, r, s);
  return '0x' + utils.pubToAddress(pub).toString('hex');
}

const sign = ({ contractAddr, destination, value, nonce, senderAddr, prKeyBuffer }) => {
  let hash = prefixedHash({ contractAddr, destination, value, nonce });
  hash = hash.slice(2, hash.length);
  const hashBuffer = Buffer.from(hash, 'hex');

  const { r, s, v } = utils.ecsign(hashBuffer, prKeyBuffer);

  const recoveredAddress = recover({ hashBuffer, r, s, v });
  console.log(`The addresses match: ${recoveredAddress.toLowerCase() === senderAddr.toLowerCase()}`)

  // return { r: r.toString('hex'), s: s.toString('hex'), v: v.toString() };
  return { r: '0x' + r.toString('hex'), s: '0x' + s.toString('hex'), v: parseInt(v) };
};

const contractAddr = '0x024Fcf8eFb30147833c104A70f7eec854967550a'; // MultiSig.address
const destination = '0x909Ae0dDf1ACaA3ccf32344922AE016Ab2558cBa';
const value = 1000000000000000000; // 1 ETH
// const value = 1;
const nonce = 0; // MultiSig.nonce

const senderAddr = '0x7403ab40723898eCf2450467Ba620EF7B77A6961';
const senderPrKey = 'deca899581d68b6b2ac88149e951afdd8f89666b95aa54a790c6d56d831ab718';
const prKeyBuffer = Buffer.from(senderPrKey, 'hex');

console.log(sign({ contractAddr, destination, value, nonce, senderAddr, prKeyBuffer }))
