// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Company {
    address public owner;
    address public central; // The Central contract that deployed this

    // Mapping to store product hashes
    mapping(bytes32 => bool) private hashToTrue;

    constructor(address _owner) {
        owner = _owner;
        central = msg.sender; // Central contract is the deployer
    }

    modifier onlyCentralOrOwner() {
        require(msg.sender == owner || msg.sender == central, "Not authorized");
        _;
    }

    // Add products (hashes) to the contract
    function addProducts(address _ownerAddress, bytes32[] memory _productHashes)
        public
        onlyCentralOrOwner
        returns (string memory)
    {
        require(_ownerAddress == owner, "Owner mismatch");

        for (uint256 i = 0; i < _productHashes.length; i++) {
            hashToTrue[_productHashes[i]] = true;
        }

        return "Products added";
    }

    // Verify a product by hash
    function verifyProductByHash(bytes32 _hash) public view returns (bool) {
        return hashToTrue[_hash];
    }
}
