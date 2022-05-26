const { default: axios } = require('axios');
require('dotenv').config({path:'../server/.env'});

const serverURL = process.env.SERVER_URL;

const getDB = async (domain) => {
    try {
      let response = await axios.get(serverURL + `/db/:${domain}`);
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error(error);
    };
};

module.exports = getDB;