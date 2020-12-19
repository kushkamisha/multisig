// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

contract MultiSigUniversal {

  uint public nonce;
  uint public /* immutable */ threshold;
  mapping (address => bool) /* immutable */ isOwner;
  address[] public /* immutable */ ownersArr;

  constructor(uint threshold_, address[] memory owners_) {
    require(owners_.length <= 10);
    require(threshold_ <= owners_.length);
    require(threshold_ != 0);

    for (uint i=0; i<owners_.length; i++) {
      isOwner[owners_[i]] = true;
    }
    ownersArr = owners_;
    threshold = threshold_;
  }

  // Note that address recovered from signatures must be strictly increasing
  function execute(
    // uint8[] memory sigV,
    // bytes32[] memory sigR,
    // bytes32[] memory sigS,
    // address destination,
    // uint value,
    // bytes memory data
  ) external returns (bytes32) {
    // require(sigR.length == threshold);
    // require(sigR.length == sigS.length && sigR.length == sigV.length);

    // Follows ERC191 signature scheme: https://github.com/ethereum/EIPs/issues/191
    // bytes32 txHash = keccak256(abi.encodePacked(bytes1(uint8(0x19)), bytes1(uint8(0x0)), address(this), destination, value, data, nonce)); // or abi.encode

    // address lastAdd = address(0); // cannot have address(0) as an owner
    // for (uint i = 0; i < threshold; i++) {
    //     address recovered = ecrecover(txHash, sigV[i], sigR[i], sigS[i]);
    //     require(recovered > lastAdd);
    //     require(isOwner[recovered]);
    //     lastAdd = recovered;
    // }

    // // If we make it here all signatures are accounted for
    // nonce = nonce + 1;
    // (bool success,) = destination.call{ value: value }(data);
    // require(success);
    
    // return keccak256(abi.encodePacked(bytes1(uint8(0x19)), bytes1(uint8(0x0)), address(this), destination, value, data, nonce)); // or abi.encode
    return keccak256(abi.encodePacked(address(this)));
  }

  receive() external payable {}
}