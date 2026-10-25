// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CreditMarketplace {
    struct Listing {
        uint256 tokenId;
        uint256 amount;
        uint256 price;
        address seller;
        bool active;
    }

    mapping(uint256 => Listing) public listings;

    event ListingCreated(uint256 indexed tokenId, uint256 amount, uint256 price, address seller);
    event ListingBought(uint256 indexed tokenId, uint256 amount, uint256 price, address buyer, address seller);

    function listForSale(uint256 tokenId, uint256 amount, uint256 price) public {
        require(amount > 0, "Amount must be > 0");
        require(price > 0, "Price must be > 0");

        listings[tokenId] = Listing({
            tokenId: tokenId,
            amount: amount,
            price: price,
            seller: msg.sender,
            active: true
        });

        emit ListingCreated(tokenId, amount, price, msg.sender);
    }

    function buy(uint256 tokenId, uint256 amount) public payable {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not active");
        require(listing.amount >= amount, "Not enough available");
        require(msg.value == listing.price * amount, "Incorrect price");

        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.active = false;
        }

        emit ListingBought(tokenId, amount, listing.price, msg.sender, listing.seller);
    }

    function cancelListing(uint256 tokenId) public {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not active");
        require(msg.sender == listing.seller, "Not seller");
        listing.active = false;
    }

    function getListing(uint256 tokenId) public view returns (Listing memory) {
        return listings[tokenId];
    }
}
