import { ethers } from "hardhat";

async function main() {
  const treasury = process.env.TREASURY_ADDRESS;
  const oracle = process.env.ORACLE_ADDRESS;

  if (!treasury) {
    throw new Error("Missing TREASURY_ADDRESS in env");
  }
  if (!oracle) {
    throw new Error("Missing ORACLE_ADDRESS in env");
  }

  console.log("Deployer:", (await ethers.getSigners())[0].address);

  // Deploy Platform
  const Platform = await ethers.getContractFactory("NeuralCreatorPlatform");
  const platform = await Platform.deploy(treasury);
  await platform.waitForDeployment();
  const platformAddress = await platform.getAddress();
  console.log("NeuralCreatorPlatform deployed:", platformAddress);

  // Deploy TraditionalArtNFT
  const Traditional = await ethers.getContractFactory("TraditionalArtNFT");
  const traditional = await Traditional.deploy(platformAddress);
  await traditional.waitForDeployment();
  const traditionalAddress = await traditional.getAddress();
  console.log("TraditionalArtNFT deployed:", traditionalAddress);

  // Deploy INFT
  const INFT = await ethers.getContractFactory("NeuralCreatorINFT");
  const inft = await INFT.deploy(platformAddress, oracle);
  await inft.waitForDeployment();
  const inftAddress = await inft.getAddress();
  console.log("NeuralCreatorINFT deployed:", inftAddress);

  // Wire contracts
  const tx1 = await platform.setTraditionalNFTContract(traditionalAddress);
  await tx1.wait();
  const tx2 = await platform.setINFTContract(inftAddress);
  await tx2.wait();
  console.log("Linked NFT contracts in Platform.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});