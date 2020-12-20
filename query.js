const MultiSig = artifacts.require('MultiSig');
const BasicToken = artifacts.require('BasicToken');
const { sign, getTokenInstance, getEncodedTransfer, signAndSendTransfer } = require('./signMessage');

module.exports = async (callback) => {
  try {
    const multisig = await MultiSig.deployed();
    const token = await BasicToken.deployed();
    const multisigAddr = multisig.address;
    const tokenAddr = token.address;
    const destination = '0x909Ae0dDf1ACaA3ccf32344922AE016Ab2558cBa';
    const senderAddr = '0x7403ab40723898eCf2450467Ba620EF7B77A6961';
    const senderPrKey = 'deca899581d68b6b2ac88149e951afdd8f89666b95aa54a790c6d56d831ab718';
    const prKeyBuffer = Buffer.from(senderPrKey, 'hex');
    // const value = 0; // web3.utils.toWei('0.01', 'ether');
    const tokenAmount = 10;
    const nonce = (await multisig.nonce()).toString();
    const tokenInstance = getTokenInstance(tokenAddr);
    const data = getEncodedTransfer({
      instance: tokenInstance,
      sender: senderAddr,
      recipient: destination,
      amount: tokenAmount
    });

    // console.log({ multisigAddr, tokenAddr, destination, value, nonce, data });

    // Allow MultiSig to spend tokens using transferFrom
    // const signedTx = await web3.eth.accounts.signTransaction({
    //   from: senderAddr,
    //   to: tokenAddr,
    //   data: tokenInstance.methods.approve(multisigAddr, tokenAmount).encodeABI(),
    //   gas: 100000
    // }, senderPrKey);
    // const sentTx = await web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
    // console.log({ sentTx });

    console.log(`MultiSig is allowed to spend ${await tokenInstance.methods.allowance(senderAddr, multisigAddr).call()
      } tokens`);

    // const { r, s, v } = sign({
    //   contractAddr: multisigAddr,
    //   destination: tokenAddr,
    //   value: 0,
    //   data,
    //   nonce,
    //   prKeyBuffer
    // });
    // console.log({ r, s, v });

    // console.log(`BasicToken.balanceOf(destination) is ${await tokenInstance.methods.balanceOf(destination).call()}`);
    // console.log(`BasicToken.balanceOf(senderAddr) is ${await tokenInstance.methods.balanceOf(senderAddr).call()}`);

    // // // await web3.eth.sendTransaction({ to: multisigAddr, from: senderAddr, value });
    // // // console.log(`Contract balance before: ${web3.utils.fromWei(await web3.eth.getBalance(multisigAddr))} ETH`);
    // await multisig.execute(tokenAddr /*destination*/, 0/*value*/, data, [r], [s], [v]);
    // // // console.log(`Contract balance after: ${web3.utils.fromWei(await web3.eth.getBalance(multisigAddr))} ETH`);

    // console.log(`BasicToken.balanceOf(destination) is ${await tokenInstance.methods.balanceOf(destination).call()}`);
    // console.log(`BasicToken.balanceOf(senderAddr) is ${await tokenInstance.methods.balanceOf(senderAddr).call()}`);

    callback();
  } catch (err) {
    console.error({ err });
  }
}
