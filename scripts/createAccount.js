const prompts = require('prompts');
const { default: axios } = require('axios');
const { bytesToHex } = require('@noble/hashes/utils');
const secp = require('@noble/secp256k1');
require('dotenv').config({path:'../server/.env'});
const serverURL = process.env.SERVER_URL + "/domains";

const createPriv = () => {
    return bytesToHex(secp.utils.randomPrivateKey());
}

const createPub = (key) => {
    return bytesToHex(secp.getPublicKey(key));
}

const claimDomain = async (domain, key) => {
    try {
      let response = await axios.post(serverURL, {
          domain,
          key,
      });
      console.log(response.data);
    } catch (error) {
      console.error(error);
    };
};

const questions = [
    {
        type: 'text',
        name: 'domain',
        message: 'Choose a username (.cc will be added to the end)'
    },
]

const createAccount = async () => {
    const response = await prompts(questions);
    claimDomain(response.domain, publicKey);
    console.log(`public key: ${publicKey}`);
    console.log(`private key: ${privateKey}`);
}

const privateKey = createPriv();
const publicKey = createPub(privateKey)

createAccount();

