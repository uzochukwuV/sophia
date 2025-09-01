// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title NeuralCreatorPlatform
 * @dev Main platform contract managing creators, content, and economy
 * Supports both traditional artists (painters, comic creators) and AI-powered creators
 */
contract NeuralCreatorPlatform is AccessControl, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // Platform fee (basis points, e.g., 250 = 2.5%)
    uint256 public platformFee = 250;
    uint256 public constant MAX_PLATFORM_FEE = 1000; // 10% max
    uint256 public constant BASIS_POINTS = 10000;

    // Treasury
    address public treasury;

    // Contract references
    address public traditionaltContract;
    address public inftContract;

    // Structs
    struct Creator {
        string username;
        string bio;
        string profileImageHash; // 0G Storage hash
        CreatorType creatorType;
        uint256 totalEarnings;
        uint256 followerCount;
        uint256 contentCount;
        uint256 nftCount;
        bool isVerified;
        bool isActive;
        uint256 createdAt;
        mapping(string => string) socialLinks; // platform => url
    }

    struct Content {
        uint256 id;
        address creator;
        string title;
        string description;
        string contentHash; // 0G Storage root hash
        string thumbnailHash; // Thumbnail image hash
        string aiMetadataHash; // AI processing receipt/metadata (optional)
        ContentType contentType;
        ArtCategory artCategory; // For traditional art
        uint256 price; // 0 for free content
        uint256 tips;
        uint256 views;
        uint256 likes;
        bool isNFT; // True if minted as NFT
        uint256 nftTokenId;
        bool isForSale;
        uint256 createdAt;
        bool isActive;
        string[] tags; // Searchable tags
    }

    struct Subscription {
        address creator;
        uint256 monthlyPrice;
        uint256 subscriberCount;
        string benefits; // 0G Storage hash with subscription benefits
        bool isActive;
    }

    struct Collaboration {
        uint256 id;
        address[] participants;
        uint256[] shares; // Basis points, must sum to 10000
        string projectHash; // 0G Storage hash
        string title;
        string description;
        uint256 totalRevenue;
        CollabStatus status;
        uint256 createdAt;
        uint256 deadline;
    }

    struct Follow {
        address follower;
        address following;
        uint256 followedAt;
    }

    enum CreatorType { TRADITIONAL_ARTIST, AI_CREATOR, HYBRID }
    enum ContentType { TEXT, IMAGE, AUDIO, VIDEO, MIXED, COMIC, DIGITAL_ART }
    enum ArtCategory { PAINTING, DRAWING, COMIC, DIGITAL_ART, PHOTOGRAPHY, SCULPTURE, OTHER }
    enum CollabStatus { PROPOSED, ACTIVE, COMPLETED, CANCELLED }

    // Mappings
    mapping(address => Creator) public creators;
    mapping(uint256 => Content) public contents;
    mapping(address => Subscription) public subscriptions;
    mapping(address => mapping(address => uint256)) public subscriptionExpiry; // subscriber => creator => expiry
    mapping(uint256 => Collaboration) public collaborations;
    mapping(address => uint256[]) public creatorContent; // creator => content IDs
    mapping(address => mapping(address => bool)) public isFollowing;
    mapping(bytes32 => bool) public usedSignatures; // Prevent replay attacks
    mapping(address => uint256[]) public creatorFollowers; // creator => follower addresses (indices)
    mapping(address => address[]) public creatorFollowing; // creator => following addresses
    
    // Content discovery
    mapping(ContentType => uint256[]) public contentByType;
    mapping(ArtCategory => uint256[]) public contentByCategory;
    mapping(string => uint256[]) public contentByTag;
    
    // Counters
    uint256 public nextContentId = 1;
    uint256 public nextCollabId = 1;
    uint256 public totalCreators;
    uint256 public totalContent;

    // Events
    event CreatorRegistered(address indexed creator, string username, CreatorType creatorType);
    event CreatorVerified(address indexed creator);
    event ContentPublished(uint256 indexed contentId, address indexed creator, string contentHash, ContentType contentType);
    event ContentTipped(uint256 indexed contentId, address indexed tipper, uint256 amount);
    event ContentPurchased(uint256 indexed contentId, address indexed buyer, uint256 price);
    event SubscriptionCreated(address indexed creator, uint256 monthlyPrice);
    event SubscriptionPurchased(address indexed subscriber, address indexed creator, uint256 duration);
    event CollaborationProposed(uint256 indexed collabId, address[] participants, uint256[] shares);
    event CollaborationAccepted(uint256 indexed collabId);
    event CollaborationCompleted(uint256 indexed collabId);
    event RevenueDistributed(uint256 indexed collabId, uint256 totalAmount);
    event AIProcessingVerified(uint256 indexed contentId, string receiptHash, address oracle);
    event UserFollowed(address indexed follower, address indexed following);
    event UserUnfollowed(address indexed follower, address indexed following);
    event ContentViewed(uint256 indexed contentId, address indexed viewer);
    event ContentLiked(uint256 indexed contentId, address indexed liker);

    constructor(address _treasury) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // Modifiers
    modifier onlyRegisteredCreator() {
        require(creators[msg.sender].isActive, "Not a registered creator");
        _;
    }

    modifier onlyValidContent(uint256 _contentId) {
        require(_contentId < nextContentId && contents[_contentId].isActive, "Invalid content");
        _;
    }

    modifier onlyContentCreator(uint256 _contentId) {
        require(contents[_contentId].creator == msg.sender, "Not content creator");
        _;
    }

    // Creator Management
    function registerCreator(
        string memory _username,
        string memory _bio,
        string memory _profileImageHash,
        CreatorType _creatorType
    ) external whenNotPaused {
        require(!creators[msg.sender].isActive, "Creator already registered");
        require(bytes(_username).length > 0, "Username required");
        
        Creator storage creator = creators[msg.sender];
        creator.username = _username;
        creator.bio = _bio;
        creator.profileImageHash = _profileImageHash;
        creator.creatorType = _creatorType;
        creator.totalEarnings = 0;
        creator.followerCount = 0;
        creator.contentCount = 0;
        creator.nftCount = 0;
        creator.isVerified = false;
        creator.isActive = true;
        creator.createdAt = block.timestamp;

        totalCreators++;
        emit CreatorRegistered(msg.sender, _username, _creatorType);
    }

    function updateCreatorProfile(
        string memory _bio,
        string memory _profileImageHash
    ) external onlyRegisteredCreator {
        Creator storage creator = creators[msg.sender];
        creator.bio = _bio;
        creator.profileImageHash = _profileImageHash;
    }

    function setSocialLink(string memory _platform, string memory _url) external onlyRegisteredCreator {
        creators[msg.sender].socialLinks[_platform] = _url;
    }

    function getSocialLink(address _creator, string memory _platform) external view returns (string memory) {
        return creators[_creator].socialLinks[_platform];
    }

    function verifyCreator(address _creator) external onlyRole(MODERATOR_ROLE) {
        require(creators[_creator].isActive, "Creator not found");
        creators[_creator].isVerified = true;
        emit CreatorVerified(_creator);
    }

    // Follow System
    function followCreator(address _creator) external {
        require(_creator != msg.sender, "Cannot follow yourself");
        require(creators[_creator].isActive, "Creator not found");
        require(!isFollowing[msg.sender][_creator], "Already following");

        isFollowing[msg.sender][_creator] = true;
        creators[_creator].followerCount++;
        creatorFollowing[msg.sender].push(_creator);
        
        emit UserFollowed(msg.sender, _creator);
    }

    function unfollowCreator(address _creator) external {
        require(isFollowing[msg.sender][_creator], "Not following");

        isFollowing[msg.sender][_creator] = false;
        creators[_creator].followerCount--;
        
        // Remove from following array
        address[] storage following = creatorFollowing[msg.sender];
        for (uint i = 0; i < following.length; i++) {
            if (following[i] == _creator) {
                following[i] = following[following.length - 1];
                following.pop();
                break;
            }
        }
        
        emit UserUnfollowed(msg.sender, _creator);
    }

    function getFollowing(address _user) external view returns (address[] memory) {
        return creatorFollowing[_user];
    }

    // Content Management
    function publishContent(
        string memory _title,
        string memory _description,
        string memory _contentHash,
        string memory _thumbnailHash,
        string memory _aiMetadataHash,
        ContentType _contentType,
        ArtCategory _artCategory,
        uint256 _price,
        string[] memory _tags
    ) external onlyRegisteredCreator whenNotPaused returns (uint256) {
        require(bytes(_title).length > 0, "Title required");
        require(bytes(_contentHash).length > 0, "Content hash required");
        require(_tags.length <= 10, "Too many tags");

        uint256 contentId = nextContentId++;
        
        Content storage content = contents[contentId];
        content.id = contentId;
        content.creator = msg.sender;
        content.title = _title;
        content.description = _description;
        content.contentHash = _contentHash;
        content.thumbnailHash = _thumbnailHash;
        content.aiMetadataHash = _aiMetadataHash;
        content.contentType = _contentType;
        content.artCategory = _artCategory;
        content.price = _price;
        content.tips = 0;
        content.views = 0;
        content.likes = 0;
        content.isNFT = false;
        content.nftTokenId = 0;
        content.isForSale = _price > 0;
        content.createdAt = block.timestamp;
        content.isActive = true;
        content.tags = _tags;

        // Add to indices
        creatorContent[msg.sender].push(contentId);
        contentByType[_contentType].push(contentId);
        contentByCategory[_artCategory].push(contentId);
        
        // Add to tag indices
        for (uint i = 0; i < _tags.length; i++) {
            contentByTag[_tags[i]].push(contentId);
        }

        creators[msg.sender].contentCount++;
        totalContent++;

        emit ContentPublished(contentId, msg.sender, _contentHash, _contentType);
        return contentId;
    }

    // Content interaction functions
    function viewContent(uint256 _contentId) external onlyValidContent(_contentId) {
        contents[_contentId].views++;
        emit ContentViewed(_contentId, msg.sender);
    }

    function likeContent(uint256 _contentId) external onlyValidContent(_contentId) {
        contents[_contentId].likes++;
        emit ContentLiked(_contentId, msg.sender);
    }

    // Content purchase (for paid content)
    function purchaseContent(uint256 _contentId) 
        external 
        payable 
        onlyValidContent(_contentId) 
        nonReentrant 
        whenNotPaused 
    {
        Content storage content = contents[_contentId];
        require(content.isForSale, "Content not for sale");
        require(msg.value >= content.price, "Insufficient payment");
        require(msg.sender != content.creator, "Cannot purchase own content");

        address creator = content.creator;
        
        // Calculate platform fee
        uint256 fee = (content.price * platformFee) / BASIS_POINTS;
        uint256 creatorAmount = content.price - fee;
        
        // Update records
        creators[creator].totalEarnings += creatorAmount;
        
        // Transfer funds
        (bool success1, ) = payable(creator).call{value: creatorAmount}("");
        (bool success2, ) = payable(treasury).call{value: fee}("");
        
        require(success1 && success2, "Transfer failed");
        
        // Refund excess
        if (msg.value > content.price) {
            (bool success3, ) = payable(msg.sender).call{value: msg.value - content.price}("");
            require(success3, "Refund failed");
        }
        
        emit ContentPurchased(_contentId, msg.sender, content.price);
    }

    // AI Processing Verification (called by oracle)
    function verifyAIProcessing(
        uint256 _contentId,
        string memory _receiptHash,
        bytes memory _signature
    ) external onlyRole(ORACLE_ROLE) onlyValidContent(_contentId) {
        // Verify signature to prevent unauthorized verification
        bytes32 messageHash = keccak256(abi.encodePacked(_contentId, _receiptHash)).toEthSignedMessageHash();
        require(!usedSignatures[messageHash], "Signature already used");
        
        address signer = messageHash.recover(_signature);
        require(hasRole(ORACLE_ROLE, signer), "Invalid oracle signature");
        
        usedSignatures[messageHash] = true;
        contents[_contentId].aiMetadataHash = _receiptHash;
        
        emit AIProcessingVerified(_contentId, _receiptHash, msg.sender);
    }

    // Tipping System
    function tipContent(uint256 _contentId) 
        external 
        payable 
        onlyValidContent(_contentId) 
        nonReentrant 
        whenNotPaused 
    {
        require(msg.value > 0, "Tip amount must be positive");
        
        Content storage content = contents[_contentId];
        address creator = content.creator;
        require(msg.sender != creator, "Cannot tip yourself");
        
        // Calculate platform fee
        uint256 fee = (msg.value * platformFee) / BASIS_POINTS;
        uint256 creatorAmount = msg.value - fee;
        
        // Update records
        content.tips += msg.value;
        creators[creator].totalEarnings += creatorAmount;
        
        // Transfer funds
        (bool success1, ) = payable(creator).call{value: creatorAmount}("");
        (bool success2, ) = payable(treasury).call{value: fee}("");
        
        require(success1 && success2, "Transfer failed");
        
        emit ContentTipped(_contentId, msg.sender, msg.value);
    }

    // Subscription System
    function createSubscription(
        uint256 _monthlyPrice,
        string memory _benefits
    ) external onlyRegisteredCreator {
        require(_monthlyPrice > 0, "Price must be positive");
        
        subscriptions[msg.sender] = Subscription({
            creator: msg.sender,
            monthlyPrice: _monthlyPrice,
            subscriberCount: 0,
            benefits: _benefits,
            isActive: true
        });

        emit SubscriptionCreated(msg.sender, _monthlyPrice);
    }

    function subscribe(address _creator, uint256 _months) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        require(_months > 0 && _months <= 12, "Invalid duration");
        require(creators[_creator].isActive, "Creator not active");
        require(msg.sender != _creator, "Cannot subscribe to yourself");
        
        Subscription storage sub = subscriptions[_creator];
        require(sub.isActive, "Subscription not available");
        
        uint256 totalCost = sub.monthlyPrice * _months;
        require(msg.value >= totalCost, "Insufficient payment");
        
        // Calculate fees
        uint256 fee = (totalCost * platformFee) / BASIS_POINTS;
        uint256 creatorAmount = totalCost - fee;
        
        // Update subscription expiry
        uint256 currentExpiry = subscriptionExpiry[msg.sender][_creator];
        uint256 newExpiry = (currentExpiry > block.timestamp ? currentExpiry : block.timestamp) + (_months * 30 days);
        subscriptionExpiry[msg.sender][_creator] = newExpiry;
        
        // Update counters
        if (currentExpiry <= block.timestamp) {
            sub.subscriberCount++;
        }
        creators[_creator].totalEarnings += creatorAmount;
        
        // Transfer funds
        (bool success1, ) = payable(_creator).call{value: creatorAmount}("");
        (bool success2, ) = payable(treasury).call{value: fee}("");
        require(success1 && success2, "Transfer failed");
        
        // Refund excess
        if (msg.value > totalCost) {
            (bool success3, ) = payable(msg.sender).call{value: msg.value - totalCost}("");
            require(success3, "Refund failed");
        }

        emit SubscriptionPurchased(msg.sender, _creator, _months);
    }

    // Collaboration System
    function proposeCollaboration(
        address[] memory _participants,
        uint256[] memory _shares,
        string memory _projectHash,
        string memory _title,
        string memory _description,
        uint256 _deadline
    ) external onlyRegisteredCreator returns (uint256) {
        require(_participants.length >= 2, "Need at least 2 participants");
        require(_participants.length == _shares.length, "Mismatched arrays");
        require(_deadline > block.timestamp, "Invalid deadline");
        
        // Validate shares sum to 100%
        uint256 totalShares = 0;
        for (uint i = 0; i < _shares.length; i++) {
            require(_shares[i] > 0, "Share must be positive");
            require(creators[_participants[i]].isActive, "Invalid participant");
            totalShares += _shares[i];
        }
        require(totalShares == BASIS_POINTS, "Shares must sum to 100%");
        
        // Ensure proposer is in participants
        bool proposerIncluded = false;
        for (uint i = 0; i < _participants.length; i++) {
            if (_participants[i] == msg.sender) {
                proposerIncluded = true;
                break;
            }
        }
        require(proposerIncluded, "Proposer must be participant");

        uint256 collabId = nextCollabId++;
        collaborations[collabId] = Collaboration({
            id: collabId,
            participants: _participants,
            shares: _shares,
            projectHash: _projectHash,
            title: _title,
            description: _description,
            totalRevenue: 0,
            status: CollabStatus.PROPOSED,
            createdAt: block.timestamp,
            deadline: _deadline
        });

        emit CollaborationProposed(collabId, _participants, _shares);
        return collabId;
    }

    function acceptCollaboration(uint256 _collabId) external {
        Collaboration storage collab = collaborations[_collabId];
        require(collab.status == CollabStatus.PROPOSED, "Invalid status");
        require(block.timestamp < collab.deadline, "Collaboration expired");
        
        // Check if sender is a participant
        bool isParticipant = false;
        for (uint i = 0; i < collab.participants.length; i++) {
            if (collab.participants[i] == msg.sender) {
                isParticipant = true;
                break;
            }
        }
        require(isParticipant, "Not a participant");
        
        collab.status = CollabStatus.ACTIVE;
        emit CollaborationAccepted(_collabId);
    }

    function completeCollaboration(uint256 _collabId) external {
        Collaboration storage collab = collaborations[_collabId];
        require(collab.status == CollabStatus.ACTIVE, "Invalid status");
        
        // Check if sender is a participant
        bool isParticipant = false;
        for (uint i = 0; i < collab.participants.length; i++) {
            if (collab.participants[i] == msg.sender) {
                isParticipant = true;
                break;
            }
        }
        require(isParticipant, "Not a participant");
        
        collab.status = CollabStatus.COMPLETED;
        emit CollaborationCompleted(_collabId);
    }

    // Revenue distribution for collaborations
    function distributeCollabRevenue(uint256 _collabId) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        require(msg.value > 0, "No revenue to distribute");
        
        Collaboration storage collab = collaborations[_collabId];
        require(collab.status == CollabStatus.ACTIVE || collab.status == CollabStatus.COMPLETED, "Invalid status");
        
        uint256 fee = (msg.value * platformFee) / BASIS_POINTS;
        uint256 distributeAmount = msg.value - fee;
        
        collab.totalRevenue += msg.value;
        
        // Distribute to participants
        for (uint i = 0; i < collab.participants.length; i++) {
            uint256 participantShare = (distributeAmount * collab.shares[i]) / BASIS_POINTS;
            creators[collab.participants[i]].totalEarnings += participantShare;
            
            (bool success, ) = payable(collab.participants[i]).call{value: participantShare}("");
            require(success, "Distribution failed");
        }
        
        // Send fee to treasury
        (bool success, ) = payable(treasury).call{value: fee}("");
        require(success, "Fee transfer failed");
        
        emit RevenueDistributed(_collabId, msg.value);
    }

    // View Functions
    function isSubscribed(address _subscriber, address _creator) external view returns (bool) {
        return subscriptionExpiry[_subscriber][_creator] > block.timestamp;
    }

    function getCreatorContent(address _creator) external view returns (uint256[] memory) {
        return creatorContent[_creator];
    }

    function getContentByType(ContentType _type) external view returns (uint256[] memory) {
        return contentByType[_type];
    }

    function getContentByCategory(ArtCategory _category) external view returns (uint256[] memory) {
        return contentByCategory[_category];
    }

    function getContentByTag(string memory _tag) external view returns (uint256[] memory) {
        return contentByTag[_tag];
    }

    function getCollaborationParticipants(uint256 _collabId) external view returns (address[] memory, uint256[] memory) {
        Collaboration storage collab = collaborations[_collabId];
        return (collab.participants, collab.shares);
    }

    function getContentTags(uint256 _contentId) external view returns (string[] memory) {
        return contents[_contentId].tags;
    }

    function getPlatformStats() external view returns (
        uint256 _totalCreators,
        uint256 _totalContent,
        uint256 _platformFee
    ) {
        return (totalCreators, totalContent, platformFee);
    }

    // Contract Integration
    function setTraditionalNFTContract(address _contract) external onlyRole(ADMIN_ROLE) {
        traditionaltContract = _contract;
    }

    function setINFTContract(address _contract) external onlyRole(ADMIN_ROLE) {
        inftContract = _contract;
    }

    // Mark content as NFT (called by NFT contracts)
    function markAsNFT(uint256 _contentId, uint256 _tokenId) external {
        require(msg.sender == traditionaltContract || msg.sender == inftContract, "Unauthorized");
        require(_contentId < nextContentId, "Invalid content");
        
        contents[_contentId].isNFT = true;
        contents[_contentId].nftTokenId = _tokenId;
        creators[contents[_contentId].creator].nftCount++;
    }

    // Admin Functions
    function setPlatformFee(uint256 _newFee) external onlyRole(ADMIN_ROLE) {
        require(_newFee <= MAX_PLATFORM_FEE, "Fee too high");
        platformFee = _newFee;
    }

    function setTreasury(address _newTreasury) external onlyRole(ADMIN_ROLE) {
        require(_newTreasury != address(0), "Invalid treasury");
        treasury = _newTreasury;
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function emergencyWithdraw() external onlyRole(ADMIN_ROLE) {
        (bool success, ) = payable(treasury).call{value: address(this).balance}("");
        require(success, "Emergency withdraw failed");
    }

    // Prevent direct payments
    receive() external payable {
        revert("Direct payments not allowed");
    }
}

/**
 * @title TraditionalArtNFT
 * @dev Standard NFT contract for traditional artists (painters, comic creators, photographers)
 * with comprehensive royalty and marketplace features
 */
contract TraditionalArtNFT is ERC721, ERC721URIStorage, ERC721Royalty, AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    struct ArtNFTMetadata {
        string title;
        string description;
        string artworkHash; // 0G Storage hash for high-res artwork
        string thumbnailHash; // 0G Storage hash for thumbnail
        address artist;
        ArtCategory category;
        ArtStyle style;
        string medium; // Oil on canvas, Digital, etc.
        string dimensions;
        uint256 yearCreated;
        uint256 edition; // Edition number (0 for 1/1)
        uint256 totalEditions; // Total in series (1 for 1/1)
        uint256 createdAt;
        bool isPhysicalBacked; // True if represents physical artwork
        string[] certifications; // Authenticity certificates
        string provenanceHash; // Ownership history
    }

    struct ArtSale {
        uint256 tokenId;
        address seller;
        uint256 price;
        uint256 deadline;
        bool isActive;
        bool isAuction;
        address highestBidder;
        uint256 highestBid;
        uint256 minBidIncrement;
    }

    enum ArtCategory { PAINTING, DRAWING, COMIC, DIGITAL_ART, PHOTOGRAPHY, SCULPTURE, MIXED_MEDIA }
    enum ArtStyle { REALISTIC, ABSTRACT, IMPRESSIONIST, SURREAL, MINIMALIST, POP_ART, CONTEMPORARY, OTHER }

    mapping(uint256 => ArtNFTMetadata) public artMetadata;
    mapping(uint256 => ArtSale) public artSales;
    mapping(uint256 => string[]) public tokenTags;
    mapping(ArtCategory => uint256[]) public tokensByCategory;
    mapping(ArtStyle => uint256[]) public tokensByStyle;
    mapping(address => uint256[]) public artistTokens;

    // Platform contract reference
    NeuralCreatorPlatform public platformContract;
    
    uint256 private _nextTokenId = 1;
    uint256 public totalSupply;

    // Marketplace settings
    uint256 public marketplaceFee = 250; // 2.5%
    uint256 public constant MAX_ROYALTY = 1000; // 10%

    event ArtNFTCreated(
        uint256 indexed tokenId, 
        address indexed artist, 
        string title, 
        ArtCategory category,
        uint256 edition,
        uint256 totalEditions
    );
    event ArtForSale(uint256 indexed tokenId, address indexed seller, uint256 price, bool isAuction);
    event ArtSold(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);
    event BidPlaced(uint256 indexed tokenId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed tokenId, address indexed winner, uint256 finalPrice);

    constructor(address _platformContract) ERC721("Neural Creator Traditional Art", "NCART") {
        platformContract = NeuralCreatorPlatform(_platformContract);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function createArtNFT(
        address _artist,
        uint256 _contentId,
        string memory _title,
        string memory _description,
        string memory _artworkHash,
        string memory _thumbnailHash,
        string memory _tokenURI,
        ArtCategory _category,
        ArtStyle _style,
        string memory _medium,
        string memory _dimensions,
        uint256 _yearCreated,
        uint256 _edition,
        uint256 _totalEditions,
        uint96 _royaltyFee,
        bool _isPhysicalBacked,
        string[] memory _certifications,
        string[] memory _tags
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(_artist != address(0), "Invalid artist address");
        require(bytes(_title).length > 0, "Title required");
        require(bytes(_artworkHash).length > 0, "Artwork hash required");
        require(_royaltyFee <= MAX_ROYALTY, "Royalty fee too high");
        require(_edition <= _totalEditions, "Invalid edition number");
        require(_totalEditions > 0, "Invalid total editions");

        uint256 tokenId = _nextTokenId++;
        totalSupply++;

        _safeMint(_artist, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        if (_royaltyFee > 0) {
            _setTokenRoyalty(tokenId, _artist, _royaltyFee);
        }

        artMetadata[tokenId] = ArtNFTMetadata({
            title: _title,
            description: _description,
            artworkHash: _artworkHash,
            thumbnailHash: _thumbnailHash,
            artist: _artist,
            category: _category,
            style: _style,
            medium: _medium,
            dimensions: _dimensions,
            yearCreated: _yearCreated,
            edition: _edition,
            totalEditions: _totalEditions,
            createdAt: block.timestamp,
            isPhysicalBacked: _isPhysicalBacked,
            certifications: _certifications,
            provenanceHash: ""
        });

        // Add to indices
        tokensByCategory[_category].push(tokenId);
        tokensByStyle[_style].push(tokenId);
        artistTokens[_artist].push(tokenId);
        tokenTags[tokenId] = _tags;

        // Mark content as NFT in platform contract
        if (_contentId > 0) {
            platformContract.markAsNFT(_contentId, tokenId);
        }

        emit ArtNFTCreated(tokenId, _artist, _title, _category, _edition, _totalEditions);
        return tokenId;
    }

    function updateProvenance(uint256 _tokenId, string memory _provenanceHash) external {
        require(_exists(_tokenId), "Token does not exist");
        require(ownerOf(_tokenId) == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "Unauthorized");
        
        artMetadata[_tokenId].provenanceHash = _provenanceHash;
    }

    function addCertification(uint256 _tokenId, string memory _certification) external {
        require(_exists(_tokenId), "Token does not exist");
        require(ownerOf(_tokenId) == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "Unauthorized");
        
        artMetadata[_tokenId].certifications.push(_certification);
    }

    // Marketplace Functions
    function listForSale(
        uint256 _tokenId,
        uint256 _price,
        uint256 _duration,
        bool _isAuction,
        uint256 _minBidIncrement
    ) external whenNotPaused {
        require(_exists(_tokenId), "Token does not exist");
        require(ownerOf(_tokenId) == msg.sender, "Not token owner");
        require(_price > 0, "Price must be positive");
        require(!artSales[_tokenId].isActive, "Already listed");

        uint256 deadline = _duration > 0 ? block.timestamp + _duration : 0;
        
        artSales[_tokenId] = ArtSale({
            tokenId: _tokenId,
            seller: msg.sender,
            price: _price,
            deadline: deadline,
            isActive: true,
            isAuction: _isAuction,
            highestBidder: address(0),
            highestBid: 0,
            minBidIncrement: _isAuction ? _minBidIncrement : 0
        });

        emit ArtForSale(_tokenId, msg.sender, _price, _isAuction);
    }

    function buyNow(uint256 _tokenId) external payable nonReentrant whenNotPaused {
        ArtSale storage sale = artSales[_tokenId];
        require(sale.isActive, "Not for sale");
        require(!sale.isAuction, "This is an auction");
        require(msg.value >= sale.price, "Insufficient payment");
        require(msg.sender != sale.seller, "Cannot buy own NFT");

        address seller = sale.seller;
        uint256 salePrice = sale.price;

        // Calculate fees and royalty
        (address royaltyRecipient, uint256 royaltyAmount) = royaltyInfo(_tokenId, salePrice);
        uint256 marketplaceFeeAmount = (salePrice * marketplaceFee) / 10000;
        uint256 sellerAmount = salePrice - royaltyAmount - marketplaceFeeAmount;

        // Clear sale
        delete artSales[_tokenId];

        // Transfer NFT
        _transfer(seller, msg.sender, _tokenId);

        // Transfer payments
        if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
            (bool success1, ) = payable(royaltyRecipient).call{value: royaltyAmount}("");
            require(success1, "Royalty transfer failed");
        }

        (bool success2, ) = payable(seller).call{value: sellerAmount}("");
        require(success2, "Seller payment failed");

        (bool success3, ) = payable(address(platformContract.treasury())).call{value: marketplaceFeeAmount}("");
        require(success3, "Fee transfer failed");

        // Refund excess
        if (msg.value > salePrice) {
            (bool success4, ) = payable(msg.sender).call{value: msg.value - salePrice}("");
            require(success4, "Refund failed");
        }

        emit ArtSold(_tokenId, msg.sender, seller, salePrice);
    }

    function placeBid(uint256 _tokenId) external payable nonReentrant whenNotPaused {
        ArtSale storage sale = artSales[_tokenId];
        require(sale.isActive, "Not for sale");
        require(sale.isAuction, "Not an auction");
        require(sale.deadline == 0 || block.timestamp < sale.deadline, "Auction ended");
        require(msg.sender != sale.seller, "Cannot bid on own NFT");

        uint256 minBid = sale.highestBid > 0 
            ? sale.highestBid + sale.minBidIncrement 
            : sale.price;
        
        require(msg.value >= minBid, "Bid too low");

        address previousBidder = sale.highestBidder;
        uint256 previousBid = sale.highestBid;

        sale.highestBidder = msg.sender;
        sale.highestBid = msg.value;

        // Refund previous bidder
        if (previousBidder != address(0)) {
            (bool success, ) = payable(previousBidder).call{value: previousBid}("");
            require(success, "Refund failed");
        }

        emit BidPlaced(_tokenId, msg.sender, msg.value);
    }

    function endAuction(uint256 _tokenId) external nonReentrant {
        ArtSale storage sale = artSales[_tokenId];
        require(sale.isActive, "Not for sale");
        require(sale.isAuction, "Not an auction");
        require(
            sale.deadline > 0 && block.timestamp >= sale.deadline ||
            msg.sender == sale.seller,
            "Cannot end auction yet"
        );

        address seller = sale.seller;
        address winner = sale.highestBidder;
        uint256 finalPrice = sale.highestBid;

        // Clear sale
        delete artSales[_tokenId];

        if (winner != address(0) && finalPrice > 0) {
            // Calculate fees and royalty
            (address royaltyRecipient, uint256 royaltyAmount) = royaltyInfo(_tokenId, finalPrice);
            uint256 marketplaceFeeAmount = (finalPrice * marketplaceFee) / 10000;
            uint256 sellerAmount = finalPrice - royaltyAmount - marketplaceFeeAmount;

            // Transfer NFT to winner
            _transfer(seller, winner, _tokenId);

            // Transfer payments
            if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
                (bool success1, ) = payable(royaltyRecipient).call{value: royaltyAmount}("");
                require(success1, "Royalty transfer failed");
            }

            (bool success2, ) = payable(seller).call{value: sellerAmount}("");
            require(success2, "Seller payment failed");

            (bool success3, ) = payable(address(platformContract.treasury())).call{value: marketplaceFeeAmount}("");
            require(success3, "Fee transfer failed");

            emit ArtSold(_tokenId, winner, seller, finalPrice);
        }

        emit AuctionEnded(_tokenId, winner, finalPrice);
    }

    function cancelListing(uint256 _tokenId) external {
        ArtSale storage sale = artSales[_tokenId];
        require(sale.isActive, "Not listed");
        require(msg.sender == sale.seller || hasRole(ADMIN_ROLE, msg.sender), "Unauthorized");

        address highestBidder = sale.highestBidder;
        uint256 highestBid = sale.highestBid;

        delete artSales[_tokenId];

        // Refund highest bidder if auction
        if (sale.isAuction && highestBidder != address(0)) {
            (bool success, ) = payable(highestBidder).call{value: highestBid}("");
            require(success, "Refund failed");
        }
    }

    // View Functions
    function getArtMetadata(uint256 _tokenId) external view returns (
        string memory title,
        string memory description,
        string memory artworkHash,
        string memory thumbnailHash,
        address artist,
        ArtCategory category,
        ArtStyle style,
        string memory medium,
        string memory dimensions,
        uint256 yearCreated,
        uint256 edition,
        uint256 totalEditions,
        bool isPhysicalBacked
    ) {
        require(_exists(_tokenId), "Token does not exist");
        ArtNFTMetadata memory metadata = artMetadata[_tokenId];
        return (
            metadata.title,
            metadata.description,
            metadata.artworkHash,
            metadata.thumbnailHash,
            metadata.artist,
            metadata.category,
            metadata.style,
            metadata.medium,
            metadata.dimensions,
            metadata.yearCreated,
            metadata.edition,
            metadata.totalEditions,
            metadata.isPhysicalBacked
        );
    }

    function getTokensByCategory(ArtCategory _category) external view returns (uint256[] memory) {
        return tokensByCategory[_category];
    }

    function getTokensByStyle(ArtStyle _style) external view returns (uint256[] memory) {
        return tokensByStyle[_style];
    }

    function getArtistTokens(address _artist) external view returns (uint256[] memory) {
        return artistTokens[_artist];
    }

    function getTokenTags(uint256 _tokenId) external view returns (string[] memory) {
        return tokenTags[_tokenId];
    }

    function getCertifications(uint256 _tokenId) external view returns (string[] memory) {
        return artMetadata[_tokenId].certifications;
    }

    function getSaleInfo(uint256 _tokenId) external view returns (
        address seller,
        uint256 price,
        uint256 deadline,
        bool isActive,
        bool isAuction,
        address highestBidder,
        uint256 highestBid
    ) {
        ArtSale memory sale = artSales[_tokenId];
        return (
            sale.seller,
            sale.price,
            sale.deadline,
            sale.isActive,
            sale.isAuction,
            sale.highestBidder,
            sale.highestBid
        );
    }

    // Admin Functions
    function setMarketplaceFee(uint256 _newFee) external onlyRole(ADMIN_ROLE) {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        marketplaceFee = _newFee;
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721, ERC721URIStorage, ERC721Royalty, AccessControl) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        whenNotPaused
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override {
        super._increaseBalance(account, value);
    }
}

/**
 * @title NeuralCreatorINFT
 * @dev ERC-7857 compliant Intelligent NFT implementation based on 0G's actual INFT specification
 * For AI agents, creator styles, and intelligent assets
 */
contract NeuralCreatorINFT is ERC721, ERC721URIStorage, ERC721Royalty, AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    struct INFTMetadata {
        string encryptedURI; // Encrypted metadata stored in 0G Storage
        bytes32 metadataHash; // Hash of encrypted metadata for verification
        address creator;
        INFTType inftType;
        string capabilitiesDescription; // Public description of capabilities
        uint256 createdAt;
        uint256 lastUpdated;
        bool transferable;
        bool updatable;
        string[] tags;
        mapping(address => bytes) authorizations; // Authorized usage permissions
    }

    struct TransferProof {
        bytes32 oldMetadataHash;
        bytes32 newMetadataHash;
        string newEncryptedURI;
        address oracle;
        bytes oracleSignature;
        uint256 timestamp;
        bool verified;
    }

    enum INFTType { AI_AGENT, CREATOR_STYLE, AI_MODEL, HYBRID_INTELLIGENCE }

    mapping(uint256 => INFTMetadata) public inftMetadata;
    mapping(uint256 => TransferProof) public transferProofs;
    mapping(bytes32 => bool) public usedProofs;
    mapping(INFTType => uint256[]) public tokensByType;
    mapping(address => uint256[]) public creatorTokens;

    // Platform contract reference
    NeuralCreatorPlatform public platformContract;
    address public oracle;

    uint256 private _nextTokenId = 1;
    uint256 public totalSupply;

    event INFTCreated(
        uint256 indexed tokenId, 
        address indexed creator, 
        INFTType inftType,
        string capabilitiesDescription
    );
    event INFTUpdated(uint256 indexed tokenId, bytes32 newMetadataHash);
    event TransferProofSubmitted(uint256 indexed tokenId, bytes32 oldHash, bytes32 newHash);
    event TransferVerified(uint256 indexed tokenId, address indexed newOwner);
    event UsageAuthorized(uint256 indexed tokenId, address indexed executor, bytes authorization);
    event MetadataReencrypted(uint256 indexed tokenId, address indexed newOwner, bytes32 newHash);

    constructor(address _platformContract, address _oracle) ERC721("Neural Creator INFT", "NCINFT") {
        platformContract = NeuralCreatorPlatform(_platformContract);
        oracle = _oracle;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, _oracle);
    }

    function createINFT(
        address _creator,
        uint256 _contentId,
        string memory _encryptedURI,
        bytes32 _metadataHash,
        string memory _tokenURI,
        INFTType _inftType,
        string memory _capabilitiesDescription,
        uint96 _royaltyFee,
        bool _transferable,
        bool _updatable,
        string[] memory _tags
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(_creator != address(0), "Invalid creator address");
        require(bytes(_encryptedURI).length > 0, "Encrypted URI required");
        require(_metadataHash != bytes32(0), "Metadata hash required");
        require(_royaltyFee <= 1000, "Royalty fee too high"); // Max 10%

        uint256 tokenId = _nextTokenId++;
        totalSupply++;

        _safeMint(_creator, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        if (_royaltyFee > 0) {
            _setTokenRoyalty(tokenId, _creator, _royaltyFee);
        }

        INFTMetadata storage metadata = inftMetadata[tokenId];
        metadata.encryptedURI = _encryptedURI;
        metadata.metadataHash = _metadataHash;
        metadata.creator = _creator;
        metadata.inftType = _inftType;
        metadata.capabilitiesDescription = _capabilitiesDescription;
        metadata.createdAt = block.timestamp;
        metadata.lastUpdated = block.timestamp;
        metadata.transferable = _transferable;
        metadata.updatable = _updatable;
        metadata.tags = _tags;

        // Add to indices
        tokensByType[_inftType].push(tokenId);
        creatorTokens[_creator].push(tokenId);

        // Mark content as NFT in platform contract
        if (_contentId > 0) {
            platformContract.markAsNFT(_contentId, tokenId);
        }

        emit INFTCreated(tokenId, _creator, _inftType, _capabilitiesDescription);
        return tokenId;
    }

    function updateINFTMetadata(
        uint256 _tokenId,
        string memory _newEncryptedURI,
        bytes32 _newMetadataHash
    ) external {
        require(_exists(_tokenId), "Token does not exist");
        require(ownerOf(_tokenId) == msg.sender, "Not token owner");
        require(inftMetadata[_tokenId].updatable, "Token not updatable");
        require(_newMetadataHash != bytes32(0), "Invalid metadata hash");

        inftMetadata[_tokenId].encryptedURI = _newEncryptedURI;
        inftMetadata[_tokenId].metadataHash = _newMetadataHash;
        inftMetadata[_tokenId].lastUpdated = block.timestamp;

        emit INFTUpdated(_tokenId, _newMetadataHash);
    }

    function authorizeUsage(
        uint256 _tokenId,
        address _executor,
        bytes memory _authorization
    ) external {
        require(_exists(_tokenId), "Token does not exist");
        require(ownerOf(_tokenId) == msg.sender, "Not token owner");
        
        inftMetadata[_tokenId].authorizations[_executor] = _authorization;
        
        emit UsageAuthorized(_tokenId, _executor, _authorization);
    }

    // ERC-7857 Transfer with Re-encryption
    function transferWithProof(
        address _to,
        uint256 _tokenId,
        bytes32 _oldMetadataHash,
        bytes32 _newMetadataHash,
        string memory _newEncryptedURI,
        bytes memory _oracleSignature
    ) external nonReentrant whenNotPaused {
        require(_exists(_tokenId), "Token does not exist");
        require(ownerOf(_tokenId) == msg.sender, "Not token owner");
        require(inftMetadata[_tokenId].transferable, "Token not transferable");
        require(_newMetadataHash != bytes32(0), "Invalid new hash");
        require(bytes(_newEncryptedURI).length > 0, "New encrypted URI required");

        // Verify the old metadata hash matches
        require(inftMetadata[_tokenId].metadataHash == _oldMetadataHash, "Hash mismatch");

        // Create proof message for oracle verification
        bytes32 messageHash = keccak256(abi.encodePacked(
            _tokenId, 
            msg.sender, 
            _to, 
            _oldMetadataHash, 
            _newMetadataHash
        ));

        require(!usedProofs[messageHash], "Proof already used");

        // Verify oracle signature
        bytes32 ethMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        address recoveredOracle = ethMessageHash.recover(_oracleSignature);
        require(hasRole(ORACLE_ROLE, recoveredOracle), "Invalid oracle signature");

        usedProofs[messageHash] = true;

        // Store transfer proof
        transferProofs[_tokenId] = TransferProof({
            oldMetadataHash: _oldMetadataHash,
            newMetadataHash: _newMetadataHash,
            newEncryptedURI: _newEncryptedURI,
            oracle: recoveredOracle,
            oracleSignature: _oracleSignature,
            timestamp: block.timestamp,
            verified: true
        });

        // Update metadata with re-encrypted URI
        inftMetadata[_tokenId].encryptedURI = _newEncryptedURI;
        inftMetadata[_tokenId].metadataHash = _newMetadataHash;
        inftMetadata[_tokenId].lastUpdated = block.timestamp;

        // Perform the transfer
        _transfer(msg.sender, _to, _tokenId);

        emit TransferVerified(_tokenId, _to);
        emit MetadataReencrypted(_tokenId, _to, _newMetadataHash);
    }

    // Override transfer functions to check transferability
    function transferFrom(address _from, address _to, uint256 _tokenId) public override {
        require(inftMetadata[_tokenId].transferable, "Token not transferable");
        super.transferFrom(_from, _to, _tokenId);
    }

    function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes memory _data) public override {
        require(inftMetadata[_tokenId].transferable, "Token not transferable");
        super.safeTransferFrom(_from, _to, _tokenId, _data);
    }

    // Verification function for oracle use
    function verifyProof(bytes calldata _proof) external view returns (bool) {
        // This would implement the specific verification logic
        // For now, we'll assume oracle handles verification off-chain
        return hasRole(ORACLE_ROLE, msg.sender);
    }

    // View Functions
    function getINFTMetadata(uint256 _tokenId) external view returns (
        string memory encryptedURI,
        bytes32 metadataHash,
        address creator,
        INFTType inftType,
        string memory capabilitiesDescription,
        uint256 createdAt,
        uint256 lastUpdated,
        bool transferable,
        bool updatable
    ) {
        require(_exists(_tokenId), "Token does not exist");
        INFTMetadata storage metadata = inftMetadata[_tokenId];
        return (
            metadata.encryptedURI,
            metadata.metadataHash,
            metadata.creator,
            metadata.inftType,
            metadata.capabilitiesDescription,
            metadata.createdAt,
            metadata.lastUpdated,
            metadata.transferable,
            metadata.updatable
        );
    }

    function getTokensByType(INFTType _type) external view returns (uint256[] memory) {
        return tokensByType[_type];
    }

    function getCreatorTokens(address _creator) external view returns (uint256[] memory) {
        return creatorTokens[_creator];
    }

    function getTokenTags(uint256 _tokenId) external view returns (string[] memory) {
        return inftMetadata[_tokenId].tags;
    }

    function getAuthorization(uint256 _tokenId, address _executor) external view returns (bytes memory) {
        return inftMetadata[_tokenId].authorizations[_executor];
    }

    function getTransferProof(uint256 _tokenId) external view returns (
        bytes32 oldMetadataHash,
        bytes32 newMetadataHash,
        string memory newEncryptedURI,
        address oracleAddress,
        uint256 timestamp,
        bool verified
    ) {
        TransferProof memory proof = transferProofs[_tokenId];
        return (
            proof.oldMetadataHash,
            proof.newMetadataHash,
            proof.newEncryptedURI,
            proof.oracle,
            proof.timestamp,
            proof.verified
        );
    }

    // Admin Functions
    function setOracle(address _newOracle) external onlyRole(ADMIN_ROLE) {
        require(_newOracle != address(0), "Invalid oracle address");
        _revokeRole(ORACLE_ROLE, oracle);
        _grantRole(ORACLE_ROLE, _newOracle);
        oracle = _newOracle;
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721, ERC721URIStorage, ERC721Royalty, AccessControl) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        whenNotPaused
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override {
        super._increaseBalance(account, value);
    }
}