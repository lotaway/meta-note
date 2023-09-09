// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./importMethod.sol";

library insideMethod {

    function some() public {

    }

}

contract AboutUseLib {

    using importMethod for uint;   //  link uint var can direct call
    uint num = 100;

    function useLib() public {
        insideMethod.some();
        //  normal call
        num.sub(10);
        //  uint var direct call
    }

}

contract ArrayHandler {

    uint[] arr1;
    uint[] arr2 = new uint[](2);
    // byte b1 = "a";
    //  byte[] b2 = new bytes(3);   //  worse than bytes b3, waste storage, which means
    bytes b3 = new bytes(3);

    function arr1Push() public returns (uint) {
        arr1.push(1);
        arr1.push(6);

        return arr1.length;
    }

    function arr2Length() public view returns (uint) {
        return arr2.length;
    }

    //  if returns array or string, should be define memory
    function getArr2() public view returns (uint[] memory) {
        return arr2;
    }

    function arr3Push() public pure {
        uint[] memory arr3 = new uint[](2);

        // arr3.push(7);   //  will be error, can't push into an memory array, ever it's a unfixed array
        arr3[3] = 7;
    }

    uint[] a1 = new uint[](6);

    function toDynamic() public pure returns (bytes memory) {
        bytes memory b = new bytes(6);
        uint[] memory a = new uint[](6);
        a[7] = 1;
        //  allow set value into a new index which large than array length
        // a.push(222); // No allow push even a unfixed memory array
        // a1.push(222);    //  allow push in a unfixed storage array

        return b;
    }

    string username2 = unicode"爽爽";

    function stringHandle() public pure {
        string memory username = unicode"李荣";
        // username.length; //  don't have length property
        bytes(username).length;
        //  length is 6, because chinese character occupied 3 bytes
        // fixed bytes to string
        bytes2 c = 0x6768;
        c.length == 2;
        //  bytes2 means length is 2, is current?
        bytes memory d = new bytes(c.length);
        for (uint i = 0; i < d.length; i++) {
            d[i] = c[i];
            //  bypesX index item means a byte as same as bypes index item?
        }
        string(d);
    }

}

/// @author lw
contract PayContract {

    constructor() payable {}

    function pay() public payable {}

    /// @dev show caller balance
    /// @notice caller normal means creater/deployer
    function showSenderBalance() public view returns (uint) {
        return msg.sender.balance;
    }

    /// @dev show contract address $this balance
    function showContractBalance() public view returns (uint) {
        return address(this).balance;
    }

    function showBalanceWithAddress(address addr) public view returns (uint) {
        return addr.balance;
    }

    /// @dev pay into contract address
    /// @notice call this method with `value` param, will pay money in to this account.
    function payIn() public payable {
        //  no matter what code
    }

    /// @dev $msg.value pay to $addr
    /// @notice this transfer without pass the contract address
    function payToAddress(address payable addr) public payable {
        addr.transfer(msg.value);
    }

}

contract GiftContract {

    address owner;

    event log(string);

    modifier isOwner() {
        require(owner == msg.sender, "Only owner allowed to perform this action");
        _;
        //  target function run
        emit log("end modifier");
    }

    modifier secondModifier(address sender) {
        require(owner == sender, "params check");
        _;
        emit log("double call modifier in a function");
    }

    function setOwner(address addr) public isOwner() secondModifier(msg.sender) returns (address) {
        owner = addr;
        return owner;
    }

    //  @dev using this function to pay to this contract
    function pay() public payable {}

    event log(address addr);

    ///  @dev give this contract balance to deployed contract $contractAddress
    function payToAnotherContract(address payable contractAddress) public payable {
        // PayContract payContract = new PayContract();
        emit log(contractAddress);
        PayContract payContract = PayContract(contractAddress);
        payContract.pay{
        value : 1 ether,
        gas : 3000
        }();
    }

}

contract UnitAndGlobalData {

    uint coin1 = 1 wei;
    uint coin2 = 1 gwei;
    //  next two unit is no more exacly
    // uint coin3 = 1 szabo;
    // uint coin4 = 1 finney;
    uint public coin5 = 1 ether;
    //  date will change into second, default is second
    uint date1 = 1 seconds;
    uint date2 = 1 minutes;
    uint date3 = 1 hours;
    uint date4 = 1 days;
    uint date5 = 1 weeks;
    // uint date6 = 1 years;    //  already remove, because of the leap year
    uint timeNow = block.timestamp;
    bytes32 bn = blockhash(0);    //  0 means target block number
    address me = block.coinbase;
    uint diff = block.difficulty;
    uint gLimit = block.gaslimit;
    uint gLeft = gasleft();
    bytes calldata1 = msg.data;
    address adr1 = msg.sender;
    uint money1 = msg.value;
    uint transactionPrice1 = tx.gasprice;
    address transactionSender1 = tx.origin; //  whole call link, the source?

    function action(address payable addr) public payable {
        // this; // the contract
        uint addressBalance = address(this).balance;
        addr.transfer(addressBalance);
        // address(this).call();
        selfdestruct(addr);
        //  destruct this contract and transfer money to param address
    }
}

contract AboutFunction {

    uint a = 1;

    //  require `_a` when create/deploy
    constructor(uint _a) {
        a = _a;
    }

    //  define param with name a,b can use by json type, private no able extend
    function setValue(uint _a, string memory b) private {
        //  do something...
    }

    function setValueWithJson() public {
        setValue(1, "1");
        //  use json param, no need to worry about plan sequence, same as last call
        setValue({
        _a : 1,
        b : "1"
        });
    }

    //  overload, and diff pan sequence params
    function setValueWithJson(uint _a) public {
        setValue({
        b : "1",
        _a : _a
        });
    }

    //  this.outCallOnly() and contractIns.outCallOnly() means external call
    function outCallOnly() external {}

    //  only can call by other function in this contract and extend
    function selfCallOnly() internal {
        //  inside the contract, a function with `external` can only call with `this.functionName()`
        this.outCallOnly();
        // outCallOnly();  //  not allow direct call a function with `external`
    }

    //  virtual mean the contract need extend and override this method
    modifier canBeOverride() virtual {
        _;
    }

    // should with `virtual` before override
    function willBeOverride() public virtual {}

}

contract AboutFunc2 {

    constructor() {}

}

//  abstract contract, just define and wait for implement
abstract contract AboutFunc3 {

    function onlyDefine() public virtual returns (uint);

}

/// @title extend `AboutFunction`
/// @notice parent const param `(1)`
contract ChildContract is AboutFunction(1), AboutFunc2, AboutFunc3 {

    //  parent var param
    // constructor(uint _a) AboutFunction(_a) {}

    modifier canBeOverride() override {
        _;
    }

    //  @overide
    function willBeOverride() public override {
    }

    //  @implement
    function onlyDefine() public pure override returns (uint) {
        return 1;
    }

    ///  @dev `pure` means didn't read any storage value, this, msg or call unpure function, will not cost gas?
    function noReadState(string memory str) public returns (string memory) {
        //  read and return memory value is fine.
        super.willBeOverride();
        //  call parent function
        willBeOverride();
        //  call function (already override by child)
        return str;
    }

    uint forRead = 1;

    ///  @dev `view` means read but no write
    function readButNoWriteState() public view returns (uint) {
        return forRead;
    }

    function multiReturn() public pure returns (uint, string memory) {
        return (1, "2");
    }

    function withReturnName() public view returns (uint forRead2) {
        forRead2 = forRead + 1;
    }

    function multiReturnWithName() public view returns (uint forRead3, string memory str2) {
        forRead3 = forRead * 2;
        str2 = "forRead4";
    }

    function ecel() public pure {
        uint a = 0;
        string memory b = "";
        (a, b) = multiReturn();
    }

    function insetFunc(bytes calldata str1) public pure returns (uint result1, uint result2, bytes32 encodeStr1, bytes32 encodeStr2, bytes20 encodeStr3) {
        //  some method inset in solidity
        result1 = addmod(1, 2, 3);
        //  (1 + 2) % 3
        result2 = mulmod(1, 2, 3);
        //  (1 * 2) % 3
        encodeStr1 = keccak256(str1);
        encodeStr2 = sha256(str1);
        encodeStr3 = ripemd160(str1);
    }

}

contract AboutABI {

    uint storedData;

    function set(uint x) public {
        storedData = x;
    }

    function abiEncode() public pure returns (bytes memory) {
        //  calcurate params into types32
        // bytes32 calldata a1 = abi.encode(1);
        //  calcurate into types, but not complete to 32
        // bytes calldata a2 = abi.encodePacked(1);
        //  calcurate function selector and params into types
        // abi.encodeWithSelector(bytes4 selector, ...) returns(bytes)
        //  like abi.encodeWithSelector(bytes4(keccak256(signature),...)
        return abi.encodeWithSignature("set(uint256)", 1);
    }

}

contract AboutMapping {

    mapping(uint => string) students;

    function setStudent(uint key, string calldata name) public {
        students[key] = name;
    }

    function getStudent(uint key) public view returns (string memory) {
        return students[key];
    }

    function getTeachers() public {
        // mapping(uint => string) teachers;    //  no allow
    }

}

/// @notice lot of questions, need to review
contract AboutStructMappingEnum {

    struct Student {
        uint age;
        string name;
        // mapping(string => uint) grade;   //  it's no secure, already remove
    }

    Student mimi;
    Student cici;

    function NoInit() public returns (uint, string memory) {
        // mimi.age = 1;
        // mimi.name = "mimi";
        mimi = Student(19, "mimi");
        cici = Student({age : 1, name : "cici"});

        return (mimi.age, mimi.name);
    }

    mapping(address => Student[]) public classRooms;

    function setClassRoom(address classAddr/*, uint id*/, uint age, string calldata name) public {
        Student memory student = Student(age, name);
        // classRooms[classAddr][id] = student;
        classRooms[classAddr].push(student);
    }

    enum Result {
        Pending,
        Success,
        Fail,
        Stop
    }
    Result result;
    Result constant defaultResult = Result.Pending;
    Result immutable defaultResult1 = Result.Pending;

    constructor(string memory _defaultResult) {
        // defaultResult1 = _defaultResult;
    }

    function setResult() public {
        result = Result.Success;
    }

    function getDefaultResult() public pure returns (uint) {
        return uint(defaultResult);
    }

}

contract ExternalContract {

    function doSomething() public pure returns (uint result) {
        return 1;
    }

}

contract ErrorHandler {

    event errorMsgLog(string errorMsg);
    event errorLog(bytes error);
    //  use `keccak256(abi.encodePacked(_name))` as topic, can be indexed search
    event errorIndexedLog(string indexed _name, bytes error);

    function handlerFunc(uint a, uint b) public returns (uint) {
        //  with tip, general use in the begin of a function
        require(a > 0 && b > 0, "Must be bigger than zero.");
        uint c = a + b;
        //  no tip, general use in the end of a function
        assert(c > b);
        if (c < a) {
            //  manual throw
            revert("result should no smaller than input");
        }

        ExternalContract extContract = new ExternalContract();

        try extContract.doSomething() returns (uint result) {
            return result;
        } catch Error(string memory errorMsg) {
            //  catch Error only work on `revert()` and `require()`
            emit errorMsgLog(errorMsg);
        } catch (bytes memory error) {
            //  catch everything, if write after catch Error will just work on `assert`
            emit errorLog(error);
        }
        //  or just try catch, no error input
        // catch {}

        return 0;
    }

    function directRecordLog() public {
        // log0("write something"); //  no more exist?
    }

}
