const express = require('express');
const router = express.Router();
const transactions = require('../services/transactions');

/* GET transaction listing. */
router.get('/transactions', (req, res, next) => {
        try {
            res.json(transactions.getMultiple(req.query.page));
        } catch (err) {
            console.error(`Error while getting transactions `, err.message);
            next(err);
        }
    });

/* POST transaction */
router.post('/v1', (req, res, next) => {
        try {
            res.json(transactions.create(req.body));
        } catch (err) {
            console.error(`Error while adding transactions `, err.message);
            next(err);
        }
    });

module.exports = router;