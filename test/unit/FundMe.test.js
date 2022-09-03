const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");

describe("FundMe", async () => {
  let fundMe;
  let deployer;
  let mockV3Aggregator;
  let sendValue = ethers.utils.parseEther("1");

  beforeEach(async () => {
    // const accounts = await ethers.getSigners();
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture(["all"]);
    fundMe = await ethers.getContract("FundMe", deployer);
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
  });

  describe("constructor", async () => {
    it("sets the aggreator address conrrect", async () => {
      let response = await fundMe.priceFeed();
      assert.equal(response, mockV3Aggregator.address);
    });
  });

  describe("fund", async () => {
    it("it fails if you dont send aenough eth", async () => {
      await expect(fundMe.fund()).to.be.revertedWith("Didnt send enough ether");
    });
    it("it update the amount funded data strucute", async () => {
      await fundMe.fund({ value: sendValue });
      const response = await fundMe.addressToAmountFunded(deployer);
      assert.equal(response.toString(), sendValue.toString());
    });
    it("Adds funder to array of funders", async () => {
      await fundMe.fund({ value: sendValue });
      const response = await fundMe.getFunders();
      assert.equal(response, deployer);
    });
  });
  describe("withdraw", async () => {
    beforeEach(async () => {
      await fundMe.fund({ value: sendValue });
    });

    it("withdraw eth from a single founder", async () => {
      // Arrange
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );
      // Act
      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const gasCost = gasUsed.mul(effectiveGasPrice);

      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
      // Assert
      assert.equal(endingFundMeBalance, 0); // after with draw it should equal to 0
      assert.equal(
        startingDeployerBalance.add(startingFundMeBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );
    });
    it("withdraw eth from a single founder", async () => {
      const accounts = await ethers.getSigners();
      for (let i = 0; i < 6; i++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[i]);
        await fundMe.fund({ value: sendValue });
      }
      // Arrange
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );
      // Act
      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const gasCost = gasUsed.mul(effectiveGasPrice);

      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
      // assert
      assert.equal(endingFundMeBalance, 0); // after with draw it should equal to 0
      assert.equal(
        startingDeployerBalance.add(startingFundMeBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );
      await expect(fundMe.funders(0)).to.be.reverted;
      for (i = 1; i < 6; i++) {
        assert.equal(
          await fundMe.addressToAmountFunded(accounts[i].address),
          0
        );
      }
    });
    it("it only allows owner to withdraw", async () => {
      const accounts = await ethers.getSigners();
      const attacker = accounts[1];
      const attackerConnectedContract = await fundMe.connect(attacker);
      await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
        "FundMe__NotOwner"
      );
    });
  });
});
