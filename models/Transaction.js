const db = require('../server/db');

class Transaction {
    constructor(sender, recipient, amount, nonce) {
        this.sender = sender;
        this.recipient = recipient;
        this.amount = amount;
        this.nonce = nonce;
        this.currency = 'coopCoin';
    }
    execute() {
        if (db.accounts[this.sender][this.currency] > this.amount) {
        db.accounts[this.sender][this.currency] -= this.amount;
        db.accounts[this.recipient][this.currency] += this.amount;
        } else {
            console.log(`(INVALID) ${this.sender}'s transaction at nonce ${this.nonce} was found invalid and was not added to the block (INVALID)`);
        };
    };
};

module.exports = Transaction;