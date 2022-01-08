// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

contract MultiSig {
    uint256 public nonce;
    uint256 public immutable threshold;
    address[] public owners;
    mapping (address => bool) public isOwner;

    constructor(address[] memory owners_, uint256 threshold_) {
        require(threshold_ <= owners_.length && threshold_ > 0, "Invalid threshold");
        threshold = threshold_;
        owners = owners_;
        for (uint256 i = 0; i < owners_.length; i++) {
            isOwner[owners_[i]] = true;
        }
    }

    function execute(
        address payable destination,
        uint256 value,
        bytes memory data,
        bytes32[] memory sigR,
        bytes32[] memory sigS,
        uint8[] memory sigV
    ) external {
        require(
            sigR.length >= threshold && sigR.length == sigS.length && sigR.length == sigV.length,
            "Invalid number of message signers"
        );

        bytes32 hash = prefixed(keccak256(abi.encodePacked(
            address(this), destination, value, data, nonce
        )));

        for (uint i = 0; i < threshold; i++) {
            address recovered = ecrecover(hash, sigV[i], sigR[i], sigS[i]);
            require(recovered > address(0), "Incorrect address");
            require(isOwner[recovered], "Address is not an owner");
        }

        // We are allowed to make a transaction
        nonce += 1;
        (bool success,) = destination.call{ value: value }(data);
        require(success);
    }

    receive() external payable {}

    // Builds a prefixed hash to mimic the behavior of eth_sign.
    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }
}
