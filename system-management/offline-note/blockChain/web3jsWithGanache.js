const fs = require("fs"),
    path = require("path"),
    solc = require("solc"),
    Web3 = require("web3"),
    Web3Utils = require("web3-utils")
    // ,BN = require("bn.js")
;

//  link local etherum server
const sameWeb3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
const web3 = new Web3("http://127.0.0.1:7545");

function NumberHandler(number) {
    // let value = new BN(number);
    let value = Web3Utils.toBN(number);

    // Web3.utils.toHex(value);
    const hex = Web3Utils.toHex(value); //  内容转16进制
    Web3Utils.hexToNumber(hex);
    Web3Utils.isAddress("0x00"); //  查询地址
}

function Block() {
    web3.eth.getBlockNumber().then(length => {
        console.log(length);
        length > 0 && web3.eth.getBlock(0, false).then(blockInfo => {
            console.log("Get a block without any transcation");
        });
    });
    //  a block maybe have several transcation, need index to get which one do you need.
    web3.eth.getTransactionFromBlock("latest", 0).then(transcationInfo => {
        console.log("Get one single transcation from a block");
    });
    web3.eth.isMining().then(isMining => {
        console.log("Is set coin");
    });
    web3.eth.getCoinbase().then(accountHash => {

    });
}

function Account() {
    web3.eth.getAccounts().then(accounts => {
        console.log("Get all accounts in the eth");
    });
    const password = (Math.round(Math.random() * 6)).toString();
    web3.eth.personal.newAccount(password).then(accountHash => {

    })
}

function trade() {
    web3.eth.getBalance("").then(balance => {
        Web3Utils.fromWei(balance, "ether");
    });
    // it's average price base on the several block gas price
    web3.eth.getGasPrice().then(price => {
        Web3Utils.fromWei(price, "ether");
    })
    web3.eth.sendTransaction({
        from: "",
        to: "",
        value: Web3Utils.fromWei("1", "ether")
    }).then();
    web3.eth.getTransactionReceipt("").then(transcationReceiptInfo => {

    });
}

function Batch() {
    web3.eth.getNodeInfo().then(info => {
        console.log(info);
    });
    web3.eth.net.getId().then(info => {
        console.log(info);
    });
    //  从solidity合约里复制的abi
    var abi = [{
                "inputs": [{
                    "internalType": "unit256",
                    "name": "_number",
                    "type": "unit256"
                }],
                "name": "setNumber",
                "outputs": [],
                "stateMutability": 'nonpayable',
                "type": "function"
            },
            {
                "inputs": [{
                    "internalType": "unit256",
                    "name": "",
                    "type": "unit256"
                }],
                "stateMutability": 'view',
                "type": "function"
            }
        ],
        address = "Already exist contract address, if new, don't need it.",
        contract = new web3.eth.Contract(abi, address),
        batch = new web3.BatchRequest();

    // batch.add(web3.eth.getBalance.request("Account address", "latest",   (error, result) => {console.log(balance);}));
    //  call means read, no cost. send means write, need spend gas.
    batch.add(contract.methods.getNumber().call.request({
        from: "Account address"
    }, (number) => {
        console.log(number);
    }));
    batch.execute();
    contract.deploy({
        data: "0x123412341234123412341234123412341234123412341234123412342134123412341234123412"
    }).send({
        from: "0xu1q2437192348710239481092384701293847102",
        gas: 1500000,
        gasPrice: "1000000"
    }).then(result => {

    });

    const sendPromise = contract.methods.setNumber().send({ from: "0x17290347120394871209394" });
    sendPromise.on("receipt", receipt => {
        console.log("transcation done with receipt: " + receipt);
    });
    //  get all event about this contract
    contract.getPastEvents("AllEvents", {
        fromBlock: 0,
        toBlock: "latest"
    }).then(result => {

    });
}

//  the VoteTest
const sourceCode = fs.readFileSync(path.join(__dirname, "../contracts/VoteTest.sol"), "utf8").toString(),
    compiledCode = solc.compile(sourceCode);

console.log(compiledCode);

const contractName = "VoteTest",
    // abi = JSON.parse(fs.readFileSync(path.join(__dirname, "../contracts/VoteTest.abi")).toString()),
    // bytecode = "0x60806040523480156200001157600080fd5b50604051620007e0380380620007e083398181016040528101906200003791906200018d565b80600190805190602001906200004f92919062000057565b5050620002e4565b82805482825590600052602060002090810192821562000096579160200282015b828111156200009557825182559160200191906001019062000078565b5b509050620000a59190620000a9565b5090565b5b80821115620000c4576000816000905550600101620000aa565b5090565b6000620000df620000d98462000207565b620001de565b90508083825260208201905082856020860282011115620001055762000104620002aa565b5b60005b858110156200013957816200011e888262000176565b84526020840193506020830192505060018101905062000108565b5050509392505050565b600082601f8301126200015b576200015a620002a5565b5b81516200016d848260208601620000c8565b91505092915050565b6000815190506200018781620002ca565b92915050565b600060208284031215620001a657620001a5620002b4565b5b600082015167ffffffffffffffff811115620001c757620001c6620002af565b5b620001d58482850162000143565b91505092915050565b6000620001ea620001fd565b9050620001f8828262000240565b919050565b6000604051905090565b600067ffffffffffffffff82111562000225576200022462000276565b5b602082029050602081019050919050565b6000819050919050565b6200024b82620002b9565b810181811067ffffffffffffffff821117156200026d576200026c62000276565b5b80604052505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b620002d58162000236565b8114620002e157600080fd5b50565b6104ec80620002f46000396000f3fe608060405234801561001057600080fd5b50600436106100575760003560e01c8063392e66781461005c57806365615ac61461008c5780637021939f146100bc578063900e009b146100ec578063b13c744b14610108575b600080fd5b610076600480360381019061007191906102a0565b610138565b6040516100839190610327565b60405180910390f35b6100a660048036038101906100a191906102a0565b61019b565b6040516100b3919061035d565b60405180910390f35b6100d660048036038101906100d191906102a0565b6101d6565b6040516100e3919061035d565b60405180910390f35b610106600480360381019061010191906102a0565b6101f6565b005b610122600480360381019061011d91906102cd565b610252565b60405161012f9190610342565b60405180910390f35b600080600090505b60018054905081101561019057826001828154811061016257610161610454565b5b9060005260206000200154141561017d576001915050610196565b8080610188906103dc565b915050610140565b50600090505b919050565b60006101a682610138565b6101af57600080fd5b60008083815260200190815260200160002060009054906101000a900460ff169050919050565b60006020528060005260406000206000915054906101000a900460ff1681565b6101ff81610138565b61020857600080fd5b600160008083815260200190815260200160002060008282829054906101000a900460ff166102379190610378565b92506101000a81548160ff021916908360ff16021790555050565b6001818154811061026257600080fd5b906000526020600020016000915090505481565b60008135905061028581610488565b92915050565b60008135905061029a8161049f565b92915050565b6000602082840312156102b6576102b5610483565b5b60006102c484828501610276565b91505092915050565b6000602082840312156102e3576102e2610483565b5b60006102f18482850161028b565b91505092915050565b610303816103af565b82525050565b610312816103bb565b82525050565b610321816103cf565b82525050565b600060208201905061033c60008301846102fa565b92915050565b60006020820190506103576000830184610309565b92915050565b60006020820190506103726000830184610318565b92915050565b6000610383826103cf565b915061038e836103cf565b92508260ff038211156103a4576103a3610425565b5b828201905092915050565b60008115159050919050565b6000819050919050565b6000819050919050565b600060ff82169050919050565b60006103e7826103c5565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82141561041a57610419610425565b5b600182019050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b600080fd5b610491816103bb565b811461049c57600080fd5b50565b6104a8816103c5565b81146104b357600080fd5b5056fea26469706673582212201d63d85fd3a0d90438d1887589fa8c0d0b61d3620e57c61ab5868d850a28de6464736f6c63430008070033",
    abi = compiledCode.contracts[contractName].interface,
    bytecode = compiledCode.contracts[contractName].bytecode,
    accountAddress = "0x54F7636E3D02E6Fb19CC1733B908119e3C950dB8"
candidates = ["King", "Queen", "Jake", "Joker"].map(item => Web3Utils.hexToBytes(Web3Utils.toHex(item))),
    contract = new Web3.eth.contract(abi);

contract.deploy({
    data: bytecode,
    arguments: [candidates]
}).send({
    from: accountAddress,
    gas: web3.eth.estimateGas({ data: bytecode })
}).on("receipt", receipt => {
    const deployContract = new web3.eth.contract(abi, receipt.contractAddress);

    // deployContract.methods.candidate(1);
    deployContract.methods.voteToCandidate(candidates[1]).send({
        from: accountAddress
    }).then(result => {
        return deployContract.methods.getVoteOfCandidate(candidates[1]).call({
            from: accountAddress
        });
    }).then(result => {
        console.log(candidates[1] + " has votes: " + result);
    });
});