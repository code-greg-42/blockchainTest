const { default: axios } = require('axios');
const prompts = require('prompts');
require('dotenv').config({path:'../server/.env'});
const serverURL = process.env.SERVER_URL;

const getNonce = async (domain) => {
    try {
      let response = await axios.get(serverURL + "/domains/" + domain);
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

const getTxCount = async () => {
  const response = await prompts(questions);
  getNonce(response.domain);
}

getTxCount();