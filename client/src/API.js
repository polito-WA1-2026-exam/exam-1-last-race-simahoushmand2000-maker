const SERVER_URL = 'http://localhost:3001/api';

// --- AUTHENTICATION ---

async function logIn(credentials) {
  let response = await fetch(SERVER_URL + '/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // <-- This is the crucial missing piece!
    body: JSON.stringify(credentials),
  });
  if (response.ok) {
    const user = await response.json();
    return user;
  } else {
    const errDetails = await response.text();
    throw errDetails;
  }
}

async function getUserInfo() {
  const response = await fetch(SERVER_URL + '/sessions/current', { credentials: 'include' });
  if (response.ok) {
    const user = await response.json();
    return user;
  } else {
    const errDetails = await response.text();
    throw errDetails;
  }
}

async function logOut() {
  await fetch(SERVER_URL + '/sessions/current', { method: 'DELETE', credentials: 'include' });
}

// --- GAME DATA ---

async function getNetwork() {
  const response = await fetch(SERVER_URL + '/network', { credentials: 'include' });
  if (response.ok) {
    return await response.json();
  } else {
    const errDetails = await response.text();
    throw errDetails;
  }
}

async function getEvents() {
  const response = await fetch(SERVER_URL + '/events', { credentials: 'include' });
  if (response.ok) {
    return await response.json();
  } else {
    const errDetails = await response.text();
    throw errDetails;
  }
}

// --- RANKINGS & SAVING ---

async function getRankings() {
  const response = await fetch(SERVER_URL + '/rankings', { credentials: 'include' });
  if (response.ok) {
    return await response.json();
  } else {
    const errDetails = await response.text();
    throw errDetails;
  }
}

async function saveGame(score) {
  const response = await fetch(SERVER_URL + '/games', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ score: score }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errDetails = await response.text();
    throw errDetails;
  }
}

const API = { logIn, getUserInfo, logOut, getNetwork, getEvents, getRankings, saveGame };
export default API;