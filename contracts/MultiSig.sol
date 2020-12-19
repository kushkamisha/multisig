pragma solidity ^0.4.25;


contract MultiSig {
    uint256 public nonce;     // (only) mutable state
    address[] public owners;  // immutable state

    constructor(address[] owners_) public {
        owners = owners_;
    }

    event Recovered(address recovered);

    function transfer(
        address destination,
        uint256 value,
        bytes32[] sigR,
        bytes32[] sigS,
        uint8[] sigV
    )
        external
    {
        bytes32 hash = prefixed(keccak256(abi.encodePacked(
            address(this), destination, value, nonce
        )));

        for (uint256 i = 0; i < owners.length; i++) {
            address recovered = ecrecover(hash, sigV[i], sigR[i], sigS[i]);
            emit Recovered(recovered);
            require(recovered == owners[i], "Incorrect owner address");
        }

        // If we make it here, all signatures are accounted for.
        nonce += 1;
        destination.transfer(value);
    }

    function () external payable {}

    // Builds a prefixed hash to mimic the behavior of eth_sign.
    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32", hash));
    }
}
