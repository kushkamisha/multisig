const fs = require('fs');
const path = require('path');
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

const getTokenInstance = (contractAddr) => {
  const { abi } = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'build', 'contracts', 'BasicToken.json')
  ));
  return new web3.eth.Contract(abi, contractAddr);
}

const getEncodedTransfer = ({ instance, to, value }) => {
  return instance.methods.transfer(to, value).encodeABI();
}

const signAndSendTransfer = async ({ data, from, to, prKey }) => {
  const tx = {
    // this could be provider.addresses[0] if it exists
    from,
    // target address, this could be a smart contract address
    to,
    // optional if you want to specify the gas limit 
    // gas: gasLimit,
    // optional if you are invoking say a payable function 
    // value: value,
    // this encodes the ABI of the method and the arguements
    data
  };
  const signedTx = await web3.eth.accounts.signTransaction({ from, to, data, gas: 100000 }, prKey);
  const sentTx = await web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
  console.log({ sentTx });
}

module.exports = {
  sign,
  recover,
  getTokenInstance,
  getEncodedTransfer,
  signAndSendTransfer,
  web3,
};
