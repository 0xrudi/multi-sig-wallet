const { expectRevert } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { assert } = require('console');
const Wallet = artifacts.require('Wallet');

contract('Wallet', (accounts) => {
    let wallet;
    beforeEach(async () => {
        // initializes the wallet contract and lists the first 3 addresses from truffle as approvers and requires quorum of 2
        wallet = await Wallet.new([accounts[0], accounts[1], accounts[2]], 2);
        // this will send 1000 wei to the smart contract from the first address listed in truffle
        await web3.eth.sendTransaction({from: accounts[0], to:wallet.address, value: 1000});
    });
    
    it('should have correct approvers and quorum', async () => {
        const approvers = await wallet.getApprovers();
        const quorum = await wallet.quorum();
        assert(approvers.length === 3);
        assert(approvers[0] === accounts[0]);
        assert(approvers[1] === accounts[1]);
        assert(approvers[2] === accounts[2]);
        assert(quorum.toNumber() === 2);  
    }); 

    it('should create transfers', async () => {
        await wallet.createTransfer(100, accounts[5], {from: accounts[0]});
        const transfers = await wallet.getTransfers();
        assert(transfers.length === 1);
        assert(transfers[0].id === '0');
        assert(transfers[0].amount === '100');
        assert(transfers[0].to === accounts[5]);
        assert(transfers[0].approvals === '0');
        assert(transfers[0].sent === false);
    });

    it('should NOT create transfers if sender is not approved', async () => {
        await expectRevert(
            wallet.createTransfer(100, accounts[5], {from: accounts[4]}),
            'only approvers are allowed to use this function'
        );
    });

    it('should approve transfer and incriment approvals', async () => {
        await wallet.createTransfer(100, accounts[5], {from: accounts[0]});
        await wallet.approveTransfer(0, {from: accounts[1]});
        const transfers = await wallet.getTransfers();
        const balance = await web3.eth.getBalance(wallet.address);
        assert(transfers[0].approvals === '1');
        assert(transfers[0].sent === false);
        assert(balance === 1000);
    });

    // this test should pass with 2 valid approvers calling approveTransfer function
    it('should approve transfer and send transaction', async () => {
        const balanceBefore = web3.utils.toBN(await web3.eth.getBalance(accounts[6]));
        await wallet.createTransfer(100, accounts[6], {from: accounts[0]});
        await wallet.approveTransfer(0, {from: accounts[1]});
        await wallet.approveTransfer(0, {from: accounts[2]});
        const balanceAfter = web3.utils.toBN(await web3.eth.getBalance(accounts[6]));
        const transfers = await wallet.getTransfers();
        assert(balanceAfter.sub(balanceBefore).toNumber === 100);
        assert(transfers[0].approvals === '2');
        assert(transfers[0].sent === true);
    });

    // This test is intended to fail by checking the logic in the onlyApprover modifier
    it('should NOT be able to approve transfer if sender is not an approver', async () => {
        await wallet.createTransfer(100, accounts[5], {from: accounts[0]});
        await expectRevert(
            wallet.approveTransfer(0, {from:accounts[5]}), // only accounts 0, 1, and 2 are listed as valid approvers for this wallet
            'only approvers are allowed to use this function'
        );
    });

    // This test is intended to fail, once a transfer reaches quorum and is sent, no users should be able to interact with it
    it('should NOT approve transfer if the transfer is already sent', async () => {
        await wallet.createTransfer(100, accounts[6], {from: accounts[0]});
        await wallet.approveTransfer(0, {from: accounts[1]});
        await wallet.approveTransfer(0, {from: accounts[2]});
        await expectRevert(
            wallet.approveTransfer(0, {from: accounts[0]}),
            'transfer has already been sent'
        );
    });

    // This test is intended to fail, it will test require statement in approveTransfer that approvers can't approve twice
    it('should NOT approve the same transfer twice', async () => {
        await wallet.createTransfer(100, accounts[6], {from: accounts[0]});
        await wallet.approveTransfer(0, {from: accounts[1]});
        await expectRevert(
            wallet.approveTransfer(0, {from: accounts[1]}),
            'transfers cannot be approved twice by same user'
        );
    });
});