pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2; // importing to be able to return struct in getter function

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
    Transfer[] public transfers;

    // to access the bool value in this mapping, indicate address, 
    // then specify id of transfer as follows "approvals[address][id]"
    mapping(address => mapping(id => bool)) public approvals; 

    constructor(address[] memory _approvers, uint _quorum) public {
        approvers = _approvers; //this is the initialized set of approvers upon contract deployment
        quorum = _quorum; //this is the amount of approvals needed in order to be able to send funds from this wallet
    }
    
    function getApprovers() external view returns(address[] memory) {
        return approvers;
    }

    function createTransfer(uint amount, address payable to) external onlyApprover() {
        transfers.push(Transfer(
            transfers.length,
            amount,
            to,
            0,
            false
        ));
    }

    function getTransfers() external view returns(Transfer[] memory) {
        return transfers;
    }

    function approveTransfer(uint id) external onlyApprover() {
        // this require statement is checking to make sure the specified request requires approvals. If already sent, it does not need to be approved
        require(transfers[id].sent == false, 'transfer has already been sent');
        // this require statement is checking the boolean value tied to this address for a specific transfer request
        require(approvals[msg.sender][id] == false, 'transfers cannot be approved twice by same user'); 
        approvals[msg.sender][id] = true; // this line will change the approval status for the user for this transfer request 
        transfers[id].approvals++; //incrementing the amount of approvals received for a transfer
        
        // as a second part of this function, it will check if the approved transfer now has enough approvals to be sent to the address
        if(transfers[id].approvals >= quorum) { 
            transfers[id].sent = true;
            address payable to = transfers[id].to;
            uint amount = transfers[id].amount;
            to.transfer(amount);
        }
    }

    receive() external payable {} // this is opening up the functionality for the smart contract to receive funds 

    modifier onlyApprover() {
        bool allowed = false
        for uint i = 0; i < approvers.length; i++) {
            if(approvers[i] == msg.sender) {
                allowed == true;
            }
        }
        require(allowed == true, 'only approvers are allowed to use this function');
        _;
    }
}