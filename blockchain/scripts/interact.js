import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const [admin, manufacturer, distributor, pharmacy] =
    await ethers.getSigners();

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const contract = await ethers.getContractAt(
    "DrugSupplyChain",
    contractAddress
  );

  console.log("Connected to contract:", contractAddress);

  // Assign roles
  console.log("\nAssigning roles...");
  await contract.connect(admin).assignRole(manufacturer.address, 1);
  await contract.connect(admin).assignRole(distributor.address, 2);
  await contract.connect(admin).assignRole(pharmacy.address, 3);
  console.log("Roles assigned");

  // Manufacturer creates drug
  console.log("\nManufacturer creating drug...");
  await contract.connect(manufacturer).createDrug(
    "Paracetamol",
    "B001",
    Math.floor(Date.now() / 1000) + 100000
  );
  console.log("Drug Created");

  // Transfer to Distributor
  console.log("\nTransferring to Distributor...");
  await contract
    .connect(manufacturer)
    .transferDrug("B001", distributor.address);
  console.log("Transferred to Distributor");

  // Distributor receives
  console.log("\nDistributor receiving...");
  await contract.connect(distributor).receiveDrug("B001");

  // Transfer to Pharmacy
  console.log("\nTransferring to Pharmacy...");
  await contract
    .connect(distributor)
    .transferDrug("B001", pharmacy.address);

  // Pharmacy receives
  console.log("\nPharmacy receiving...");
  await contract.connect(pharmacy).receiveDrug("B001");

  // Sell
  console.log("\nPharmacy selling...");
  await contract.connect(pharmacy).sellDrug("B001");

  console.log("\n✅ Full Supply Chain Completed Successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});