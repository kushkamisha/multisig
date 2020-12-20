// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BasicToken is ERC20 {
  constructor(uint256 initialSupply) ERC20("BasicToken", "BST") {
    _mint(msg.sender, initialSupply);
  }
}
