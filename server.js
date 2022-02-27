const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const numeral = require('numeral');
const forceSsl = require('force-ssl-heroku');
const _ = require('lodash');

app.locals.numeral = numeral;
app.locals._ = _;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(forceSsl);

app.use("/", require("./routes/index.js"));

const transactionsRouter = require('./routes/transactions');
app.use(express.json());

app.get('/v1', (req, res) => {
    res.json({ message: 'alive' });
});

app.use('/v1', transactionsRouter);

// app.listen(port, () => {
//     console.log(`Transactions REST app listening at http://localhost:${port}/transactions`);
// });

app.listen(PORT, console.log('Server started on port:' + PORT));
