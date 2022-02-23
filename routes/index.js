const express = require('express');
const router = express.Router({
	mergeParams: true
});
const Web3 = require("web3");
const { ethers, BigInt } = require("ethers");
const numeral = require('numeral');
const { default: BigNumber } = require('bignumber.js');

function freeze(time) {
    const stop = new Date().getTime() + time;
    while (new Date().getTime() < stop);
}

const ethweb3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'));
const bscweb3 = new Web3('https://bsc-dataseed1.binance.org:443');
const sacrificeAddress = '0x2e91728aF3a54aCDCeD7938fE9016aE2cc5948C9';

let bscLBN = 15492868; //await bscweb3.eth.getBlockNumber();
let ethLBN = 14259168; //await ethweb3.eth.getBlockNumber();

var decimals = [
	{token: 'DAI', decimals: 18},
	{token: 'USDC', decimals: 6},
	{token: 'TUSD', decimals: 18},
	{token: 'USDT', decimals: 6},
	{token: 'HEX', decimals: 18}
]

var sacrificers = [];

var metas = [
    { network: 'BSC', contract: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', token: 'DAI', startBlock: 15385000, endBlock: bscLBN },
    { network: 'BSC', contract: '0x55d398326f99059fF775485246999027B3197955', token: 'USDT', startBlock: 15385000, endBlock: bscLBN },
    { network: 'BSC', contract: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', token: 'USDC', startBlock: 15385000, endBlock: bscLBN },
    { network: 'BSC', contract: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', token: 'BUSD', startBlock: 15385000, endBlock: bscLBN },
    { network: 'ETH', contract: '0x0000000000085d4780B73119b644AE5ecd22b376', token: 'TUSD', startBlock: 14230000, endBlock: ethLBN },
    { network: 'ETH', contract: '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39', token: 'HEX', startBlock: 14230000, endBlock: ethLBN },
    { network: 'ETH', contract: '0x4Fabb145d64652a948d72533023f6E7A623C7C53', token: 'BUSD', startBlock: 14230000, endBlock: ethLBN },
    { network: 'ETH', contract: '0x6B175474E89094C44Da98b954EedeAC495271d0F', token: 'DAI', startBlock: 14230000, endBlock: ethLBN },
    { network: 'ETH', contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', token: 'USDC', startBlock: 14230000, endBlock: ethLBN },
    { network: 'ETH', contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7', token: 'USDT', startBlock: 14230000, endBlock: ethLBN }
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


metas.forEach(async function (meta) {

    if (meta.network === 'BSC') {
        var myContractInstance = new bscweb3.eth.Contract(abi, meta.contract);

        let fromBlock = meta.startBlock;
        let toBlock = fromBlock + 4999;

        while (fromBlock <= meta.endBlock) {
            await callBlockChain(fromBlock, toBlock, meta.network, meta.contract, meta.token);

            fromBlock = toBlock;
            toBlock += 4999;
            freeze(211);
        }
        // console.log("Done with " + JSON.stringify(meta));
        // console.log("sacrificers length -> " + sacrificers.length);

    } else {
        var myContractInstance = new ethweb3.eth.Contract(abi, meta.contract);
        let latest = ethweb3.eth.getBlockNumber();

        let fromBlock = meta.startBlock;
        let toBlock = fromBlock + 4999;

        while (fromBlock <= meta.endBlock) {
            await callBlockChain(fromBlock, toBlock, meta.network, meta.contract, meta.token);

            fromBlock = toBlock;
            toBlock += 4999;
            freeze(211);
        }

        // console.log("Done with " + JSON.stringify(meta));
        // console.log("sacrificers length -> " + sacrificers.length);
    }
});

// sacrificers.forEach(function (sac) { console.log(`${sac.from},${sac.value},${sac.token}`) });
// Done

async function callBlockChain(fromBlock, toBlock, network, contract, token) {
    // console.log(`--> ${fromBlock},${toBlock},${network},${contract},${token}`);

    var myContractInstance;
    if (network === 'BSC') {
        myContractInstance = new bscweb3.eth.Contract(abi, contract);
    } else {
        myContractInstance = new ethweb3.eth.Contract(abi, contract);
    }

    await myContractInstance.getPastEvents('Transfer', {
        filter: { to: sacrificeAddress },
        fromBlock: fromBlock,
        toBlock: toBlock
    }, function (error, events) { if (error) console.error(error); })
        .then(function (events) {
            events.forEach(function (event) {
                // console.log("!!fromBlock - " + fromBlock);
                let index = sacrificers.findIndex(element => {
                    if (element.from === event.returnValues.from && element.token === token) {
                        return true;
                    }
                });
                if (index > -1) {
                    sacrificers.at(index).value += (BigInt(event.returnValues.value)).toString();
                } else {
                    let item = {};
                    item.from = event.returnValues.from;

                    item.value = BigNumber(event.returnValues.value);
                    item.token = token;
                    sacrificers.push(item);
                    let aaa = sacrificers.at(sacrificers.length - 1);
                }
            })
        }).catch(err => { console.log(err) });

    sacrificers.forEach(function (sac) { console.log(`${sac.from},${sac.value},${sac.token}`) });
}

router.get('/', (req, res) => {
	res.render('home',{data: sacrificers});
});

module.exports = router;