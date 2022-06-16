// SPDX-License-Identifier: GPL-3.0
pragma soliditypp >=0.8.0;

contract Bar {
    uint public data = 123;

    function set(uinta a) external {
        data = a; 
    }
}