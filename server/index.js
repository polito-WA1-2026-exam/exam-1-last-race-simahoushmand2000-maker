const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const dao = require('./dao');

const app = express();
const port = 3001;

// --- MIDDLEWARE ---
app.use(morgan('dev'));
app.use(express.json());

// Set up CORS to allow the React client (usually port 5173) to communicate with this server
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));

// --- PASSPORT & SESSION CONFIGURATION ---
passport.use(new LocalStrategy(
  function(username, password, done) {
    dao.getUser(username, password).then((user) => {
      if (!user) return done(null, false, { message: 'Incorrect username and/or password.' });
      return done(null, user);
    }).catch(err => done(err));
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  dao.getUserById(id).then(user => {
    done(null, user); // this makes req.user available
  }).catch(err => done(err, null));
});

app.use(session({
  secret: 'a secret sentence not to share with anybody and anywhere, used to sign the session ID cookie',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// Custom middleware: check if a given request is coming from an authenticated user
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Not authenticated' });
}

// --- AUTHENTICATION APIs ---

// POST /api/sessions (Login)
app.post('/api/sessions', function(req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json(info);
    req.login(user, (err) => {
      if (err) return next(err);
      return res.json(req.user);
    });
  })(req, res, next);
});

// GET /api/sessions/current (Check if logged in)
app.get('/api/sessions/current', (req, res) => {
  if(req.isAuthenticated()) {
    res.status(200).json(req.user);
  } else {
    res.status(401).json({error: 'Unauthenticated user!'});
  }
});

// DELETE /api/sessions/current (Logout)
app.delete('/api/sessions/current', (req, res) => {
  req.logout( () => { res.end(); } );
});

// --- GAME APIs ---

// GET /api/network (Get all stations, lines, and connections for the map)
app.get('/api/network', async (req, res) => {
  try {
    const stations = await dao.getStations();
    const lines = await dao.getLines();
    const connections = await dao.getLineStations();
    res.json({ stations, lines, connections });
  } catch (err) {
    res.status(500).json({ error: `Database error while retrieving network data: ${err}` });
  }
});

// GET /api/events (Get all random events)
app.get('/api/events', async (req, res) => {
  try {
    const events = await dao.getEvents();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: `Database error while retrieving events: ${err}` });
  }
});

// GET /api/rankings (Get the leaderboard)
app.get('/api/rankings', async (req, res) => {
  try {
    const rankings = await dao.getRankings();
    res.json(rankings);
  } catch (err) {
    res.status(500).json({ error: `Database error while retrieving rankings: ${err}` });
  }
});

// POST /api/games (Save a new game score - Protected route)
app.post('/api/games', isLoggedIn, async (req, res) => {
  try {
    const { score } = req.body;
    // Score validation could go here
    const gameId = await dao.saveGame(req.user.id, score);
    res.status(201).json({ id: gameId, score: score });
  } catch (err) {
    res.status(500).json({ error: `Database error while saving game: ${err}` });
  }
});

// --- SERVER START ---
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});