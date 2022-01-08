import { getEncodedTransferFrom, sign } from "../signMessage";
import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BasicToken, MultiSig } from "../typechain-types";

describe("Multisig", () => {
  let multisig: MultiSig;
  let token: BasicToken;
  let prKeyBuffers: Buffer[];
  let owner: SignerWithAddress;
  let owner2: SignerWithAddress;
  let recipient: SignerWithAddress;
  let somebody: SignerWithAddress;

  const prKeyStrToBuffer = (prKey: string) =>
    Buffer.from(prKey.replace(/0x/g, ""), "hex");
  const toWei = (val: string | number) =>
    ethers.utils.parseEther(val.toString());

  before(async () => {
    [owner, owner2, recipient, somebody] = await ethers.getSigners();

    const { privateKey: prKey1 } = ethers.Wallet.fromMnemonic(
      process.env.MNEMONIC || "",
      "m/44'/60'/0'/0/0"
    );
    const { privateKey: prKey2 } = ethers.Wallet.fromMnemonic(
      process.env.MNEMONIC || "",
      "m/44'/60'/0'/0/1"
    );

    prKeyBuffers = [prKeyStrToBuffer(prKey1), prKeyStrToBuffer(prKey2)];
    const owners = [owner.address, owner2.address];
    const threshold = owners.length;
    multisig = (await (
      await ethers.getContractFactory("MultiSig")
    ).deploy(owners, threshold)) as MultiSig;
    token = (await (
      await ethers.getContractFactory("BasicToken")
    ).deploy(toWei(100))) as BasicToken;
  });

  it("should work with seding ETH", async () => {
    const value = ethers.utils.parseEther("0.1");
    const nonce = await multisig.nonce();
    const data = "0x";

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
        prKeyBuffers[i]
      );
      rs.push(r);
      ss.push(s);
      vs.push(v);
    }

    // Send ETH to multisig
    await somebody.sendTransaction({
      to: multisig.address,
      value: value,
    });
    expect(await ethers.provider.getBalance(multisig.address)).to.equal(value);
    const recipBalBefore = await ethers.provider.getBalance(recipient.address);

    await multisig.execute(recipient.address, value, data, rs, ss, vs);

    expect(await ethers.provider.getBalance(multisig.address)).to.equal(0);
    const recipBalAfter = await ethers.provider.getBalance(recipient.address);
    expect(recipBalAfter.sub(recipBalBefore)).to.equal(value);
  });

  it("should work with seding tokens", async () => {
    const value = 0;
    const tokenAmount = toWei(10);
    const nonce = await multisig.nonce();

    const data = getEncodedTransferFrom(
      token,
      owner.address,
      recipient.address,
      tokenAmount
    );
    const rs = [];
    const ss = [];
    const vs = [];
    for (let i = 0; i < prKeyBuffers.length; i++) {
      const { r, s, v } = await sign(
        multisig.address,
        token.address,
        value.toString(),
        data,
        nonce,
        prKeyBuffers[i]
      );
      rs.push(r);
      ss.push(s);
      vs.push(v);
    }

    // Allow MultiSig to spend tokens using transferFrom
    await token.connect(owner).approve(multisig.address, tokenAmount);

    expect(await token.allowance(owner.address, multisig.address)).to.equal(
      tokenAmount
    );
    expect(await token.balanceOf(recipient.address)).to.equal("0");
    expect(await token.balanceOf(owner.address)).to.equal(toWei(100));

    await multisig.execute(token.address, value, data, rs, ss, vs);

    expect(await token.balanceOf(recipient.address)).to.equal(tokenAmount);
    expect(await token.balanceOf(owner.address)).to.equal(toWei(90));
    expect(await token.allowance(owner.address, multisig.address)).to.equal(
      "0"
    );
  });
});
