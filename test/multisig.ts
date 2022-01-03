const { getTokenInstance, getEncodedTransferFrom, sign } = require("../signMessage");

const dotenv = require('dotenv');
dotenv.config();
const { expect } = require('chai');
const Web3 = require('web3');
const BasicToken = artifacts.require("BasicToken");
const MultiSig = artifacts.require("MultiSig");

describe('Multisig', () => {
  const web3 = new Web3(Web3.givenProvider || 'http://localhost:8545');
  let multisig;
  let token;
  let prKeyBuffers;
  let owner,
      owner2,
      recipient;

  before(async () => {
    [
      owner,
      owner2,
      recipient,
    ] = [
      "0xEc6751439B9cC8a13c61B7c73A4081eBc08be42a",
      "0xF0723672096c5dc5718aFB3530CBf951aAa9E4c7",
      "0x431C7C93533e5C88C9C499EF3c39D0BbE1A0A3C6"
    ];
    prKeyBuffers = [
      Buffer.from('10d4bd07a4c83afdf5c35090064d9df368fbc5e4409e3e2440bffccfaa056d4b', 'hex'),
      Buffer.from('ed8fffe05cb4f0a411292ed8ccc1aa28404516e886bb46f1e3d79a4635cad3a2', 'hex'),
    ];
    const owners = [owner, owner2];
    const threshold = owners.length;
  
    multisig = await MultiSig.new(owners, threshold);
    token = await BasicToken.new(1000);
  })

  it('should work with seding ETH', async () => {
    const value = web3.utils.toWei('0.1', 'ether');
    const tokenAmount = 10;
    const nonce = (await multisig.nonce()).toString();

    const tokenInstance = getTokenInstance(token.address);
    const data = getEncodedTransferFrom({
      instance: tokenInstance,
      sender: owner,
      recipient: recipient,
      amount: tokenAmount,
    });

    const rs = [];
    const ss = [];
    const vs = [];
    for (let i = 0; i < prKeyBuffers.length; i++) {
      const { r, s, v } = sign({
        contractAddr: multisig.address,
        destination: recipient,
        value,
        data,
        nonce,
        prKeyBuffer: prKeyBuffers[i],
      });
      rs.push(r);
      ss.push(s);
      vs.push(v);
    }

    await web3.eth.sendTransaction({ to: multisig.address, from: owner, value });

    expect(await web3.eth.getBalance(multisig.address)).to.equal(value);
    // TODO: waffle: expect.balanceEthToChange(...)
    await multisig.execute(recipient, value, data, rs, ss, vs);
    expect(await web3.eth.getBalance(multisig.address)).to.equal('0');
  });

  it('should work with seding tokens', async () => {
    const value = 0; // web3.utils.toWei('0.01', 'ether');
    const tokenAmount = '10';
    const nonce = (await multisig.nonce()).toString();

    const tokenInstance = getTokenInstance(token.address);
    const data = getEncodedTransferFrom({
      instance: tokenInstance,
      sender: owner,
      recipient: recipient,
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
      .send({ from: owner })

    expect(await tokenInstance.methods.allowance(owner, multisig.address).call()).to.equal(tokenAmount);
    expect(await tokenInstance.methods.balanceOf(recipient).call()).to.equal('0');
    expect(await tokenInstance.methods.balanceOf(owner).call()).to.equal('1000');

    await multisig.execute(token.address, 0, data, rs, ss, vs);

    expect(await tokenInstance.methods.balanceOf(recipient).call()).to.equal(tokenAmount);
    expect(await tokenInstance.methods.balanceOf(owner).call()).to.equal('990');
    expect(await tokenInstance.methods.allowance(owner, multisig.address).call()).to.equal('0');
  });
});
