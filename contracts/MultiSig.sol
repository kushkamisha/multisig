// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.5;

contract MultiSig {
    uint256 public nonce;
    uint256 public immutable threshold;
    address[] public owners; // immutable

    constructor(address[] memory owners_, uint256 threshold_) {
        require(threshold_ <= owners_.length && threshold_ > 0, "Invalid threshold");
        threshold = threshold_;
        owners = owners_;
    }

    function execute(
        address payable destination,
        uint256 value,
        bytes memory data,
        bytes32[] memory sigR,
        bytes32[] memory sigS,
        uint8[] memory sigV
    )
        external
    {
        bytes32 hash = prefixed(keccak256(abi.encodePacked(
            address(this), destination, value, data, nonce
        )));

        for (uint256 i = 0; i < owners.length; i++) {
            address recovered = ecrecover(hash, sigV[i], sigR[i], sigS[i]);
            require(recovered == owners[i], "Incorrect owner address");
        }

        // We are allowed to make a transaction
        nonce += 1;
        (bool success,) = destination.call{ value: value }(data);
        require(success);
    }

    receive () external payable {}

    // Builds a prefixed hash to mimic the behavior of eth_sign.
    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32", hash));
    }
}
