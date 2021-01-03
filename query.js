const MultiSig = artifacts.require('MultiSig');
const BasicToken = artifacts.require('BasicToken');
const { sign, getTokenInstance, getEncodedTransferFrom } = require('./signMessage');

module.exports = async (callback) => {
  try {
    const multisig = await MultiSig.deployed();
    const token = await BasicToken.deployed();

    const destination = '0x909Ae0dDf1ACaA3ccf32344922AE016Ab2558cBa';
    const senderAddr = '0x7403ab40723898eCf2450467Ba620EF7B77A6961';
    const prKeyBuffers = [
      // Buffer.from('5b07bae6366e7ca82f82989e9d18a5aeb6320234aa58a552a609677c95258278', 'hex'),
      Buffer.from('deca899581d68b6b2ac88149e951afdd8f89666b95aa54a790c6d56d831ab718', 'hex'),
      Buffer.from('24d52ea1a035de7a61fd0c706de4b095adca0c8193f1395140356b3df31b5b6a', 'hex'),
      // Buffer.from('cb6888ad5120adf7b8bee06fc236f8cce90405a6a313fb3bc63dccb2c44ae1c0', 'hex'),
    ]
    const value = 0; // web3.utils.toWei('0.01', 'ether');
    const tokenAmount = 10;
    const nonce = (await multisig.nonce()).toString();

    const tokenInstance = getTokenInstance(token.address);
    const data = getEncodedTransferFrom({
      instance: tokenInstance,
      sender: senderAddr,
      recipient: destination,
      amount: tokenAmount,
    });

    const rs = [];
    const ss = [];
    const vs = [];
    for (let i = 0; i < prKeyBuffers.length; i++) {
      const { r, s, v } = sign({
        contractAddr: multisig.address,
        destination: token.address,
        value,
        data,
        nonce,
        prKeyBuffer: prKeyBuffers[i],
      });
      rs.push(r);
      ss.push(s);
      vs.push(v);
    }

    // Allow MultiSig to spend tokens using transferFrom
    await tokenInstance.methods
      .approve(multisig.address, tokenAmount)
      .send({ from: senderAddr })

    // await web3.eth.sendTransaction({ to: multisig.address, from: senderAddr, value });

    console.log(`MultiSig is allowed to spend ${await tokenInstance.methods.allowance(senderAddr, multisig.address).call()
      } tokens`);

    console.log(`BasicToken.balanceOf(destination) is ${await tokenInstance.methods.balanceOf(destination).call()}`);
    console.log(`BasicToken.balanceOf(senderAddr) is ${await tokenInstance.methods.balanceOf(senderAddr).call()}`);

    // console.log(`Contract balance before: ${web3.utils.fromWei(await web3.eth.getBalance(multisig.address))} ETH`);
    await multisig.execute(token.address /*destination*/, 0/*value*/, data, rs, ss, vs);
    // console.log(`Contract balance after: ${web3.utils.fromWei(await web3.eth.getBalance(multisig.address))} ETH`);

    console.log(`BasicToken.balanceOf(destination) is ${await tokenInstance.methods.balanceOf(destination).call()}`);
    console.log(`BasicToken.balanceOf(senderAddr) is ${await tokenInstance.methods.balanceOf(senderAddr).call()}`);

    console.log(`MultiSig is allowed to spend ${await tokenInstance.methods.allowance(senderAddr, multisig.address).call()
      } tokens`);

    callback();
  } catch (err) {
    console.error({ err });
  }
}
