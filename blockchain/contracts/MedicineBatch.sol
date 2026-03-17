// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MedicineBatch {
    struct Batch {
        uint256 batchId;
        string medicineId;
        string manufacturer;
        string batchNumber;
        uint256 timestamp;
        string previousHash;
        string hash;
    }

    Batch[] public batches;

    event BatchAdded(uint256 batchId, string medicineId, string manufacturer, string batchNumber, uint256 timestamp, string previousHash, string hash);

    function addBatch(string memory medicineId, string memory manufacturer, string memory batchNumber, string memory previousHash, string memory hash) public {
        uint256 batchId = batches.length;
        uint256 timestamp = block.timestamp;
        batches.push(Batch(batchId, medicineId, manufacturer, batchNumber, timestamp, previousHash, hash));
        emit BatchAdded(batchId, medicineId, manufacturer, batchNumber, timestamp, previousHash, hash);
    }

    function getBatch(uint256 batchId) public view returns (Batch memory) {
        require(batchId < batches.length, "Batch does not exist");
        return batches[batchId];
    }

    function getBatchCount() public view returns (uint256) {
        return batches.length;
    }
}
