const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Deploying MedGuardVerification contract...');

  const [deployer] = await ethers.getSigners();
  console.log('Deploying from:', deployer.address);
  console.log('Balance:', ethers.formatEther(await deployer.provider.getBalance(deployer.address)), 'ETH');

  const MedGuardVerification = await ethers.getContractFactory('MedGuardVerification');
  const contract = await MedGuardVerification.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('\nMedGuardVerification deployed at:', address);

  // Save address to backend .env
  const envPath = path.resolve(__dirname, '..', '..', 'backend', '.env');
  let envContent = '';
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch {}

  if (envContent.includes('CONTRACT_ADDRESS=')) {
    envContent = envContent.replace(/CONTRACT_ADDRESS=.*/g, `CONTRACT_ADDRESS=${address}`);
  } else {
    envContent += `\nCONTRACT_ADDRESS=${address}`;
  }

  const rpc = hre.network.config.url || 'http://127.0.0.1:8545';
  if (envContent.includes('RPC_URL=')) {
    envContent = envContent.replace(/RPC_URL=.*/g, `RPC_URL=${rpc}`);
  } else {
    envContent += `\nRPC_URL=${rpc}`;
  }

  fs.writeFileSync(envPath, envContent.trim() + '\n');
  console.log('Updated backend/.env with CONTRACT_ADDRESS and RPC_URL');
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); });
