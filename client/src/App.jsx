import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import API from './API';

// We will build these components in the upcoming steps!
 import Navigation from './components/Navigation';
 import LoginForm from './components/LoginForm';
 import GameLayout from './components/GameLayout';
 import Rankings from './components/Rankings';
// import Instructions from './components/Instructions';

function App() {
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if the user is already logged in when the app first loads
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await API.getUserInfo();
        setUser(currentUser);
        setLoggedIn(true);
      } catch (err) {
        // Not logged in (anonymous user)
        setLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (credentials) => {
    const currentUser = await API.logIn(credentials);
    setUser(currentUser);
    setLoggedIn(true);
  };

  const handleLogout = async () => {
    await API.logOut();
    setUser(null);
    setLoggedIn(false);
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <BrowserRouter>
       <Navigation loggedIn={loggedIn} user={user} logout={handleLogout} /> 
      <Container className="mt-4">
        <Routes>
          {/* Default Route: Instructions for anonymous, redirect to game if logged in */}
          <Route path="/" element={
            loggedIn ? <Navigate replace to="/play" /> : <div>Game Instructions (Anonymous View)</div>
          } />
          
          <Route path="/login" element={
            loggedIn ? <Navigate replace to="/play" /> : <LoginForm login={handleLogin} />
          } />
          
          <Route path="/play" element={
            loggedIn ? <GameLayout /> : <Navigate replace to="/login" />
          } />
          
          <Route path="/rankings" element={
            loggedIn ? <Rankings /> : <Navigate replace to="/login" />
          } />
          
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;