const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: 'sql7.freesqldatabase.com',
  user: 'sql7746647',
  password: 'pJvAxMPsjl',
  database: 'sql7746647',
  port: 3306,
});

db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

module.exports = db;
