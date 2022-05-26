const { default: axios } = require('axios');
require('dotenv').config({path:'../server/.env'});
const prompts = require('prompts');
const serverURL = process.env.SERVER_URL + "/coinbaseTransaction";

const questions = [
    {
        type: 'text',
        name: 'initiate',
        message: 'Initiate Coinbase Transaction? (Y/N)',
        initial: 'Y',
    },
]

const sendCoinbase = async (randomAccount, randomAmount) => {
    try {
      let response = await axios.post(serverURL, {
        randomAccount,
        randomAmount,
      });
      console.log(response.data);
    } catch (error) {
      console.error(error);
    };
};

const coinbaseTx = async () => {
    const response = await prompts(questions);
    if (response.initiate.toLowerCase() === 'y') {
        const winner = Math.floor(Math.random() * 3 + 1);
        const amount = Math.floor(Math.random() * 100000 + 1);
        sendCoinbase(winner, amount);
    } else {
        console.log('coinbase transaction intiation halted. run program again when ready')
    }
}

coinbaseTx();