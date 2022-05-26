const { default: axios } = require('axios');
const prompts = require('prompts');
require('dotenv').config({path:'../server/.env'});

const serverURL = process.env.SERVER_URL;

const findTokenBalance = async (address) => {
    try {
      let response = await axios.get(serverURL + "/tokens/" + address);
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

const getTokenBalance = async () => {
  const response = await prompts(questions);
  findTokenBalance(response.domain);
}

getTokenBalance();