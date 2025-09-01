export const NeuralCreatorPlatformABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_username", "type": "string" },
      { "internalType": "string", "name": "_bio", "type": "string" },
      { "internalType": "string", "name": "_profileImageHash", "type": "string" },
      { "internalType": "uint8", "name": "_creatorType", "type": "uint8" }
    ],
    "name": "registerCreator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_title", "type": "string" },
      { "internalType": "string", "name": "_description", "type": "string" },
      { "internalType": "string", "name": "_contentHash", "type": "string" },
      { "internalType": "string", "name": "_thumbnailHash", "type": "string" },
      { "internalType": "string", "name": "_aiMetadataHash", "type": "string" },
      { "internalType": "uint8", "name": "_contentType", "type": "uint8" },
      { "internalType": "uint8", "name": "_artCategory", "type": "uint8" },
      { "internalType": "uint256", "name": "_price", "type": "uint256" },
      { "internalType": "string[]", "name": "_tags", "type": "string[]" }
    ],
    "name": "publishContent",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // View: get content IDs for a creator
  {
    "inputs": [{ "internalType": "address", "name": "_creator", "type": "address" }],
    "name": "getCreatorContent",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  // View: get tags for a contentId
  {
    "inputs": [{ "internalType": "uint256", "name": "_contentId", "type": "uint256" }],
    "name": "getContentTags",
    "outputs": [{ "internalType": "string[]", "name": "", "type": "string[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  // Auto-generated getter for public mapping contents(uint256)
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "contents",
    "outputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" },
      { "internalType": "address", "name": "creator", "type": "address" },
      { "internalType": "string", "name": "title", "type": "string" },
      { "internalType": "string", "name": "description", "type": "string" },
      { "internalType": "string", "name": "contentHash", "type": "string" },
      { "internalType": "string", "name": "thumbnailHash", "type": "string" },
      { "internalType": "string", "name": "aiMetadataHash", "type": "string" },
      { "internalType": "uint8", "name": "contentType", "type": "uint8" },
      { "internalType": "uint8", "name": "artCategory", "type": "uint8" },
      { "internalType": "uint256", "name": "price", "type": "uint256" },
      { "internalType": "uint256", "name": "tips", "type": "uint256" },
      { "internalType": "uint256", "name": "views", "type": "uint256" },
      { "internalType": "uint256", "name": "likes", "type": "uint256" },
      { "internalType": "bool", "name": "isNFT", "type": "bool" },
      { "internalType": "uint256", "name": "nftTokenId", "type": "uint256" },
      { "internalType": "bool", "name": "isForSale", "type": "bool" },
      { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
      { "internalType": "bool", "name": "isActive", "type": "bool" }
      // Note: tags are stored separately; use getContentTags()
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;