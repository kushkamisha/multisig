import * as utils from "ethereumjs-util";
import { ethers } from "hardhat";
import { ERC20 } from "./typechain-types";
import { BNLike } from "ethereumjs-util";
import { BigNumber } from "ethers";

const prefixedHash = (
  contractAddr: string,
  destination: string,
  value: string,
  data: string,
  nonce: BigNumber
): string => {
  const hash = ethers.utils.solidityKeccak256(
    ["address", "address", "uint256", "bytes", "uint256"],
    [contractAddr, destination, value, data, nonce]
  );
  return ethers.utils.solidityKeccak256(
    ["string", "bytes"],
    ["\x19Ethereum Signed Message:\n32", hash]
  );
};

// Recover address
const recover = (hashBuffer: Buffer, r: Buffer, s: Buffer, v: BNLike) => {
  const pub = utils.ecrecover(hashBuffer, v, r, s);
  return "0x" + utils.pubToAddress(pub).toString("hex");
};

const hashIt = (
  contractAddr: string,
  destination: string,
  value: string,
  data: string,
  nonce: BigNumber
) => {
  // 66 byte string, which represents 32 bytes of data
  let hash = prefixedHash(contractAddr, destination, value, data, nonce);
  hash = hash.slice(2, hash.length);
  return Buffer.from(hash, "hex");
};

const sign = async (hash: Buffer, prKey: Buffer) => {
  const { r, s, v } = utils.ecsign(hash, prKey);
  return { r, s, v };
};

const getEncodedTransferFrom = (
  token: ERC20,
  sender: string,
  recipient: string,
  amount: BigNumber
) => {
  return token.interface.encodeFunctionData("transferFrom", [
    sender,
    recipient,
    amount.toString(),
  ]); // todo: make sure is correct
};

export { hashIt, sign, recover, getEncodedTransferFrom };
