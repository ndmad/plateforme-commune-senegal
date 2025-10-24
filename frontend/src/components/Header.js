import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';

const Header = () => {
  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="#">
          🌍 Plateforme des Ressources Communales - Sénégal
        </Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link href="#carte">Carte</Nav.Link>
          <Nav.Link href="#ressources">Ressources</Nav.Link>
          <Nav.Link href="#admin">Administration</Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default Header;