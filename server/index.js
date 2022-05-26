const express = require('express');
const cors = require('cors');
const port = 3032;
const secp = require('@noble/secp256k1')
const app = express();
const db = require('./db.js');
const Transaction = require('../models/Transaction');
const Block = require('../models/Block');
const merkleTree = require('../scripts/merkleTree');
const { bytesToHex } = require('@noble/hashes/utils');
const { keccak_256 } = require('@noble/hashes/sha3');
const { avgBlockTimes } = require('./db.js');
require('dotenv').config();

app.use(cors());
app.use(express.json());

const isValid = (signature, hash, publicKey) => {
  return secp.verify(signature, hash, publicKey);
}

const setDifficulty = (numZeroes, letter) => {
  return "0x" + "0".repeat(numZeroes) + letter.repeat(64 - numZeroes);
}
const difLetters = ['f', 'e', 'd', 'c', 'b', 'a'];

app.get('/balance/:address', (req, res) => {
    const {address} = req.params;
    const balance = db.accounts[address].coopCoin || 0;
    res.send(`${address} --- balance: ${balance}`);
  });

  app.get('/tokens/:address', (req, res) => {
    const {address} = req.params;
    const balance = db.accounts[address].rollTokens || 0;
    res.send(`${address} --- rolls available: ${balance}`);
  });

  app.get('/domains/:domain', (req, res) => {
    const {domain} = req.params;
    const txCount = db.accounts[domain].nextNonce;
    res.send(`Account has ${txCount} transactions. Use ${txCount} for the next nonce`);
  });

  app.get('/blockchain/:domain', (req, res) => {
    const {domain} = req.params;
    let blockchainLength = db.blockchain.blocks.length;
    console.log(`${domain} checked blockchain length at ${Date.now()}`);
    res.send(`${blockchainLength}`);
    });

  app.get('/db/:domain', (req, res) => {
    const {domain} = req.params;
    console.log(`${domain} has made a chain request at ${Date.now()}`)
    // resolve issue with big ints
    function toJson(data) {
      return JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v);
  }
    res.send( toJson(db) );
  });
  
  app.post('/send', (req, res) => {
    const {sender, recipient, amount, signature, message} = req.body;
    const hash = bytesToHex(keccak_256(JSON.stringify({nonce: [db.accounts[sender].nextNonce], message: [message], salt: [process.env.SALT]})));
    if (isValid(signature, hash, db.accounts[sender].publicKey)) {
      let tx = new Transaction(sender, recipient, amount, db.accounts[sender].nextNonce);
      db.mempool.push(tx);
      db.accounts[sender].nextNonce++;
      console.log(`Transaction of ${amount} CoopCoins from ${sender} to ${recipient} will be added to the next block`);
      res.send(`Success! Transaction added to mempool.`);
    } else {
      res.send('Incorrect Inputs!');
    }
  });

  app.post('/domains', (req, res) => {
    const {domain, key} = req.body;
    let domainName = domain + ".cc";
    if (!db.accounts[domainName]) {
    db.accounts[domainName] = {
      id: domain,
      coopCoin: 0,
      rollTokens: 12,
      nextNonce: 0,
      publicKey: key,
      blocksMined: 0,
      tokensMined: 0,
      coinsFromRolls: 0,
    };
    console.log(db.accounts[domainName]);
    res.send(`(SUCCESS) New Account Domain: ${domainName} (SUCCESS)`);
    } else {
      res.send('(ALERT) (FAILED) Domain Taken! Reload Script and Try Again! (ALERT) (FAILED)');
    }
  });

  app.post('/roll', (req, res) => {
    const {domain} = req.body;
    if ((!db.accounts[domain]) || (!db.accounts[domain].rollTokens)) {
      res.send('(FAILED) Account does not exist or is out of tokens! Go mine some more! (FAILED)');
    } else {
      db.accounts[domain].rollTokens--;
      let rollReward = Math.floor((Math.random() * 1000) + 1);
      db.accounts[domain].coopCoin += rollReward;
      db.accounts[domain].coinsFromRolls += rollReward;
      console.log(db.accounts[domain]);
      res.send(`(SUCCESS) ${domain} has been awarded ${rollReward} CoopCoins! ${db.accounts[domain].rollTokens} rolls remaining. (SUCCESS)`)
    }
  });

  app.post('/block', (req, res) => {
    const {domain, block} = req.body;
      // set var for invalidation
      let invalidCount = 0;
      // create block class from block data and verify correct chain;
      const validBlock = new Block(block.timestamp, block.nonce);
      validBlock.blockHash = block.blockHash;
      validBlock.blockNumber = block.blockNumber;
      validBlock.transactionCount = block.transactionCount;
      validBlock.previousBlockHash = block.previousBlockHash;
      if (db.blockchain.blocks.length) {
        if (validBlock.previousBlockHash != db.blockchain.blocks[db.blockchain.blocks.length - 1].blockHash) {
        invalidCount++;
      }
      if (validBlock.blockNumber != db.blockchain.blocks.length) {
        invalidCount++;
      }} else {
        if (validBlock.previousBlockHash) {
          invalidCount++;
        }
      }
      // create tx class instances from tx data;
      const txs = block.transactions;
      for (let i = 0; i < block.transactions.length; i++) {
        // cancel loop if any inconsistencies exist
        if (invalidCount > 0) {
          break;
        }
        if (i == 0) {
          // verify and add miner tx in roll tokens
          if ((txs[0].sender == 'coinbase.cc') && (txs[0].amount == db.blockReward)) {
          const minerTx = new Transaction(txs[0].sender, txs[0].recipient, txs[0].amount, txs[0].nonce);
      minerTx.currency = 'rollTokens';
      db.accounts['coinbase.cc'].nextNonce++;
      validBlock.addTransaction(minerTx);
          } else { 
            invalidCount++;
          }
        } else {
          // add other transactions
          const tx = new Transaction(txs[i].sender, txs[i].recipient, txs[i].amount, txs[i].nonce);
          validBlock.addTransaction(tx);
        }
      }
      if (invalidCount == 0) {
      validBlock.merkle = merkleTree(validBlock.transactions);
      console.log(validBlock);
      validBlock.execute();
      db.blockchain.addBlock(validBlock);
      if (db.mempool) {
      db.mempool.splice(0, validBlock.transactionCount - 1);
      }
      console.log(db.blockchain.blocks);
      db.accounts[domain].tokensWon += db.blockReward;
      // adjust block reward based on time between blocks
      let blockTime = Date.now();
      let blockDif = blockTime - db.lastBlockTime;
      if (blockDif > db.lastBlockDifferential) {
        db.blockReward = 2;
      }
      if (blockDif < db.lastBlockDifferential) {
        db.blockReward = 1;
      }
      if (blockDif == db.lastBlockDifferential) {
        db.blockReward = 100;
      }
      db.lastBlockTime = blockTime;
      db.lastBlockDifferential = blockDif;
      // adjust difficulty every 30 blocks
      if ((db.blockchain.blocks.length >= 30) && (db.blockchain.blocks.length % 30 == 0)) {
        let avgBlockTime = (blockTime - db.blockchain.blocks[validBlock.blockNumber - 29].timestamp) / 30;
        avgBlockTimes.push(avgBlockTime);
        if (avgBlockTime < 20000) {
          if (db.targetDifficultyParams.letter < 3) {
            db.targetDifficultyParams.zeroes += 1;
            db.targetDifficultyParams.letter += 3;
          } else {
            db.targetDifficultyParams.letter -= 3;
          };
            db.targetDifficulty = BigInt(setDifficulty(db.targetDifficultyParams.zeroes, difLetters[db.targetDifficultyParams.letter]));
        }
        if (avgBlockTime > 40000) {
          if (db.targetDifficultyParams.letter >= 3) {
            db.targetDifficultyParams.zeroes -= 1;
            db.targetDifficultyParams.letter += 3;
          } else {
            db.targetDifficultyParams.letter += 3;
          }
            db.targetDifficulty = BigInt(setDifficulty(db.targetDifficultyParams.zeroes, difLetters[db.targetDifficultyParams.letter]));
        } else { db.targetDifficulty = db.targetDifficulty };
      }
      // print results
      console.log(`(NEW BLOCK) ${domain} has succesfully mined block# with a hash of ${block.blockHash} (NEW BLOCK)`);
      console.log(db);
      db.accounts[domain].blocksMined++;
      res.send(`(SUCCESS) Block Accepted (SUCCESS)`);
      } else {
        res.send(`(INVALID) ${domain}'s block was rejected. (INVALID)`);
      }
    });
    //random amount transacted from coinbase.cc to one of the original 3 accounts
  app.post('/coinbaseTransaction', (req, res) => {
    const {randomAccount, randomAmount} = req.body;
    let winner = Object.keys(db.accounts)[randomAccount];
    const coinbaseTx = new Transaction('coinbase.cc', winner, randomAmount, 0);
    db.accounts['coinbase.cc'].nextNonce++;
    db.mempool.push(coinbaseTx);
    console.log(db.mempool);
        res.send(`(CONGRATS) ${winner} has won the coinbase prize of ${randomAmount} CoopCoin! (CONGRATS)`);
      });
  
  app.listen(port, () => {
    console.log(`Listening on port ${port}!`);
    console.log(db.accounts);
  });