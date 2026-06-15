// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Company.sol";

contract Central {
    // Track wallet -> company contract
    mapping(address => address) private walletAddressToSmartContractAddress;
    address[] public companyContracts;

    // Create new company contract for the caller
    function createSmartContract() public {
        Company companyContract = new Company(msg.sender);
        companyContracts.push(address(companyContract));
        walletAddressToSmartContractAddress[msg.sender] = address(companyContract);
    }

    // Get a company contract by wallet address
    function getCompanySmartContractAddress(address _walletAddress)
        public
        view
        returns (address)
    {
        return walletAddressToSmartContractAddress[_walletAddress];
    }

    // Add products to a company's contract
    function addproduct(
        address _ownerAddress,
        address _contractAddress,
        bytes32[] memory _productHashes
    ) public returns (string memory) {
        return Company(_contractAddress).addProducts(_ownerAddress, _productHashes);
    }

    // Verify product using hash
    function checkProductByHash(address _contractAddress, bytes32 _hash)
        public
        view
        returns (bool)
    {
        return Company(_contractAddress).verifyProductByHash(_hash);
    }
}
