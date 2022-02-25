const express = require('express');
const router = express.Router({
    mergeParams: true
});
const Web3 = require("web3");
const { ethers } = require("ethers");
const numeral = require('numeral');

function freeze(time) {
    const stop = new Date().getTime() + time;
    while (new Date().getTime() < stop);
}

const ethweb3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'));
const bscweb3 = new Web3(new Web3.providers.HttpProvider('https://bsc-dataseed1.binance.org:443'));
const sacrificeAddress = '0x2e91728aF3a54aCDCeD7938fE9016aE2cc5948C9';

var metas = [
    { network: 'BSC', contract: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', token: 'DAI', decimals: Math.pow(10, 18), startBlock: 15385000, endBlock: 0 },
    { network: 'BSC', contract: '0x55d398326f99059fF775485246999027B3197955', token: 'USDT', decimals: Math.pow(10, 18), startBlock: 15385000, endBlock: 0 },
    { network: 'BSC', contract: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', token: 'USDC', decimals: Math.pow(10, 18), startBlock: 15385000, endBlock: 0 },
    { network: 'BSC', contract: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', token: 'BUSD', decimals: Math.pow(10, 18), startBlock: 15385000, endBlock: 0 },
    { network: 'ETH', contract: '0x0000000000085d4780B73119b644AE5ecd22b376', token: 'TUSD', decimals: Math.pow(10, 18), startBlock: 14230000, endBlock: 0 },
    // { network: 'ETH', contract: '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39', token: 'HEX', decimals: Math.pow(10, 8), startBlock: 14230000, endBlock: 0 },
    { network: 'ETH', contract: '0x4Fabb145d64652a948d72533023f6E7A623C7C53', token: 'BUSD', decimals: Math.pow(10, 18), startBlock: 14230000, endBlock: 0 },
    { network: 'ETH', contract: '0x6B175474E89094C44Da98b954EedeAC495271d0F', token: 'DAI', decimals: Math.pow(10, 18), startBlock: 14230000, endBlock: 0 },
    { network: 'ETH', contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', token: 'USDC', decimals: Math.pow(10, 6), startBlock: 14230000, endBlock: 0 },
    { network: 'ETH', contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7', token: 'USDT', decimals: Math.pow(10, 6), startBlock: 14230000, endBlock: 0 }
];

const abi = [{
    "anonymous": false,
    "inputs": [
        { "indexed": true, "name": "from", "type": "address" },
        { "indexed": true, "name": "to", "type": "address" },
        { "indexed": false, "name": "value", "type": "uint256" }],
    "name": "Transfer",
    "type": "event"
}];

let bscLBN, ethLBN;
let sacrificers = [];

metas.forEach(async function (meta) {
    if (meta.network === 'BSC') {
        bscLBN = await bscweb3.eth.getBlockNumber();
        meta.endBlock = bscLBN;
    } else {
        ethLBN = await ethweb3.eth.getBlockNumber();
        meta.endBlock = ethLBN;
    }

    await callBlockChain(meta, bscLBN, ethLBN);
});


async function getPastEvents(myContractInstance, fromBlock, toBlock, meta) {
    await myContractInstance.getPastEvents('Transfer', {
        filter: { to: sacrificeAddress },
        fromBlock: fromBlock,
        toBlock: toBlock
    }, function (error, events) { if (error) console.error(error); })
        .then(function (events) {
            // console.log("events count -> " + events.length);
            events.forEach(function (event) {
                let index = sacrificers.findIndex(element => {
                    if (element.from === event.returnValues.from && element.token === meta.token) {
                        return true;
                    }
                });
                if (index > -1) {
                    if (Number.isNaN(Number(event.returnValues.value))) {
                        // do nothing
                    } else {
                        sacrificers.at(index).value += (Number(event.returnValues.value)/meta.decimals);
                    }
                } else {
                    let item = {};
                    item.from = event.returnValues.from;

                    item.value = Number(event.returnValues.value)/meta.decimals;
                    if (Number.isNaN(Number(item.value))) {
                        item.value = 0;
                    }
                    item.token = meta.token;
                    sacrificers.push(item);
                }
            })
        }).catch(err => { console.log(err) });
}

async function callBlockChain(meta, bscLBN, ethLBN) {
    let fromBlock = meta.startBlock;
    let toBlock = fromBlock + 4999;

    while (fromBlock <= meta.endBlock) {

        var myContractInstance;
        if (meta.network === 'BSC') {
            meta.endBlock = bscLBN;
            myContractInstance = new bscweb3.eth.Contract(abi, meta.contract);
        } else {
            meta.endBlock = ethLBN;
            myContractInstance = new ethweb3.eth.Contract(abi, meta.contract);
        }

        await getPastEvents(myContractInstance, fromBlock, toBlock, meta);

        fromBlock = toBlock;
        toBlock += 4999;
        freeze(211);
    }
}

router.get('/', (req, res) => {
    res.render('home', { data: sacrificers });
});

router.get('/api', (req, res) => {
    res.json({ data: sacrificers });
});

module.exports = router;