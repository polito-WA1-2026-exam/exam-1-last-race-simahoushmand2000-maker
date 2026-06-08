import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { NavLink, Link } from 'react-router-dom';

function Navigation({ loggedIn, user, logout }) {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <i className="bi bi-train-front me-2"></i>
          Last Race
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {/* Everyone can see Instructions (Home) */}
            <Nav.Link as={NavLink} to="/">Instructions</Nav.Link>
            
            {/* Only logged-in users see Game and Rankings */}
            {loggedIn && <Nav.Link as={NavLink} to="/play">Play</Nav.Link>}
            {loggedIn && <Nav.Link as={NavLink} to="/rankings">Rankings</Nav.Link>}
          </Nav>
          <Nav>
            {loggedIn ? (
              <>
                <Navbar.Text className="me-3">
                  Signed in as: <strong>{user?.username}</strong>
                </Navbar.Text>
                <Button variant="outline-danger" size="sm" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <Nav.Link as={NavLink} to="/login">
                <Button variant="outline-light" size="sm">Login</Button>
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navigation;