const prompts = require('prompts');
const { default: axios } = require('axios');
const { response } = require('express');
require('dotenv').config({path:'../server/.env'});
const serverURL = process.env.SERVER_URL + "/roll";

const claimReward = async (domain) => {
    try {
      let response = await axios.post(serverURL, {
          domain,
      });
      return response.data;
    } catch (error) {
      console.error(error);
    };
};

const rewardAmount = (str) => {
    const firstIndex = str.search(/\d/);
    const totalDigits = str.indexOf('CoopCoins') - firstIndex;
    const amount = str.slice(firstIndex, firstIndex + totalDigits);
    return Number.parseInt(amount, 10);
}

const howManyRolls = (str) => {
    const firstIndex = str.indexOf('!') + 2;
    const modStr = str.slice(firstIndex);
    const endNum = modStr.indexOf(' ');
    const amount = modStr.slice(0, endNum);
    return Number.parseInt(amount, 10);
}

const rollMany = async (numTimes, domain) => {
    let sum = 0;
    let times = 0;
    for (let i = 0; i < numTimes; i++ ) {
        const reward = await claimReward(domain);
        console.log(reward);
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

const question1 = [
    {
        type: 'text',
        name: 'domain',
        message: 'Enter your domain name (including .cc)',
    },
]

const question2 = [
    {
        type: 'confirm',
        name: 'again',
        message: 'Want to roll again?',
        initial: true,
    }
]

const question3 = [
    {
        type: 'select',
        name: 'more',
        message: 'Want to roll even more?',
        choices: [
            { title: 'no', description: 'end program' },
            { title: 'Roll 1', description: 'Uses 1 Roll Token'},
            { title: 'Roll 2', description: 'Uses 2 Roll Tokens'},
            { title: 'Roll 5', description: 'Uses 5 Roll Tokens', value: 5 },
            { title: 'Roll 10', description: 'Uses 10 Roll Tokens', value: 10 },
            { title: 'Roll All', description: 'Uses All Roll Tokens', value: 'all' },
        ]
    }
]

const roll = async () => {
    let sum = 0;
    const response = await prompts(question1);
    const firstReward = await claimReward(response.domain);
    console.log(firstReward);
    if (firstReward.includes('SUCCESS')) {
        const firstAmount = rewardAmount(firstReward);
        sum += firstAmount;
        const rollAgain = await prompts(question2);
        if (rollAgain.again === true) {
            const secondReward = await claimReward(response.domain);
            console.log(secondReward);
            const secondAmount = rewardAmount(secondReward);
            const tokensLeft = howManyRolls(secondReward);
            sum += secondAmount;
            const rollYetAgain = await prompts(question3);
            if (rollYetAgain.more === 0) {
                console.log(`Congratulations on your winnings of ${sum} CoopCoin!`);
            }
            if (rollYetAgain.more === 'all') {
                const rollAll = await rollMany(tokensLeft, response.domain);
            console.log(`Rolled ${rollAll.times} times for a total of ${rollAll.sum} CoopCoin!`);
            console.log(`Congratulations on your winnings of ${sum + rollAll.sum} CoopCoin!`);
            } 
            if ((rollYetAgain.more != 0) && (rollYetAgain.more != 'all')) {
            const bigRoll = await rollMany(rollYetAgain.more, response.domain);
            console.log(`Rolled ${bigRoll.times} times for a total of ${bigRoll.sum} CoopCoin!`);
            console.log(`Congratulations on your winnings of ${sum + bigRoll.sum} CoopCoin!`);
            };
            } else {
                console.log('Congratulations on your winnings!')
            }
        };
}

roll();