// Hardhat config for blockchain batch authentication
require('@nomiclabs/hardhat-ethers');

module.exports = {
  solidity: '0.8.20',
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts'
  },
};
