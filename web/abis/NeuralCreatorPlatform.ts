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
  }
] as const;