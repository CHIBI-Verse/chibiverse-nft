// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ChibiVerse is ERC721Enumerable, Ownable, ReentrancyGuard, Pausable {
    using Strings for uint256;
    using Counters for Counters.Counter;

    // CONSTANT
    string public constant PROVENANCE =
        "1c96ec246a8dc70486fe93748c35ce97b2269ba4bfabe9c81d6e3835cc2d6ecd";
    uint256 public constant MAX_CHIBI_PURCHASE = 20; // Max Chibi can mint per tx
    // uint256 public constant MAX_CHIBI = 10000; // Max supply of Minted Chibi
    uint256 public constant MAX_CHIBI = 100; // Max supply of Minted Chibi
    uint256 public constant CHIBI_PRICE = 0.006 ether; // Chibi price - 0.006 ETH
    // uint256 public constant MAX_GIEVAWAY_RESERVE = 50;
    uint256 public constant MAX_GIEVAWAY_RESERVE = 1;

    Counters.Counter private supply;
    Counters.Counter private gievawaySupply;
    string private uriPrefix = "";
    string private uriSuffix = "";
    string private hiddenMetadataUri;

    bool public revealed = false;

    mapping(address => bool) giveawayList;
    mapping(address => bool) claimedList;

    constructor(
        string memory _uriPrefix,
        string memory _uriSuffix,
        string memory _hiddenMetadataUri
    ) ERC721("ChibiVerse", "CHIBI") {
        setUriPrefix(_uriPrefix);
        setUriSuffix(_uriSuffix);
        setHiddenMetadataUri(_hiddenMetadataUri);
    }

    // modifier
    modifier mintCompliance(uint256 _mintAmount) {
        require(!paused(), "The contract is paused!");
        require(tx.origin == _msgSender(), "Contracts not allowed");
        require(
            _isContract(_msgSender()) == false,
            "Cannot mint from a contract"
        );
        require(
            _mintAmount > 0 && _mintAmount <= MAX_CHIBI_PURCHASE,
            "Invalid mint amount!"
        );
        require(
            supply.current() + _mintAmount <= MAX_CHIBI,
            "Max supply exceeded!"
        );
        _;
    }

    modifier onlyGiveawayListed() {
        require(_isGiveawayListed(_msgSender()), "Only giveaway listed!");
        _;
    }

    modifier onlyClaimable(address _address) {
        require(_claimable(_address), "Don't claim again!");
        _;
    }

    // internal method
    function _isGiveawayListed(address _address) internal view returns (bool) {
        return giveawayList[_address];
    }

    function _claimable(address _address) internal view returns (bool) {
        return !claimedList[_address];
    }

    function _addToClaimedList(address _address) internal {
        claimedList[_address] = true;
    }

    function _addGiveawayList(address _address) internal {
        giveawayList[_address] = true;
    }

    function _removeGiveawayList(address _address) internal {
        giveawayList[_address] = false;
    }

    function _isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    function _mintLoop(address _receiver, uint256 _mintAmount) internal {
        for (uint256 i = 0; i < _mintAmount; i++) {
            supply.increment();
            _safeMint(_receiver, supply.current());
        }
    }

    // override
    function _baseURI() internal view virtual override returns (string memory) {
        return uriPrefix;
    }

    function totalSupply() public view override returns (uint256) {
        return supply.current();
    }

    // public
    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(_tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        if (revealed == false) {
            return
                string(
                    abi.encodePacked(
                        hiddenMetadataUri,
                        _tokenId.toString(),
                        uriSuffix
                    )
                );
        }

        return
            string(
                abi.encodePacked(_baseURI(), _tokenId.toString(), uriSuffix)
            );
    }

    function mint(uint256 _mintAmount)
        public
        payable
        nonReentrant
        mintCompliance(_mintAmount)
    {
        require(msg.value >= CHIBI_PRICE * _mintAmount, "Insufficient funds!");

        _mintLoop(_msgSender(), _mintAmount);
    }

    function claim()
        public
        nonReentrant
        onlyClaimable(_msgSender())
        onlyGiveawayListed
        mintCompliance(1)
    {
        require(
            gievawaySupply.current() + 1 <= MAX_GIEVAWAY_RESERVE,
            "Max gievaway supply exceeded!"
        );
        _mintLoop(_msgSender(), 1);
        _removeGiveawayList(_msgSender());
        _addToClaimedList(_msgSender());
        gievawaySupply.increment();
    }

    function walletOfOwner(address _owner)
        public
        view
        returns (uint256[] memory)
    {
        uint256 tokenCount = balanceOf(_owner);

        uint256[] memory tokensId = new uint256[](tokenCount);
        for (uint256 i; i < tokenCount; i++) {
            tokensId[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokensId;
    }

    function claimable(address _address) public view returns (bool) {
        return _claimable(_address) && _isGiveawayListed(_address);
    }

    function GIEVAWAY_RESERVE() public view returns (uint256) {
        return MAX_GIEVAWAY_RESERVE - gievawaySupply.current();
    }

    // onlyOwner
    function setRevealed() public onlyOwner {
        revealed = true;
    }

    function setHiddenMetadataUri(string memory _hiddenMetadataUri)
        public
        onlyOwner
    {
        hiddenMetadataUri = _hiddenMetadataUri;
    }

    function setUriPrefix(string memory _uriPrefix) public onlyOwner {
        uriPrefix = _uriPrefix;
    }

    function setUriSuffix(string memory _uriSuffix) public onlyOwner {
        uriSuffix = _uriSuffix;
    }

    function addToGiveawayList(address _address)
        public
        onlyClaimable(_address)
        onlyOwner
    {
        _addGiveawayList(_address);
    }

    function removeGiveawayList(address _address) public onlyOwner {
        _removeGiveawayList(_address);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function withdraw() public nonReentrant onlyOwner {
        (bool os, ) = payable(owner()).call{value: address(this).balance}("");
        require(os);
    }
}
