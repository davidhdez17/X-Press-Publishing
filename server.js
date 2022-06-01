const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const errorhandler = require('errorhandler');
const morgan = require('morgan');
const apiRouter = require('./api/api.js');

const app = express();

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());
app.use('/api', apiRouter);
app.use(errorhandler());
app.use(morgan('tiny'));

app.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`);
});

module.exports = app; 