const { network } = require("hardhat");
const {
  networkConfig,
  developmentChains,
  INITIAL_ANSWER,
  DECIMALS,
} = require("../helper-hardhat-config");

module.exports = async (hre) => {
  const { getNamedAccounts, deployments } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  if (developmentChains.includes(network.name)) {
    log("local network detected Deploy mocks");
    await deploy("MockV3Aggregator", {
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_ANSWER],
    });
    log("mocks deployed");
  }
};

module.exports.tags = ["all", "mocks"];
