const db = require('../services/db');
const config = require('../config');

function getMultiple(page = 1) {
    const offset = (page - 1) * config.listPerPage;
    const data = db.query(`SELECT * FROM transactions LIMIT ?,?`, [offset, config.listPerPage]);
    const meta = { page };

    return {
        data,
        meta
    }
}

function validateCreate(transaction) {
    let messages = [];

    console.log(transaction);

    if (!transaction) {
        messages.push('No object is provided');
    }

    if (!transaction.fromAddress) {
        messages.push('fromAddress is empty');
    }

    if (!transaction.blockNumber) {
        messages.push('blockNumber is empty');
    }

    if (!transaction.timestamp) {
        messages.push('timestamp is empty');
    }

    if (!transaction.trasactionHash) {
        messages.push('trasactionHash is empty');
    }
    if (!transaction.amount) {
        messages.push('amount is empty');
    }

    if (!transaction.token) {
        messages.push('token is empty');
    }

    if (!transaction.scansite) {
        messages.push('scansite is empty');
    }

    if (messages.length) {
        let error = new Error(messages.join());
        error.statusCode = 400;

        throw error;
    }
}

function create(transactionObj) {
    validateCreate(transactionObj);
    const { fromAddress, blockNumber, timestamp, trasactionHash, amount, token, scansite } = transactionObj;
    const result = db.run('INSERT INTO transactions (fromAddress, blockNumber, timestamp, trasactionHash, amount, token, scansite) VALUES (@fromAddress, @blockNumber, @timestamp, @trasactionHash, @amount, @token, @scansite)', { fromAddress, blockNumber, timestamp, trasactionHash, amount, token, scansite });

    let message = 'Error in creating transaction';
    if (result.changes) {
        message = 'Transaction created successfully';
    }

    return { message };
}

module.exports = {
    getMultiple
}