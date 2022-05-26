const { default: axios } = require('axios');
const prompts = require('prompts');
require('dotenv').config({path:'../server/.env'});

const serverURL = process.env.SERVER_URL + "/send";

const sendTransaction = async (sender, recipient, amount, signature, message) => {
    try {
      let response = await axios.post(serverURL, {
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

const questions = [
  {
      type: 'text',
      name: 'domain',
      message: 'Enter your domain name'
  },
  {
      type: 'text',
      name: 'signature',
      message: 'Enter your signature'
  },
  {
      type: 'text',
      name: 'message',
      message: 'Enter message used in hash',
  },
  {
      type: 'text',
      name: 'recipient',
      message: 'Enter recipient domain name'
  },
  {
      type: 'number',
      name: 'amount',
      message: 'Enter amount you would like to send'
  }
];

const sendTx = async () => {
  const response = await prompts(questions);
  sendTransaction(response.domain, response.recipient, response.amount, response.signature, response.message);
}

sendTx();
