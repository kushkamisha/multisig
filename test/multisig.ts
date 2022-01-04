// const { getTokenInstance, getEncodedTransferFrom, sign } = require("../signMessage");

// const dotenv = require('dotenv');
// dotenv.config();
// const { expect } = require('chai');
// const Web3 = require('web3');
// const BasicToken = artifacts.require("BasicToken");
// const MultiSig = artifacts.require("MultiSig");

import { getEncodedTransferFrom, sign } from "../signMessage";
import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Wallet } from "ethers";
import { BasicToken, MultiSig } from "../typechain";
import { BaseProvider } from "@ethersproject/providers";

describe("Multisig", () => {
  // let provider: BaseProvider;
  let multisig: MultiSig;
  let token: BasicToken;
  let prKeyBuffers: Buffer[];
  // let wallets: Wallet[];
  let somebody: SignerWithAddress;
  let owner: Wallet;
  let owner2: Wallet;
  let recipient: Wallet;

  const createWallet = (index: number) =>
    Wallet.fromMnemonic(
      process.env.MNEMONIC as string,
      `m/44'/60'/0'/0/${index}`
    );
  const prKeyStrToBuffer = (prKey: string) =>
    Buffer.from(prKey.replace(/0x/g, ""), "hex");

  before(async () => {
    [somebody] = await ethers.getSigners();
    // provider = ethers.getDefaultProvider("homestead");
    // wallets = [...Array(3).keys()].map((i) => createWallet(i));
    [owner, owner2, recipient] = [
      new Wallet(
        "0x10d4bd07a4c83afdf5c35090064d9df368fbc5e4409e3e2440bffccfaa056d4b"
      ),
      new Wallet(
        "0xed8fffe05cb4f0a411292ed8ccc1aa28404516e886bb46f1e3d79a4635cad3a2"
      ),
      new Wallet(
        "0x3c9c803c3c2c99045e6b76857449af3e916af2514697ed08bdd3940e25030950"
      ),
    ];
    // console.log({ wallets });

    console.log({
      owner: owner.address,
      owner2: owner2.address,
      recipient: recipient.address,
    });
    // console.log(
    //   wallets[0].privateKey,
    //   wallets[1].privateKey,
    //   wallets[2].privateKey
    // );
    prKeyBuffers = [
      prKeyStrToBuffer(
        "0x10d4bd07a4c83afdf5c35090064d9df368fbc5e4409e3e2440bffccfaa056d4b"
      ),
      prKeyStrToBuffer(
        "0xed8fffe05cb4f0a411292ed8ccc1aa28404516e886bb46f1e3d79a4635cad3a2"
      ),
      // prKeyStrToBuffer(
      //   "0x3c9c803c3c2c99045e6b76857449af3e916af2514697ed08bdd3940e25030950"
      // ),
    ];
    console.log(prKeyBuffers);
    const owners = [owner.address, owner2.address];
    const threshold = owners.length;
    multisig = await (
      await ethers.getContractFactory("MultiSig")
    ).deploy(owners, threshold);
    token = await (await ethers.getContractFactory("BasicToken")).deploy(1000); // todo: make 100e18
  });

  it("should work with seding ETH", async () => {
    const value = ethers.utils.parseEther("0.1");
    const tokenAmount = "10";
    const nonce = (await multisig.nonce()).toString();
    // const tokenInstance = await ethers.getContractFactory
    // console.log({ tokenInstance });

    const data = getEncodedTransferFrom(
      token,
      owner.address,
      recipient.address,
      tokenAmount
    );
    console.log({ data });
    const rs = [];
    const ss = [];
    const vs = [];
    for (let i = 0; i < prKeyBuffers.length; i++) {
      const { r, s, v } = await sign(
        multisig.address,
        recipient.address,
        value.toString(),
        data,
        nonce,
        [owner, owner2][i],
        prKeyBuffers[i]
      );
      rs.push(r);
      ss.push(s);
      vs.push(v);
    }
    console.log({ rs, ss, vs });
    // await web3.eth.sendTransaction({
    //   to: multisig.address,
    //   from: owner,
    //   value,
    // });
    await somebody.sendTransaction({
      to: multisig.address,
      value: value,
    });
    // await provider.sendTransaction(tx);
    expect(await ethers.provider.getBalance(multisig.address)).to.equal(value);
    //     // TODO: waffle: expect.balanceEthToChange(...)
    await multisig.execute(recipient.address, value, data, rs, ss, vs);
    expect(await ethers.provider.getBalance(multisig.address)).to.equal("0");
  });

  //   it('should work with seding tokens', async () => {
  //     const value = 0; // web3.utils.toWei('0.01', 'ether');
  //     const tokenAmount = '10';
  //     const nonce = (await multisig.nonce()).toString();
  //     const tokenInstance = getTokenInstance(token.address);
  //     const data = getEncodedTransferFrom({
  //       instance: tokenInstance,
  //       sender: owner,
  //       recipient: recipient,
  //       amount: tokenAmount,
  //     });
  //     const rs = [];
  //     const ss = [];
  //     const vs = [];
  //     for (let i = 0; i < prKeyBuffers.length; i++) {
  //       const { r, s, v } = sign({
  //         contractAddr: multisig.address,
  //         destination: token.address,
  //         value,
  //         data,
  //         nonce,
  //         prKeyBuffer: prKeyBuffers[i],
  //       });
  //       rs.push(r);
  //       ss.push(s);
  //       vs.push(v);
  //     }
  //     // Allow MultiSig to spend tokens using transferFrom
  //     await tokenInstance.methods
  //       .approve(multisig.address, tokenAmount)
  //       .send({ from: owner })
  //     expect(await tokenInstance.methods.allowance(owner, multisig.address).call()).to.equal(tokenAmount);
  //     expect(await tokenInstance.methods.balanceOf(recipient).call()).to.equal('0');
  //     expect(await tokenInstance.methods.balanceOf(owner).call()).to.equal('1000');
  //     await multisig.execute(token.address, 0, data, rs, ss, vs);
  //     expect(await tokenInstance.methods.balanceOf(recipient).call()).to.equal(tokenAmount);
  //     expect(await tokenInstance.methods.balanceOf(owner).call()).to.equal('990');
  //     expect(await tokenInstance.methods.allowance(owner, multisig.address).call()).to.equal('0');
  //   });
});
