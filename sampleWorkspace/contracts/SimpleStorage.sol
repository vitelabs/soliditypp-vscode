// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

contract SimpleStorage {
    uint storedData;

    function set(uint x) external {
        storedData = x;
    }

    function get() external view returns (uint) {
        return storedData;
    }
}
