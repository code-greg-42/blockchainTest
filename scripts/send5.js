const { default: axios } = require('axios');
const { bytesToHex } = require('@noble/hashes/utils');
const { keccak_256 } = require('@noble/hashes/sha3');
const secp = require('@noble/secp256k1');
const generateUsername = require('better-usernames');
const res = require('express/lib/response');
require('dotenv').config({path:'../server/.env'});
const serverURL = process.env.SERVER_URL;
const salt = process.env.SALT;

const createPrivRoll5 = () => {
    return bytesToHex(secp.utils.randomPrivateKey());
}

const createPubRoll5 = (key) => {
    return bytesToHex(secp.getPublicKey(key));
}

const claimDomainRoll5 = async (domain, key) => {
    try {
      let response = await axios.post(serverURL + '/domains', {
          domain,
          key,
      });
      console.log(response.data);
    } catch (error) {
      console.error(error);
    };
};

const signatureRoll5 = async (domain, message, nonce, privKey) => {
    const hash = bytesToHex(keccak_256(JSON.stringify({nonce: [nonce], message: [message], salt: [salt]})));
    const sig = await secp.sign(hash, privKey);
    return bytesToHex(sig);
};

  const claimRewardRoll5 = async (domain) => {
    try {
      let response = await axios.post(serverURL + '/roll', {
          domain,
      });
      return response.data;
    } catch (error) {
      console.error(error);
    };
};

const rewardAmount = (str) => {
  const amount = str.slice(str.indexOf('awarded') + 8, str.indexOf('Coop') - 1);
  return Number.parseInt(amount, 10);
}

const rollManyRoll5 = async (numTimes, domain) => {
    let sum = 0;
    let times = 0;
    for (let i = 0; i < numTimes; i++ ) {
        const reward = await claimRewardRoll5(domain);
        if (reward.includes('FAILED')) {
            sum = sum;
            times = times;
        } else {
        const rewardNum = rewardAmount(reward);
        sum += rewardNum;
        times++;
        };
    };
    return { sum: sum, times: times };
}

const sendTransactionRoll5 = async (sender, recipient, amount, signature, message) => {
    try {
      let response = await axios.post(serverURL + '/send', {
        sender,
        recipient,
        amount,
        signature,
        message
      });
      console.log(response.data);
    } catch (error) {
      console.error(error);
    };
};

const send5 = async () => {
    let privKey = createPrivRoll5();
    let pubKey = createPubRoll5(privKey);
    let username = generateUsername();
    await claimDomainRoll5(username, pubKey);
    let domainName = username + '.cc';
    let nonce = 0;
    const rolls = await rollManyRoll5(5, domainName);
    console.log(`Rolled ${rolls.times} times for a total of ${rolls.sum} CoopCoins!`);
    for (let i = 0; i < 5; i++) {
      let amount = Math.floor(Math.random() * 100 + 1);
      let message = Math.floor(Math.random() * 1000 + 1);
      const signature = await signatureRoll5(domainName, message, nonce, privKey);
      await sendTransactionRoll5(domainName, 'phyllis.cc', amount, signature, message);
      nonce++
    }
}

send5();