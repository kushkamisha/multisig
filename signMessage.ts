import fs from "fs";
import path from "path";
// import Web3 from "web3";
import * as utils from "ethereumjs-util";
import { Contract, Wallet } from "ethers";
import { ethers } from "hardhat";
import { ERC20 } from "./typechain";
import { Interface } from "ethers/lib/utils";
import { BNLike } from "ethereumjs-util";

// const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));

const prefixedHash = (
  contractAddr: string,
  destination: string,
  value: string,
  data: string,
  nonce: string
): string => {
  const hash = ethers.utils.solidityKeccak256(
    ["string", "string", "string", "string", "string"],
    [contractAddr, destination, value, data, nonce]
  ); // todo: make sure is the same as `web3.utils.soliditySha3`
  // const hash = web3.utils.soliditySha3(
  //   contractAddr,
  //   destination,
  //   value,
  //   data,
  //   nonce
  // ) as string;
  // return web3.utils.soliditySha3(
  //   "\x19Ethereum Signed Message:\n32",
  //   hash
  // ) as string;
  return ethers.utils.solidityKeccak256(
    ["string", "string"],
    ["\x19Ethereum Signed Message:\n32", hash]
  );
};

// Recover address
const recover = (hashBuffer: Buffer, r: Buffer, s: Buffer, v: BNLike) => {
  const pub = utils.ecrecover(hashBuffer, v, r, s);
  return "0x" + utils.pubToAddress(pub).toString("hex");
};

const sign = async (
  contractAddr: string,
  destination: string,
  value: string,
  data: string,
  nonce: string,
  wallet: Wallet,
  prKeyBuffer: Buffer
) => {
  // 66 byte string, which represents 32 bytes of data
  let hash = prefixedHash(contractAddr, destination, value, data, nonce);
  hash = hash.slice(2, hash.length);
  const hashBuffer = Buffer.from(hash, "hex");

  // 32 bytes of data in Uint8Array
  // const messageHashBinary = ethers.utils.arrayify(hash);

  // To sign the 32 bytes of data, make sure you pass in the data
  // const signature = await wallet.signMessage(messageHashBinary);
  // console.log({ signature });
  // console.log({ utils });
  const { r, s, v } = utils.ecsign(hashBuffer, prKeyBuffer);
  console.log({ r, s, v });

  return {
    r: "0x" + r.toString("hex"),
    s: "0x" + s.toString("hex"),
    v,
  };
};

// const getTokenInstance = (contractAddr: string) => {
//   const { abi } = JSON.parse(
//     fs.readFileSync(
//       path.join(__dirname, "build", "contracts", "BasicToken.json"),
//       "utf8"
//     )
//   );
//   return new ethers.utils.Interface(abi);
// };

const getEncodedTransferFrom = (
  token: ERC20,
  sender: string,
  recipient: string,
  amount: string
) => {
  return token.interface.encodeFunctionData("transferFrom", [
    sender,
    recipient,
    amount,
  ]); // todo: make sure is correct
};

export { sign, recover /*, getTokenInstance */, getEncodedTransferFrom };
