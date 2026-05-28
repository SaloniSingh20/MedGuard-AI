const { ethers } = require('hardhat');
require('dotenv').config({ path: '../../backend/.env' });

async function main() {
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) {
    console.error('CONTRACT_ADDRESS not set in backend/.env');
    process.exit(1);
  }

  const [signer] = await ethers.getSigners();
  const MedGuardVerification = await ethers.getContractFactory('MedGuardVerification');
  const contract = MedGuardVerification.attach(address).connect(signer);

  console.log('Contract address:', address);
  console.log('Total verifications:', (await contract.totalVerifications()).toString());

  // Demo: record a verification
  const testId = `test-${Date.now()}`;
  const batchNum = 'PCM-2024-001';
  const hash = ethers.keccak256(ethers.toUtf8Bytes('Paracetamol-PCM-2024-001'));

  console.log('\nRecording test verification...');
  const tx = await contract.recordVerification(testId, batchNum, hash, 0, 9500);
  await tx.wait();
  console.log('TX hash:', tx.hash);

  // Query batch history
  const history = await contract.getBatchHistory(batchNum);
  console.log('\nBatch history for', batchNum, ':');
  history.forEach((r) => {
    const verdicts = ['AUTHENTIC', 'SUSPICIOUS', 'COUNTERFEIT'];
    console.log(`  - ${r.verificationId}: ${verdicts[r.verdict]} (${r.confidenceBps / 100}%)`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); });
