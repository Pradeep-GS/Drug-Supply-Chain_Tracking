import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const DrugSupplyChain = await ethers.getContractFactory("DrugSupplyChain");
  const contract = await DrugSupplyChain.deploy();

  await contract.waitForDeployment();

  console.log("✅ Contract deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});