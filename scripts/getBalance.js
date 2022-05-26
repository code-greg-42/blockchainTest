const { default: axios } = require('axios');
const prompts = require('prompts');
require('dotenv').config({path:'../server/.env'});

const serverURL = process.env.SERVER_URL;

const findBalance = async (address) => {
    try {
      let response = await axios.get(serverURL + "/balance/" + address);
      console.log(response.data);
    } catch (error) {
      console.error(error);
    };
};

const questions = [
  {
      type: 'text',
      name: 'domain',
      message: 'Enter your domain name (including .cc)',
  },
]

const getBalance = async () => {
  const response = await prompts(questions);
  findBalance(response.domain);
}

getBalance();
