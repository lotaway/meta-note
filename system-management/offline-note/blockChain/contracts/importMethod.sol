// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library importMethod {
    function sum(uint a, uint b) public pure returns(uint) {
        return a + b;
    }

    function sub(uint a, uint b) public pure returns(uint) {
        return a * b;
    }
}