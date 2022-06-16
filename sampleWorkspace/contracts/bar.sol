contract Bar {
    uint public data = 123;

    function set(uint a) external {
        data = a; 
    }
}