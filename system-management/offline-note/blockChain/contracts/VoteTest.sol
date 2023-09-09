// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
* It has to be a chairman create this vote and send the proposal list;
* Only chairman can give the vote right to people;
* One people can only vote once, including chairman;
* People can delegate to other to help him vote, even him has a delegated too;
* No one can vote to himself.
 */

 contract Ballot {

    enum VoterStatus {
        NoRight,
        HasTicker,
        Voted,
        Ban
    }

    struct Voter {
        VoterStatus status;
        uint ticker;
        address[] delegateFrom;
        address delegateTo;
        uint delegateTicker;
    }

    struct Proposal {
        bytes32 name;
        address addr;
        uint ticker;
    }

    mapping(address => Voter) public voters;

    Proposal[] public proposals;

    address chairman;

    constructor(bytes32[] memory _proposals, address _addr) {
        chairman = msg.sender;
        for (uint i = 0; i < _proposals.length; i++) {
            proposals.push(Proposal({
                name: _proposals[i],
                addr: _addr,
                ticker: 0
            }));
        }
    }

    function addVoter(address _voterAddr) external {
        require(msg.sender == chairman, "You have not right to add voter!");
        require(voters[_voterAddr].status != VoterStatus.NoRight, "Address already add to voter!");
        voters[_voterAddr].ticker = 1;
        voters[_voterAddr].status = VoterStatus.HasTicker;
    }

    //  @notice need to get index in client side
    function voteToIndex(uint toIndex) external {
        Voter memory voter = voters[msg.sender];
        require(voter.status == VoterStatus.HasTicker);
        proposals[toIndex].ticker = voter.ticker + voter.delegateTicker;
    }

    function delegateTo(address _toAddr) external {
        Voter memory target = voters[_toAddr];
        require(voters[msg.sender].status != VoterStatus.HasTicker, "You don't has ticker!");
        require(voters[msg.sender].delegateTo == address(0), "You already delegate to other!");
        require(target.status == VoterStatus.HasTicker, "Target address is no allow!");
        voters[msg.sender].delegateTo = _toAddr;
        voters[_toAddr].delegateFrom.push(msg.sender);
        voters[_toAddr].delegateTicker += voters[msg.sender].ticker + voters[msg.sender].delegateTicker;
        voters[msg.sender].ticker = 0;
        voters[msg.sender].delegateTicker = 0;
        voters[msg.sender].status = VoterStatus.Ban;
    }

 }