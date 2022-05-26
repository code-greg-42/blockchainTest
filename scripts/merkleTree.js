const Transaction = require('../models/Transaction');
const { keccak_256 } = require('@noble/hashes/sha3');
const { bytesToHex } = require('@noble/hashes/utils');

// const fakeMempool = [];

// const create8 = () => {
    // for (let i = 0; i < 8; i++) {
       // let tx = new Transaction('coopcoin.cc', 'phyllis.cc', Math.floor(Math.random() * 500) + 1, i);
       // fakeMempool.push(tx);
   // }
// }

const prepLeaves = (mem) => {
    let merkleReady = [];
    for (let i = 0; i < mem.length; i++) {
        merkleReady.push(JSON.stringify(mem[i]))
    }
    return merkleReady;
}

const hash = (str) => {
    return bytesToHex(keccak_256(JSON.stringify(str)));
}

const concat = (a, b) => {
    return a + b;
}

const merkleTree = (arr) => {
    let merkleArr = prepLeaves(arr);
        if (merkleArr.length === 1) {
            return hash(merkleArr[0]);
        }
        const layer = [];
        for (let i = 0; i < merkleArr.length; i += 2) {
            const left = merkleArr[i];
            const right = merkleArr[i + 1];
            if (right) {
                layer.push(hash(concat(left, right)));
            }
            else {
                layer.push(left);
            }
        }
        return merkleTree(layer);
}

module.exports = merkleTree;