import React, { useEffect, useState } from "react";
import "./App.css";
import logo from './assets/logo.png';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Container, Nav, Navbar } from "react-bootstrap";
import TabPanel from  "./organization/TabPanel";
import Statistics from "./statistics/Statistics";
import Upcoming from "./statistics/Upcoming";
import Home from './Home';
import PingPong from './fun/PingPong';



const App = () => {

  const [scrollValue, setScrollValue] = useState(0);
  const [navbarId, setNavbarId] = useState("navbar-visible");
  const [mobileMenuActive, setMobileMenuActive] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      (scrollValue - window.scrollY > 0 || mobileMenuActive) ? setNavbarId("navbar-visible") : setNavbarId("navbar-hidden");
      setScrollValue(window.scrollY);
    };
    if(mobileMenuActive) setNavbarId("navbar-visible");
    // console.log(location.pathname);
    window.addEventListener("scroll", handleScroll); 
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrollValue, mobileMenuActive]);

  return (
  <React.StrictMode >
    <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark" sticky="top" id={navbarId}>
      <Container fluid="md">
        <Navbar.Brand href="/"><img
          src={logo}
          width="25"
          height="25"
          padding-right="10"
          className="d-inline-block align-top"
          alt="React Bootstrap logo"
        /> Tischtennis Oberkirchberg </Navbar.Brand>
        <Navbar.Toggle aria-controls="responive-navbar-nav" onClick={() => setMobileMenuActive(!mobileMenuActive)} />
        <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="/">Startseite</Nav.Link>
              <Nav.Link href="/planning">Mannschaftsplanung</Nav.Link>
              <Nav.Link href="/statistics">Statistiken</Nav.Link>
              <Nav.Link href="/upcoming">Nächste Spiele</Nav.Link>
              <Nav.Link href="/pingpong">Ping Pong</Nav.Link>
            </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
      <Router>
        <Routes>
          <Route path="/" element={<Home />}/>
          <Route path="/planning" element={<TabPanel />}/>
          <Route path="/statistics" element={<Statistics/>}/>
          <Route path="/upcoming" element={<Upcoming />}/>
          <Route path="/pingpong" element={<PingPong />}/>
        </Routes>
      </Router>
  </React.StrictMode>
  )
};

export default App;