// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BatchNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    struct Batch {
        address picker;
        address aggregator;
        address recycler;
        string material;
        uint256 loggedWeightKg;
        uint256 receivedWeightKg;
        uint8 status; // 0=REGISTERED, 1=IN_TRANSIT, 2=RECEIVED, 3=FLAGGED, 4=RETIRED
        string photoHash;
        string registerTx;
        string transferTx;
        string retireTx;
        uint256 createdAt;
    }

    mapping(uint256 => Batch) public batches;
    mapping(string => uint256) public photoHashToTokenId;

    event BatchRegistered(
        uint256 indexed tokenId,
        address indexed picker,
        address indexed aggregator,
        string material,
        uint256 weightKg,
        string photoHash
    );

    event BatchTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        string txHash
    );

    event BatchReceived(
        uint256 indexed tokenId,
        address indexed recycler,
        uint256 receivedWeightKg,
        string txHash
    );

    event BatchFlagged(
        uint256 indexed tokenId,
        uint256 loggedWeightKg,
        uint256 receivedWeightKg
    );

    event BatchRetired(
        uint256 indexed tokenId,
        address indexed recycler,
        string txHash
    );

    constructor() ERC721("CircuLagosBatch", "CLBATCH") Ownable(msg.sender) {
        _tokenIds = 1; // Start from 1
    }

    function _baseURI() internal view override returns (string memory) {
        return "https://circulagos.example.com/batch/";
    }

    function registerBatch(
        address picker,
        address aggregator,
        string memory material,
        uint256 loggedWeightKg,
        string memory location,
        string memory photoHash,
        string memory registerTx
    ) external onlyOwner returns (uint256) {
        require(bytes(photoHash).length > 0, "Photo hash required");
        require(photoHashToTokenId[photoHash] == 0, "Photo already registered");

        uint256 tokenId = _tokenIds;
        _tokenIds++;

        batches[tokenId] = Batch({
            picker: picker,
            aggregator: aggregator,
            recycler: address(0),
            material: material,
            loggedWeightKg: loggedWeightKg,
            receivedWeightKg: 0,
            status: 0, // REGISTERED
            photoHash: photoHash,
            registerTx: registerTx,
            transferTx: "",
            retireTx: "",
            createdAt: block.timestamp
        });

        photoHashToTokenId[photoHash] = tokenId;

        _safeMint(aggregator, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked("batch/", Strings.toString(tokenId))));

        emit BatchRegistered(tokenId, picker, aggregator, material, loggedWeightKg, photoHash);
        return tokenId;
    }

    function transferToRecycler(
        uint256 tokenId,
        address recycler,
        string memory transferTx
    ) external onlyOwner {
        Batch storage batch = batches[tokenId];
        require(batch.status == 0, "Batch must be registered");
        require(recycler != address(0), "Invalid recycler");

        batch.recycler = recycler;
        batch.status = 1; // IN_TRANSIT
        batch.transferTx = transferTx;

        _transfer(batch.aggregator, recycler, tokenId);

        emit BatchTransferred(tokenId, batch.aggregator, recycler, transferTx);
    }

    function confirmReceipt(
        uint256 tokenId,
        uint256 receivedWeightKg,
        string memory confirmTx
    ) external onlyOwner {
        Batch storage batch = batches[tokenId];
        require(batch.status == 1, "Batch must be in transit");

        batch.receivedWeightKg = receivedWeightKg;
        batch.transferTx = confirmTx;

        // Check weight mismatch (5% tolerance)
        if (receivedWeightKg < batch.loggedWeightKg * 95 / 100 ||
            receivedWeightKg > batch.loggedWeightKg * 105 / 100) {
            batch.status = 3; // FLAGGED
            emit BatchFlagged(tokenId, batch.loggedWeightKg, receivedWeightKg);
        } else {
            batch.status = 2; // RECEIVED
            emit BatchReceived(tokenId, batch.recycler, receivedWeightKg, confirmTx);
        }
    }

    function retireBatch(
        uint256 tokenId,
        string memory retireTx
    ) external onlyOwner {
        Batch storage batch = batches[tokenId];
        require(batch.status == 2, "Batch must be received");

        batch.status = 4; // RETIRED
        batch.retireTx = retireTx;

        _burn(tokenId);
        emit BatchRetired(tokenId, batch.recycler, retireTx);
    }

    function getBatch(uint256 tokenId) external view returns (Batch memory) {
        return batches[tokenId];
    }

    function getStatus(uint256 tokenId) external view returns (uint8) {
        return batches[tokenId].status;
    }

    function getPhotoHash(uint256 tokenId) external view returns (string memory) {
        return batches[tokenId].photoHash;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}