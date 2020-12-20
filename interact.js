// // Run from truffle console
// const instance = await MultiSig.deployed()
// web3.eth.sendTransaction({ to: instance.address, from: '0x7403ab40723898eCf2450467Ba620EF7B77A6961', value: web3.utils.toWei('1.1', 'ether') })
// web3.eth.getBalance(instance.address)
// instance.transfer('0x909Ae0dDf1ACaA3ccf32344922AE016Ab2558cBa', '1000000000000000000', ['0xf7ce29aee06517b25771b7150c69c7ad67655c99909cc7e5f3b25fa76ace0f77'], ['0x2d46d95c81bd875fc9a543a3d74f0814ceac8ee5bf2ab72c415f612a4d9816e5'], [27])

// instance.execute('0x909Ae0dDf1ACaA3ccf32344922AE016Ab2558cBa', '10000000000000000', '0x0')

multisig = await MultiSig.deployed();
token = await BasicToken.deployed();
await token.approve(multisig.address, 10);
(await token.allowance('0x7403ab40723898eCf2450467Ba620EF7B77A6961', multisig.address)).toString();