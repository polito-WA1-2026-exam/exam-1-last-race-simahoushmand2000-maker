const sqlite3 = require('sqlite3');
const crypto = require('crypto');

// Open the database
const db = new sqlite3.Database('database.sqlite', (err) => {
  if (err) throw err;
});

// --- GAME DATA ---
exports.getStations = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM stations';
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

exports.getLines = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM lines';
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

exports.getLineStations = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM line_stations';
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

exports.getEvents = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM events';
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// --- USER & AUTHENTICATION ---
exports.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else if (row === undefined) resolve({error: 'User not found.'});
      else {
        // Only return safe data (never the hash or salt)
        const user = { id: row.id, username: row.username }
        resolve(user);
      }
    });
  });
};

exports.getUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], (err, row) => {
      if (err) { reject(err); }
      else if (row === undefined) { resolve(false); }
      else {
        const user = { id: row.id, username: row.username };
        const salt = row.salt;
        crypto.scrypt(password, salt, 32, (err, hashedPassword) => {
          if (err) reject(err);
          const passwordHex = Buffer.from(row.hash, 'hex');
          if(!crypto.timingSafeEqual(passwordHex, hashedPassword)) {
            resolve(false);
          } else {
            resolve(user);
          }
        });
      }
    });
  });
};

// --- RANKING & SAVING ---
exports.getRankings = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT users.username, MAX(games.score) as best_score 
      FROM games 
      JOIN users ON games.user_id = users.id 
      GROUP BY users.username 
      ORDER BY best_score DESC
    `;
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

exports.saveGame = (userId, score) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO games (user_id, score) VALUES (?, ?)';
    db.run(sql, [userId, score], function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};