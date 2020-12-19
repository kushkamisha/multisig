// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;


contract MultiSig {
    uint256 public nonce;     // (only) mutable state
    address[] public owners;  // immutable state

    constructor(address[] memory owners_) {
        owners = owners_;
    }

    event Recovered(address recovered);

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
            emit Recovered(recovered);
            require(recovered == owners[i], "Incorrect owner address");
        }

        // If we make it here, all signatures are accounted for.
        nonce += 1;
        // destination.transfer(value);
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
