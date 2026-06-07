const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

// Create the SQLite database file
const db = new sqlite3.Database('database.sqlite');

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 32).toString('hex');
    return { salt, hash };
}

db.serialize(() => {
    // 1. Create Tables
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        hash TEXT,
        salt TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS lines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS stations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS line_stations (
        line_id INTEGER,
        station_id INTEGER,
        PRIMARY KEY (line_id, station_id),
        FOREIGN KEY (line_id) REFERENCES lines(id),
        FOREIGN KEY (station_id) REFERENCES stations(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT,
        effect INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        score INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // 2. Insert 3 Registered Users
    const users = ['player1', 'player2', 'player3'];
    const stmtUsers = db.prepare("INSERT INTO users (username, hash, salt) VALUES (?, ?, ?)");
    users.forEach(user => {
        const { salt, hash } = hashPassword('password');
        stmtUsers.run(user, hash, salt);
    });
    stmtUsers.finalize();

    // 3. Insert 4 Lines
    const lines = ['Red Line', 'Blue Line', 'Green Line', 'Yellow Line'];
    const stmtLines = db.prepare("INSERT INTO lines (name) VALUES (?)");
    lines.forEach(line => stmtLines.run(line));
    stmtLines.finalize();

    // 4. Insert 12+ Stations (including 3+ interchanges)
    const stations = [
        'Centrale', 'Porta Velaria', 'Crocevia del Falco', 'Piazza delle Lanterne',
        'Fontana Oscura', 'Borgo Sereno', 'Viale dei Mosaici', 'Torre Cinerea',
        'Campo dellEco', 'Stazione Ovest', 'Parco Nord', 'Polo Sud', 'Valle dOro'
    ];
    const stmtStations = db.prepare("INSERT INTO stations (name) VALUES (?)");
    stations.forEach(station => stmtStations.run(station));
    stmtStations.finalize();

    // 5. Link Stations to Lines (Creating interchanges at Centrale, Porta Velaria, and Fontana Oscura)
    const lineStations = [
        [1, 1], [1, 2], [1, 3], [1, 4], // Red Line
        [2, 1], [2, 5], [2, 6], [2, 7], // Blue Line
        [3, 2], [3, 5], [3, 8], [3, 9], // Green Line
        [4, 4], [4, 8], [4, 7], [4, 9]  // Yellow Line
    ];
    const stmtLineStations = db.prepare("INSERT INTO line_stations (line_id, station_id) VALUES (?, ?)");
    lineStations.forEach(ls => stmtLineStations.run(ls[0], ls[1]));
    stmtLineStations.finalize();

    // 6. Insert 8 Events (-4 to +4)
    const events = [
        { desc: 'Quiet journey', effect: 0 },
        { desc: 'Wrong platform', effect: -2 },
        { desc: 'Kind passenger', effect: 1 },
        { desc: 'Found a coin', effect: 2 },
        { desc: 'Ticket inspection delay', effect: -1 },
        { desc: 'Train breakdown', effect: -3 },
        { desc: 'Express route', effect: 3 },
        { desc: 'Pickpocket!', effect: -4 }
    ];
    const stmtEvents = db.prepare("INSERT INTO events (description, effect) VALUES (?, ?)");
    events.forEach(e => stmtEvents.run(e.desc, e.effect));
    stmtEvents.finalize();

    // 7. Insert Game History for 2 Users
    const games = [
        { user_id: 1, score: 15 },
        { user_id: 1, score: 22 },
        { user_id: 2, score: 8 }
    ];
    const stmtGames = db.prepare("INSERT INTO games (user_id, score) VALUES (?, ?)");
    games.forEach(g => stmtGames.run(g.user_id, g.score));
    stmtGames.finalize();

    console.log("Database initialized successfully with all exam requirements!");
});

db.close();