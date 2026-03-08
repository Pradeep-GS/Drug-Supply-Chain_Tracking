import { expect } from "chai";
import { network } from "hardhat";

describe("DrugSupplyChain", function () {

  async function deployFixture() {
    const { ethers } = await network.connect();

    const [admin, distributor, pharmacy] = await ethers.getSigners();

    const Contract = await ethers.getContractFactory("DrugSupplyChain");
    const contract = await Contract.deploy();
    await contract.waitForDeployment();

    await contract.assignRole(distributor.address, 2);
    await contract.assignRole(pharmacy.address, 3);

    return { contract, admin, distributor, pharmacy };
  }

  it("Should complete full supply chain flow", async function () {
    const { contract, distributor, pharmacy } = await deployFixture();

    const futureDate = Math.floor(Date.now() / 1000) + 100000;

    await contract.createDrug("Paracetamol", "BATCH001", futureDate);

    let drug = await contract.getDrug("BATCH001");
    expect(Number(drug.status)).to.equal(0);

    await contract.transferDrug("BATCH001", distributor.address);

    await contract.connect(distributor).receiveDrug("BATCH001");

    await contract.connect(distributor).transferDrug("BATCH001", pharmacy.address);

    await contract.connect(pharmacy).receiveDrug("BATCH001");

    await contract.connect(pharmacy).sellDrug("BATCH001");

    drug = await contract.getDrug("BATCH001");
    expect(Number(drug.status)).to.equal(3);
  });

});