const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/', (req, res) => {
  db.query('SELECT * FROM users ORDER BY last_login DESC', (err, results) => {
    if (err) {
      res.status(500).send('Error getting users');
    } else {
      res.json(results);
    }
  });
});

router.delete('/', (req, res) => {
  const { usersIds } = req.body;
  const placeholders = usersIds.map(() => '?').join(', ');
  const query = `DELETE FROM users WHERE id IN (${placeholders})`;

  db.query(query, usersIds, (err, results) => {
    if (err) {
      return res.status(500).send('Error deleting users');
    };

    if (results.affectedRows === 0) {
      return res.status(404).send('Users not found');
    };

    res.status(200).send(`${results.affectedRows} User successfully deleted`);
  });
});

router.post('/', (req, res) => {
  const { name, email, password } = req.body;
  db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password], (err, results) => {
    if (err) {
      res.status(500).send('Error adding user');
    } else {
      const userId = results.insertId;
      res.status(201).send({ message: 'User added', userId: userId });
    }
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      return res.status(500).send('Error checking user');
    };
    
    if (results.length === 0) {
      return res.status(404).send('User not found');
    };
    
    const user = results[0];
    if (user.status == 'blocked') {
      return res.status(401).send('User blocked');
    };

    if (user.password === password) {
      const userId = user.id;
      const updateQuery = 'UPDATE users SET last_login = ? WHERE id = ?';
      const currentTimestamp = new Date();
      db.query(updateQuery, [currentTimestamp, userId], (updateErr) => {
        if (updateErr) {
          return res.status(500).send('Error updating login time');
        };
        res.status(200).json({ user: user });
      })} else {
      return res.status(401).send('Incorrect password');
    };
  });
});

router.patch('/block', (req, res) => {
  const { usersIds } = req.body;
  const placeholders = usersIds.map(() => '?').join(', ');
  const query = `UPDATE users SET status = 'blocked' WHERE id IN (${placeholders})`;

  db.query(query, usersIds, (err, results) => {
    if (err) {
      return res.status(500).send('Error blocking users');
    };

    if (results.affectedRows === 0) {
      return res.status(404).send('No users found');
    };

    res.status(200).send(`${results.affectedRows} users successfully blocked`);
  });
});

router.patch('/unblock', (req, res) => {
  const { usersIds } = req.body;
  const placeholders = usersIds.map(() => '?').join(', ');
  const query = `UPDATE users SET status = 'active' WHERE id IN (${placeholders})`;

  db.query(query, usersIds, (err, results) => {
    if (err) {
      return res.status(500).send('Error unblocking users');
    };

    if (results.affectedRows === 0) {
      return res.status(404).send('No users found');
    };

    res.status(200).send(`${results.affectedRows} users successfully unblocked`);
  });
});

router.get('/status', (req, res) => {
  const userId = req.query.id;

  const query = 'SELECT status FROM users WHERE id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).send('Server error');
    };

    if (results.length === 0) {
      return res.status(404).send('User not found');
    };
    const status = results[0].status;
    res.status(200).json({ status });
  });
});

module.exports = router;
