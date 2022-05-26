const prompts = require('prompts');
require('dotenv').config({path:'../server/.env'});
const { bytesToHex } = require('@noble/hashes/utils');
const { keccak_256 } = require('@noble/hashes/sha3');
const secp = require('@noble/secp256k1');
const salt = process.env.SALT;

const questions = [
    {
        type: 'text',
        name: 'domain',
        message: 'Enter your domain name'
    },
    {
        type: 'text',
        name: 'private',
        message: 'Enter private key (offline)',
    },
    {
        type: 'number',
        name: 'nonce',
        message: 'Enter nonce'
    },
    {
        type: 'text',
        name: 'message',
        message: 'Enter random message to sign. (Write down your entry and use this for sendTx as well)',
    }
  ];

const signature = async (domain, message, nonce, privKey) => {
    const hash = bytesToHex(keccak_256(JSON.stringify({nonce: [nonce], message: [message], salt: [salt]})));
    const sig = await secp.sign(hash, privKey);
    console.log(`signature for ${domain}: ${bytesToHex(sig)}`);
};

const sign = async () => {
    const response = await prompts(questions);
    signature(response.domain, response.message, response.nonce, response.private);
  }
  
  sign();