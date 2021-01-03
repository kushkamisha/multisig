const BasicToken = artifacts.require("BasicToken");
const MultiSig = artifacts.require("MultiSig");

module.exports = function (deployer) {
  deployer.deploy(BasicToken, 1000);
  const owners = ["0x7403ab40723898eCf2450467Ba620EF7B77A6961"/*, "0x909Ae0dDf1ACaA3ccf32344922AE016Ab2558cBa", "0x826C1Cd8bFCF524A555e0E749dC2C72f3d1d1B68"*/]
  const threshold = owners.length;
  deployer.deploy(MultiSig, owners, threshold);
};
