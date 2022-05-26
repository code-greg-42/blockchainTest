const { default: axios } = require('axios');
require('dotenv').config({path:'../server/.env'});

const serverURL = process.env.SERVER_URL;

const getBlockchainLength = async (domain) => {
    try {
      let response = await axios.get(serverURL + `/blockchain/:${domain}`);
      console.log(response.data);
      let lengthNumber = Number.parseInt(response.data);
      console.log(lengthNumber);
      return lengthNumber;
    } catch (error) {
      console.error(error);
    };
};

module.exports = getBlockchainLength;