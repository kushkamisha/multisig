const BasicToken = artifacts.require("BasicToken");
const MultiSig = artifacts.require("MultiSig");

module.exports = function (deployer) {
  deployer.deploy(BasicToken, 1000);
  const owners = ["0xEc6751439B9cC8a13c61B7c73A4081eBc08be42a", "0xF0723672096c5dc5718aFB3530CBf951aAa9E4c7", "0x431C7C93533e5C88C9C499EF3c39D0BbE1A0A3C6"]
  const threshold = owners.length - 1;
  deployer.deploy(MultiSig, owners, threshold);
};
