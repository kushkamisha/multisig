import { getEncodedTransferFrom, sign } from "../signMessage";
import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BasicToken, MultiSig } from "../typechain";

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

  before(async () => {
    [owner, owner2, recipient, somebody] = await ethers.getSigners();

    prKeyBuffers = [
      prKeyStrToBuffer(
        "0x10d4bd07a4c83afdf5c35090064d9df368fbc5e4409e3e2440bffccfaa056d4b"
      ),
      prKeyStrToBuffer(
        "0xed8fffe05cb4f0a411292ed8ccc1aa28404516e886bb46f1e3d79a4635cad3a2"
      ),
    ];
    const owners = [owner.address, owner2.address];
    const threshold = owners.length;
    multisig = await (
      await ethers.getContractFactory("MultiSig")
    ).deploy(owners, threshold);
    token = await (await ethers.getContractFactory("BasicToken")).deploy(1000); // todo: make 100e18
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
    await somebody.sendTransaction({
      to: multisig.address,
      value: value,
    });
    expect(await ethers.provider.getBalance(multisig.address)).to.equal(value);
    // TODO: waffle: expect.balanceEthToChange(...)
    await multisig.execute(recipient.address, value, data, rs, ss, vs);
    expect(await ethers.provider.getBalance(multisig.address)).to.equal("0");
  });

  it("should work with seding tokens", async () => {
    const value = 0;
    const tokenAmount = "10";
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
    expect(await token.balanceOf(owner.address)).to.equal("1000");

    await multisig.execute(token.address, value, data, rs, ss, vs);

    expect(await token.balanceOf(recipient.address)).to.equal(tokenAmount);
    expect(await token.balanceOf(owner.address)).to.equal("990");
    expect(await token.allowance(owner.address, multisig.address)).to.equal(
      "0"
    );
  });
});
