
// TODO
// PHASE 1
//  - refresh all data once every 15 mins
// 
// PHASE 2
// 1. update data incrementally every 5 mins
// 2. update complete data by flushing old data once every mid-night

const express = require('express');
const router = express.Router({
    mergeParams: true
});
const Web3 = require("web3");
const { ethers } = require("ethers");
const numeral = require('numeral');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'sacrifice/transactions.db'
});

try {
    sequelize.authenticate();
    console.log('Connection has been established successfully.');
} catch (error) {
    console.error('Unable to connect to the database:', error);
}

const metadata = sequelize.define("metadata", {
    lastBSCBlock: {
        // type: Sequelize.INTEGER
        type: DataTypes.INTEGER,
        allowNull: false
    },
    lastETHBlock: {
        // type: Sequelize.INTEGER
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: false
});

var lastBSCBlock, lastETHBlock;
queryMeta(lastBSCBlock, lastETHBlock);
async function queryMeta() {
    metadata.findAll({ attributes: ['lastBSCBlock', 'lastETHBlock'] });
    metadata.findAll({
        attributes: { exclude: ['id'] },
        where: { id: 1 }
    }).then(function (rows) {
        // rows.forEach(function (row) { console.log("--> " + JSON.stringify(row)); });
        lastBSCBlock = rows.at(0).get('lastBSCBlock');
        lastETHBlock = rows.at(0).get('lastETHBlock');
        console.log(a);
        console.log(b);
    }).catch(function (error) {
        console.error(error);
    });
}

async function updateBSCMetadata(metadata, lastBSCB) {
    await metadata.update({ lastBSCBlock: lastBSCB }, {
        where: { id: 1 }
    });
}

async function updateBSCMetadata(metadata, lastETHB) {
    await metadata.update({ lastETHBlock: lastETHB }, {
        where: { id: 1 }
    });
}

function freeze(time) {
    const stop = new Date().getTime() + time;
    while (new Date().getTime() < stop);
}

const ethweb3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'));
const bscweb3 = new Web3(new Web3.providers.HttpProvider('https://bsc-dataseed1.binance.org:443'));
const sacrificeAddress = '0x2e91728aF3a54aCDCeD7938fE9016aE2cc5948C9';

var metas = [
    { network: 'BSC', contract: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', scansite: 'bscscan', token: 'DAI', decimals: Math.pow(10, 18), startBlock: lastBSCBlock, endBlock: 0 },
    { network: 'BSC', contract: '0x55d398326f99059fF775485246999027B3197955', scansite: 'bscscan', token: 'USDT', decimals: Math.pow(10, 18), startBlock: lastBSCBlock, endBlock: 0 },
    { network: 'BSC', contract: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', scansite: 'bscscan', token: 'USDC', decimals: Math.pow(10, 18), startBlock: lastBSCBlock, endBlock: 0 },
    { network: 'BSC', contract: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', scansite: 'bscscan', token: 'BUSD', decimals: Math.pow(10, 18), startBlock: lastBSCBlock, endBlock: 0 },
    { network: 'ETH', contract: '0x0000000000085d4780B73119b644AE5ecd22b376', scansite: 'etherscan', token: 'TUSD', decimals: Math.pow(10, 18), startBlock: lastETHBlock, endBlock: 0 },
    // { network: 'ETH', contract: '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39', scansite: 'etherscan', token: 'HEX', decimals: Math.pow(10, 8), startBlock: lastETHBlock, endBlock: 0 },
    { network: 'ETH', contract: '0x4Fabb145d64652a948d72533023f6E7A623C7C53', scansite: 'etherscan', token: 'BUSD', decimals: Math.pow(10, 18), startBlock: lastETHBlock, endBlock: 0 },
    { network: 'ETH', contract: '0x6B175474E89094C44Da98b954EedeAC495271d0F', scansite: 'etherscan', token: 'DAI', decimals: Math.pow(10, 18), startBlock: lastETHBlock, endBlock: 0 },
    { network: 'ETH', contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', scansite: 'etherscan', token: 'USDC', decimals: Math.pow(10, 6), startBlock: lastETHBlock, endBlock: 0 },
    { network: 'ETH', contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7', scansite: 'etherscan', token: 'USDT', decimals: Math.pow(10, 6), startBlock: lastETHBlock, endBlock: 0 }
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
let blockMap = {};

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

async function getPastEvents(web3, myContractInstance, fromBlock, toBlock, meta) {
    await myContractInstance.getPastEvents('Transfer', {
        filter: { to: sacrificeAddress },
        fromBlock: fromBlock,
        toBlock: toBlock
    }, function (error, events) { if (error) console.error(error); })
        .then(function (events) {
            // console.log("events count -> " + events.length);
            events.forEach(async function (event) {
                let block = await web3.eth.getBlock(event.blockNumber);
                let transaction = {};
                transaction.from = event.returnValues.from;
                transaction.blockNumber = event.blockNumber;
                transaction.timestamp = block.timestamp;
                transaction.trasactionHash = event.transactionHash;
                transaction.value = Number(event.returnValues.value) / meta.decimals;
                transaction.token = meta.token;
                transaction.scansite = meta.scansite;

                if (Number.isNaN(Number(transaction.value))) {
                    transaction.value = 0;
                }

                sacrificers.push(transaction);
                console.log(JSON.stringify(transaction));
            })
        }).catch(err => { console.log(err) });
}

async function callBlockChain(meta, bscLBN, ethLBN) {
    let fromBlock = meta.startBlock;
    let toBlock = fromBlock + 4999;

    var myContractInstance;
    var web3;
    if (meta.network === 'BSC') {
        meta.endBlock = bscLBN;
        myContractInstance = new bscweb3.eth.Contract(abi, meta.contract);
        web3 = bscweb3;
    } else {
        meta.endBlock = ethLBN;
        myContractInstance = new ethweb3.eth.Contract(abi, meta.contract);
        web3 = ethweb3;
    }

    while (fromBlock <= meta.endBlock) {
        await getPastEvents(web3, myContractInstance, fromBlock, toBlock, meta);

        fromBlock = toBlock;
        toBlock += 5000;
        freeze(211);
    }


}
