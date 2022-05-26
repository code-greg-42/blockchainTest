const prompts = require('prompts');
const { default: axios } = require('axios');
const Block = require('../models/Block');
const Transaction = require('../models/Transaction');
const getDB = require('./getDB');
const getBlockchainLength = require('./getBlockchainLength');
const merkleTree = require('./merkleTree');
require('dotenv').config({path:'../server/.env'});
const serverURL = process.env.SERVER_URL + "/block"
// prompts CLI questions
const questions = [
    {
        type: 'text',
        name: 'domain',
        message: 'Enter your domain name (including .cc)',
    },
]
// function for sending a valid block to the server
const sendBlock = async (domain, block) => {
    try {
      let response = await axios.post(serverURL, {
        domain,
        block,
      });
      console.log(response.data);
    } catch (error) {
      console.error(error);
    };
};

const startMine = async (domain) => {
  // downloads latest version of blockchain from server
    const res = await getDB(domain);
    console.log(res.mempool);
  // creates new block, adds miner/coinbase transaction to it, specifying roll tokens as currency
    const block = new Block(Date.now(), 0, []);
    block.blockNumber = res.blockchain.blocks.length;
    const minerTx = new Transaction('coinbase.cc', domain, res.blockReward, res.accounts['coinbase.cc'].nextNonce);
    minerTx.currency = 'rollTokens';
    block.addTransaction(minerTx);
    let txCount = 1;
    // adds mempool transactions to new block
    const txList = res.mempool;
    txList.forEach(tx => {
        block.addTransaction(tx);
        txCount++;
    });
  // sets previousBlockHash to the last block hash on the downloaded blockchain
    if (res.blockchain.blocks.length) {
      block.previousBlockHash = res.blockchain.blocks[res.blockchain.blocks.length - 1].blockHash;
    } else {
      block.previousBlockHash = null;
    }

    block.transactionCount = txCount;
    // sets merkleRoot to a merkleTree hash of all of the blocks transactions
    block.merkle = merkleTree(block.transactions);
    
    // increment nonce to search for '0x' hash. Every 100k nonces, check for a newly added block on server.
    // if yes, restart startMine. if no, keep trying to find a valid block.
labelMiningLoop:
while(BigInt('0x' + block.hash()) >= res.targetDifficulty) {
    block.nonce++;
    if ((block.nonce) > 0 && (block.nonce % 100000 == 0)) {
        const bclen = await getBlockchainLength(domain);
        console.log(bclen);
        console.log(block.blockNumber);
        if (bclen != block.blockNumber) {
          break labelMiningLoop;
        }
    }
  };
  if (BigInt('0x' + block.hash()) >= res.targetDifficulty) {
    startMine(domain);
  } else {

  console.log(block.transactions);

  block.blockHash = '0x' + block.hash();

    await sendBlock(domain, block);
    console.log(block.nonce);
    console.log('0x' + block.hash());
    console.log(`Valid block found by ${domain}`);

    startMine(domain);
  };
}
// function to feed prompts input into startMine function.
const mine = async () => {
    const response = await prompts(questions);
    startMine(response.domain);
}

mine()