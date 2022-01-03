const MultiSig = artifacts.require('MultiSig');
const BasicToken = artifacts.require('BasicToken');
const { sign, getTokenInstance, getEncodedTransferFrom } = require('./signMessage');

module.exports = async (callback) => {
  try {
    const multisig = await MultiSig.deployed();
    const token = await BasicToken.deployed();

    const destination = '0xF0723672096c5dc5718aFB3530CBf951aAa9E4c7';
    const senderAddr = '0xEc6751439B9cC8a13c61B7c73A4081eBc08be42a';
    const prKeyBuffers = [
      // Buffer.from('5b07bae6366e7ca82f82989e9d18a5aeb6320234aa58a552a609677c95258278', 'hex'),
      Buffer.from('ed8fffe05cb4f0a411292ed8ccc1aa28404516e886bb46f1e3d79a4635cad3a2', 'hex'),
      Buffer.from('10d4bd07a4c83afdf5c35090064d9df368fbc5e4409e3e2440bffccfaa056d4b', 'hex'),
      // Buffer.from('cb6888ad5120adf7b8bee06fc236f8cce90405a6a313fb3bc63dccb2c44ae1c0', 'hex'),
    ]
    const value = 0; // web3.utils.toWei('0.01', 'ether');
    const tokenAmount = 10;
    const nonce = (await multisig.nonce()).toString();
    console.log({ nonce });

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
    console.log(1);
    await tokenInstance.methods
      .approve(multisig.address, tokenAmount)
      .send({ from: senderAddr })
    console.log(2);

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
