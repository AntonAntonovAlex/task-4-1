const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const usersRoute = require('./routes/users');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/users', usersRoute);

module.exports = app;
