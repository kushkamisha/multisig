const MultiSig = artifacts.require('MultiSig');
const { sign, web3 } = require('./signMessage');

module.exports = async (callback) => {
  try {
    const contract = await MultiSig.deployed();
    const contractAddr = contract.address;
    const destination = '0x909Ae0dDf1ACaA3ccf32344922AE016Ab2558cBa';
    const value = web3.utils.toWei('0.01', 'ether');
    const data = '0xfff23243';
    const nonce = (await contract.nonce()).toString();

    console.log({ contractAddr, destination, value, nonce });

    const senderAddr = '0x7403ab40723898eCf2450467Ba620EF7B77A6961';
    const senderPrKey = 'deca899581d68b6b2ac88149e951afdd8f89666b95aa54a790c6d56d831ab718';
    const prKeyBuffer = Buffer.from(senderPrKey, 'hex');

    const { r, s, v } = sign({ contractAddr, destination, value, data, nonce, prKeyBuffer });
    console.log({ r, s, v });

    await web3.eth.sendTransaction({ to: contractAddr, from: senderAddr, value });
    console.log(`Contract balance before: ${web3.utils.fromWei(await web3.eth.getBalance(contractAddr))} ETH`);
    await contract.execute(destination, value, data, [r], [s], [v]);
    console.log(`Contract balance after: ${web3.utils.fromWei(await web3.eth.getBalance(contractAddr))} ETH`);

    callback();
  } catch (err) {
    console.error({ err });
  }
}
