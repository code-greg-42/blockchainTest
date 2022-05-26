const {keccak_256} = require('@noble/hashes/sha3');
const { bytesToHex } = require('@noble/hashes/utils');

class Block {
  constructor(timestamp, nonce) {
    this.timestamp = timestamp;
    this.nonce = nonce;
    this.transactions = [];
    this.merkle = null;
    this.blockHash = null;
    this.previousBlockHash = null;
    this.blockNumber = null;
    this.transactionCount = null;
  }
  addTransaction(tx) {
    this.transactions.push(tx);
  }
  hash() {
    return bytesToHex(keccak_256(
      this.timestamp + "" +
      this.nonce + "" +
      JSON.stringify(this.transactions)
    ));
  }
  execute() {
      if (this.transactions) {
    this.transactions.forEach(transaction => transaction.execute());
  }
}
}

module.exports = Block;