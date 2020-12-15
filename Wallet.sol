pragma solidity ^0.6.0;

contract Wallet {
    address[] public approvers;
    unit public quorum;
    struct Transfer {
        uint id; // the identification number for this request
        uint amount; // amount of ether to be sent in this transfer
        address payable recipient;
        uint approvals; //amount of approvals received for request
        bool sent; // returns true or false for status of transfer
    }
    mapping(uint => Transfer) public transfers;
    uint public nextId;

    constructor(address[] memory _approvers, uint _quorum) public {
        approvers = _approvers; //this is the initialized set of approvers upon contract deployment
        quorum = _quorum; //this is the amount of approvals needed in order to be able to send funds from this wallet
    }
    
    function getApprovers() external view returns(address[] memory) {
        return approvers;
    }

    function createTransfer(uint amount, address payable to) external {
        transfers[nextId] = Transfer(
            nextId,
            amount,
            to,
            0,
            false
        );
        nextId++;
    }
}