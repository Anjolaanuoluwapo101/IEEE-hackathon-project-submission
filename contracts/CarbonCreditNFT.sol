// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CarbonCreditNFT {
    struct Token {
        uint256 totalSupply;
        string metadataURI;
    }

    mapping(uint256 => mapping(address => uint256)) private _balances;
    mapping(uint256 => Token) private _tokens;

    string private _baseURI = "https://circulagos.example.com/metadata/";
    uint256 private _nextTokenId;
    address public contractOwner;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId, uint256 amount);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    modifier onlyOwner() {
        require(msg.sender == contractOwner, "Not owner");
        _;
    }

    constructor() {
        contractOwner = msg.sender;
        _nextTokenId = 1;
    }

    function mintCredit(address to, uint256 amount, string memory metadataURI) public onlyOwner returns (uint256) {
        uint256 id = _nextTokenId++;
        _tokens[id] = Token({totalSupply: amount, metadataURI: metadataURI});
        _balances[id][to] += amount;
        emit Transfer(address(0), to, id, amount);
        return id;
    }

    function retire(uint256 id, uint256 amount) public {
        require(_balances[id][msg.sender] >= amount, "Insufficient balance");
        _balances[id][msg.sender] -= amount;
        emit Transfer(msg.sender, address(0), id, amount);
    }

    function balanceOf(address ownerAddr, uint256 id) public view returns (uint256) {
        return _balances[id][ownerAddr];
    }

    function uri(uint256 id) public view returns (string memory) {
        return string(abi.encodePacked(_tokens[id].metadataURI, Strings.toString(id)));
    }

    function getTotalMinted() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    function totalSupply(uint256 id) public view returns (uint256) {
        return _tokens[id].totalSupply;
    }

    function approve(address to, uint256 id) public {
        require(msg.sender != to, "Approve to caller");
        require(_balances[id][msg.sender] > 0, "No balance");
        _approved[id][to] = true;
        emit Approval(msg.sender, to, id);
    }

    function transferFrom(address from, address to, uint256 id, uint256 amount) public {
        require(_balances[id][from] >= amount, "Insufficient balance");
        require(msg.sender == from || _approved[id][msg.sender], "Not authorized");
        _balances[id][from] -= amount;
        _balances[id][to] += amount;
        emit Transfer(from, to, id, amount);
    }

    mapping(uint256 => mapping(address => bool)) private _approved;
}

library Strings {
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits = 0;
        while (temp > 0) {
            temp /= 10;
            digits++;
        }
        bytes memory buffer = new bytes(digits);
        while (value > 0) {
            digits -= 1;
            uint8 digit = uint8(value % 10);
            buffer[digits] = bytes1(uint8(48) + digit);
            value /= 10;
        }
        return string(buffer);
    }
}
